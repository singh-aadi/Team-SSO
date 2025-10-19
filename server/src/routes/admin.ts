import { Router, Request, Response } from 'express';
import { query } from '../db';
import fs from 'fs';
import path from 'path';

const router = Router();

// ADMIN ENDPOINT - Run database migrations
// POST /api/admin/migrate
router.post('/migrate', async (req: Request, res: Response) => {
  try {
    const { migration, secret } = req.body;
    
    // Simple auth check
    if (secret !== 'TeamSSO2024MigrateNow') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    console.log('🔧 Running migration:', migration);

    let sql = '';
    
    if (migration === 'fix-companies') {
      // Run the companies fix migration
      const migrationPath = path.join(__dirname, '../../migrations/004_add_more_companies_with_stages.sql');
      sql = fs.readFileSync(migrationPath, 'utf8');
    } else if (migration === 'quick-fix') {
      // Quick fix for existing companies
      sql = `
        UPDATE companies SET stage = 'Series A' WHERE name = 'TechFlow AI' AND (stage IS NULL OR stage = '');
        UPDATE companies SET stage = 'Seed' WHERE name = 'GreenEats' AND (stage IS NULL OR stage = '');
        UPDATE companies SET stage = 'Series B' WHERE name = 'HealthTrack Pro' AND (stage IS NULL OR stage = '');
        UPDATE companies SET stage = 'Seed' WHERE name = 'FinanceHub' AND (stage IS NULL OR stage = '');
        UPDATE companies SET stage = 'Series A' WHERE name = 'EduStream' AND (stage IS NULL OR stage = '');
      `;
    } else {
      return res.status(400).json({ error: 'Invalid migration name' });
    }

    // Execute the SQL
    await query('BEGIN');
    await query(sql);
    await query('COMMIT');

    // Get updated company counts
    const result = await query(`
      SELECT 
        stage,
        COUNT(*) as count
      FROM companies 
      WHERE stage IS NOT NULL AND stage != ''
      GROUP BY stage
      ORDER BY stage;
    `);

    console.log('✅ Migration completed successfully!');

    res.json({
      success: true,
      message: 'Migration completed',
      companies_by_stage: result.rows
    });

  } catch (error: any) {
    await query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message 
    });
  }
});

// GET /api/admin/check - Check database status
router.get('/check', async (req: Request, res: Response) => {
  try {
    const companies = await query('SELECT id, name, industry, stage FROM companies ORDER BY name LIMIT 20');
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN stage IS NOT NULL AND stage != '' THEN 1 END) as with_stage,
        COUNT(CASE WHEN stage IS NULL OR stage = '' THEN 1 END) as without_stage
      FROM companies
    `);

    res.json({
      total_companies: companies.rows.length,
      stats: stats.rows[0],
      companies: companies.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
