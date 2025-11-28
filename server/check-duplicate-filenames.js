const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'team_sso',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function checkDuplicateFilenames() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 CHECKING DUPLICATE FILENAMES IN PITCH_DECKS TABLE');
    console.log('='.repeat(70) + '\n');

    // Query 1: Find duplicate filenames
    const duplicatesQuery = `
      SELECT 
        filename, 
        COUNT(*) as upload_count,
        COUNT(DISTINCT company_id) as unique_company_count,
        ARRAY_AGG(DISTINCT company_id) as company_ids,
        ARRAY_AGG(id ORDER BY created_at) as deck_ids,
        ARRAY_AGG(created_at ORDER BY created_at) as upload_dates
      FROM pitch_decks 
      GROUP BY filename 
      HAVING COUNT(*) > 1 
      ORDER BY upload_count DESC
    `;

    const duplicates = await pool.query(duplicatesQuery);

    if (duplicates.rows.length === 0) {
      console.log('✅ No duplicate filenames found!');
      console.log('   Each filename is unique in the database.\n');
    } else {
      console.log(`⚠️  Found ${duplicates.rows.length} filename(s) with multiple uploads:\n`);

      duplicates.rows.forEach((row, index) => {
        console.log(`${index + 1}. Filename: "${row.filename}"`);
        console.log(`   📊 Total Uploads: ${row.upload_count}`);
        console.log(`   🏢 Unique Companies: ${row.unique_company_count}`);
        
        if (row.unique_company_count === 1) {
          console.log(`   ✅ Same Company: YES (company_id: ${row.company_ids[0] || 'NULL'})`);
        } else {
          console.log(`   ❌ Same Company: NO - Multiple different companies!`);
          console.log(`   🔗 Company IDs: ${row.company_ids.map(id => id || 'NULL').join(', ')}`);
        }
        
        console.log(`   📅 Upload Dates:`);
        row.upload_dates.forEach((date, i) => {
          console.log(`      ${i + 1}. ${new Date(date).toLocaleString()}`);
        });
        console.log('');
      });
    }

    // Query 2: Overall statistics
    console.log('='.repeat(70));
    console.log('📈 OVERALL STATISTICS');
    console.log('='.repeat(70) + '\n');

    const statsQuery = `
      SELECT 
        COUNT(*) as total_decks,
        COUNT(DISTINCT filename) as unique_filenames,
        COUNT(DISTINCT company_id) as unique_companies,
        COUNT(*) FILTER (WHERE company_id IS NULL) as decks_without_company
      FROM pitch_decks
    `;

    const stats = await pool.query(statsQuery);
    const stat = stats.rows[0];

    console.log(`📁 Total Pitch Decks: ${stat.total_decks}`);
    console.log(`📝 Unique Filenames: ${stat.unique_filenames}`);
    console.log(`🏢 Unique Companies: ${stat.unique_companies}`);
    console.log(`⚠️  Decks without company_id: ${stat.decks_without_company}`);
    
    const duplicateFileCount = stat.total_decks - stat.unique_filenames;
    console.log(`🔁 Duplicate file uploads: ${duplicateFileCount}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('💡 ANALYSIS FOR VC LENS FEATURE');
    console.log('='.repeat(70) + '\n');

    if (duplicates.rows.length > 0) {
      const sameCompanyDupes = duplicates.rows.filter(r => r.unique_company_count === 1).length;
      const diffCompanyDupes = duplicates.rows.filter(r => r.unique_company_count > 1).length;

      console.log(`✅ Filename reliably links to same company: ${sameCompanyDupes} case(s)`);
      console.log(`❌ Filename links to different companies: ${diffCompanyDupes} case(s)`);
      
      if (diffCompanyDupes > 0) {
        console.log('\n⚠️  WARNING: Filename alone is NOT reliable for linking!');
        console.log('   Recommendation: Use company_id as primary linking method.');
      } else if (sameCompanyDupes > 0) {
        console.log('\n✅ GOOD NEWS: All duplicate filenames belong to same company!');
        console.log('   Filename can be used as fallback linking method.');
      }
    } else {
      console.log('✅ All filenames are unique - no data to assess reliability.');
      console.log('   Recommendation: Use company_id + AI-extracted name for VC Lens.');
    }

    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDuplicateFilenames();
