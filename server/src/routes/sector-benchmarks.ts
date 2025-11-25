import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { 
  populateSector, 
  populateAllSectors, 
  getSectorDefinitions 
} from '../services/sectorDataPopulator';

const router = Router();
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'teamsso_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Sector definitions with icons
const SECTORS = [
  { id: 'ai', name: 'Artificial Intelligence & ML', icon: '🤖' },
  { id: 'healthtech', name: 'HealthTech & Biotech', icon: '🏥' },
  { id: 'fintech', name: 'FinTech & Payments', icon: '💰' },
  { id: 'cleantech', name: 'CleanTech & Sustainability', icon: '🌱' },
  { id: 'edtech', name: 'EdTech & Learning', icon: '📚' },
  { id: 'foodtech', name: 'Food Tech & AgTech', icon: '🍕' },
  { id: 'saas', name: 'SaaS & Enterprise B2B', icon: '💼' },
  { id: 'ecommerce', name: 'E-commerce & Retail', icon: '🛒' },
  { id: 'mobility', name: 'Mobility & Transportation', icon: '🚗' },
  { id: 'proptech', name: 'PropTech & Real Estate', icon: '🏠' },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒' },
  { id: 'web3', name: 'Web3 & Blockchain', icon: '⛓️' },
  { id: 'other', name: 'Other / General Tech', icon: '🔧' },
];

// GET /api/sector-benchmarks/sectors - Get all sectors
router.get('/sectors', async (req: Request, res: Response) => {
  try {
    // Get count of companies per sector
    const result = await pool.query(`
      SELECT sector, COUNT(*) as company_count
      FROM sector_top_companies
      GROUP BY sector
    `);

    const companyCounts = result.rows.reduce((acc: any, row: any) => {
      acc[row.sector] = parseInt(row.company_count);
      return acc;
    }, {});

    const sectorsWithCounts = SECTORS.map(sector => ({
      ...sector,
      companyCount: companyCounts[sector.id] || 0,
    }));

    res.json({
      success: true,
      data: sectorsWithCounts,
    });
  } catch (error) {
    console.error('Error fetching sectors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sectors',
    });
  }
});

// GET /api/sector-benchmarks/sectors/:sectorId/companies - Get top 10 companies for a sector
router.get('/sectors/:sectorId/companies', async (req: Request, res: Response) => {
  try {
    const { sectorId } = req.params;

    const result = await pool.query(
      `SELECT id, sector, company_name, rank, logo_url, description, website, 
              founded_year, common_metrics, sector_metrics, last_updated
       FROM sector_top_companies
       WHERE sector = $1
       ORDER BY rank ASC`,
      [sectorId]
    );

    res.json({
      success: true,
      data: {
        sector: SECTORS.find(s => s.id === sectorId),
        companies: result.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching sector companies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sector companies',
    });
  }
});

// GET /api/sector-benchmarks/companies/:companyId - Get single company details
router.get('/companies/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const result = await pool.query(
      `SELECT * FROM sector_top_companies WHERE id = $1`,
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company',
    });
  }
});

// POST /api/sector-benchmarks/sectors/:sectorId/refresh - Refresh top companies for a sector using AI
router.post('/sectors/:sectorId/refresh', async (req: Request, res: Response) => {
  try {
    const { sectorId } = req.params;

    console.log(`🔄 Refreshing sector data for: ${sectorId}`);
    
    const result = await populateSector(sectorId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error('Error refreshing sector data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh sector data',
    });
  }
});

// GET /api/sector-benchmarks/decks/:deckId/metrics - Get metrics for a specific deck
router.get('/decks/:deckId/metrics', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;

    const result = await pool.query(
      `SELECT 
        pd.id, 
        pd.filename, 
        c.name as company_name,
        c.industry as sector,
        pd.sector as deck_sector,
        pd.extracted_metrics,
        pd.dual_pdf_analysis
       FROM pitch_decks pd
       JOIN companies c ON pd.company_id = c.id
       WHERE pd.id = $1`,
      [deckId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found',
      });
    }

  const deck = result.rows[0];

    // Extract metrics from dual_pdf_analysis if extracted_metrics is empty
  const metrics = deck.extracted_metrics || extractMetricsFromAnalysis(deck.dual_pdf_analysis);

    res.json({
      success: true,
        data: {
        deckId: deck.id,
        filename: deck.filename,
        companyName: deck.company_name,
        // Prefer deck-specific sector (if user provided) otherwise company industry
        sector: deck.deck_sector || deck.sector,
        metrics: metrics,
      },
    });
  } catch (error) {
    console.error('Error fetching deck metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deck metrics',
    });
  }
});

