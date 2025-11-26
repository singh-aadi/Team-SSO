const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'startup_scout',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Divyank07#'
});

async function checkTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'vc_preferences' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 vc_preferences table structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();
