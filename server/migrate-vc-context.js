// Run specific migration for VC Context tables
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runVCContextMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected!');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '007_add_vc_context_tables.sql'), 
      'utf-8'
    );
    
    console.log('🔄 Running VC Context migration...');
    await client.query(migrationSQL);
    console.log('✅ VC Context tables created successfully!');

    client.release();
    await pool.end();
    
    console.log('\n✅ Migration complete!');
    console.log('📊 Created tables:');
    console.log('   - vc_context_items');
    console.log('   - vc_context_summaries');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runVCContextMigration();