// POST /api/sector-benchmarks/populate-all - Populate all sectors (ADMIN ONLY)
router.post('/populate-all', async (req: Request, res: Response) => {
  try {
    console.log(`🚀 Starting population for ALL sectors...`);
    
    const result = await populateAllSectors();

    res.json({
      success: result.success,
      message: result.success 
        ? 'Successfully populated all sectors' 
        : 'Some sectors failed to populate',
      results: result.results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error populating all sectors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to populate sectors',
    });
  }
});

// GET /api/sector-benchmarks/sector-definitions - Get sector metadata
router.get('/sector-definitions', async (req: Request, res: Response) => {
  try {
    const definitions = getSectorDefinitions();
    res.json({
      success: true,
      data: definitions,
    });
  } catch (error) {
    console.error('Error fetching sector definitions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sector definitions',
    });
  }
});

// Helper function to map industry names to sector IDs
function mapIndustryToSectorId(industry: string): string {
  if (!industry) return 'other';
  
  const industryLower = industry.toLowerCase();
  
  // Direct mappings
  const mappings: { [key: string]: string } = {
    'artificial intelligence': 'ai',
    'ai': 'ai',
    'machine learning': 'ai',
    'healthtech': 'healthtech',
    'health tech': 'healthtech',
    'biotech': 'healthtech',
    'fintech': 'fintech',
    'financial technology': 'fintech',
    'cleantech': 'cleantech',
    'clean tech': 'cleantech',
    'sustainability': 'cleantech',
    'edtech': 'edtech',
    'education': 'edtech',
    'foodtech': 'foodtech',
    'food tech': 'foodtech',
    'agtech': 'foodtech',
    'saas': 'saas',
    'software': 'saas',
    'enterprise': 'saas',
    'ecommerce': 'ecommerce',
    'e-commerce': 'ecommerce',
    'retail': 'ecommerce',
    'mobility': 'mobility',
    'transportation': 'mobility',
    'proptech': 'proptech',
    'real estate': 'proptech',
    'cybersecurity': 'cybersecurity',
    'security': 'cybersecurity',
    'web3': 'web3',
    'blockchain': 'web3',
    'crypto': 'web3',
  };
  
  // Check for exact match
  if (mappings[industryLower]) {
    return mappings[industryLower];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(mappings)) {
    if (industryLower.includes(key)) {
      return value;
    }
  }
  
  return 'other';
}

