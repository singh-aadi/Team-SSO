// Quick migration script to run schema.sql
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('🔄 Connecting to database...');

    // Retry loop: sometimes connections fail transiently (ECONNRESET) when the proxy or network is unstable.
    const maxAttempts = 4;
    let attempt = 0;
    let client;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        client = await pool.connect();
        console.log(`✅ Connected on attempt ${attempt}!`);
        break;
      } catch (connErr) {
        console.error(`⚠️ Connection attempt ${attempt} failed:`, connErr && connErr.message ? connErr.message : connErr);
        if (attempt >= maxAttempts) {
          throw connErr;
        }
        // Wait before retrying (exponential backoff)
        const backoffMs = 500 * Math.pow(2, attempt - 1);
        console.log(`⏳ Waiting ${backoffMs}ms before retrying...`);
        await new Promise(r => setTimeout(r, backoffMs));
      }
    }

    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    
    console.log('🔄 Running migrations...');
    // Run within a single query so errors are surfaced clearly
    await client.query(schemaSQL);
    console.log('✅ Schema created successfully!');

    client.release();
    await pool.end();

    console.log('\n✅ Migration complete!');
  } catch (error) {
    // Print full stack for debugging (not just message)
    console.error('❌ Migration failed:', error && error.stack ? error.stack : error);
    process.exit(1);
  }
}

runMigration();
