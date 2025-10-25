const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:admin123@localhost:5432/startup_scout'
});

async function testVCContext() {
  console.log('\n🧪 Testing VC Context Manager...\n');
  
  try {
    // Test 1: Check tables exist
    console.log('✓ Test 1: Verify VC context tables exist');
    const tablesResult = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'vc_context%'"
    );
    console.log('  Tables found:', tablesResult.rows.map(r => r.table_name).join(', '));
    
    if (tablesResult.rows.length !== 2) {
      throw new Error('Expected 2 tables (vc_context_items, vc_context_summaries)');
    }
    
    // Test 2: Check if any items exist
    console.log('\n✓ Test 2: Query existing context items');
    const itemsResult = await pool.query('SELECT COUNT(*) FROM vc_context_items');
    console.log(`  Found ${itemsResult.rows[0].count} context items`);
    
    // Test 3: Check summaries
    console.log('\n✓ Test 3: Query existing summaries');
    const summariesResult = await pool.query('SELECT COUNT(*) FROM vc_context_summaries');
    console.log(`  Found ${summariesResult.rows[0].count} summaries`);
    
    // Test 4: Get a sample deck ID for testing
    console.log('\n✓ Test 4: Get sample deck for testing');
    const deckResult = await pool.query('SELECT id, company_name FROM pitch_decks LIMIT 1');
    if (deckResult.rows.length > 0) {
      console.log(`  Sample deck: ${deckResult.rows[0].company_name} (${deckResult.rows[0].id})`);
    }
    
    console.log('\n✅ All database tests passed!\n');
    
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testVCContext();
