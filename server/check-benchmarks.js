const { query } = require('./dist/db');

async function checkBenchmarks() {
  try {
    // Check if table exists
    const tableCheck = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'industry_benchmarks'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Table DOES NOT EXIST');
      return;
    }
    
    console.log('✅ Table EXISTS\n');
    
    // Get row count
    const countResult = await query('SELECT COUNT(*) as count FROM industry_benchmarks');
    console.log('📊 Total Rows:', countResult.rows[0].count, '\n');
    
    // Get sample data
    const sampleData = await query(`
      SELECT industry, stage, metric_name, metric_value, unit 
      FROM industry_benchmarks 
      ORDER BY industry, stage 
      LIMIT 15
    `);
    
    console.log('📈 Sample Benchmark Data:\n');
    sampleData.rows.forEach(row => {
      console.log(`  ${row.industry.padEnd(15)} | ${row.stage.padEnd(12)} | ${row.metric_name.padEnd(25)} : ${row.metric_value}${row.unit}`);
    });
    
    // Get industries
    const industries = await query('SELECT DISTINCT industry FROM industry_benchmarks ORDER BY industry');
    console.log('\n🏭 Industries:', industries.rows.map(r => r.industry).join(', '));
    
    // Get stages
    const stages = await query('SELECT DISTINCT stage FROM industry_benchmarks ORDER BY stage');
    console.log('📊 Stages:', stages.rows.map(r => r.stage).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBenchmarks();
