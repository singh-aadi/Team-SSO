/**
 * 🌐 GROUNDING & WEB SEARCH ENRICHMENT
 * 
 * Intelligently determines:
 * - What metrics are missing from PDF
 * - What claims need web validation
 * - What queries to generate for each vertical
 * - How to merge PDF + Web data
 */

import { analyzeWithGrounding, generateSearchQueries, GroundingSource } from './vertex-ai';

/**
 * Interface for metrics extracted from PDF
 */
export interface ExtractedMetrics {
  tam?: string;
  sam?: string;
  som?: string;
  revenue?: string;
  users?: string;
  cac?: string;
  ltv?: string;
  mrr?: string;
  arr?: string;
  burnRate?: string;
  runway?: string;
  competitors: string[];
  teamSize?: number;
  fundingRaised?: string;
}

/**
 * Interface for web-enriched metrics
 */
export interface EnrichedMetrics extends ExtractedMetrics {
  webValidation: {
    [key: string]: {
      pdfValue: string;
      webValue: string;
      discrepancy: boolean;
      confidence: 'HIGH' | 'MEDIUM' | 'LOW';
      sources: string[];
    };
  };
  additionalCompetitors: Array<{
    name: string;
    funding: string;
    source: string;
  }>;
  industryBenchmarks: {
    [key: string]: {
      value: string;
      source: string;
    };
  };
}

/**
 * Interface for web sources
 */
