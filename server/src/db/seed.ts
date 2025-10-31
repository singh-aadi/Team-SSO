import { query } from './index';

// Sample data for MVP testing
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed Industries and Benchmarks
    const benchmarks = [
      // SaaS Industry - Seed Stage
      { industry: 'SaaS', stage: 'Seed', metric: 'MRR', value: 25000, p25: 15000, p50: 25000, p75: 45000, unit: 'USD', year: 2024 },
      { industry: 'SaaS', stage: 'Seed', metric: 'CAC', value: 500, p25: 300, p50: 500, p75: 800, unit: 'USD', year: 2024 },
      { industry: 'SaaS', stage: 'Seed', metric: 'Churn Rate', value: 5, p25: 3, p50: 5, p75: 8, unit: '%', year: 2024 },
      { industry: 'SaaS', stage: 'Seed', metric: 'Growth Rate', value: 15, p25: 10, p50: 15, p75: 25, unit: '%', year: 2024 },
      
      // SaaS Industry - Series A
      { industry: 'SaaS', stage: 'Series A', metric: 'MRR', value: 150000, p25: 100000, p50: 150000, p75: 250000, unit: 'USD', year: 2024 },
      { industry: 'SaaS', stage: 'Series A', metric: 'CAC', value: 800, p25: 500, p50: 800, p75: 1200, unit: 'USD', year: 2024 },
      { industry: 'SaaS', stage: 'Series A', metric: 'Churn Rate', value: 3, p25: 2, p50: 3, p75: 5, unit: '%', year: 2024 },
      { industry: 'SaaS', stage: 'Series A', metric: 'LTV/CAC Ratio', value: 3.5, p25: 2.5, p50: 3.5, p75: 5, unit: 'ratio', year: 2024 },
      
      // FinTech Industry - Seed Stage
      { industry: 'FinTech', stage: 'Seed', metric: 'Transaction Volume', value: 500000, p25: 300000, p50: 500000, p75: 800000, unit: 'USD', year: 2024 },
      { industry: 'FinTech', stage: 'Seed', metric: 'User Acquisition Cost', value: 25, p25: 15, p50: 25, p75: 40, unit: 'USD', year: 2024 },
      { industry: 'FinTech', stage: 'Seed', metric: 'Monthly Active Users', value: 5000, p25: 2000, p50: 5000, p75: 10000, unit: 'users', year: 2024 },
      
      // E-commerce - Seed Stage
      { industry: 'E-commerce', stage: 'Seed', metric: 'GMV', value: 100000, p25: 50000, p50: 100000, p75: 200000, unit: 'USD', year: 2024 },
      { industry: 'E-commerce', stage: 'Seed', metric: 'AOV', value: 75, p25: 50, p50: 75, p75: 120, unit: 'USD', year: 2024 },
      { industry: 'E-commerce', stage: 'Seed', metric: 'Repeat Purchase Rate', value: 25, p25: 15, p50: 25, p75: 35, unit: '%', year: 2024 },
    ];

    for (const benchmark of benchmarks) {
      await query(`
        INSERT INTO industry_benchmarks 
        (industry, stage, metric_name, metric_value, percentile_25, percentile_50, percentile_75, unit, year, data_source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (industry, stage, metric_name, year) DO NOTHING
      `, [
        benchmark.industry,
        benchmark.stage,
        benchmark.metric,
        benchmark.value,
        benchmark.p25,
        benchmark.p50,
        benchmark.p75,
        benchmark.unit,
        benchmark.year,
        'Internal Research'
      ]);
    }

    console.log('✅ Benchmarks seeded successfully');

    // Seed Sample Companies
    const companies = [
      {
        name: 'CloudSync Pro',
        industry: 'SaaS',
        stage: 'Series A',
        founded: 2021,
        location: 'San Francisco, CA',
        description: 'AI-powered cloud data synchronization platform for enterprises',
        funding: 5000000,
        valuation: 25000000,
        employees: 25
      },
      {
        name: 'PayFlow Solutions',
        industry: 'FinTech',
        stage: 'Seed',
        founded: 2022,
        location: 'New York, NY',
        description: 'Digital payment infrastructure for emerging markets',
        funding: 2000000,
        valuation: 10000000,
        employees: 12
      },
      {
        name: 'EcoMarket',
        industry: 'E-commerce',
        stage: 'Seed',
        founded: 2023,
        location: 'Austin, TX',
        description: 'Sustainable products marketplace connecting eco-conscious consumers',
        funding: 1500000,
        valuation: 6000000,
        employees: 8
      },
      {
        name: 'HealthTrack AI',
        industry: 'HealthTech',
        stage: 'Pre-Seed',
        founded: 2024,
        location: 'Boston, MA',
        description: 'AI-driven personal health monitoring and prediction platform',
        funding: 500000,
        valuation: 3000000,
        employees: 5
      },
      {
        name: 'DataForge Analytics',
        industry: 'SaaS',
        stage: 'Series A',
        founded: 2020,
        location: 'Seattle, WA',
        description: 'Real-time business intelligence and analytics platform',
        funding: 8000000,
        valuation: 40000000,
        employees: 35
      }
    ];

    for (const company of companies) {
      await query(`
        INSERT INTO companies 
        (name, industry, stage, founded_year, location, description, funding_amount, valuation, employee_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        company.name,
        company.industry,
        company.stage,
        company.founded,
        company.location,
        company.description,
        company.funding,
        company.valuation,
        company.employees
      ]);
    }

    console.log('✅ Sample companies seeded successfully');
    console.log('🎉 Database seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedDatabase;
