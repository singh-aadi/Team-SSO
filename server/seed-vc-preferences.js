const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'startup_scout',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Divyank07#'
});

async function insertDefaultPreferences() {
  try {
    console.log('📝 Step 1: Creating unique constraint...');
    
    await pool.query(`
      ALTER TABLE vc_preferences 
      ADD CONSTRAINT vc_preferences_user_id_preferences_name_key 
      UNIQUE (user_id, preferences_name)
    `).catch(e => console.log('   (Constraint may already exist)'));
    
    console.log('✅ Unique constraint ensured');
    
    console.log('📝 Step 2: Inserting default VC preferences for vc-001...');
    
    const result = await pool.query(`
      INSERT INTO vc_preferences (user_id, preferences_name, industry, criteria)
      VALUES ($1, $2, $3, $4::jsonb)
      ON CONFLICT (user_id, preferences_name) DO UPDATE
      SET criteria = EXCLUDED.criteria, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      'vc-001',
      'Default',
      'all',
      JSON.stringify([
        {
          "id": "team",
          "name": "Team",
          "weight": 30,
          "subcriteria": [
            {"id": "experience", "name": "Experience", "weight": 40},
            {"id": "technical", "name": "Technical Expertise", "weight": 30},
            {"id": "vision", "name": "Vision & Leadership", "weight": 30}
          ]
        },
        {
          "id": "market",
          "name": "Market Opportunity",
          "weight": 25,
          "subcriteria": [
            {"id": "size", "name": "Market Size", "weight": 35},
            {"id": "growth", "name": "Growth Rate", "weight": 35},
            {"id": "timing", "name": "Market Timing", "weight": 30}
          ]
        },
        {
          "id": "product",
          "name": "Product & Technology",
          "weight": 25,
          "subcriteria": [
            {"id": "innovation", "name": "Innovation Level", "weight": 40},
            {"id": "scalability", "name": "Scalability", "weight": 30},
            {"id": "moat", "name": "Competitive Moat", "weight": 30}
          ]
        },
        {
          "id": "traction",
          "name": "Traction & Metrics",
          "weight": 20,
          "subcriteria": [
            {"id": "growth", "name": "Growth Rate", "weight": 40},
            {"id": "retention", "name": "Retention", "weight": 30},
            {"id": "efficiency", "name": "Capital Efficiency", "weight": 30}
          ]
        }
      ])
    ]);
    
    console.log('✅ Default preferences created for vc-001');
    console.log('   ID:', result.rows[0].id);
    console.log('   Name:', result.rows[0].preferences_name);
    console.log('   Industry:', result.rows[0].industry);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

insertDefaultPreferences();
