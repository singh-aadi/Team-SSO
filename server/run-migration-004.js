const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration from environment
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'teamsso_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running migration: 004_add_more_companies_with_stages.sql');
    
    const migrationPath = path.join(__dirname, 'migrations', '004_add_more_companies_with_stages.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    
    // Show results
    const result = await client.query(`
      SELECT 
        stage,
        COUNT(*) as company_count,
        STRING_AGG(DISTINCT industry, ', ') as industries
      FROM companies 
      WHERE stage IS NOT NULL AND stage != ''
      GROUP BY stage
      ORDER BY 
        CASE stage
          WHEN 'Pre-Seed' THEN 1
          WHEN 'Seed' THEN 2
          WHEN 'Series A' THEN 3
          WHEN 'Series B' THEN 4
          WHEN 'Series C' THEN 5
          WHEN 'Series C+' THEN 6
          WHEN 'Growth' THEN 7
          ELSE 99
        END;
    `);
    
    console.log('\n📊 Companies by Stage:');
    result.rows.forEach(row => {
      console.log(`  ${row.stage}: ${row.company_count} companies (${row.industries})`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
