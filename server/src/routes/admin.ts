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
    } else if (migration === 'add-all-companies') {
      // Add 12 new companies covering all stages
      sql = `
        -- Add Pre-Seed companies
        INSERT INTO companies (name, description, website_url, industry, stage, founded_year, employee_count, location, created_at)
        VALUES
          ('NanoBot Labs', 'Microscopic robotics for medical procedures', 'https://nanobotlabs.io', 'HealthTech', 'Pre-Seed', 2024, 3, 'Cambridge, MA', NOW()),
          ('CryptoGuard', 'Blockchain security and auditing platform', 'https://cryptoguard.tech', 'Cybersecurity', 'Pre-Seed', 2024, 4, 'Remote', NOW()),
          ('CleanAir Tech', 'Carbon capture technology', 'https://cleanairtech.com', 'CleanTech', 'Seed', 2023, 10, 'Portland, OR', NOW()),
          ('PropVision', 'AI-powered property valuation', 'https://propvision.ai', 'PropTech', 'Seed', 2023, 8, 'Miami, FL', NOW()),
          ('SecureNet AI', 'Enterprise cybersecurity platform', 'https://securenet.ai', 'Cybersecurity', 'Series A', 2022, 35, 'Austin, TX', NOW()),
          ('LearnFast', 'Personalized learning management', 'https://learnfast.edu', 'EdTech', 'Series A', 2022, 28, 'Chicago, IL', NOW()),
          ('PayFlow Global', 'International payment processing', 'https://payflow.global', 'FinTech', 'Series B', 2021, 50, 'New York, NY', NOW()),
          ('FreshFarm Direct', 'Farm-to-table food delivery', 'https://freshfarmdirect.com', 'Food Tech', 'Series B', 2021, 42, 'Denver, CO', NOW()),
          ('RideShare Pro', 'B2B ride-sharing platform', 'https://ridesharepro.com', 'Mobility', 'Series C', 2020, 120, 'San Francisco, CA', NOW()),
          ('ShopAI', 'AI-powered e-commerce', 'https://shopai.com', 'E-commerce', 'Series C', 2020, 85, 'Seattle, WA', NOW()),
          ('DataCore Enterprise', 'Enterprise SaaS platform', 'https://datacore.io', 'SaaS', 'Growth', 2019, 200, 'Palo Alto, CA', NOW()),
          ('ChainLink Finance', 'DeFi infrastructure', 'https://chainlinkfi.com', 'Web3', 'Growth', 2019, 150, 'Singapore', NOW())
        ON CONFLICT (name) DO NOTHING;
      `;
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
