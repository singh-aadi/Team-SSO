/**
 * Script to populate sector_top_companies table with AI-generated data
 * Usage: 
 *   - Populate single sector: node populate-sectors.js ai
 *   - Populate all sectors: node populate-sectors.js all
 */

import dotenv from 'dotenv';
import { populateSector, populateAllSectors, getSectorDefinitions } from './src/services/sectorDataPopulator';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Usage:
  npm run populate-sectors <sector_id>  - Populate specific sector
  npm run populate-sectors all          - Populate all sectors

Available sectors:
${getSectorDefinitions().map(s => `  - ${s.id}: ${s.name}`).join('\n')}
    `);
    process.exit(0);
  }

  if (command === 'all') {
    console.log('🚀 Populating ALL sectors...\n');
    const result = await populateAllSectors();
    
    console.log('\n📊 Results:');
    result.results.forEach(r => {
      const icon = r.success ? '✅' : '❌';
      console.log(`${icon} ${r.sectorName}: ${r.message}`);
    });

    process.exit(result.success ? 0 : 1);
  } else {
    console.log(`🚀 Populating sector: ${command}\n`);
    const result = await populateSector(command);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      process.exit(0);
    } else {
      console.log(`❌ ${result.message}`);
      process.exit(1);
    }
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
