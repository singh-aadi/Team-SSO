const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'team_sso',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function analyzeFilenameReliability() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 FILENAME RELIABILITY ANALYSIS FOR ANALYZED DECKS');
    console.log('='.repeat(80) + '\n');

    // Check analyzed decks only
    const query = `
      SELECT 
        filename,
        COUNT(*) as version_count,
        ARRAY_AGG(sso_score ORDER BY analyzed_at) as scores,
        ARRAY_AGG(TO_CHAR(analyzed_at, 'YYYY-MM-DD HH24:MI') ORDER BY analyzed_at) as dates,
        ARRAY_AGG(id ORDER BY analyzed_at) as deck_ids
      FROM pitch_decks
      WHERE sso_score IS NOT NULL
        AND analysis_status = 'completed'
      GROUP BY filename
      ORDER BY version_count DESC, filename
    `;

    const results = await pool.query(query);

    console.log(`📊 ANALYZED DECKS GROUPED BY FILENAME:\n`);

    let totalGroups = results.rows.length;
    let multiVersionGroups = results.rows.filter(r => r.version_count > 1).length;
    let singleVersionGroups = results.rows.filter(r => r.version_count === 1).length;

    results.rows.forEach((row, index) => {
      console.log(`${index + 1}. Filename: "${row.filename}"`);
      console.log(`   Versions: ${row.version_count}`);
      
      if (row.version_count > 1) {
        console.log(`   📈 Score History: ${row.scores.join(' → ')}`);
        console.log(`   📅 Dates: ${row.dates.join(' | ')}`);
        
        // Calculate trend
        const firstScore = parseFloat(row.scores[0]);
        const lastScore = parseFloat(row.scores[row.scores.length - 1]);
        const change = ((lastScore - firstScore) / firstScore * 100).toFixed(1);
        
        if (change > 0) {
          console.log(`   ✅ TREND: Improving (+${change}%)`);
        } else if (change < 0) {
          console.log(`   ⚠️  TREND: Declining (${change}%)`);
        } else {
          console.log(`   ➡️  TREND: Stable (${change}%)`);
        }
        
        console.log(`   🎯 PERFECT FOR VC LENS: Multiple versions tracked!`);
      } else {
        console.log(`   📊 Score: ${row.scores[0]}`);
        console.log(`   📅 Date: ${row.dates[0]}`);
        console.log(`   ℹ️  Single version (no history yet)`);
      }
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('📈 SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log(`Total filename groups: ${totalGroups}`);
    console.log(`  - With multiple versions: ${multiVersionGroups} (VC Lens ready ✅)`);
    console.log(`  - Single version: ${singleVersionGroups} (future potential)`);
    console.log('');

    // Check for potential issues
    console.log('='.repeat(80));
    console.log('🔍 RELIABILITY CHECK');
    console.log('='.repeat(80) + '\n');

    // For analyzed decks, check if same filename = same company
    const reliabilityQuery = `
      SELECT 
        filename,
        COUNT(DISTINCT company_id) as unique_companies,
        ARRAY_AGG(DISTINCT company_id) as company_ids
      FROM pitch_decks
      WHERE sso_score IS NOT NULL
        AND analysis_status = 'completed'
      GROUP BY filename
      HAVING COUNT(*) > 1
    `;

    const reliability = await pool.query(reliabilityQuery);

    if (reliability.rows.length === 0) {
      console.log('✅ NO CONFLICTS: All filenames with multiple versions are consistent');
      console.log('   (No filename is used by different companies)');
      console.log('');
      console.log('🎯 VERDICT: Filename is RELIABLE for VC Lens grouping!');
    } else {
      console.log('⚠️  CONFLICTS FOUND:');
      reliability.rows.forEach(row => {
        console.log(`   - "${row.filename}": ${row.unique_companies} different company_ids`);
        console.log(`     Company IDs: ${row.company_ids.join(', ')}`);
      });
      
      if (reliability.rows.every(r => r.company_ids.length === 1 && r.company_ids[0] === '00000000-0000-0000-0000-000000000001')) {
        console.log('');
        console.log('ℹ️  NOTE: All use the same default company_id (00000000...)');
        console.log('   This is expected due to test/development uploads.');
        console.log('');
        console.log('🎯 VERDICT: Filename is STILL RELIABLE (all use same test company)');
      } else {
        console.log('');
        console.log('⚠️  VERDICT: Filename may have conflicts - need AI extraction');
      }
    }

    console.log('\n');

    // Show what VC Lens would display
    if (multiVersionGroups > 0) {
      console.log('='.repeat(80));
      console.log('📊 VC LENS PREVIEW (What users would see)');
      console.log('='.repeat(80) + '\n');

      const multiVersionDecks = results.rows.filter(r => r.version_count > 1);
      
      multiVersionDecks.forEach((row, i) => {
        // Extract company name from filename
        const companyName = row.filename
          .replace(/\.(pdf|ppt|pptx|docx|doc)$/i, '')
          .replace(/[-_()]/g, ' ')
          .replace(/\b(pitch|deck|presentation|slide|v\d+|final|draft|inr|usd|may|june|july|aug|sep|oct|nov|dec|\d{4})\b/gi, '')
          .trim();

        console.log(`${i + 1}. Company: "${companyName}"`);
        console.log(`   Versions Analyzed: ${row.version_count}`);
        console.log(`   Score Progression:`);
        
        row.scores.forEach((score, idx) => {
          console.log(`     v${idx + 1} (${row.dates[idx]}): ${(parseFloat(score) * 100).toFixed(0)}/100`);
        });
        
        console.log('');
      });
    }

    console.log('='.repeat(80));
    console.log('💡 RECOMMENDATION');
    console.log('='.repeat(80) + '\n');

    if (multiVersionGroups > 0 && reliability.rows.length === 0) {
      console.log('✅ FILENAME-BASED VC LENS IS VIABLE!');
      console.log('');
      console.log('Benefits:');
      console.log('  ✅ No database changes needed');
      console.log('  ✅ Works with current data immediately');
      console.log('  ✅ Simple query: GROUP BY filename');
      console.log('  ✅ Already have multiple versions to track');
      console.log('');
      console.log('Implementation:');
      console.log('  1. Use filename as grouping key');
      console.log('  2. Extract display name from filename');
      console.log('  3. Show version history chronologically');
      console.log('');
      console.log('Future Enhancement (optional):');
      console.log('  - Add company_name_extracted for better display names');
      console.log('  - But NOT required for basic VC Lens functionality');
    } else if (multiVersionGroups === 0) {
      console.log('ℹ️  NOT ENOUGH DATA YET');
      console.log('');
      console.log('Current Status:');
      console.log('  - Only single-version decks analyzed');
      console.log('  - Need multiple analyses of same deck to show trends');
      console.log('');
      console.log('VC Lens will work once you:');
      console.log('  - Re-analyze an existing deck, OR');
      console.log('  - Upload updated versions of pitch decks');
    } else {
      console.log('⚠️  MIXED RESULTS');
      console.log('');
      console.log('Some filenames have conflicts. Recommend:');
      console.log('  1. Add company_name_extracted column for clarity');
      console.log('  2. Use AI extraction for better grouping');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

analyzeFilenameReliability();
