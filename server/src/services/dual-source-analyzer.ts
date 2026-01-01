/**
 * 🔄 DUAL-SOURCE ANALYZER
 * 
 * Merges data from two sources:
 * 1. PDF (uploaded pitch deck)
 * 2. Web (Google Search Grounding)
 * 
 * Responsibilities:
 * - Cross-validate claims
 * - Detect discrepancies
 * - Assign confidence scores
 * - Generate fact-check summaries
 */

import { EnrichedMetrics, WebSource, Discrepancy } from './grounding';
import { GroundingSource, FactCheck } from './vertex-ai';

/**
 * Interface for PDF analysis (existing)
 */
export interface PDFAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  competitiveAdvantage: string;
  marketOpportunity: any;
  team: any;
  financials: any;
  product: any;
  traction: any;
  scores: {
    overall: number;
    problem: number;
    solution: number;
    market: number;
    team: number;
    traction: number;
    financials: number;
  };
}

/**
 * Interface for web enrichment
 */
export interface WebEnrichment {
  enrichedMetrics: EnrichedMetrics;
  sources: WebSource[];
  discrepancies: Discrepancy[];
  groundingMetadata?: {
    webSearchQueries: string[];
    retrievalScore: number;
  };
}

/**
 * Interface for combined analysis
 */
export interface CombinedAnalysis {
  // Original PDF analysis
  pdfAnalysis: PDFAnalysis;

  // Web-enriched data
  webEnrichment: {
    validatedMetrics: {
      [key: string]: {
        pdfValue: string;
        webValue: string;
        match: boolean;
        confidence: 'HIGH' | 'MEDIUM' | 'LOW';
        sources: string[];
      };
    };
    additionalCompetitors: Array<{
      name: string;
      funding: string;
      source: string;
      foundViaWeb: boolean;
    }>;
    industryBenchmarks: {
      [key: string]: {
        companyValue: string;
        industryAverage: string;
        performance: string; // "23% better" or "15% worse"
        source: string;
      };
    };
  };

  // Fact-check summary
  factChecks: {
    verified: FactCheck[];
    discrepancies: FactCheck[];
    unverified: FactCheck[];
  };

  // Data source breakdown
  dataSourceBreakdown: {
    fromPDF: number; // percentage
    fromWeb: number; // percentage
    totalMetrics: number;
    discrepanciesFound: number;
  };

  // Overall confidence
  confidence: {
    overall: 'HIGH' | 'MEDIUM' | 'LOW';
    reasons: string[];
  };
}

/**
 * 🔄 MERGE SOURCES AND VALIDATE
 * 
 * Main function that combines PDF + Web data and generates
 * a comprehensive fact-checked analysis.
 */
export async function mergeSourcesAndValidate(
  pdfAnalysis: PDFAnalysis,
  webEnrichment: WebEnrichment
): Promise<CombinedAnalysis> {
  try {
    console.log('🔄 [Dual-Source] Starting merge and validation...');

    // 1. Validate metrics (cross-check PDF vs Web)
    const validatedMetrics = validateMetrics(
      pdfAnalysis,
      webEnrichment.enrichedMetrics
    );

    console.log(`   Validated metrics: ${Object.keys(validatedMetrics).length}`);

    // 2. Enrich competitors list
    const allCompetitors = enrichCompetitors(
      pdfAnalysis,
      webEnrichment.enrichedMetrics
    );

    console.log(`   Total competitors: ${allCompetitors.length}`);

    // 3. Compare against industry benchmarks
    const benchmarkComparison = compareToBenchmarks(
      pdfAnalysis,
      webEnrichment.enrichedMetrics
    );

    console.log(`   Benchmarks compared: ${Object.keys(benchmarkComparison).length}`);

    // 4. Generate fact-check summary
    const factChecks = generateFactCheckSummary(
      validatedMetrics,
      webEnrichment.discrepancies
    );

    console.log(`   Fact-checks: ${factChecks.verified.length} verified, ${factChecks.discrepancies.length} discrepancies`);

    // 5. Calculate data source breakdown
    const dataSourceBreakdown = calculateDataBreakdown(
      pdfAnalysis,
      webEnrichment
    );

    console.log(`   Data sources: ${dataSourceBreakdown.fromPDF}% PDF, ${dataSourceBreakdown.fromWeb}% Web`);

    // 6. Determine overall confidence
    const confidence = determineOverallConfidence(
      factChecks,
      validatedMetrics,
      webEnrichment.discrepancies
    );

    console.log(`   Overall confidence: ${confidence.overall}`);

    // Build combined analysis
    const combined: CombinedAnalysis = {
      pdfAnalysis,
      webEnrichment: {
        validatedMetrics,
        additionalCompetitors: allCompetitors,
        industryBenchmarks: benchmarkComparison,
      },
      factChecks,
      dataSourceBreakdown,
      confidence,
    };

    console.log('✅ [Dual-Source] Merge complete!');

    return combined;
  } catch (error) {
    console.error('❌ [Dual-Source] Merge failed:', error);
    throw error;
  }
}

