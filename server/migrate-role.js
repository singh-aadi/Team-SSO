require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'team_sso_db',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running migration: 007_add_user_role_selection.sql');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '007_add_user_role_selection.sql'),
      'utf8'
    );
    
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the change
    const result = await client.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'user_type'
    `);
    
    console.log('\n📊 user_type column info:');
    console.log(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
