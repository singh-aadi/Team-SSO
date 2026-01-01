/**
 * Create VC Mode tables in database
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'teamsso_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function createVCModeTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating VC Mode tables...\n');
    
    // Table 1: vc_preferences
    console.log('1️⃣ Creating vc_preferences table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS vc_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        preferences_name VARCHAR(255) NOT NULL,
        industry VARCHAR(255),
        criteria JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_vc_preferences_user ON vc_preferences(user_id);
    `);
    console.log('✅ vc_preferences created\n');
    
    // Table 2: vc_context_documents
    console.log('2️⃣ Creating vc_context_documents table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS vc_context_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_vc_context_deck ON vc_context_documents(deck_id);
      CREATE INDEX IF NOT EXISTS idx_vc_context_user ON vc_context_documents(user_id);
    `);
    console.log('✅ vc_context_documents created\n');
    
    // Table 3: vc_evaluations
    console.log('3️⃣ Creating vc_evaluations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS vc_evaluations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        evaluation_data JSONB NOT NULL,
        proceed_recommendation BOOLEAN NOT NULL,
        confidence_score DECIMAL(3, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_vc_evaluations_deck ON vc_evaluations(deck_id);
      CREATE INDEX IF NOT EXISTS idx_vc_evaluations_user ON vc_evaluations(user_id);
    `);
    console.log('✅ vc_evaluations created\n');
    
    // Table 4: deck_intelligence_context
    console.log('4️⃣ Creating deck_intelligence_context table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS deck_intelligence_context (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        vc_mode_evaluation JSONB,
        vc_context_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(deck_id, user_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_deck_intelligence_deck ON deck_intelligence_context(deck_id);
    `);
    console.log('✅ deck_intelligence_context created\n');
    
    // Create triggers
    console.log('5️⃣ Creating triggers...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      DROP TRIGGER IF EXISTS update_vc_preferences_updated_at ON vc_preferences;
      CREATE TRIGGER update_vc_preferences_updated_at 
        BEFORE UPDATE ON vc_preferences
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      DROP TRIGGER IF EXISTS update_deck_intelligence_updated_at ON deck_intelligence_context;
      CREATE TRIGGER update_deck_intelligence_updated_at 
        BEFORE UPDATE ON deck_intelligence_context
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Triggers created\n');
    
    // Verify all tables
    console.log('6️⃣ Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('vc_preferences', 'vc_context_documents', 'vc_evaluations', 'deck_intelligence_context')
      ORDER BY table_name
    `);
    
    console.log('✅ Tables verified:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    console.log('\n🎉 All VC Mode tables created successfully!');
    
  } catch (error) {
    console.error('❌ Table creation failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createVCModeTables().catch(err => {
  console.error(err);
  process.exit(1);
});