/**
 * ✅ VALIDATE METRICS
 * 
 * Cross-validates metrics from PDF against web sources.
 */
function validateMetrics(
  pdfAnalysis: PDFAnalysis,
  enrichedMetrics: EnrichedMetrics
): {
  [key: string]: {
    pdfValue: string;
    webValue: string;
    match: boolean;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    sources: string[];
  };
} {
  const validated: any = {};

  // Validate web validations from enriched metrics
  for (const [key, validation] of Object.entries(enrichedMetrics.webValidation)) {
    validated[key] = {
      pdfValue: validation.pdfValue,
      webValue: validation.webValue,
      match: !validation.discrepancy,
      confidence: validation.confidence,
      sources: validation.sources,
    };
  }

  return validated;
}

/**
 * 🏢 ENRICH COMPETITORS
 * 
 * Combines PDF-mentioned competitors + web-found competitors.
 */
function enrichCompetitors(
  pdfAnalysis: PDFAnalysis,
  enrichedMetrics: EnrichedMetrics
): Array<{
  name: string;
  funding: string;
  source: string;
  foundViaWeb: boolean;
}> {
  const allCompetitors: Array<{
    name: string;
    funding: string;
    source: string;
    foundViaWeb: boolean;
  }> = [];

  // Add PDF competitors
  if (enrichedMetrics.competitors) {
    for (const competitor of enrichedMetrics.competitors) {
      allCompetitors.push({
        name: competitor,
        funding: 'Unknown',
        source: 'Pitch Deck',
        foundViaWeb: false,
      });
    }
  }

  // Add web-found competitors
  if (enrichedMetrics.additionalCompetitors) {
    for (const competitor of enrichedMetrics.additionalCompetitors) {
      allCompetitors.push({
        name: competitor.name,
        funding: competitor.funding,
        source: competitor.source,
        foundViaWeb: true,
      });
    }
  }

  return allCompetitors;
}

/**
 * 📊 COMPARE TO BENCHMARKS
 * 
 * Compares company metrics against industry averages.
 */
function compareToBenchmarks(
  pdfAnalysis: PDFAnalysis,
  enrichedMetrics: EnrichedMetrics
): {
  [key: string]: {
    companyValue: string;
    industryAverage: string;
    performance: string;
    source: string;
  };
} {
  const comparison: any = {};

  // Compare financials if available
  if (pdfAnalysis.financials && enrichedMetrics.industryBenchmarks) {
    for (const [key, benchmark] of Object.entries(enrichedMetrics.industryBenchmarks)) {
      // Try to find corresponding company value
      let companyValue = 'Not provided';
      
      // Look in financials
      if (pdfAnalysis.financials[key]) {
        companyValue = pdfAnalysis.financials[key];
      }

      // Calculate performance difference
      const performance = calculatePerformanceDiff(companyValue, benchmark.value);

      comparison[key] = {
        companyValue,
        industryAverage: benchmark.value,
        performance,
        source: benchmark.source,
      };
    }
  }

  return comparison;
}

