const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'team_sso',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function checkCompanyIdDistribution() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 CHECKING COMPANY_ID DISTRIBUTION ACROSS ANALYZED DECKS');
    console.log('='.repeat(80) + '\n');

    // Query 1: Count unique company_ids in analyzed decks
    const companyDistQuery = `
      SELECT 
        company_id,
        COUNT(*) as deck_count,
        ARRAY_AGG(DISTINCT filename) as filenames,
        MIN(analyzed_at) as first_analysis,
        MAX(analyzed_at) as last_analysis
      FROM pitch_decks
      WHERE sso_score IS NOT NULL
        AND analysis_status = 'completed'
      GROUP BY company_id
      ORDER BY deck_count DESC
    `;

    const results = await pool.query(companyDistQuery);

    console.log(`📊 UNIQUE COMPANY IDs IN ANALYZED DECKS: ${results.rows.length}\n`);

    if (results.rows.length === 1) {
      console.log('⚠️  WARNING: ALL analyzed decks have the SAME company_id!');
      console.log('   This means company_id cannot be used to differentiate between companies.\n');
    }

    results.rows.forEach((row, index) => {
      console.log(`${index + 1}. Company ID: ${row.company_id || 'NULL'}`);
      console.log(`   📊 Analyzed Decks: ${row.deck_count}`);
      console.log(`   📁 Unique Filenames: ${row.filenames.length}`);
      console.log(`   📅 First Analysis: ${row.first_analysis ? new Date(row.first_analysis).toLocaleString() : 'N/A'}`);
      console.log(`   📅 Last Analysis: ${row.last_analysis ? new Date(row.last_analysis).toLocaleString() : 'N/A'}`);
      console.log(`   📝 Files:`);
      row.filenames.forEach(filename => {
        console.log(`      - ${filename}`);
      });
      console.log('');
    });

    // Query 2: Check if this is the default/test company
    console.log('='.repeat(80));
    console.log('🏢 CHECKING COMPANY DETAILS');
    console.log('='.repeat(80) + '\n');

    const companyDetailsQuery = `
      SELECT 
        id,
        name,
        industry,
        stage,
        status,
        created_at
      FROM companies
      WHERE id = ANY(
        SELECT DISTINCT company_id 
        FROM pitch_decks 
        WHERE sso_score IS NOT NULL 
          AND company_id IS NOT NULL
      )
    `;

    const companies = await pool.query(companyDetailsQuery);

    if (companies.rows.length === 0) {
      console.log('⚠️  No company records found for analyzed decks!');
      console.log('   The company_id references a company that may not exist or is deleted.\n');
    } else {
      companies.rows.forEach((company) => {
        console.log(`Company ID: ${company.id}`);
        console.log(`Name: ${company.name || 'Not set'}`);
        console.log(`Industry: ${company.industry || 'Not set'}`);
        console.log(`Stage: ${company.stage || 'Not set'}`);
        console.log(`Status: ${company.status}`);
        console.log(`Created: ${new Date(company.created_at).toLocaleString()}`);
        console.log('');

        // Check if this looks like a default/test company
        if (company.id === '00000000-0000-0000-0000-000000000001') {
          console.log('🚨 THIS IS A DEFAULT/TEST COMPANY ID!');
          console.log('   All analyzed decks are linked to the same test company.');
          console.log('   This means company_id is NOT being set properly during upload.\n');
        }
      });
    }

    // Query 3: Check all pitch_decks company_id distribution (not just analyzed)
    console.log('='.repeat(80));
    console.log('🔍 COMPANY_ID DISTRIBUTION ACROSS ALL PITCH DECKS (Including Unanalyzed)');
    console.log('='.repeat(80) + '\n');

    const allDecksQuery = `
      SELECT 
        company_id,
        COUNT(*) as total_decks,
        COUNT(*) FILTER (WHERE sso_score IS NOT NULL) as analyzed_decks,
        COUNT(*) FILTER (WHERE sso_score IS NULL) as unanalyzed_decks
      FROM pitch_decks
      GROUP BY company_id
      ORDER BY total_decks DESC
    `;

    const allDecks = await pool.query(allDecksQuery);

    console.log(`Found ${allDecks.rows.length} unique company_id value(s):\n`);

    allDecks.rows.forEach((row, index) => {
      console.log(`${index + 1}. Company ID: ${row.company_id || 'NULL'}`);
      console.log(`   Total Decks: ${row.total_decks}`);
      console.log(`   Analyzed: ${row.analyzed_decks}`);
      console.log(`   Unanalyzed: ${row.unanalyzed_decks}`);
      console.log('');
    });

    // Analysis
    console.log('='.repeat(80));
    console.log('💡 ANALYSIS FOR VC LENS');
    console.log('='.repeat(80) + '\n');

    if (results.rows.length === 1 && results.rows[0].company_id === '00000000-0000-0000-0000-000000000001') {
      console.log('🚨 CRITICAL FINDING:');
      console.log('   ALL analyzed decks are assigned to the SAME default/test company_id.');
      console.log('');
      console.log('❌ IMPACT ON VC LENS:');
      console.log('   - Cannot use company_id to link different companies');
      console.log('   - company_id does NOT differentiate between We360.ai, Cashvisory, Dr. Doodley, etc.');
      console.log('   - All decks would be grouped together as one "company"');
      console.log('');
      console.log('✅ SOLUTION:');
      console.log('   1. PRIMARY: Use AI-extracted company name (from deck content)');
      console.log('   2. FALLBACK: Use filename pattern matching');
      console.log('   3. FIX: Update upload flow to properly assign company_id');
      console.log('');
      console.log('📋 IMPLEMENTATION PRIORITY:');
      console.log('   🔥 URGENT: Add company_name_extracted column (Migration 010)');
      console.log('   🔥 URGENT: Extract company name during AI analysis');
      console.log('   🔥 URGENT: Use company name for VC Lens grouping');
      console.log('   📝 Future: Fix company_id assignment in upload flow');
    } else if (results.rows.length > 1) {
      console.log('✅ GOOD NEWS:');
      console.log('   Multiple company_ids found in analyzed decks.');
      console.log('   company_id CAN be used for VC Lens grouping.');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkCompanyIdDistribution();
