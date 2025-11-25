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
 * ✅ COMPLETELY REBUILT - Save VC evaluation preferences to vc_preferences table
 */
router.post('/save-preferences', async (req: Request, res: Response) => {
  console.log('\n🔥🔥🔥 ===== SAVE PREFERENCES ROUTE HIT ===== 🔥🔥🔥');
  console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { userId, industry, criteria } = req.body;

    // ✅ VALIDATION
    if (!userId) {
      console.error('❌ MISSING USER ID');
      return res.status(400).json({ error: 'userId is required' });
    }
    
    if (!criteria) {
      console.error('❌ MISSING CRITERIA');
      return res.status(400).json({ error: 'criteria is required' });
    }

    console.log('✅ Validation passed');
    console.log('   👤 User ID:', userId);
    console.log('   🏭 Industry:', industry || 'all');
    console.log('   📊 Criteria type:', typeof criteria, Array.isArray(criteria) ? 'ARRAY' : 'OBJECT');

    // ✅ EXTRACT mainCriteria array
    const criteriaArray = criteria.mainCriteria || criteria;
    console.log('   � Criteria array length:', Array.isArray(criteriaArray) ? criteriaArray.length : 'NOT AN ARRAY');

    // ✅ TRANSFORM DATA
    const dealbreakers: string[] = [];
    const positivePatterns: string[] = [];
    let investmentThesis = '';
    const contextWeights: Record<string, number> = {};

    if (Array.isArray(criteriaArray)) {
      criteriaArray.forEach((criterion: any) => {
        // Store weight
        if (criterion.name && typeof criterion.weight === 'number') {
          contextWeights[criterion.name] = criterion.weight;
        }

        // Extract from subcriteria
        if (Array.isArray(criterion.subcriteria)) {
          criterion.subcriteria.forEach((sub: any) => {
            const name = sub.name?.toLowerCase() || '';
            if (name.includes('must not') || name.includes('avoid') || name.includes('red flag')) {
              dealbreakers.push(sub.name);
            } else if (name.includes('must have') || name.includes('should') || name.includes('positive')) {
              positivePatterns.push(sub.name);
            }
          });
        }
      });

      // Build thesis
      if (industry && industry !== 'all') {
        const topCriteria = criteriaArray
          .sort((a: any, b: any) => (b.weight || 0) - (a.weight || 0))
          .slice(0, 3)
          .map((c: any) => c.name);
        investmentThesis = `Focus on ${industry} sector. Priority: ${topCriteria.join(', ')}`;
      }
    }

    console.log('🎯 TRANSFORMED DATA:');
    console.log('   ⚠️  Dealbreakers:', dealbreakers.length, dealbreakers);
    console.log('   ✓ Positive Patterns:', positivePatterns.length, positivePatterns);
    console.log('   📝 Investment Thesis:', investmentThesis || 'NONE');
    console.log('   ⚖️  Context Weights:', Object.keys(contextWeights).length, contextWeights);

    // ✅ INSERT INTO DATABASE
    console.log('💾 INSERTING INTO vc_preferences TABLE...');
    
    const insertQuery = `
      INSERT INTO vc_preferences (
        id,
        user_id, 
        preferences_name, 
        industry, 
        criteria,
        dealbreakers,
        positive_patterns,
        investment_thesis,
        context_weights,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1, 
        $2, 
        $3, 
        $4,
        $5,
        $6,
        $7,
        $8,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, preferences_name)
      DO UPDATE SET
        industry = EXCLUDED.industry,
        criteria = EXCLUDED.criteria,
        dealbreakers = EXCLUDED.dealbreakers,
        positive_patterns = EXCLUDED.positive_patterns,
        investment_thesis = EXCLUDED.investment_thesis,
        context_weights = EXCLUDED.context_weights,
        updated_at = NOW()
      RETURNING id, user_id, preferences_name, industry
    `;

    const dbResult = await pool.query(insertQuery, [
      userId,
      'Wizard Preferences',
      industry || 'all',
      JSON.stringify(criteria),
      JSON.stringify(dealbreakers),
      JSON.stringify(positivePatterns),
      investmentThesis || null,
      JSON.stringify(contextWeights)
    ]);

    console.log('✅✅✅ DATABASE INSERT SUCCESS! ✅✅✅');
    console.log('   🆔 Preference ID:', dbResult.rows[0].id);
    console.log('   👤 User ID:', dbResult.rows[0].user_id);
    console.log('   📝 Name:', dbResult.rows[0].preferences_name);
    console.log('   🏭 Industry:', dbResult.rows[0].industry);

    // ✅ TRIGGER PROMPT REGENERATION
    console.log('🤖 Triggering prompt regeneration...');
    const generatedPrompt = await triggerPromptRegeneration(
      pool, 
      userId, 
      industry || 'all', 
      criteriaArray
    );
    console.log('✅ Prompt version:', generatedPrompt.version);

    // ✅ SEND RESPONSE
    const response = {
      success: true,
      preferenceId: dbResult.rows[0].id,
      promptVersion: generatedPrompt.version,
      message: 'Preferences saved successfully!',
      data: {
        userId: dbResult.rows[0].user_id,
        industry: dbResult.rows[0].industry,
        dealbreakersCount: dealbreakers.length,
        positivePatternsCount: positivePatterns.length,
        hasThesis: !!investmentThesis,
        weightsCount: Object.keys(contextWeights).length
      }
    };

    console.log('📤 SENDING RESPONSE:', JSON.stringify(response, null, 2));
    console.log('🔥🔥🔥 ===== SAVE PREFERENCES COMPLETE ===== 🔥🔥🔥\n');

    return res.status(200).json(response);

  } catch (error) {
    console.error('💥💥💥 ERROR IN SAVE PREFERENCES 💥💥💥');
    console.error('Error object:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return res.status(500).json({ 
      error: 'Failed to save preferences',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/vc-agent/preferences/:userId
 * ✅ COMPLETELY REBUILT - Fetch VC preferences from vc_preferences table
 */
router.get('/preferences/:userId', async (req: Request, res: Response) => {
  console.log('\n🔍🔍🔍 ===== GET PREFERENCES ROUTE HIT ===== 🔍🔍🔍');
  console.log('👤 User ID:', req.params.userId);
  
  try {
    const { userId } = req.params;

    if (!userId) {
      console.error('❌ Missing user ID in params');
      return res.status(400).json({ error: 'userId is required' });
    }

    // ✅ QUERY vc_preferences TABLE
    console.log('🔎 Querying vc_preferences table...');
    const query = `
      SELECT 
        id,
        user_id,
        preferences_name,
        industry, 
        criteria,
        dealbreakers,
        positive_patterns,
        investment_thesis,
        context_weights,
        created_at,
        updated_at
      FROM vc_preferences
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      console.log('⚠️  No preferences found for user:', userId);
      return res.status(404).json({
        success: false,
        error: 'No preferences found',
        message: 'Please configure your evaluation criteria in the wizard',
      });
    }

    const pref = result.rows[0];
    console.log('✅ PREFERENCES FOUND:');
    console.log('   🆔 ID:', pref.id);
    console.log('   📝 Name:', pref.preferences_name);
    console.log('   🏭 Industry:', pref.industry);
    console.log('   ⚠️  Dealbreakers:', pref.dealbreakers ? JSON.parse(pref.dealbreakers).length : 0);
    console.log('   ✓ Positive Patterns:', pref.positive_patterns ? JSON.parse(pref.positive_patterns).length : 0);
    console.log('   📝 Has Thesis:', !!pref.investment_thesis);
    console.log('   ⚖️  Weights:', pref.context_weights ? Object.keys(JSON.parse(pref.context_weights)).length : 0);

    // Parse JSONB fields
    const response = {
      success: true,
      preferences: {
        id: pref.id,
        userId: pref.user_id,
        preferencesName: pref.preferences_name,
        industry: pref.industry,
        criteria: pref.criteria,
        dealbreakers: pref.dealbreakers ? JSON.parse(pref.dealbreakers) : [],
        positivePatterns: pref.positive_patterns ? JSON.parse(pref.positive_patterns) : [],
        investmentThesis: pref.investment_thesis,
        contextWeights: pref.context_weights ? JSON.parse(pref.context_weights) : {},
        createdAt: pref.created_at,
        updatedAt: pref.updated_at
      }
    };

    console.log('📤 Sending response with preferences');
    console.log('🔍🔍🔍 ===== GET PREFERENCES COMPLETE ===== 🔍🔍🔍\n');

    return res.status(200).json(response);

  } catch (error) {
    console.error('💥💥💥 ERROR IN GET PREFERENCES 💥💥💥');
    console.error('Error:', error);
    console.error('Message:', error instanceof Error ? error.message : 'Unknown');
    
    return res.status(500).json({ 
      error: 'Failed to fetch preferences',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/vc-agent/export-to-deck-intelligence
 * Export VC preferences to Deck Intelligence context
 */
router.post('/export-to-deck-intelligence', async (req: Request, res: Response) => {
  try {
    const { deckId, userId } = req.body;

    console.log('📤 Exporting VC Preferences to Deck Intelligence:');
    console.log('   Deck ID:', deckId);
    console.log('   User ID:', userId);

    if (!deckId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: deckId and userId'
      });
    }

    // Get the latest preferences for this user
    const prefsResult = await pool.query(`
      SELECT id, preferences_name, industry, criteria, 
             dealbreakers, positive_patterns, investment_thesis, context_weights
      FROM vc_preferences
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `, [userId]);

    if (prefsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No preferences found for this user' });
    }

    const preferences = prefsResult.rows[0];
    console.log('   Found preferences:', preferences.preferences_name);

    // Insert or update deck_intelligence_context
    await pool.query(`
      INSERT INTO deck_intelligence_context (
        deck_id,
        user_id,
        vc_preferences,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (deck_id, user_id)
      DO UPDATE SET
        vc_preferences = EXCLUDED.vc_preferences,
        updated_at = CURRENT_TIMESTAMP
    `, [deckId, userId, JSON.stringify(preferences)]);

    console.log('✅ VC Preferences exported to Deck Intelligence');

    res.json({
      success: true,
      message: 'Preferences exported to Deck Intelligence successfully',
      preferencesName: preferences.preferences_name
    });

  } catch (error: any) {
    console.error('❌ Error exporting preferences:', error);
    res.status(500).json({ 
      error: 'Export failed',
      details: error.message
    });
  }
});

export default router;
