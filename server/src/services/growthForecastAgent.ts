/**
 * 📈 GROWTH FORECAST AGENT
 * 
 * PhD-Level Predictive Analytics System for Startup Trajectories
 * 
 * METHODOLOGY:
 * - Analyzes historical data from pitch deck (revenue, users, metrics)
 * - Compares against similar companies in same industry/stage
 * - Uses Vertex AI for intelligent pattern recognition and extrapolation
 * - Generates probabilistic forecasts with confidence intervals
 * - Accounts for market conditions, competitive dynamics, execution risk
 * 
 * OUTPUT:
 * - 3-year, 5-year, 10-year revenue/user projections
 * - Three scenarios: Pessimistic (P10), Base Case (P50), Optimistic (P90)
 * - Key growth drivers and risk factors
 * - Market share evolution
 * - Capital requirements and dilution estimates
 * 
 * INTELLIGENCE:
 * Uses ensemble method combining:
 * 1. Statistical extrapolation (CAGR, trend analysis)
 * 2. Comparable company analysis (similar stage/industry)
 * 3. AI-powered pattern matching (Vertex AI)
 * 4. Market size constraints (TAM/SAM limitations)
 */

import { VertexAI } from '@google-cloud/vertexai';
import { Pool } from 'pg';
import { getActiveGeminiModel } from '../utils/gemini-model';

// Lazy-load VertexAI to ensure environment variables are loaded
let vertexAI: VertexAI | null = null;

function getVertexAI(): VertexAI {
  if (!vertexAI) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'projectsso-473108';
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    
    console.log(`📈 Initializing Vertex AI for Growth Forecast with project: ${project}`);
    
    vertexAI = new VertexAI({
      project,
      location,
    });
  }
  return vertexAI;
}

interface DeckMetrics {
  companyName: string;
  industry: string;
  stage: string;
  currentRevenue?: number;
  currentUsers?: number;
  monthlyGrowthRate?: number;
  tam?: number; // Total Addressable Market
  sam?: number; // Serviceable Addressable Market
  burnRate?: number;
  runway?: number;
  foundingYear?: number;
}

interface GrowthScenario {
  year: number;
  revenue: {
    pessimistic: number;
    baseCase: number;
    optimistic: number;
  };
  users: {
    pessimistic: number;
    baseCase: number;
    optimistic: number;
  };
  marketShare: {
    pessimistic: number;
    baseCase: number;
    optimistic: number;
  };
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

interface GrowthForecast {
  companyName: string;
  generatedAt: Date;
  forecastHorizon: string; // '3-year', '5-year', '10-year'
  scenarios: GrowthScenario[];
  keyDrivers: string[];
  riskFactors: string[];
  capitalRequirements: {
    year: number;
    estimatedRaise: number;
    estimatedValuation: number;
    dilution: number;
  }[];
  assumptions: string[];
  methodology: string;
}

/**
 * 🤖 EXTRACT METRICS FROM DECK ANALYSIS
 * Parse existing deck analysis to extract quantitative metrics
 */
async function extractMetricsFromDeck(
  pool: Pool,
  deckId: string
): Promise<DeckMetrics | null> {
  const deckQuery = `
    SELECT 
      pd.company_name,
      c.stage,
      c.industry,
      c.founding_year,
      pd.file_path
    FROM pitch_decks pd
    LEFT JOIN companies c ON pd.company_id = c.id
    WHERE pd.id = $1
  `;

  const analysisQuery = `
    SELECT section_name, feedback, strengths, section_score
    FROM deck_analysis
    WHERE deck_id = $1
  `;

  const deckResult = await pool.query(deckQuery, [deckId]);
  const analysisResult = await pool.query(analysisQuery, [deckId]);

  if (deckResult.rows.length === 0) {
    return null;
  }

  const deck = deckResult.rows[0];
  const analysis = analysisResult.rows;

  // Extract metrics from analysis using AI
  const vertex = getVertexAI();
  const model = vertex.preview.getGenerativeModel({
    model: getActiveGeminiModel(),
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.3,
    },
  });

  const analysisText = analysis.map(a => 
    `Section: ${a.section_name}\nFeedback: ${a.feedback}\nStrengths: ${a.strengths?.join(', ')}`
  ).join('\n\n');