export interface WebSource {
  type: 'validation' | 'competitor' | 'benchmark' | 'news';
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

/**
 * Interface for discrepancies
 */
export interface Discrepancy {
  metric: string;
  pdfClaim: string;
  webFinding: string;
  difference: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * 🔍 IDENTIFY MISSING METRICS
 * 
 * Analyzes PDF extraction to determine what's missing
 * and should be searched for on the web.
 */
export function identifyMissingMetrics(metrics: ExtractedMetrics, industry: string): string[] {
  const missing: string[] = [];

  // Universal metrics
  if (!metrics.tam) missing.push('Total Addressable Market (TAM)');
  if (!metrics.sam) missing.push('Serviceable Addressable Market (SAM)');
  if (!metrics.som) missing.push('Serviceable Obtainable Market (SOM)');
  
  if (metrics.competitors.length === 0) {
    missing.push('Competitor landscape');
  }

  // Industry-specific metrics
  const industryLower = industry.toLowerCase();

  if (industryLower.includes('saas') || industryLower.includes('software')) {
    if (!metrics.mrr) missing.push('Monthly Recurring Revenue (MRR)');
    if (!metrics.arr) missing.push('Annual Recurring Revenue (ARR)');
    if (!metrics.cac) missing.push('Customer Acquisition Cost (CAC)');
    if (!metrics.ltv) missing.push('Lifetime Value (LTV)');
    missing.push('SaaS Magic Number');
    missing.push('Net Revenue Retention (NRR)');
  } else if (industryLower.includes('health') || industryLower.includes('medical')) {
    if (!metrics.cac) missing.push('Patient Acquisition Cost (PAC)');
    missing.push('Patient Lifetime Value (PLV)');
    missing.push('FDA approval status');
    missing.push('Clinical trial results');
    missing.push('Healthcare compliance certifications');
  } else if (industryLower.includes('fintech') || industryLower.includes('financial')) {
    missing.push('Gross Transaction Volume (GTV)');
    missing.push('Take rate');
    missing.push('Fraud rate');
    missing.push('Regulatory licenses');
    missing.push('Payment processing volume');
  } else if (industryLower.includes('ecommerce') || industryLower.includes('marketplace')) {
    missing.push('Gross Merchandise Volume (GMV)');
    missing.push('Commission rate');
    missing.push('Liquidity (supply/demand ratio)');
    missing.push('Repeat purchase rate');
  } else if (industryLower.includes('consumer') || industryLower.includes('social')) {
    missing.push('Daily Active Users (DAU)');
    missing.push('Monthly Active Users (MAU)');
    missing.push('DAU/MAU ratio');
    missing.push('Viral coefficient');
    missing.push('Retention rate (D1, D7, D30)');
  }

  // Financial health metrics
  if (!metrics.burnRate) missing.push('Monthly burn rate');
  if (!metrics.runway) missing.push('Cash runway');
  if (!metrics.fundingRaised) missing.push('Total funding raised');

  console.log(`🔍 [Grounding] Identified ${missing.length} missing metrics for ${industry}`);
  return missing;
}

/**
 * 🌐 ENRICH METRICS WITH WEB SEARCH
 * 
 * Takes PDF-extracted metrics and enriches them with web data:
 * - Validates claims
 * - Finds missing competitors
 * - Adds industry benchmarks
 */
export async function enrichWithWebSearch(
  metrics: ExtractedMetrics,
  industry: string,
  companyName: string,
  deckText: string
): Promise<{
  enrichedMetrics: EnrichedMetrics;
  sources: WebSource[];
  discrepancies: Discrepancy[];
}> {
  try {
    console.log('🌐 [Grounding] Starting web enrichment...');

    // Identify what's missing
    const missingMetrics = identifyMissingMetrics(metrics, industry);
    console.log(`   Missing metrics: ${missingMetrics.length}`);

    // Generate search queries
    const searchQueries = generateSearchQueries(industry, companyName, missingMetrics);
    console.log(`   Generated queries: ${searchQueries.length}`);

    // Call Vertex AI with Grounding
    const vertexResult = await analyzeWithGrounding(
      deckText,
      industry,
      companyName,
      missingMetrics
    );

    console.log('✅ [Grounding] Vertex AI analysis complete');
    console.log(`   Web sources found: ${vertexResult.webSources.length}`);

    // Parse analysis result
    const analysis = vertexResult.analysis;

    // Build enriched metrics
    const enrichedMetrics: EnrichedMetrics = {
      ...metrics,
      webValidation: {},
      additionalCompetitors: [],
      industryBenchmarks: {},
    };

    // Extract web validations
    if (analysis.marketOpportunity) {
      for (const [key, value] of Object.entries(analysis.marketOpportunity)) {
        if (typeof value === 'object' && value !== null) {
          const metric = value as any;
          enrichedMetrics.webValidation[key] = {
            pdfValue: metric.pdfClaim || metrics[key as keyof ExtractedMetrics] || 'Not mentioned',
            webValue: metric.webValidation || 'Not found',
            discrepancy: metric.discrepancy || false,
            confidence: metric.confidence || 'LOW',
            sources: metric.sources || [],
          };
        }
      }
    }

    // Extract additional competitors
    if (analysis.competitors?.foundViaWeb) {
      enrichedMetrics.additionalCompetitors = analysis.competitors.foundViaWeb.map((comp: any) => ({
        name: comp.name,
        funding: comp.funding || 'Unknown',
        source: comp.source || 'Web search',
      }));
    }

    // Extract industry benchmarks
    if (analysis.benchmarks) {
      for (const [key, value] of Object.entries(analysis.benchmarks)) {
        if (typeof value === 'object' && value !== null) {
          const benchmark = value as any;
          enrichedMetrics.industryBenchmarks[key] = {
            value: benchmark.industryAverage || benchmark.webValidation || 'Not found',
            source: benchmark.sources?.[0] || 'Web search',
          };
        }
      }
    }

    // Convert web sources
    const sources: WebSource[] = vertexResult.webSources.map((src) => ({
      type: determineSourceType(src.title, src.snippet),
      title: src.title,
      url: src.url,
      snippet: src.snippet,
      relevance: src.relevance,
    }));

    // Extract discrepancies
    const discrepancies: Discrepancy[] = [];
    if (analysis.factChecks) {
      for (const factCheck of analysis.factChecks) {
        if (factCheck.discrepancy) {
          discrepancies.push({
            metric: factCheck.claim,
            pdfClaim: factCheck.pdfSource,
            webFinding: factCheck.webValidation,
            difference: calculateDifference(factCheck.claim, factCheck.pdfSource, factCheck.webValidation),
            severity: determineSeverity(factCheck.claim),
            confidence: factCheck.confidence,
          });
        }
      }
    }

    console.log('✅ [Grounding] Enrichment complete');
    console.log(`   Validated metrics: ${Object.keys(enrichedMetrics.webValidation).length}`);
    console.log(`   Additional competitors: ${enrichedMetrics.additionalCompetitors.length}`);
    console.log(`   Benchmarks found: ${Object.keys(enrichedMetrics.industryBenchmarks).length}`);
    console.log(`   Discrepancies: ${discrepancies.length}`);

    return {
      enrichedMetrics,
      sources,
      discrepancies,
    };
  } catch (error) {
    console.error('❌ [Grounding] Enrichment failed:', error);
    throw error;
  }
}

/**
 * 🎯 DETERMINE SOURCE TYPE
 */
function determineSourceType(title: string, snippet: string): 'validation' | 'competitor' | 'benchmark' | 'news' {
  const text = (title + ' ' + snippet).toLowerCase();

  if (text.includes('competitor') || text.includes('vs') || text.includes('alternative')) {
    return 'competitor';
  } else if (text.includes('benchmark') || text.includes('average') || text.includes('industry')) {
    return 'benchmark';
  } else if (text.includes('funding') || text.includes('raise') || text.includes('announcement')) {
    return 'news';
  } else {
    return 'validation';
  }
}

/**
 * 📊 CALCULATE DIFFERENCE
 */
function calculateDifference(metric: string, pdfValue: string, webValue: string): string {
  // Try to extract numbers
  const pdfNum = parseFloat(pdfValue.replace(/[^0-9.]/g, ''));
  const webNum = parseFloat(webValue.replace(/[^0-9.]/g, ''));

  if (!isNaN(pdfNum) && !isNaN(webNum)) {
    const diff = ((pdfNum - webNum) / webNum) * 100;
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
  }

  return 'Cannot calculate';
}

/**
 * ⚠️ DETERMINE SEVERITY
 */
function determineSeverity(metric: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const critical = ['tam', 'sam', 'revenue', 'funding', 'users'];
  const important = ['cac', 'ltv', 'mrr', 'arr'];

  const metricLower = metric.toLowerCase();

  if (critical.some((c) => metricLower.includes(c))) {
    return 'HIGH';
  } else if (important.some((i) => metricLower.includes(i))) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * 🔍 EXTRACT METRICS FROM DECK TEXT
 * 
 * Helper function to extract basic metrics from raw deck text.
 * This is a simple implementation - can be enhanced with better NLP.
 */
export function extractMetricsFromText(deckText: string): ExtractedMetrics {
  const metrics: ExtractedMetrics = {
    competitors: [],
  };

  const text = deckText.toLowerCase();

  // TAM extraction (very basic - looks for patterns like "$100M TAM")
  const tamMatch = text.match(/\$[\d,.]+[mkb]?\s*(tam|total addressable market)/i);
  if (tamMatch) {
    metrics.tam = tamMatch[0];
  }

  // SAM extraction
  const samMatch = text.match(/\$[\d,.]+[mkb]?\s*(sam|serviceable addressable market)/i);
  if (samMatch) {
    metrics.sam = samMatch[0];
  }

  // Users/customers
  const usersMatch = text.match(/([\d,.]+[mkb]?)\s*(users|customers|active users)/i);
  if (usersMatch) {
    metrics.users = usersMatch[0];
  }

  // Revenue
  const revenueMatch = text.match(/\$[\d,.]+[mkb]?\s*(revenue|mrr|arr)/i);
  if (revenueMatch) {
    metrics.revenue = revenueMatch[0];
  }

  // Competitors (looks for "vs", "competitor", "alternative to")
  const competitorPatterns = [
    /competitor[s]?:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /alternative to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /vs\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
  ];

  for (const pattern of competitorPatterns) {
    const matches = deckText.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !metrics.competitors.includes(match[1])) {
        metrics.competitors.push(match[1]);
      }
    }
  }

  console.log('📄 [Grounding] Extracted metrics from PDF:', {
    tam: metrics.tam ? '✓' : '✗',
    sam: metrics.sam ? '✓' : '✗',
    users: metrics.users ? '✓' : '✗',
    revenue: metrics.revenue ? '✓' : '✗',
    competitors: metrics.competitors.length,
  });

  return metrics;
}

export default {
  identifyMissingMetrics,
  enrichWithWebSearch,
  extractMetricsFromText,
};
