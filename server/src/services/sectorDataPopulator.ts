/**
 * Sector Data Populator Service
 * Uses Gemini AI to research and populate top 10 companies per sector with realistic metrics
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { getCurrentGeminiModel } from '../routes/settings.js';

// Load environment variables
dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use the model selected in the frontend dropdown
function getModel() {
  const selectedModel = getCurrentGeminiModel();
  console.log(`🤖 Using Gemini model: ${selectedModel}`);
  return genAI.getGenerativeModel({ model: selectedModel });
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'teamsso_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

interface SectorDefinition {
  id: string;
  name: string;
  description: string;
  commonMetrics: string[];
  sectorMetrics: string[];
}

const SECTOR_DEFINITIONS: SectorDefinition[] = [
  {
    id: 'ai',
    name: 'Artificial Intelligence & ML',
    description: 'AI research, ML platforms, LLMs, computer vision, NLP',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['model_accuracy', 'dataset_size', 'inference_speed', 'compute_costs', 'api_calls'],
  },
  {
    id: 'healthtech',
    name: 'HealthTech & Biotech',
    description: 'Digital health, telemedicine, medical devices, pharma tech',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['patient_acquisition_cost', 'patient_retention_rate', 'avg_revenue_per_patient', 'clinical_outcomes_index', 'regulatory_approvals'],
  },
  {
    id: 'fintech',
    name: 'FinTech & Payments',
    description: 'Digital banking, payments, lending, wealth management',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['transaction_volume', 'arpu', 'default_rate', 'compliance_score', 'aum', 'fraud_rate'],
  },
  {
    id: 'cleantech',
    name: 'CleanTech & Sustainability',
    description: 'Renewable energy, carbon capture, waste management, green tech',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['carbon_abatement_cost', 'energy_efficiency_ratio', 'renewable_adoption_rate', 'compliance_score', 'emissions_reduced'],
  },
  {
    id: 'edtech',
    name: 'EdTech & Learning',
    description: 'Online education, learning platforms, edtech tools',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['students_enrolled', 'completion_rate', 'engagement_rate', 'avg_revenue_per_student', 'nps'],
  },
  {
    id: 'foodtech',
    name: 'Food Tech & AgTech',
    description: 'Food delivery, agtech, alternative proteins, supply chain',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['gmv', 'order_frequency', 'avg_order_value', 'food_waste_reduction', 'supply_chain_efficiency'],
  },
  {
    id: 'saas',
    name: 'SaaS & Enterprise B2B',
    description: 'Cloud software, enterprise tools, B2B platforms',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['mrr', 'arr', 'churn_rate', 'nps', 'customer_count', 'expansion_revenue'],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce & Retail',
    description: 'Online retail, marketplace, DTC brands',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['gmv', 'avg_order_value', 'conversion_rate', 'repeat_purchase_rate', 'cart_abandonment_rate'],
  },
  {
    id: 'mobility',
    name: 'Mobility & Transportation',
    description: 'Ride-sharing, logistics, autonomous vehicles, micro-mobility',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['rides_per_day', 'avg_ride_value', 'driver_utilization', 'fleet_size', 'customer_wait_time'],
  },
  {
    id: 'proptech',
    name: 'PropTech & Real Estate',
    description: 'Property management, real estate platforms, smart buildings',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['properties_listed', 'avg_transaction_value', 'time_to_close', 'occupancy_rate', 'commission_rate'],
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Security software, threat detection, compliance tools',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['threats_detected', 'false_positive_rate', 'response_time', 'compliance_certifications', 'security_score'],
  },
  {
    id: 'web3',
    name: 'Web3 & Blockchain',
    description: 'Crypto, DeFi, NFTs, blockchain infrastructure',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['active_wallets', 'transaction_volume', 'gas_optimization', 'tvl', 'network_uptime'],
  },
  {
    id: 'other',
    name: 'Other / General Tech',
    description: 'Other technology sectors not covered above',
    commonMetrics: ['revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'],
    sectorMetrics: ['custom_metric_1', 'custom_metric_2', 'custom_metric_3'],
  },
];

/**
 * Generate top 10 companies for a specific sector using Gemini AI
 */
