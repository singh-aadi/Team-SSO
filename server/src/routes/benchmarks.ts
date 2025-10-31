import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/benchmarks - Get industry benchmarks
router.get('/', async (req: Request, res: Response) => {
  try {
    const { industry, stage } = req.query;

    let queryText = 'SELECT * FROM industry_benchmarks WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

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

    queryText += ' ORDER BY industry, stage, metric_name';

    const result = await query(queryText, queryParams);

    // Group by industry and stage
    const grouped = result.rows.reduce((acc: any, row) => {
      const key = `${row.industry}-${row.stage}`;
      if (!acc[key]) {
        acc[key] = {
          industry: row.industry,
          stage: row.stage,
          metrics: []
        };
      }
      acc[key].metrics.push({
        name: row.metric_name,
        value: parseFloat(row.metric_value),
        percentile_25: parseFloat(row.percentile_25),
        percentile_50: parseFloat(row.percentile_50),
        percentile_75: parseFloat(row.percentile_75),
        unit: row.unit
      });
      return acc;
    }, {});

    res.json({
      benchmarks: Object.values(grouped)
    });
  } catch (error) {
    console.error('Error fetching benchmarks:', error);
    res.status(500).json({ error: 'Failed to fetch benchmarks' });
  }
});

// GET /api/benchmarks/industries - Get list of industries
router.get('/industries', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT DISTINCT industry 
      FROM industry_benchmarks 
      ORDER BY industry
    `);

    res.json({
      industries: result.rows.map(r => r.industry)
    });
  } catch (error) {
    console.error('Error fetching industries:', error);
    res.status(500).json({ error: 'Failed to fetch industries' });
  }
});

// GET /api/benchmarks/stages - Get list of stages
router.get('/stages', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT DISTINCT stage 
      FROM industry_benchmarks 
      ORDER BY stage
    `);

    res.json({
      stages: result.rows.map(r => r.stage)
    });
  } catch (error) {
    console.error('Error fetching stages:', error);
    res.status(500).json({ error: 'Failed to fetch stages' });
  }
});

export default router;
