const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'team_sso',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function checkAnalysisData() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 CHECKING DECK ANALYSIS FOR COMPANY NAME EXTRACTION');
    console.log('='.repeat(80) + '\n');

    // Query 1: Check if feedback contains JSON with company info
    const analysisQuery = `
      SELECT 
        da.id,
        da.deck_id,
        pd.filename,
        pd.company_id,
        da.section_name,
        da.feedback,
        pd.created_at
      FROM deck_analysis da
      JOIN pitch_decks pd ON pd.id = da.deck_id
      WHERE da.section_name = 'Overall Analysis'
      ORDER BY pd.created_at DESC
      LIMIT 10
    `;

    const results = await pool.query(analysisQuery);

    console.log(`📊 Found ${results.rows.length} analysis records\n`);
    console.log('='.repeat(80));

    results.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. DECK: "${row.filename}"`);
      console.log(`   Deck ID: ${row.deck_id}`);
      console.log(`   Company ID: ${row.company_id || 'NULL'}`);
      console.log(`   Date: ${new Date(row.created_at).toLocaleString()}`);
      
      // Try to parse feedback as JSON to find company name
      let companyNameFound = false;
      let extractedCompanyName = null;
      
      try {
        // Check if feedback is JSON
        if (row.feedback && typeof row.feedback === 'string' && row.feedback.trim().startsWith('{')) {
          const feedbackJson = JSON.parse(row.feedback);
          
          // Look for company name in various possible locations
          if (feedbackJson.companyName) {
            extractedCompanyName = feedbackJson.companyName;
            companyNameFound = true;
          } else if (feedbackJson.company_name) {
            extractedCompanyName = feedbackJson.company_name;
            companyNameFound = true;
          } else if (feedbackJson.overallAnalysis && feedbackJson.overallAnalysis.companyName) {
            extractedCompanyName = feedbackJson.overallAnalysis.companyName;
            companyNameFound = true;
          }
        } else if (row.feedback) {
          // Check if feedback contains company name as plain text
          const companyMatch = row.feedback.match(/company[:\s]+([A-Za-z0-9\s\.\-]+)/i);
          if (companyMatch) {
            extractedCompanyName = companyMatch[1].trim();
            companyNameFound = true;
          }
        }
      } catch (e) {
        // Not valid JSON, check as plain text
        if (row.feedback) {
          const companyMatch = row.feedback.match(/company[:\s]+([A-Za-z0-9\s\.\-]+)/i);
          if (companyMatch) {
            extractedCompanyName = companyMatch[1].trim();
            companyNameFound = true;
          }
        }
      }

      if (companyNameFound) {
        console.log(`   ✅ Company Name Extracted: "${extractedCompanyName}"`);
      } else {
        console.log(`   ❌ Company Name: NOT FOUND in analysis`);
      }

      // Show feedback structure
      if (row.feedback) {
        const feedbackPreview = row.feedback.substring(0, 200);
        console.log(`   📝 Feedback Type: ${typeof row.feedback}`);
        console.log(`   📄 Feedback Preview: ${feedbackPreview}...`);
      } else {
        console.log(`   ⚠️  No feedback data`);
      }
      
      console.log('   ' + '-'.repeat(76));
    });

    // Query 2: Statistics on company name extraction
    console.log('\n' + '='.repeat(80));
    console.log('📈 EXTRACTION STATISTICS');
    console.log('='.repeat(80) + '\n');

    const statsQuery = `
      SELECT 
        COUNT(*) as total_analyses,
        COUNT(DISTINCT pd.filename) as unique_filenames,
        COUNT(DISTINCT pd.company_id) as unique_company_ids,
        COUNT(*) FILTER (WHERE pd.company_id IS NULL) as null_company_ids
      FROM deck_analysis da
      JOIN pitch_decks pd ON pd.id = da.deck_id
      WHERE da.section_name = 'Overall Analysis'
    `;

    const stats = await pool.query(statsQuery);
    const stat = stats.rows[0];

    console.log(`📊 Total Analyses: ${stat.total_analyses}`);
    console.log(`📁 Unique Filenames: ${stat.unique_filenames}`);
    console.log(`🏢 Unique Company IDs: ${stat.unique_company_ids}`);
    console.log(`⚠️  NULL Company IDs: ${stat.null_company_ids}`);

    // Query 3: Check for duplicate analyses of same deck
    console.log('\n' + '='.repeat(80));
    console.log('🔄 DUPLICATE FILENAME ANALYSIS (from deck_analysis)');
    console.log('='.repeat(80) + '\n');

    const duplicatesQuery = `
      SELECT 
        pd.filename,
        COUNT(DISTINCT pd.id) as unique_decks,
        COUNT(DISTINCT pd.company_id) as unique_companies,
        ARRAY_AGG(DISTINCT pd.company_id) as company_ids,
        COUNT(da.id) as analysis_count
      FROM deck_analysis da
      JOIN pitch_decks pd ON pd.id = da.deck_id
      WHERE da.section_name = 'Overall Analysis'
      GROUP BY pd.filename
      HAVING COUNT(DISTINCT pd.id) > 1
      ORDER BY COUNT(DISTINCT pd.id) DESC
      LIMIT 10
    `;

    const dupes = await pool.query(duplicatesQuery);

    if (dupes.rows.length > 0) {
      console.log(`⚠️  Found ${dupes.rows.length} filenames with multiple analyzed versions:\n`);
      
      dupes.rows.forEach((row, i) => {
        console.log(`${i + 1}. "${row.filename}"`);
        console.log(`   📊 Unique Decks: ${row.unique_decks}`);
        console.log(`   🏢 Unique Companies: ${row.unique_companies}`);
        console.log(`   🔗 Company IDs: ${row.company_ids.map(id => id || 'NULL').join(', ')}`);
        console.log(`   ✅ Analysis Count: ${row.analysis_count}`);
        
        if (row.unique_companies === 1) {
          console.log(`   ✅ GOOD: All versions link to SAME company`);
        } else {
          console.log(`   ❌ BAD: Versions link to DIFFERENT companies`);
        }
        console.log('');
      });
    } else {
      console.log('✅ No duplicate analyzed filenames found\n');
    }

    // Query 4: Sample company grouping by filename
    console.log('='.repeat(80));
    console.log('💡 POTENTIAL VC LENS GROUPINGS (by filename)');
    console.log('='.repeat(80) + '\n');

    const groupingQuery = `
      WITH deck_versions AS (
        SELECT 
          pd.filename,
          pd.id as deck_id,
          pd.company_id,
          pd.sso_score,
          pd.created_at,
          da.id as analysis_id
        FROM pitch_decks pd
        JOIN deck_analysis da ON da.deck_id = pd.id
        WHERE da.section_name = 'Overall Analysis'
      )
      SELECT 
        filename,
        COUNT(*) as version_count,
        COUNT(DISTINCT company_id) as company_count,
        ARRAY_AGG(sso_score ORDER BY created_at) as score_progression,
        ARRAY_AGG(TO_CHAR(created_at, 'YYYY-MM-DD') ORDER BY created_at) as dates
      FROM deck_versions
      GROUP BY filename
      HAVING COUNT(*) >= 2
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `;

    const groupings = await pool.query(groupingQuery);

    if (groupings.rows.length > 0) {
      console.log(`🎯 Top ${groupings.rows.length} filenames with multiple versions:\n`);
      
      groupings.rows.forEach((row, i) => {
        console.log(`${i + 1}. "${row.filename}"`);
        console.log(`   📈 Versions: ${row.version_count}`);
        console.log(`   🏢 Companies: ${row.company_count}`);
        console.log(`   📊 Score Progression: ${row.score_progression.join(' → ')}`);
        console.log(`   📅 Dates: ${row.dates.join(', ')}`);
        
        if (row.company_count === 1) {
          console.log(`   ✅ PERFECT FOR VC LENS: Single company, multiple versions!`);
        } else {
          console.log(`   ⚠️  WARNING: Multiple companies - needs better linking`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️  No filenames with multiple analyzed versions found\n');
    }

    console.log('='.repeat(80));
    console.log('🎯 CONCLUSION FOR VC LENS');
    console.log('='.repeat(80) + '\n');

    if (dupes.rows.length > 0) {
      const sameCompanyCount = dupes.rows.filter(r => r.unique_companies === 1).length;
      const diffCompanyCount = dupes.rows.filter(r => r.unique_companies > 1).length;
      
      console.log(`✅ Reliable filename linking: ${sameCompanyCount} case(s)`);
      console.log(`❌ Unreliable filename linking: ${diffCompanyCount} case(s)`);
      
      if (diffCompanyCount > 0) {
        console.log('\n⚠️  RECOMMENDATION: Use company_id as primary linking method');
        console.log('   Add AI-extracted company name as fallback');
      } else {
        console.log('\n✅ Filename linking looks reliable for analyzed decks!');
        console.log('   Still recommend company_id as primary for best accuracy');
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

checkAnalysisData();