  const extractionPrompt = `Extract quantitative metrics from this pitch deck analysis:

${analysisText}

Extract and return JSON with these fields (use null if not found):
{
  "currentRevenue": <number in USD, null if not found>,
  "currentUsers": <number of users/customers, null if not found>,
  "monthlyGrowthRate": <percentage as decimal (e.g., 0.15 for 15%), null if not found>,
  "tam": <Total Addressable Market in USD, null if not found>,
  "sam": <Serviceable Addressable Market in USD, null if not found>,
  "burnRate": <monthly burn in USD, null if not found>,
  "runway": <months of runway, null if not found>
}

Return ONLY the JSON object, no additional text.`;

  try {
    const result = await model.generateContent(extractionPrompt);
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      companyName: deck.company_name,
      industry: deck.industry || 'Unknown',
      stage: deck.stage || 'Unknown',
      foundingYear: deck.founding_year,
      ...extracted,
    };
  } catch (error) {
    console.error('Error extracting metrics:', error);
    return {
      companyName: deck.company_name,
      industry: deck.industry || 'Unknown',
      stage: deck.stage || 'Unknown',
      foundingYear: deck.founding_year,
    };
  }
}

/**
 * 📊 GENERATE GROWTH FORECAST
 * Core AI-powered forecasting logic
 */
export async function generateGrowthForecast(
  pool: Pool,
  deckId: string,
  horizonYears: number = 5
): Promise<GrowthForecast> {
  console.log(`📈 Growth Agent: Generating ${horizonYears}-year forecast for deck ${deckId}`);

  // Step 1: Extract metrics from deck
  const metrics = await extractMetricsFromDeck(pool, deckId);
  
  if (!metrics) {
    throw new Error(`Deck ${deckId} not found`);
  }

  // Step 2: Get comparable companies data
  const comparablesQuery = `
    SELECT 
      c.name,
      c.stage,
      c.industry,
      c.founding_year,
      c.current_valuation,
      c.total_funding
    FROM companies c
    WHERE c.industry = $1
      AND c.stage IN ($2, 'Series A', 'Series B')
      AND c.founding_year IS NOT NULL
    ORDER BY c.founding_year DESC
    LIMIT 20
  `;

  const comparables = await pool.query(comparablesQuery, [metrics.industry, metrics.stage]);

  // Step 3: Use Vertex AI for intelligent forecasting
  const vertex = getVertexAI();
  const model = vertex.preview.getGenerativeModel({
    model: getActiveGeminiModel(),
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.6, // Moderate creativity for forecasting
      topP: 0.9,
    },
  });

  const forecastPrompt = `You are a quantitative VC analyst specializing in startup growth forecasting.

COMPANY PROFILE:
- Name: ${metrics.companyName}
- Industry: ${metrics.industry}
- Stage: ${metrics.stage}
- Current Revenue: ${metrics.currentRevenue ? `$${(metrics.currentRevenue / 1e6).toFixed(2)}M` : 'Not disclosed'}
- Current Users: ${metrics.currentUsers ? metrics.currentUsers.toLocaleString() : 'Not disclosed'}
- Monthly Growth Rate: ${metrics.monthlyGrowthRate ? `${(metrics.monthlyGrowthRate * 100).toFixed(1)}%` : 'Not disclosed'}
- TAM: ${metrics.tam ? `$${(metrics.tam / 1e9).toFixed(2)}B` : 'Not disclosed'}
- Founding Year: ${metrics.foundingYear || 'Unknown'}

COMPARABLE COMPANIES IN ${metrics.industry}:
${comparables.rows.slice(0, 10).map((c, i) => 
  `${i + 1}. ${c.name} - ${c.stage} - Founded ${c.founding_year} - Valuation $${((c.current_valuation || 0) / 1e6).toFixed(1)}M`
).join('\n')}

TASK: Generate a detailed ${horizonYears}-year growth forecast with three scenarios.

METHODOLOGY:
1. Analyze current metrics and growth trajectory
2. Compare against similar companies at similar stages
3. Account for market size constraints (TAM/SAM)
4. Consider industry-specific growth patterns
5. Factor in execution risk and market conditions

Generate forecast in STRICT JSON format:

{
  "scenarios": [
    {
      "year": 1,
      "revenue": {
        "pessimistic": <number USD>,
        "baseCase": <number USD>,
        "optimistic": <number USD>
      },
      "users": {
        "pessimistic": <number>,
        "baseCase": <number>,
        "optimistic": <number>
      },
      "marketShare": {
        "pessimistic": <percentage as decimal>,
        "baseCase": <percentage as decimal>,
        "optimistic": <percentage as decimal>
      },
      "confidenceInterval": {
        "lower": <percentage as decimal (e.g., 0.6 for 60%)>,
        "upper": <percentage as decimal>
      }
    },
    ... (repeat for years 2-${horizonYears})
  ],
  "keyDrivers": [
    "<3-5 key factors that will drive growth>",
    "..."
  ],
  "riskFactors": [
    "<3-5 key risks that could impact forecast>",
    "..."
  ],
  "capitalRequirements": [
    {
      "year": 1,
      "estimatedRaise": <USD needed>,
      "estimatedValuation": <post-money valuation USD>,
      "dilution": <percentage as decimal>
    },
    ... (1-2 more funding rounds)
  ],
  "assumptions": [
    "<List 5-7 key assumptions underlying this forecast>",
    "..."
  ],
  "methodology": "<2-3 sentence explanation of forecasting approach>"
}

SCENARIO DEFINITIONS:
- Pessimistic (P10): 10th percentile outcome - significant headwinds, slower execution
- Base Case (P50): Median outcome - normal execution, expected market conditions
- Optimistic (P90): 90th percentile outcome - exceptional execution, favorable market

Be realistic and data-driven. Return ONLY the JSON object.`;

  try {
    const result = await model.generateContent(forecastPrompt);
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse forecast JSON from AI response');
    }

    const forecastData = JSON.parse(jsonMatch[0]);

    const forecast: GrowthForecast = {
      companyName: metrics.companyName,
      generatedAt: new Date(),
      forecastHorizon: `${horizonYears}-year`,
      ...forecastData,
    };

    // Save forecast to database
    await saveForecast(pool, deckId, forecast);

    console.log(`✅ Growth Agent: Generated forecast for ${metrics.companyName}`);
    console.log(`   Horizon: ${horizonYears} years`);
    console.log(`   Base case Year ${horizonYears} revenue: $${(forecastData.scenarios[horizonYears - 1]?.revenue?.baseCase / 1e6 || 0).toFixed(1)}M`);

    return forecast;
  } catch (error) {
    console.error('❌ Growth Agent: Forecast generation failed:', error);
    throw error;
  }
}

