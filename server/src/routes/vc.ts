import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/vc/watchlist - Get VC's watchlist
router.get('/watchlist', async (req: Request, res: Response) => {
  try {
    const { vc_id } = req.query;

    if (!vc_id) {
      return res.status(400).json({ error: 'vc_id is required' });
    }

    const result = await query(`
      SELECT w.*, c.name, c.industry, c.stage, c.valuation, c.description, c.location
      FROM vc_watchlist w
      JOIN companies c ON w.company_id = c.id
      WHERE w.vc_id = $1
      ORDER BY w.created_at DESC
    `, [vc_id]);

    res.json({ watchlist: result.rows });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// POST /api/vc/watchlist - Add company to watchlist
router.post('/watchlist', async (req: Request, res: Response) => {
  try {
    const { vc_id, company_id, notes, priority } = req.body;

    const result = await query(`
      INSERT INTO vc_watchlist (vc_id, company_id, notes, priority)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (vc_id, company_id) DO UPDATE
      SET notes = EXCLUDED.notes, priority = EXCLUDED.priority, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [vc_id, company_id, notes, priority || 'medium']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// GET /api/vc/portfolio - Get VC's portfolio
router.get('/portfolio', async (req: Request, res: Response) => {
  try {
    const { vc_id } = req.query;

    if (!vc_id) {
      return res.status(400).json({ error: 'vc_id is required' });
    }

    const result = await query(`
      SELECT p.*, c.name, c.industry, c.stage, c.location, c.employee_count
      FROM vc_portfolio p
      JOIN companies c ON p.company_id = c.id
      WHERE p.vc_id = $1 AND p.status = 'active'
      ORDER BY p.investment_date DESC
    `, [vc_id]);

    res.json({ portfolio: result.rows });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// GET /api/vc/dashboard - Get VC dashboard stats
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { vc_id } = req.query;

    if (!vc_id) {
      return res.status(400).json({ error: 'vc_id is required' });
    }

    // Portfolio stats
    const portfolioStats = await query(`
      SELECT 
        COUNT(*) as total_investments,
        SUM(investment_amount) as total_invested,
        AVG(stake_percentage) as avg_stake
      FROM vc_portfolio
      WHERE vc_id = $1 AND status = 'active'
    `, [vc_id]);

    // Watchlist count
    const watchlistCount = await query(`
      SELECT COUNT(*) as count FROM vc_watchlist WHERE vc_id = $1
    `, [vc_id]);

    // Recent activity
    const recentDecks = await query(`
      SELECT d.*, c.name as company_name
      FROM pitch_decks d
      JOIN companies c ON d.company_id = c.id
      WHERE d.uploaded_by = $1
      ORDER BY d.created_at DESC
      LIMIT 5
    `, [vc_id]);

    res.json({
      portfolio: portfolioStats.rows[0],
      watchlist_count: watchlistCount.rows[0].count,
      recent_decks: recentDecks.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
