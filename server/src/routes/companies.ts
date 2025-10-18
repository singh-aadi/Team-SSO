import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/companies - Get all companies with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { industry, stage, search, limit = '50', offset = '0' } = req.query;
    
    let queryText = 'SELECT * FROM companies WHERE status = $1';
    const queryParams: any[] = ['active'];
    let paramCount = 1;

    // Add filters
    if (industry) {
      paramCount++;
      queryText += ` AND industry = $${paramCount}`;
      queryParams.push(industry);
    }

    if (stage) {
      paramCount++;
      queryText += ` AND stage = $${paramCount}`;
      queryParams.push(stage);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM companies WHERE status = $1';
    const countParams: any[] = ['active'];
    let countParamIndex = 1;

    if (industry) {
      countParamIndex++;
      countQuery += ` AND industry = $${countParamIndex}`;
      countParams.push(industry);
    }
    if (stage) {
      countParamIndex++;
      countQuery += ` AND stage = $${countParamIndex}`;
      countParams.push(stage);
    }
    if (search) {
      countParamIndex++;
      countQuery += ` AND (name ILIKE $${countParamIndex} OR description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      companies: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// GET /api/companies/:id - Get single company
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM companies WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// POST /api/companies - Create new company
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      industry,
      stage,
      founded_year,
      location,
      website_url,
      description,
      funding_amount,
      valuation,
      employee_count
    } = req.body;

    const result = await query(`
      INSERT INTO companies 
      (name, industry, stage, founded_year, location, website_url, description, 
       funding_amount, valuation, employee_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      name, industry, stage, founded_year, location, website_url,
      description, funding_amount, valuation, employee_count
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// GET /api/companies/stats/overview - Get statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const industryStats = await query(`
      SELECT industry, COUNT(*) as count 
      FROM companies 
      WHERE status = 'active'
      GROUP BY industry
      ORDER BY count DESC
    `);

    const stageStats = await query(`
      SELECT stage, COUNT(*) as count 
      FROM companies 
      WHERE status = 'active'
      GROUP BY stage
      ORDER BY count DESC
    `);

    const totalCompanies = await query(`
      SELECT COUNT(*) as total FROM companies WHERE status = 'active'
    `);

    const avgFunding = await query(`
      SELECT 
        AVG(funding_amount) as avg_funding,
        AVG(valuation) as avg_valuation
      FROM companies 
      WHERE status = 'active'
    `);

    res.json({
      total: parseInt(totalCompanies.rows[0].total),
      byIndustry: industryStats.rows,
      byStage: stageStats.rows,
      averages: avgFunding.rows[0]
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