export async function generateSectorTopCompanies(sectorId: string): Promise<any[]> {
  const sector = SECTOR_DEFINITIONS.find(s => s.id === sectorId);
  if (!sector) {
    throw new Error(`Sector ${sectorId} not found`);
  }

  console.log(`🤖 Generating top 10 companies for ${sector.name}...`);

  const prompt = `You are a startup market intelligence expert. Generate data for the TOP 10 performing companies in the ${sector.name} sector.

**Sector Description**: ${sector.description}

**Requirements**:
1. Research and identify the 10 best-performing, most notable companies in this sector (mix of public companies, unicorns, and well-funded startups)
2. Provide realistic metrics based on publicly available data or reasonable estimates
3. Rank them from 1-10 based on overall performance (revenue, funding, market position)
4. Include founded year (actual founding year if known)

**Common Metrics to Include** (for each company):
${sector.commonMetrics.map(m => `- ${m}`).join('\n')}

**Sector-Specific Metrics to Include**:
${sector.sectorMetrics.map(m => `- ${m}`).join('\n')}

**Output Format** (JSON array):
[
  {
    "rank": 1,
    "company_name": "Company Name",
    "description": "Brief description (1 sentence)",
    "founded_year": 2015,
    "website": "https://example.com",
    "common_metrics": {
      "revenue": { "value": 1600000000, "unit": "USD", "period": "ARR" },
      "growth_rate": { "value": 200, "unit": "percent", "period": "YoY" },
      "cac": { "value": 5000, "unit": "USD" },
      "ltv": { "value": 50000, "unit": "USD" },
      "ltv_cac_ratio": { "value": 10.0 },
      "burn_rate": { "value": 50000000, "unit": "USD", "period": "monthly" },
      "runway": { "value": 36, "unit": "months" },
      "gross_margin": { "value": 92, "unit": "percent" },
      "employees": { "value": 750 },
      "funding_raised": { "value": 11300000000, "unit": "USD" }
    },
    "sector_metrics": {
      // Sector-specific metrics here with same structure
    }
  }
]

**CRITICAL INSTRUCTIONS**:
- Return ONLY valid JSON (no markdown, no backticks, no explanations)
- All numeric values must be numbers, not strings
- Use realistic estimates if exact data unavailable
- Ensure all 10 companies are included
- Revenue should be in USD (convert if needed)
- Make sure metrics are internally consistent (e.g., LTV/CAC ratio should match LTV and CAC values)

Generate the JSON now:`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean up the response (remove markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const companies = JSON.parse(jsonText);

    if (!Array.isArray(companies) || companies.length !== 10) {
      throw new Error('Invalid response: expected array of 10 companies');
    }

    console.log(`✅ Generated ${companies.length} companies for ${sector.name}`);
    return companies;
  } catch (error) {
    console.error(`❌ Error generating companies for ${sectorId}:`, error);
    throw error;
  }
}

/**
 * Save generated companies to database
 */
export async function saveSectorCompanies(sectorId: string, companies: any[]): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete existing companies for this sector
    await client.query('DELETE FROM sector_top_companies WHERE sector = $1', [sectorId]);

    // Insert new companies
    for (const company of companies) {
      await client.query(
        `INSERT INTO sector_top_companies 
         (sector, company_name, rank, description, website, founded_year, common_metrics, sector_metrics)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          sectorId,
          company.company_name,
          company.rank,
          company.description,
          company.website || null,
          company.founded_year || null,
          JSON.stringify(company.common_metrics),
          JSON.stringify(company.sector_metrics),
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Saved ${companies.length} companies for ${sectorId} to database`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error saving companies for ${sectorId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Populate a single sector with top 10 companies
 */
export async function populateSector(sectorId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`\n🚀 Starting population for sector: ${sectorId}`);

    const companies = await generateSectorTopCompanies(sectorId);
    await saveSectorCompanies(sectorId, companies);

    return {
      success: true,
      message: `Successfully populated ${companies.length} companies for ${sectorId}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to populate ${sectorId}: ${error.message}`,
    };
  }
}

/**
 * Populate all sectors with top 10 companies
 */
export async function populateAllSectors(): Promise<{ success: boolean; results: any[] }> {
  console.log(`\n🚀 Starting population for ALL ${SECTOR_DEFINITIONS.length} sectors...`);

  const results = [];

  for (const sector of SECTOR_DEFINITIONS) {
    console.log(`\n📊 Processing sector ${sector.id} (${sector.name})...`);

    try {
      const result = await populateSector(sector.id);
      results.push({
        sectorId: sector.id,
        sectorName: sector.name,
        ...result,
      });

      // Add delay between sectors to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      results.push({
        sectorId: sector.id,
        sectorName: sector.name,
        success: false,
        message: `Error: ${error.message}`,
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`\n✅ Population complete: ${successCount} succeeded, ${failCount} failed`);

  return {
    success: failCount === 0,
    results,
  };
}

/**
 * Get list of all sectors
 */
export function getSectorDefinitions(): SectorDefinition[] {
  return SECTOR_DEFINITIONS;
}
