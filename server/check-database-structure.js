const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'team_sso',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function checkTables() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 DATABASE TABLE ANALYSIS');
    console.log('='.repeat(80) + '\n');

    // Check pitch_decks table
    console.log('1️⃣  PITCH_DECKS TABLE:');
    const decksQuery = `
      SELECT 
        COUNT(*) as total_decks,
        COUNT(DISTINCT company_id) as unique_companies,
        COUNT(*) FILTER (WHERE analysis_status = 'completed') as completed_analyses,
        COUNT(*) FILTER (WHERE analysis_status = 'pending') as pending_analyses,
        COUNT(*) FILTER (WHERE sso_score IS NOT NULL) as decks_with_scores
      FROM pitch_decks
    `;
    const decksResult = await pool.query(decksQuery);
    const deckStats = decksResult.rows[0];
    
    console.log(`   📊 Total Decks: ${deckStats.total_decks}`);
    console.log(`   🏢 Unique Companies: ${deckStats.unique_companies}`);
    console.log(`   ✅ Completed Analyses: ${deckStats.completed_analyses}`);
    console.log(`   ⏳ Pending Analyses: ${deckStats.pending_analyses}`);
    console.log(`   📈 Decks with SSO Scores: ${deckStats.decks_with_scores}`);

    // Check deck_analysis table
    console.log('\n2️⃣  DECK_ANALYSIS TABLE:');
    const analysisQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT deck_id) as unique_decks,
        COUNT(DISTINCT section_name) as unique_sections
      FROM deck_analysis
    `;
    const analysisResult = await pool.query(analysisQuery);
    const analysisStats = analysisResult.rows[0];
    
    console.log(`   📊 Total Records: ${analysisStats.total_records}`);
    console.log(`   📁 Unique Decks: ${analysisStats.unique_decks}`);
    console.log(`   📑 Unique Sections: ${analysisStats.unique_sections}`);

    if (analysisStats.total_records === '0') {
      console.log('\n   ⚠️  WARNING: deck_analysis table is EMPTY!');
      console.log('   This means analysis results are NOT being stored in deck_analysis table.');
      console.log('   They might be stored elsewhere or only in pitch_decks.sso_score');
    }

    // Check if there are any sections
    if (analysisStats.unique_sections > 0) {
      console.log('\n   📋 Section Names:');
      const sectionsQuery = `SELECT DISTINCT section_name FROM deck_analysis LIMIT 10`;
      const sections = await pool.query(sectionsQuery);
      sections.rows.forEach(row => {
        console.log(`      - ${row.section_name}`);
      });
    }

    // Check pitch_decks columns to see what data we have
    console.log('\n3️⃣  PITCH_DECKS COLUMNS:');
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pitch_decks'
      ORDER BY ordinal_position
    `;
    const columns = await pool.query(columnsQuery);
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    // Sample recent decks with scores
    console.log('\n4️⃣  RECENT DECKS WITH SCORES (Sample):');
    const sampleQuery = `
      SELECT 
        id,
        filename,
        company_id,
        sso_score,
        analysis_status,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created,
        TO_CHAR(analyzed_at, 'YYYY-MM-DD HH24:MI') as analyzed
      FROM pitch_decks
      WHERE sso_score IS NOT NULL
      ORDER BY analyzed_at DESC
      LIMIT 5
    `;
    const samples = await pool.query(sampleQuery);
    
    if (samples.rows.length > 0) {
      console.log('');
      samples.rows.forEach((deck, i) => {
        console.log(`   ${i + 1}. ${deck.filename}`);
        console.log(`      Score: ${deck.sso_score}`);
        console.log(`      Company ID: ${deck.company_id || 'NULL'}`);
        console.log(`      Status: ${deck.analysis_status}`);
        console.log(`      Created: ${deck.created}`);
        console.log(`      Analyzed: ${deck.analyzed || 'Not analyzed'}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No decks with scores found');
    }

    // Check for duplicate filenames in analyzed decks
    console.log('5️⃣  DUPLICATE FILENAMES (Analyzed Decks Only):');
    const dupesQuery = `
      SELECT 
        filename,
        COUNT(*) as count,
        COUNT(DISTINCT company_id) as unique_companies,
        ARRAY_AGG(DISTINCT company_id) as company_ids,
        ARRAY_AGG(sso_score ORDER BY analyzed_at) as score_history,
        ARRAY_AGG(TO_CHAR(analyzed_at, 'YYYY-MM-DD') ORDER BY analyzed_at) as analysis_dates
      FROM pitch_decks
      WHERE sso_score IS NOT NULL
      GROUP BY filename
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `;
    const dupes = await pool.query(dupesQuery);
    
    if (dupes.rows.length > 0) {
      console.log(`\n   Found ${dupes.rows.length} filename(s) with multiple analyzed versions:\n`);
      dupes.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. "${row.filename}"`);
        console.log(`      Uploads: ${row.count}`);
        console.log(`      Companies: ${row.unique_companies}`);
        console.log(`      Company IDs: ${row.company_ids.map(id => id || 'NULL').join(', ')}`);
        console.log(`      Score History: ${row.score_history.filter(s => s).join(' → ')}`);
        console.log(`      Analysis Dates: ${row.analysis_dates.filter(d => d).join(', ')}`);
        
        if (row.unique_companies === 1) {
          console.log(`      ✅ SAME COMPANY - Perfect for VC Lens!`);
        } else {
          console.log(`      ❌ DIFFERENT COMPANIES - Needs better linking`);
        }
        console.log('');
      });
    } else {
      console.log('\n   ✅ No duplicate filenames in analyzed decks');
    }

    // Summary
    console.log('='.repeat(80));
    console.log('📊 SUMMARY FOR VC LENS FEATURE');
    console.log('='.repeat(80) + '\n');

    if (analysisStats.total_records === '0') {
      console.log('⚠️  Analysis data is NOT in deck_analysis table');
      console.log('✅ Can use pitch_decks.sso_score for VC Lens tracking');
      console.log('');
      console.log('💡 RECOMMENDATION:');
      console.log('   - Query pitch_decks table directly for score history');
      console.log('   - Group by company_id (primary) or filename (fallback)');
      console.log('   - Track sso_score over time using analyzed_at timestamps');
    }

    if (dupes.rows.length > 0) {
      const reliableCount = dupes.rows.filter(r => r.unique_companies === 1).length;
      const unreliableCount = dupes.rows.filter(r => r.unique_companies > 1).length;
      
      console.log(`\n📈 Filename Linking Analysis:`);
      console.log(`   ✅ Reliable (same company): ${reliableCount}`);
      console.log(`   ❌ Unreliable (diff companies): ${unreliableCount}`);
      
      if (unreliableCount > 0) {
        console.log('\n   ⚠️  Filename alone is NOT sufficient');
        console.log('   ✅ Use company_id as primary linking method');
      } else if (reliableCount > 0) {
        console.log('\n   ✅ Filename linking looks reliable!');
        console.log('   Still recommend company_id for best accuracy');
      }
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkTables();