/**
 * 📈 CALCULATE PERFORMANCE DIFFERENCE
 */
function calculatePerformanceDiff(companyValue: string, benchmarkValue: string): string {
  // Try to extract numbers
  const companyNum = parseFloat(companyValue.replace(/[^0-9.]/g, ''));
  const benchmarkNum = parseFloat(benchmarkValue.replace(/[^0-9.]/g, ''));

  if (!isNaN(companyNum) && !isNaN(benchmarkNum)) {
    const diff = ((companyNum - benchmarkNum) / benchmarkNum) * 100;
    if (diff > 0) {
      return `${diff.toFixed(1)}% better than average`;
    } else {
      return `${Math.abs(diff).toFixed(1)}% below average`;
    }
  }

  return 'Cannot compare';
}

/**
 * ✅ GENERATE FACT-CHECK SUMMARY
 * 
 * Categorizes claims into verified, discrepancies, and unverified.
 */
function generateFactCheckSummary(
  validatedMetrics: any,
  discrepancies: Discrepancy[]
): {
  verified: FactCheck[];
  discrepancies: FactCheck[];
  unverified: FactCheck[];
} {
  const verified: FactCheck[] = [];
  const discrepancyChecks: FactCheck[] = [];
  const unverified: FactCheck[] = [];

  // Process validated metrics
  for (const [key, validation] of Object.entries(validatedMetrics)) {
    const val = validation as any;
    const factCheck: FactCheck = {
      claim: key,
      pdfSource: val.pdfValue,
      webValidation: val.webValue,
      discrepancy: !val.match,
      confidence: val.confidence,
      sources: val.sources,
    };

    if (val.match && val.confidence === 'HIGH') {
      verified.push(factCheck);
    } else if (!val.match) {
      discrepancyChecks.push(factCheck);
    } else {
      unverified.push(factCheck);
    }
  }

  return {
    verified,
    discrepancies: discrepancyChecks,
    unverified,
  };
}

/**
 * 📊 CALCULATE DATA BREAKDOWN
 * 
 * Determines percentage of data from PDF vs Web.
 */
function calculateDataBreakdown(
  pdfAnalysis: PDFAnalysis,
  webEnrichment: WebEnrichment
): {
  fromPDF: number;
  fromWeb: number;
  totalMetrics: number;
  discrepanciesFound: number;
} {
  // Count metrics from PDF
  let pdfMetrics = 0;
  const sections = [
    pdfAnalysis.marketOpportunity,
    pdfAnalysis.financials,
    pdfAnalysis.traction,
    pdfAnalysis.team,
  ];

  for (const section of sections) {
    if (section && typeof section === 'object') {
      pdfMetrics += Object.keys(section).length;
    }
  }

  // Count web-sourced metrics
  const webMetrics = webEnrichment.sources.length;

  // Total metrics
  const totalMetrics = pdfMetrics + webMetrics;

  // Calculate percentages
  const fromPDF = totalMetrics > 0 ? Math.round((pdfMetrics / totalMetrics) * 100) : 100;
  const fromWeb = totalMetrics > 0 ? Math.round((webMetrics / totalMetrics) * 100) : 0;

  return {
    fromPDF,
    fromWeb,
    totalMetrics,
    discrepanciesFound: webEnrichment.discrepancies.length,
  };
}

/**
 * 🎯 DETERMINE OVERALL CONFIDENCE
 * 
 * Assigns overall confidence based on:
 * - Number of verified facts
 * - Number of discrepancies
 * - Severity of discrepancies
 */