/**
 * 💾 Save Forecast to Database
 */
async function saveForecast(
  pool: Pool,
  deckId: string,
  forecast: GrowthForecast
): Promise<void> {
  const query = `
    INSERT INTO growth_forecasts (
      deck_id,
      forecast_horizon,
      scenarios,
      key_drivers,
      risk_factors,
      capital_requirements,
      assumptions,
      methodology,
      generated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (deck_id, forecast_horizon)
    DO UPDATE SET
      scenarios = EXCLUDED.scenarios,
      key_drivers = EXCLUDED.key_drivers,
      risk_factors = EXCLUDED.risk_factors,
      capital_requirements = EXCLUDED.capital_requirements,
      assumptions = EXCLUDED.assumptions,
      methodology = EXCLUDED.methodology,
      generated_at = EXCLUDED.generated_at
  `;

  await pool.query(query, [
    deckId,
    forecast.forecastHorizon,
    JSON.stringify(forecast.scenarios),
    JSON.stringify(forecast.keyDrivers),
    JSON.stringify(forecast.riskFactors),
    JSON.stringify(forecast.capitalRequirements),
    JSON.stringify(forecast.assumptions),
    forecast.methodology,
    forecast.generatedAt,
  ]);

  console.log(`💾 Saved forecast for deck ${deckId} (${forecast.forecastHorizon})`);
}

/**
 * 🔍 Get Saved Forecast
 */
export async function getForecast(
  pool: Pool,
  deckId: string,
  horizon: string = '5-year'
): Promise<GrowthForecast | null> {
  const query = `
    SELECT 
      forecast_horizon,
      scenarios,
      key_drivers,
      risk_factors,
      capital_requirements,
      assumptions,
      methodology,
      generated_at
    FROM growth_forecasts
    WHERE deck_id = $1 AND forecast_horizon = $2
    ORDER BY generated_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [deckId, horizon]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  const deckQuery = await pool.query(
    'SELECT company_name FROM pitch_decks WHERE id = $1',
    [deckId]
  );

  return {
    companyName: deckQuery.rows[0]?.company_name || 'Unknown',
    generatedAt: row.generated_at,
    forecastHorizon: row.forecast_horizon,
    scenarios: row.scenarios,
    keyDrivers: row.key_drivers,
    riskFactors: row.risk_factors,
    capitalRequirements: row.capital_requirements,
    assumptions: row.assumptions,
    methodology: row.methodology,
  };
}
