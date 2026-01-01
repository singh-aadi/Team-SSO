/**
 * VC MODE API ROUTES
 * 
 * Endpoints for agentic VC evaluation system
 */

import { Router, Request, Response } from 'express';
import { query } from '../db';
import { evaluateWithVCMode } from '../services/vcModeAgent';

const router = Router();

/**
 * POST /api/vc-mode/evaluate/:deckId
 * Run full agentic evaluation on a pitch deck
 */
router.post('/evaluate/:deckId', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const { userId } = req.body;

    console.log('🤖 Starting VC Mode evaluation:');
    console.log('   Deck ID:', deckId);
    console.log('   User ID:', userId);

    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing userId in request body' 
      });
    }

    // 1. Load deck context
    const deckResult = await query(`
      SELECT 
        d.id,
        d.company_id,
        d.file_path,
        d.file_url,
        d.upload_date,
        d.status,
        d.ai_summary,
        c.name as company_name,
        c.industry,
        c.stage,
        c.description
      FROM pitch_decks d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.id = $1
    `, [deckId]);

    if (deckResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const deck = deckResult.rows[0];

    // 2. Load deck analysis text (for AI context)
    const analysisResult = await query(`
      SELECT 
        section_name,
        score,
        analysis,
        suggestions,
        evidence
      FROM deck_analysis
      WHERE deck_id = $1
      ORDER BY section_name
    `, [deckId]);

    const deckText = analysisResult.rows.map(row => 
      `${row.section_name}: ${row.analysis} ${row.evidence || ''}`
    ).join('\n\n');

    // 3. Load VC preferences
    const prefsResult = await query(`
      SELECT * FROM vc_preferences
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `, [userId]);

    if (prefsResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No VC preferences found',
        message: 'Please configure your VC preferences first in the VC Mode settings'
      });
    }

    const preferences = prefsResult.rows[0];

    // 4. Load optional VC context documents
    const contextResult = await query(`
      SELECT content, document_type
      FROM vc_context_documents
      WHERE deck_id = $1
      ORDER BY uploaded_at DESC
    `, [deckId]);

    const contextDocuments = contextResult.rows.map(row => row.content);

    // 5. Build deck context
    const deckContext = {
      company_name: deck.company_name || 'Unknown',
      industry: deck.industry || 'Unknown',
      stage: deck.stage || 'Seed',
      deck_text: deckText || deck.ai_summary || '',
      deck_summary: deck.ai_summary,
      vc_context_documents: contextDocuments
    };

    // 6. Parse VC preferences
    const vcPreferences = {
      dealbreakers: preferences.criteria?.dealbreakers || [],
      patterns: preferences.criteria?.patterns || [],
      context_weights: preferences.criteria?.context_weights || [],
      thesis_alignment: preferences.criteria?.thesis_alignment || {
        target_sectors: [],
        target_stages: [],
        check_size_range: { min: 0, max: 10000000 },
        geography: [],
        strategic_priorities: ''
      }
    };

    console.log('📊 Context loaded:');
    console.log('   Company:', deckContext.company_name);
    console.log('   Dealbreakers:', vcPreferences.dealbreakers.length);
    console.log('   Patterns:', vcPreferences.patterns.length);

    // 7. Run agentic evaluation
    const evaluation = await evaluateWithVCMode(deckContext, vcPreferences);

    // 8. Save evaluation results
    const saveResult = await query(`
      INSERT INTO vc_evaluations (
        deck_id,
        user_id,
        evaluation_data,
        proceed_recommendation,
        confidence_score,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      deckId,
      userId,
      JSON.stringify(evaluation),
      evaluation.final_recommendation.proceed,
      evaluation.final_recommendation.confidence
    ]);

    console.log('✅ Evaluation complete and saved');
    console.log('   Evaluation ID:', saveResult.rows[0].id);
    console.log('   Proceed:', evaluation.final_recommendation.proceed);
    console.log('   Confidence:', (evaluation.final_recommendation.confidence * 100).toFixed(0) + '%');

    res.status(200).json({
      success: true,
      evaluation_id: saveResult.rows[0].id,
      evaluation
    });

  } catch (error: any) {
    console.error('❌ Error in VC Mode evaluation:', error);
    res.status(500).json({ 
      error: 'Evaluation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/vc-mode/evaluation/:deckId
 * Get saved evaluation results for a deck
 */
router.get('/evaluation/:deckId', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const { userId } = req.query;

    console.log('📖 Fetching VC Mode evaluation:');
    console.log('   Deck ID:', deckId);
    console.log('   User ID:', userId);

    const result = await query(`
      SELECT 
        id,
        deck_id,
        user_id,
        evaluation_data,
        proceed_recommendation,
        confidence_score,
        created_at
      FROM vc_evaluations
      WHERE deck_id = $1
      ${userId ? 'AND user_id = $2' : ''}
      ORDER BY created_at DESC
      LIMIT 1
    `, userId ? [deckId, userId] : [deckId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No evaluation found',
        message: 'Run an evaluation first using POST /api/vc-mode/evaluate/:deckId'
      });
    }

    console.log('✅ Evaluation found:', result.rows[0].id);

    res.json({
      success: true,
      evaluation: result.rows[0]
    });

  } catch (error: any) {
    console.error('❌ Error fetching evaluation:', error);
    res.status(500).json({ 
      error: 'Failed to fetch evaluation',
      message: error.message
    });
  }
});

/**
 * POST /api/vc-mode/export-to-deck-intelligence
 * Export VC Mode evaluation to Deck Intelligence context
 */
router.post('/export-to-deck-intelligence', async (req: Request, res: Response) => {
  try {
    const { deckId, userId, evaluationId } = req.body;

    console.log('📤 Exporting to Deck Intelligence:');
    console.log('   Deck ID:', deckId);
    console.log('   Evaluation ID:', evaluationId);

    if (!deckId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: deckId and userId'
      });
    }

    // Load evaluation
    const evalResult = await query(`
      SELECT evaluation_data
      FROM vc_evaluations
      WHERE id = $1 AND deck_id = $2 AND user_id = $3
    `, [evaluationId, deckId, userId]);

    if (evalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    const evaluationData = evalResult.rows[0].evaluation_data;

    // Insert or update deck_intelligence_context
    await query(`
      INSERT INTO deck_intelligence_context (
        deck_id,
        user_id,
        vc_mode_evaluation,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (deck_id, user_id)
      DO UPDATE SET
        vc_mode_evaluation = EXCLUDED.vc_mode_evaluation,
        updated_at = CURRENT_TIMESTAMP
    `, [deckId, userId, JSON.stringify(evaluationData)]);

    console.log('✅ Exported to Deck Intelligence');

    res.json({
      success: true,
      message: 'Evaluation exported to Deck Intelligence successfully'
    });

  } catch (error: any) {
    console.error('❌ Error exporting evaluation:', error);
    res.status(500).json({ 
      error: 'Export failed',
      message: error.message
    });
  }
});

/**
 * DELETE /api/vc-mode/evaluation/:evaluationId
 * Delete a saved evaluation
 */
router.delete('/evaluation/:evaluationId', async (req: Request, res: Response) => {
  try {
    const { evaluationId } = req.params;
    const { userId } = req.query;

    console.log('🗑️ Deleting evaluation:', evaluationId);

    const result = await query(`
      DELETE FROM vc_evaluations
      WHERE id = $1
      ${userId ? 'AND user_id = $2' : ''}
      RETURNING id
    `, userId ? [evaluationId, userId] : [evaluationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    console.log('✅ Evaluation deleted');

    res.json({
      success: true,
      message: 'Evaluation deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error deleting evaluation:', error);
    res.status(500).json({ 
      error: 'Delete failed',
      message: error.message
    });
  }
});

/**
 * GET /api/vc-mode/check-context/:userId
 * Check if user has exported any VC context
 */
router.get('/check-context/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Check deck_intelligence_context table for any entries with vc_context_data
    const result = await query(`
      SELECT 
        COUNT(*) as count,
        COUNT(CASE WHEN vc_context_data IS NOT NULL THEN 1 END) as context_count
      FROM deck_intelligence_context
      WHERE user_id = $1 AND vc_context_data IS NOT NULL
    `, [userId]);

    const hasContext = parseInt(result.rows[0].context_count) > 0;
    const itemCount = parseInt(result.rows[0].context_count);

    res.json({
      hasContext,
      itemCount
    });

  } catch (error: any) {
    console.error('❌ Error checking context:', error);
    res.json({ hasContext: false, itemCount: 0 });
  }
});

export default router;
