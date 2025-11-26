const { Client } = require('pg');
require('dotenv').config();

async function createTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'startup_scout',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const createTableQuery = `
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
    `;

    await client.query(createTableQuery);
    console.log('✅ Table deck_intelligence_context created successfully!');

    // Create index
    await client.query('CREATE INDEX IF NOT EXISTS idx_deck_intelligence_deck ON deck_intelligence_context(deck_id);');
    console.log('✅ Index created successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

createTable();
