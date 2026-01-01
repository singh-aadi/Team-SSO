// Migration script for deck_comparisons table
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Drop existing table if it exists (to recreate with correct schema)
    console.log('🗑️  Dropping existing deck_comparisons table if it exists...');
    await client.query('DROP TABLE IF EXISTS deck_comparisons CASCADE');
    console.log('✅ Dropped existing table');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '009-create-deck-comparisons.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration: 009-create-deck-comparisons.sql');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Created table: deck_comparisons');
    console.log('📊 Created indexes for performance');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('👋 Database connection closed');
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
