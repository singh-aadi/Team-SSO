/**
 * API Routes for Agentic VC System
 * Handles custom prompts, growth forecasts, and evaluation preferences
 */

import { Router, Request, Response } from 'express';
import pool from '../db';
import {
  generateAdaptivePrompt,
  triggerPromptRegeneration,
  getLatestPrompt,
  getPromptHistory,
} from '../services/promptAgent';
import {
  generateGrowthForecast,
  getForecast,
} from '../services/growthForecastAgent';

const router = Router();

/**
 * POST /api/vc-agent/regenerate-prompt
 * Trigger prompt regeneration when user modifies criteria
 */
router.post('/regenerate-prompt', async (req: Request, res: Response) => {
  try {
    const { userId, industry, criteria } = req.body;

    if (!userId || !criteria) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, criteria' 
      });
    }

    console.log(`🔄 API: Regenerating prompt for user ${userId}`);
    
    const generatedPrompt = await triggerPromptRegeneration(
      pool,
      userId,
      industry || 'all',
      criteria
    );

    res.json({
      success: true,
      version: generatedPrompt.version,
      metadata: generatedPrompt.metadata,
      message: 'Evaluation prompt regenerated successfully',
    });
  } catch (error) {
    console.error('Error regenerating prompt:', error);
    res.status(500).json({ 
      error: 'Failed to regenerate prompt',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/vc-agent/prompt/:userId
 * Get latest custom prompt for user
 */
router.get('/prompt/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const prompt = await getLatestPrompt(pool, userId);

    if (!prompt) {
      return res.status(404).json({
        error: 'No custom prompt found',
        message: 'Using default evaluation template',
      });
    }

    res.json({
      success: true,
      prompt,
    });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ 
      error: 'Failed to fetch prompt',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/vc-agent/prompt-history/:userId
 * Get prompt version history
 */
router.get('/prompt-history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const history = await getPromptHistory(pool, userId, limit);

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('Error fetching prompt history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch prompt history',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/vc-agent/forecast/:deckId
 * Generate growth forecast for a deck
 */
router.post('/forecast/:deckId', async (req: Request, res: Response) => {
  try {
    const deckId = req.params.deckId; // UUID string
    const horizonYears = parseInt(req.body.horizonYears) || 5;

    if (!deckId) {
      return res.status(400).json({ error: 'Invalid deck ID' });
    }

    if (horizonYears < 1 || horizonYears > 10) {
      return res.status(400).json({ 
        error: 'Horizon must be between 1 and 10 years' 
      });
    }

    console.log(`📈 API: Generating ${horizonYears}-year forecast for deck ${deckId}`);

    const forecast = await generateGrowthForecast(pool, deckId, horizonYears);

    res.json({
      success: true,
      forecast,
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ 
      error: 'Failed to generate forecast',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/vc-agent/forecast/:deckId
 * Get saved forecast for a deck
 */
router.get('/forecast/:deckId', async (req: Request, res: Response) => {
  try {
    const deckId = req.params.deckId; // UUID string
    const horizon = (req.query.horizon as string) || '5-year';

    if (!deckId) {
      return res.status(400).json({ error: 'Invalid deck ID' });
    }

    const forecast = await getForecast(pool, deckId, horizon);

    if (!forecast) {
      return res.status(404).json({
        error: 'Forecast not found',
        message: 'Generate a new forecast using POST /forecast/:deckId',
      });
    }

    res.json({
      success: true,
      forecast,
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({ 
      error: 'Failed to fetch forecast',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/vc-agent/save-preferences
 * Save user's evaluation preferences
 */
router.post('/save-preferences', async (req: Request, res: Response) => {
  try {
    const { userId, industry, criteria } = req.body;

    console.log('📝 Save preferences request:', { userId, industry, criteria });

    if (!userId || !criteria) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: userId, criteria' 
      });
    }

    // First, ensure the table exists and has the unique constraint
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vc_evaluation_preferences'
      );
    `;
    
    const tableExists = await pool.query(checkTableQuery);
    
    if (!tableExists.rows[0].exists) {
      console.error('❌ Table vc_evaluation_preferences does not exist');
      return res.status(500).json({ 
        error: 'Database not properly initialized. Please run migrations.',
        details: 'vc_evaluation_preferences table missing'
      });
    }

    const query = `
      INSERT INTO vc_evaluation_preferences (user_id, industry, criteria, last_updated)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        industry = EXCLUDED.industry,
        criteria = EXCLUDED.criteria,
        last_updated = NOW()
      RETURNING id
    `;

    console.log('💾 Saving preferences to database...');
    const result = await pool.query(query, [
      userId,
      industry || 'all',
      JSON.stringify(criteria),
    ]);

    console.log('✅ Preferences saved, triggering prompt regeneration...');
    
    // Extract mainCriteria array from the criteria object
    // Frontend sends: { mainCriteria: [...], customCriteria: [...] }
    // promptAgent expects: array of criteria
    const criteriaArray = criteria.mainCriteria || criteria;
    
    console.log('📊 Criteria structure:', {
      isArray: Array.isArray(criteriaArray),
      count: Array.isArray(criteriaArray) ? criteriaArray.length : 'N/A',
      hasCustom: criteria.customCriteria ? criteria.customCriteria.length : 0
    });
    
    // Also trigger prompt regeneration
    const generatedPrompt = await triggerPromptRegeneration(
      pool, 
      userId, 
      industry || 'all', 
      criteriaArray
    );

    console.log('🎉 Prompt regenerated:', generatedPrompt.version);

    res.json({
      success: true,
      preferenceId: result.rows[0].id,
      promptVersion: generatedPrompt.version,
      message: 'Preferences saved and prompt regenerated',
    });
  } catch (error) {
    console.error('❌ Error saving preferences:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    res.status(500).json({ 
      error: 'Failed to save preferences',
      details: errorMessage,
    });
  }
});

/**
 * GET /api/vc-agent/preferences/:userId
 * Get user's evaluation preferences
 */
router.get('/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT industry, criteria, last_updated
      FROM vc_evaluation_preferences
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No preferences found',
        message: 'Using default evaluation criteria',
      });
    }

    res.json({
      success: true,
      preferences: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ 
      error: 'Failed to fetch preferences',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