function determineOverallConfidence(
  factChecks: {
    verified: FactCheck[];
    discrepancies: FactCheck[];
    unverified: FactCheck[];
  },
  validatedMetrics: any,
  discrepancies: Discrepancy[]
): {
  overall: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;

  // Verified facts increase confidence
  const verifiedCount = factChecks.verified.length;
  if (verifiedCount > 5) {
    score += 30;
    reasons.push(`${verifiedCount} claims verified by web sources`);
  } else if (verifiedCount > 2) {
    score += 20;
    reasons.push(`${verifiedCount} claims verified`);
  }

  // Discrepancies decrease confidence
  const discrepancyCount = factChecks.discrepancies.length;
  if (discrepancyCount > 3) {
    score -= 40;
    reasons.push(`⚠️ ${discrepancyCount} significant discrepancies found`);
  } else if (discrepancyCount > 0) {
    score -= 20;
    reasons.push(`⚠️ ${discrepancyCount} discrepancies found`);
  }

  // High-severity discrepancies severely impact confidence
  const highSeverityCount = discrepancies.filter((d) => d.severity === 'HIGH').length;
  if (highSeverityCount > 0) {
    score -= 30;
    reasons.push(`⚠️ ${highSeverityCount} HIGH severity discrepancies`);
  }

  // Web sources increase confidence
  const webSourceCount = Object.keys(validatedMetrics).length;
  if (webSourceCount > 10) {
    score += 30;
    reasons.push(`Extensive web validation (${webSourceCount} sources)`);
  } else if (webSourceCount > 5) {
    score += 20;
    reasons.push(`Good web validation (${webSourceCount} sources)`);
  }

  // Determine overall confidence
  let overall: 'HIGH' | 'MEDIUM' | 'LOW';
  if (score >= 50) {
    overall = 'HIGH';
  } else if (score >= 20) {
    overall = 'MEDIUM';
  } else {
    overall = 'LOW';
  }

  return { overall, reasons };
}

/**
 * 🔍 FORMAT FOR PDF OUTPUT
 * 
 * Formats combined analysis for enhanced PDF generation.
 */
export function formatForPDF(combined: CombinedAnalysis): {
  sections: any[];
  factCheckSummary: string;
  dataSources: string;
  confidenceScore: string;
} {
  const sections: any[] = [];

  // 1. Validated Metrics Section
  sections.push({
    title: 'Web-Validated Metrics',
    type: 'validation',
    content: combined.webEnrichment.validatedMetrics,
  });

  // 2. Competitor Landscape
  sections.push({
    title: 'Competitive Landscape',
    type: 'competitors',
    content: combined.webEnrichment.additionalCompetitors,
  });

  // 3. Industry Benchmarks
  sections.push({
    title: 'Industry Benchmarks',
    type: 'benchmarks',
    content: combined.webEnrichment.industryBenchmarks,
  });

  // 4. Fact-Check Summary
  const factCheckSummary = `
✅ VERIFIED CLAIMS (${combined.factChecks.verified.length}):
${combined.factChecks.verified.map((fc) => `  • ${fc.claim}`).join('\n')}

⚠️ DISCREPANCIES (${combined.factChecks.discrepancies.length}):
${combined.factChecks.discrepancies.map((fc) => `  • ${fc.claim} (PDF: ${fc.pdfSource}, Web: ${fc.webValidation})`).join('\n')}

❓ UNVERIFIED (${combined.factChecks.unverified.length}):
${combined.factChecks.unverified.map((fc) => `  • ${fc.claim}`).join('\n')}
  `;

  // 5. Data Sources
  const dataSources = `
📄 From Pitch Deck: ${combined.dataSourceBreakdown.fromPDF}%
🌐 From Web Search: ${combined.dataSourceBreakdown.fromWeb}%
⚠️ Discrepancies: ${combined.dataSourceBreakdown.discrepanciesFound}
  `;

  // 6. Confidence Score
  const confidenceScore = `
Overall Confidence: ${combined.confidence.overall}

Reasons:
${combined.confidence.reasons.map((r) => `• ${r}`).join('\n')}
  `;

  return {
    sections,
    factCheckSummary,
    dataSources,
    confidenceScore,
  };
}

export default {
  mergeSourcesAndValidate,
  formatForPDF,
};
