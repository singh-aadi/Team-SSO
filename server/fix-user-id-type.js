const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'startup_scout',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Divyank07#'
});

async function fixUserIdType() {
  try {
    console.log('🔧 Step 1: Dropping foreign key constraint...');
    
    await pool.query(`
      ALTER TABLE vc_preferences 
      DROP CONSTRAINT IF EXISTS vc_preferences_user_id_fkey
    `);
    
    console.log('✅ Foreign key dropped');
    
    console.log('🔧 Step 2: Changing user_id type to VARCHAR(255)...');
    
    await pool.query(`
      ALTER TABLE vc_preferences 
      ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text
    `);
    
    console.log('✅ Column type changed to VARCHAR(255)');
    
    // Make it NOT NULL
    await pool.query(`
      ALTER TABLE vc_preferences 
      ALTER COLUMN user_id SET NOT NULL
    `);
    
    console.log('✅ Set user_id to NOT NULL');
    
    // Verify the change
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'vc_preferences' AND column_name = 'user_id'
    `);
    
    console.log('📊 Final structure:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixUserIdType();