// GET /api/sector-benchmarks/decks/:deckId/benchmark - Benchmark deck against top companies
router.get('/decks/:deckId/benchmark', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;

    // Get deck metrics
    const deckResult = await pool.query(
      `SELECT 
        pd.id, 
        pd.filename,
        c.name as company_name,
        c.industry as sector,
        pd.sector as deck_sector,
        pd.extracted_metrics,
        pd.dual_pdf_analysis
       FROM pitch_decks pd
       JOIN companies c ON pd.company_id = c.id
       WHERE pd.id = $1`,
      [deckId]
    );

    if (deckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Deck not found',
      });
    }

  const deck = deckResult.rows[0];

  // Determine the sector source: prefer a deck-specific override, then company industry
  const sectorSource = deck.deck_sector || deck.sector;
  // Map industry/sector name to canonical sector ID
  const sectorId = mapIndustryToSectorId(sectorSource);
  console.log(`📊 Mapping sector source "${sectorSource}" (company/deck) to sector "${sectorId}"`);

    // Get top companies for the same sector
    const companiesResult = await pool.query(
      `SELECT id, company_name, rank, common_metrics, sector_metrics
       FROM sector_top_companies
       WHERE sector = $1
       ORDER BY rank ASC`,
      [sectorId]
    );

    console.log(`   Found ${companiesResult.rows.length} benchmark companies for sector "${sectorId}"`);

    if (companiesResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No benchmark data available for sector "${sectorId}". Please populate this sector first using the refresh button or choose a deck in a different sector (AI, Web3, FinTech, SaaS, Mobility, or CleanTech).`,
        sectorId: sectorId,
        originalIndustry: deck.sector
      });
    }

    // Extract metrics (prefer extracted_metrics, fallback to analysis parsing)
    const deckMetrics = deck.extracted_metrics || extractMetricsFromAnalysis(deck.dual_pdf_analysis);
    console.log(`   Deck metrics source: ${deck.extracted_metrics ? 'extracted_metrics column' : 'dual_pdf_analysis parsing'}`);
    console.log(`   Common metrics found: ${Object.keys(deckMetrics.common || {}).length}`);

    // Calculate percentage comparisons (1st place = 100%)
    const benchmarkComparisons = calculateBenchmarkComparisons(
      deckMetrics,
      companiesResult.rows
    );

    res.json({
      success: true,
      data: {
        deck: {
          id: deck.id,
          filename: deck.filename,
          companyName: deck.company_name,
          sector: deck.sector,
          sectorId: sectorId,
          metrics: deckMetrics,
        },
        topCompanies: companiesResult.rows,
        comparisons: benchmarkComparisons,
      },
    });
  } catch (error) {
    console.error('Error benchmarking deck:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to benchmark deck',
    });
  }
});

// Helper function to extract metrics from dual_pdf_analysis
function extractMetricsFromAnalysis(analysis: any): any {
  if (!analysis) {
    console.log('⚠️ No analysis data available');
    return {
      common: {},
      sector_specific: {},
      missingMetrics: ['all']
    };
  }

  const metrics: any = {
    common: {},
    sector_specific: {},
    missingMetrics: []
  };

  // Extract from strengths/weaknesses text
  const allText = [
    ...(analysis.strengths || []),
    ...(analysis.weaknesses || []),
    ...(analysis.keyInsights || []),
    analysis.recommendation || '',
    JSON.stringify(analysis)
  ].join(' ');

  console.log(`📝 Extracting metrics from analysis text (${allText.length} chars)`);

  // Improved regex extraction patterns
  const revenueMatch = allText.match(/\$?([\d,.]+)\s?(M|K|million|thousand)?\s*(ARR|MRR|revenue)/i);
  const growthMatch = allText.match(/([\d.]+)%\s*(YoY|year[- ]over[- ]year|MoM|growth)/i);
  const cacMatch = allText.match(/CAC[:\s]+\$?([\d,]+)/i);
  const ltvMatch = allText.match(/LTV[:\s]+\$?([\d,]+)/i);
  const marginMatch = allText.match(/([\d.]+)%\s*(gross\s)?margin/i);
  const burnMatch = allText.match(/burn\s*rate[:\s]+\$?([\d,]+)/i);
  const runwayMatch = allText.match(/([\d.]+)\s*months?\s*(runway|remaining)/i);
  const employeesMatch = allText.match(/([\d,]+)\s*(employees|team\s*members)/i);
  const fundingMatch = allText.match(/\$?([\d,.]+)\s?(M|K|million|thousand)?\s*(raised|funding)/i);

  if (revenueMatch) {
    let value = parseFloat(revenueMatch[1].replace(/,/g, ''));
    const unit = revenueMatch[2]?.toLowerCase();
    if (unit === 'm' || unit === 'million') value *= 1000000;
    if (unit === 'k' || unit === 'thousand') value *= 1000;
    
    metrics.common.revenue = {
      value: value,
      unit: 'USD',
      period: revenueMatch[3] || 'ARR',
    };
    console.log(`✅ Found revenue: $${value} ${revenueMatch[3]}`);
  }

  if (growthMatch) {
    metrics.common.growth_rate = {
      value: parseFloat(growthMatch[1]),
      unit: 'percent',
      period: growthMatch[2],
    };
    console.log(`✅ Found growth: ${growthMatch[1]}%`);
  }

  if (cacMatch) {
    metrics.common.cac = {
      value: parseFloat(cacMatch[1].replace(/,/g, '')),
      unit: 'USD',
    };
    console.log(`✅ Found CAC: $${cacMatch[1]}`);
  }

  if (ltvMatch) {
    metrics.common.ltv = {
      value: parseFloat(ltvMatch[1].replace(/,/g, '')),
      unit: 'USD',
    };
    console.log(`✅ Found LTV: $${ltvMatch[1]}`);
  }

  if (marginMatch) {
    metrics.common.gross_margin = {
      value: parseFloat(marginMatch[1]),
      unit: 'percent',
    };
    console.log(`✅ Found margin: ${marginMatch[1]}%`);
  }

  if (burnMatch) {
    metrics.common.burn_rate = {
      value: parseFloat(burnMatch[1].replace(/,/g, '')),
      unit: 'USD',
      period: 'monthly'
    };
  }

  if (runwayMatch) {
    metrics.common.runway = {
      value: parseFloat(runwayMatch[1]),
      unit: 'months'
    };
  }

  if (employeesMatch) {
    metrics.common.employees = {
      value: parseInt(employeesMatch[1].replace(/,/g, '')),
      unit: 'count'
    };
  }

  if (fundingMatch) {
    let value = parseFloat(fundingMatch[1].replace(/,/g, ''));
    const unit = fundingMatch[2]?.toLowerCase();
    if (unit === 'm' || unit === 'million') value *= 1000000;
    if (unit === 'k' || unit === 'thousand') value *= 1000;
    
    metrics.common.funding_raised = {
      value: value,
      unit: 'USD'
    };
  }

  // Track which common metrics are missing
  const expectedCommonMetrics = [
    'revenue', 'growth_rate', 'cac', 'ltv', 'ltv_cac_ratio', 
    'burn_rate', 'runway', 'gross_margin', 'employees', 'funding_raised'
  ];

  expectedCommonMetrics.forEach(metric => {
    if (!metrics.common[metric]) {
      metrics.missingMetrics.push(metric);
    }
  });

  if (metrics.missingMetrics.length > 0) {
    console.log(`⚠️ Missing metrics: ${metrics.missingMetrics.join(', ')}`);
  }

  return metrics;
}

// Helper function to calculate benchmark comparisons with percentage scoring
function calculateBenchmarkComparisons(deckMetrics: any, topCompanies: any[]): any {
  if (topCompanies.length === 0) return {};

  const firstPlace = topCompanies[0]; // Rank 1 company
  const comparisons: any = {
    common_metrics: {},
    sector_metrics: {},
    missingMetrics: deckMetrics.missingMetrics || []
  };

  // Compare common metrics
  const deckCommon = deckMetrics.common || {};
  const firstPlaceCommon = firstPlace.common_metrics || {};

  Object.keys(firstPlaceCommon).forEach(metricKey => {
    const firstPlaceValue = firstPlaceCommon[metricKey]?.value;
    const deckValue = deckCommon[metricKey]?.value;

    if (firstPlaceValue && deckValue) {
      const percentage = (deckValue / firstPlaceValue) * 100;
      comparisons.common_metrics[metricKey] = {
        deckValue: deckValue,
        firstPlaceValue: firstPlaceValue,
        percentage: Math.round(percentage * 100) / 100,
        unit: firstPlaceCommon[metricKey]?.unit,
        available: true
      };
    } else if (firstPlaceValue && !deckValue) {
      // Metric exists in benchmark but not in deck - mark as N/A
      comparisons.common_metrics[metricKey] = {
        deckValue: 'N/A',
        firstPlaceValue: firstPlaceValue,
        percentage: 'N/A',
        unit: firstPlaceCommon[metricKey]?.unit,
        available: false
      };
    }
  });

  // Compare sector-specific metrics
  const deckSector = deckMetrics.sector_specific || {};
  const firstPlaceSector = firstPlace.sector_metrics || {};

  Object.keys(firstPlaceSector).forEach(metricKey => {
    const firstPlaceValue = firstPlaceSector[metricKey]?.value;
    const deckValue = deckSector[metricKey]?.value;

    if (firstPlaceValue && deckValue) {
      const percentage = (deckValue / firstPlaceValue) * 100;
      comparisons.sector_metrics[metricKey] = {
        deckValue: deckValue,
        firstPlaceValue: firstPlaceValue,
        percentage: Math.round(percentage * 100) / 100,
        unit: firstPlaceSector[metricKey]?.unit,
        available: true
      };
    } else if (firstPlaceValue && !deckValue) {
      // Metric exists in benchmark but not in deck - mark as N/A
      comparisons.sector_metrics[metricKey] = {
        deckValue: 'N/A',
        firstPlaceValue: firstPlaceValue,
        percentage: 'N/A',
        unit: firstPlaceSector[metricKey]?.unit,
        available: false
      };
    }
  });

  return comparisons;
}

export default router;
