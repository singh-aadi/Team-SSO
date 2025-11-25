import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/vc-preferences/:userId - Get user's VC preferences
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { industry } = req.query;

    console.log('📖 Loading VC preferences:');
    console.log('   User ID:', userId);
    console.log('   Industry filter:', industry || 'none');

    let queryText = `
      SELECT * FROM vc_preferences 
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (industry && industry !== 'all') {
      queryText += ` AND industry = $2`;
      params.push(industry);
    }

    queryText += ` ORDER BY updated_at DESC LIMIT 1`;

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      console.log('ℹ️ No preferences found for user:', userId);
      return res.status(404).json({ 
        error: 'No preferences found',
        message: 'User has no saved preferences. Using defaults.'
      });
    }

    console.log('✅ Found preferences:', result.rows[0].preferences_name);
    console.log('   Industry:', result.rows[0].industry);
    console.log('   Last updated:', result.rows[0].updated_at);

    res.json({
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error fetching VC preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// POST /api/vc-preferences - Save or update user's VC preferences
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, preferencesName, industry, criteria } = req.body;

    console.log('💾 Saving VC preferences:');
    console.log('   User ID:', userId);
    console.log('   Name:', preferencesName || 'Default');
    console.log('   Industry:', industry || 'all');
    console.log('   Criteria count:', Array.isArray(criteria) ? criteria.length : 'invalid');

    if (!userId || !criteria) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId and criteria are required' 
      });
    }

    // Validate that criteria is an object or array
    if (!criteria || typeof criteria !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid criteria format: must be an object or array' 
      });
    }

    const name = preferencesName || 'Default';
    const industryValue = industry || 'all';

    // Insert or update preferences
    const result = await query(`
      INSERT INTO vc_preferences 
        (user_id, preferences_name, industry, criteria, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, preferences_name) 
      DO UPDATE SET 
        industry = EXCLUDED.industry,
        criteria = EXCLUDED.criteria,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, name, industryValue, JSON.stringify(criteria)]);

    console.log('✅ Preferences saved successfully for:', userId);
    console.log('   Record ID:', result.rows[0].id);

    res.status(201).json({
      success: true,
      message: 'VC preferences saved successfully',
      preferences: result.rows[0]
    });
  } catch (error: any) {
    console.error('❌ Error saving VC preferences:', error);
    res.status(500).json({ 
      error: 'Failed to save preferences',
      details: error.message 
    });
  }
});

// GET /api/vc-preferences/:userId/all - Get all saved preferences for a user
router.get('/:userId/all', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await query(`
      SELECT * FROM vc_preferences 
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `, [userId]);

    res.json({
      preferences: result.rows
    });
  } catch (error) {
    console.error('Error fetching all VC preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// DELETE /api/vc-preferences/:userId/:preferencesName - Delete a specific preference set
router.delete('/:userId/:preferencesName', async (req: Request, res: Response) => {
  try {
    const { userId, preferencesName } = req.params;

    const result = await query(`
      DELETE FROM vc_preferences 
      WHERE user_id = $1 AND preferences_name = $2
      RETURNING *
    `, [userId, preferencesName]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Preference set not found' 
      });
    }

    res.json({
      success: true,
      message: 'Preferences deleted successfully',
      deleted: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting VC preferences:', error);
    res.status(500).json({ error: 'Failed to delete preferences' });
  }
});

export default router;
