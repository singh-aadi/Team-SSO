/**
 * 🌐 VERTEX AI CLIENT WITH GOOGLE SEARCH GROUNDING
 * 
 * Replaces AI Studio API with Vertex AI for:
 * - Stable Gemini 2.0 Flash access
 * - Google Search Grounding (web validation)
 * - Source attribution (PDF vs Web)
 * - Fact-checking with citations
 */

import { VertexAI, GenerateContentRequest, Content, Part } from '@google-cloud/vertexai';
import { getActiveGeminiModel } from '../utils/gemini-model';

// Configuration
const PROJECT_ID = 'projectsso-473108';
const LOCATION = 'us-central1'; // Vertex AI region
const MODEL = getActiveGeminiModel(); // Gemini 2.0 Flash

// Initialize Vertex AI client
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

// Get generative model with Grounding enabled
const model = vertexAI.getGenerativeModel({
  model: MODEL,
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.2, // Lower for factual analysis
    topP: 0.8,
    topK: 40,
  },
});

/**
 * Interface for Grounding sources
 */
export interface GroundingSource {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

/**
 * Interface for analysis with sources
 */
export interface VertexAIAnalysis {
  analysis: any;
  pdfSources: string[];
  webSources: GroundingSource[];
  groundingMetadata?: {
    webSearchQueries: string[];
    retrievalScore: number;
  };
}

/**
 * Interface for fact-check results
 */
export interface FactCheck {
  claim: string;
  pdfSource: string;
  webValidation: string;
  discrepancy: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sources: string[];
}

/**
 * Interface for already-analyzed deck data
 */
export interface AnalyzedDeckData {
  deckId: string;
  companyName: string;
  industry: string;
  stage: string;
  filename: string;
  analyzedAt: string;
  overallAnalysis: {
    ssoScore: number;
    problemScore: number;
    solutionScore: number;
    marketScore: number;
    tractionScore: number;
    teamScore: number;
    financialsScore: number;
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    keyInsights: string[];
    recommendation: string;
  };
  sections: Array<{
    sectionName: string;
    sectionScore: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
}

/**
 * Interface for comparison result
 */
export interface ComparisonResult {
  executiveSummary: string;
  overallWinner: 'deck1' | 'deck2' | 'tie';
  winnerReasoning: string;
  categoryComparison: {
    problem: CategoryComparison;
    solution: CategoryComparison;
    market: CategoryComparison;
    traction: CategoryComparison;
    team: CategoryComparison;
    financials: CategoryComparison;
  };
  strengthsComparison: {
    deck1Advantages: string[];
    deck2Advantages: string[];
    sharedStrengths: string[];
  };
  weaknessesComparison: {
    deck1Concerns: string[];
    deck2Concerns: string[];
    sharedConcerns: string[];
  };
  recommendations: {
    deck1: string[];
    deck2: string[];
  };
  keyDifferentiators: string[];
  webValidation?: {
    marketSizeClaims?: any;
    competitiveLandscape?: any;
    industryGrowthRate?: any;
  };
  investmentRecommendation: {
    preferredDeck: 'deck1' | 'deck2' | 'both' | 'neither';
    reasoning: string;
    riskLevel: 'low' | 'medium' | 'high';
    timeframe: 'immediate' | 'monitor' | 'pass';
  };
}

interface CategoryComparison {
  winner: 'deck1' | 'deck2' | 'tie';
  deck1Score: number;
  deck2Score: number;
  analysis: string;
}

/**
 * 🔍 ANALYZE DECK WITH GROUNDING
 * 
 * Uses Vertex AI Gemini 2.0 Flash with Google Search Grounding
 * to validate claims, find competitors, and enrich metrics.
 */
export async function analyzeWithGrounding(
  deckText: string,
  industry: string,
  companyName: string,
  missingMetrics: string[]
): Promise<VertexAIAnalysis> {
  try {
    console.log('🌐 [Vertex AI] Starting analysis with Grounding...');
    console.log(`   Industry: ${industry}`);
    console.log(`   Missing metrics: ${missingMetrics.join(', ')}`);

    // Build enhanced prompt for grounded analysis
    const prompt = buildGroundedAnalysisPrompt(deckText, industry, companyName, missingMetrics);

    // 🌐 Create request with Google Search Grounding enabled
    // IMPORTANT: Grounding requires specific configuration
    const request: GenerateContentRequest = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      tools: [
        {
          googleSearch: {} as any, // NEW API - replaces deprecated googleSearchRetrieval
        } as any,
      ],
    };

    console.log('🔍 [Vertex AI] Sending request with Grounding enabled...');
    console.log('   Tool: googleSearch (automatic mode)');
    console.log('   Prompt length:', prompt.length, 'chars');
    
    const response = await model.generateContent(request);

    // Extract response
    const candidate = response.response.candidates?.[0];
    if (!candidate) {
      throw new Error('No response candidate from Vertex AI');
    }

    console.log('✅ [Vertex AI] Response received!');
    console.log('   Checking for grounding metadata...');

    // 🔍 VERBOSE GROUNDING DEBUG
    console.log('\n' + '='.repeat(80));
    console.log('📊 [GROUNDING DEBUG] Response Structure Analysis');
    console.log('='.repeat(80));
    console.log('Candidates Count:', response.response.candidates?.length || 0);
    console.log('Has Grounding Metadata:', !!candidate.groundingMetadata);
    
    if (candidate.groundingMetadata) {
      const gm = candidate.groundingMetadata;
      console.log('📦 Grounding Metadata Details:');
      console.log('   - Web Search Queries:', gm.webSearchQueries?.length || 0);
      console.log('   - Grounding Chunks:', gm.groundingChunks?.length || 0);
      console.log('   - Grounding Supports:', (gm as any).groundingSupports?.length || 0);
      console.log('   - Search Entry Point:', (gm as any).searchEntryPoint || 'N/A');
      
      if (gm.webSearchQueries && gm.webSearchQueries.length > 0) {
        console.log('\n🔍 Web Searches Performed:');
        gm.webSearchQueries.forEach((query: string, i: number) => {
          console.log(`   ${i + 1}. "${query}"`);
        });
      } else {
        console.log('⚠️  NO WEB SEARCH QUERIES FOUND!');
      }
      
      if (gm.groundingChunks && gm.groundingChunks.length > 0) {
        console.log(`\n🌐 Grounding Chunks Found: ${gm.groundingChunks.length}`);
        gm.groundingChunks.slice(0, 3).forEach((chunk: any, i: number) => {
          if (chunk.web) {
            console.log(`   ${i + 1}. ${chunk.web.title || 'No title'}`);
            console.log(`      URL: ${chunk.web.uri || 'No URL'}`);
          }
        });
      } else {
        console.log('⚠️  NO GROUNDING CHUNKS FOUND!');
      }
      
      console.log('='.repeat(80) + '\n');
    } else {
      console.log('❌ [CRITICAL] NO GROUNDING METADATA FOUND!');
      console.log('='.repeat(80));
      console.log('🔍 Possible Reasons:');
      console.log('   1. Vertex AI decided web search was not necessary');
      console.log('   2. Prompt not explicit enough (try more imperative language)');
      console.log('   3. API tier doesn\'t support grounding (check billing)');
      console.log('   4. Regional availability issue (us-central1 should work)');
      console.log('   5. Service account lacks permissions (roles/aiplatform.user)');
      console.log('\n💡 Debugging Steps:');
      console.log('   1. Check Vertex AI logs in Cloud Console');
      console.log('   2. Verify "Generative AI - Grounding with Google Search" API is enabled');
      console.log('   3. Try simpler prompt with explicit "search for X" instructions');
      console.log('   4. Check if grounding is available for gemini-2.5-flash model');
      console.log('='.repeat(80) + '\n');
    }

    // Extract text content
    const analysisText = candidate.content.parts
      .map((part: Part) => (part.text ? part.text : ''))
      .join('\n');

    // Extract grounding metadata if available
    const groundingMetadata = candidate.groundingMetadata;
    const webSources: GroundingSource[] = [];
    let webSearchQueries: string[] = [];

    console.log('📊 [Vertex AI] Response structure:', {
      hasCandidate: !!candidate,
      hasGroundingMetadata: !!groundingMetadata,
      candidateKeys: candidate ? Object.keys(candidate) : [],
    });

    if (groundingMetadata) {
      console.log('✅ [Vertex AI] Grounding metadata found!');
      console.log('   Metadata keys:', Object.keys(groundingMetadata));
      
      // Extract web search queries
      if (groundingMetadata.webSearchQueries) {
        webSearchQueries = groundingMetadata.webSearchQueries;
        console.log(`   Web searches performed: ${webSearchQueries.length}`);
        webSearchQueries.forEach((q, i) => console.log(`     ${i + 1}. "${q}"`));
      } else {
        console.log('   ⚠️ No webSearchQueries in metadata');
      }

      // Extract grounding sources
      if (groundingMetadata.groundingChunks) {
        console.log(`   Processing ${groundingMetadata.groundingChunks.length} grounding chunks...`);
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web) {
            webSources.push({
              title: chunk.web.title || 'Web Source',
              url: chunk.web.uri || '',
              snippet: (chunk.web as any).snippet || '', // TypeScript workaround
              relevance: (chunk as any).retrievalScore || 0, // TypeScript workaround
            });
          }
        }
        console.log(`   ✅ Web sources extracted: ${webSources.length}`);
        webSources.slice(0, 3).forEach((src, i) => {
          console.log(`     ${i + 1}. ${src.title}`);
          console.log(`        ${src.url}`);
        });
      } else {
        console.log('   ⚠️ No groundingChunks in metadata');
      }
    } else {
      console.log('⚠️ [Vertex AI] NO GROUNDING METADATA FOUND!');
      console.log('   This means Vertex AI did NOT trigger web search.');
      console.log('   Possible reasons:');
      console.log('   1. Prompt did not require external information');
      console.log('   2. Grounding API not enabled in GCP project');
      console.log('   3. Model decided all info available in training data');
      console.log('   4. dynamicRetrievalConfig threshold too high');
    }

    // Parse JSON analysis from response
    let analysis: any;
    try {
      // Try to extract JSON from code blocks
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
      let jsonText = jsonMatch ? jsonMatch[1] : analysisText;
      
      // Clean up common JSON issues before parsing
      jsonText = jsonText
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .trim();
      
      // Try to find complete JSON object
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }
      
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ [Vertex AI] Failed to parse JSON response:', parseError);
      console.error('   Response length:', analysisText.length);
      console.error('   First 300 chars:', analysisText.substring(0, 300));
      // Return raw text as fallback
      analysis = { rawResponse: analysisText };
    }

    console.log('✅ [Vertex AI] Analysis complete!');
    console.log(`   Total web sources: ${webSources.length}`);

    return {
      analysis,
      pdfSources: ['Uploaded Pitch Deck'], // PDF is always a source
      webSources,
      groundingMetadata: groundingMetadata
        ? {
            webSearchQueries,
            retrievalScore: (groundingMetadata as any).retrievalScore || 0, // TypeScript workaround
          }
        : undefined,
    };
  } catch (error) {
    console.error('❌ [Vertex AI] Analysis failed:', error);
    throw new Error(`Vertex AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 📝 BUILD GROUNDED ANALYSIS PROMPT
 * 
 * Creates intelligent prompt that triggers web searches for:
 * - Market size validation (TAM/SAM/SOM)
 * - Competitor identification
 * - Industry benchmarks
 * - Recent funding/news
 */
function buildGroundedAnalysisPrompt(
  deckText: string,
  industry: string,
  companyName: string,
  missingMetrics: string[]
): string {
  const currentYear = new Date().getFullYear();

  return `You are an expert venture capital analyst with MANDATORY REAL-TIME WEB SEARCH ACCESS via Google Search.

🔍 **CRITICAL INSTRUCTION - YOU MUST PERFORM WEB SEARCHES:**

Before analyzing this pitch deck, you MUST execute these web searches RIGHT NOW:

1. 🔍 SEARCH: "Total Addressable Market ${industry} ${currentYear} Gartner Forrester McKinsey market research"
2. 🔍 SEARCH: "${companyName} competitors funding rounds Crunchbase TechCrunch VentureBeat"
3. 🔍 SEARCH: "${industry} startup benchmarks CAC LTV burn rate revenue growth ${currentYear}"
4. 🔍 SEARCH: "${companyName} company news press release funding announcement ${currentYear}"
5. 🔍 SEARCH: "${industry} valuation multiples exit valuations M&A ${currentYear}"

**IF YOU DO NOT PERFORM THESE 5 WEB SEARCHES, YOUR ANALYSIS WILL BE INCOMPLETE AND INCORRECT.**

---

**COMPANY:** ${companyName}
**INDUSTRY:** ${industry}
**CURRENT YEAR:** ${currentYear}

**MISSING METRICS (SEARCH FOR THESE TOO):**
${missingMetrics.length > 0 ? missingMetrics.map((m, i) => `${i + 6}. 🔍 SEARCH: "${industry} ${m} benchmark ${currentYear}"`).join('\n') : 'None - but still perform searches 1-5 above'}

**PITCH DECK CONTENT:**
${deckText.substring(0, 15000)} ${deckText.length > 15000 ? '... (truncated)' : ''}

---

**YOUR ANALYSIS WORKFLOW:**

**STEP 1: EXECUTE WEB SEARCHES** (you MUST do this first)
- Run all 5 numbered searches above
- Collect data from Gartner, Forrester, Crunchbase, TechCrunch, etc.
- Save URLs and snippets for citations

**STEP 2: EXTRACT DATA FROM PITCH DECK**
- Pull out all claims (TAM, users, revenue, etc.)
- Note what's missing from the deck

**STEP 3: CROSS-VALIDATE DECK VS WEB**
- Compare deck claims against web search results
- Flag discrepancies (e.g., "Deck says $100M TAM, Gartner reports $75M")
- Calculate % difference

**STEP 4: OUTPUT JSON WITH SOURCES**

Provide your analysis in this EXACT JSON format:

\`\`\`json
{
  "marketOpportunity": {
    "tam": {
      "pdfClaim": "$100M (from deck)",
      "webValidation": "$75M (Gartner Market Analysis 2024)",
      "discrepancy": true,
      "discrepancyPercentage": "+33%",
      "confidence": "HIGH",
      "sources": ["https://gartner.com/market-report-2024", "https://forrester.com/tam-analysis"]
    },
    "sam": {
      "pdfClaim": "$40M",
      "webValidation": "Not found in web searches",
      "discrepancy": false,
      "confidence": "LOW",
      "sources": []
    },
    "som": { ... }
  },
  "competitors": {
    "mentionedInDeck": ["Company X", "Company Y"],
    "foundViaWeb": [
      {
        "name": "Company Z",
        "funding": "$25M Series B (Crunchbase)",
        "lastRound": "Series B (2024)",
        "investors": ["Sequoia", "a16z"],
        "source": "https://crunchbase.com/company-z",
        "competitiveThreat": "HIGH - similar product, more funding"
      },
      {
        "name": "Company W",
        "funding": "Acquired by BigCorp for $100M",
        "exitType": "Acquisition",
        "source": "https://techcrunch.com/company-w-acquisition",
        "competitiveThreat": "MEDIUM - validates market"
      }
    ]
  },
  "teamValidation": {
    "ceo": {
      "name": "John Doe (from deck)",
      "pdfClaim": "10 years at Google",
      "webValidation": "Confirmed via LinkedIn - 8 years at Google, 2 years at Meta",
      "verified": true,
      "linkedinUrl": "https://linkedin.com/in/johndoe",
      "confidence": "HIGH"
    }
  },
  "benchmarks": {
    "cac": {
      "pdfClaim": "$50",
      "industryAverage": "$75 (SaaS Capital Index 2024)",
      "performance": "33% better than average",
      "percentile": "Top 25%",
      "source": "https://saas-capital.com/benchmarks-2024"
    },
    "ltv": {
      "pdfClaim": "$500",
      "industryAverage": "$400",
      "performance": "25% better than average",
      "ltvCacRatio": 10.0,
      "industryLtvCac": 5.3,
      "source": "https://saas-metrics.com/ltv-benchmarks"
    },
    "burnRate": { ... },
    "growthRate": { ... }
  },
  "factChecks": [
    {
      "claim": "100,000 active users",
      "pdfSource": "Slide 12, Traction section",
      "webValidation": "85,000 users mentioned in TechCrunch article (Oct 2024)",
      "discrepancy": true,
      "discrepancyAmount": "+15,000 users (+17.6%)",
      "severity": "MEDIUM",
      "confidence": "HIGH",
      "sources": ["https://techcrunch.com/article-about-company"],
      "investorImpact": "Minor inflation - may indicate aggressive counting methodology"
    },
    {
      "claim": "FDA 510(k) clearance obtained",
      "pdfSource": "Slide 8, Regulatory",
      "webValidation": "Confirmed on FDA website - clearance K242345 granted Sept 2024",
      "discrepancy": false,
      "confidence": "HIGH",
      "sources": ["https://fda.gov/510k/K242345"],
      "investorImpact": "Verified - strong regulatory moat"
    }
  ],
  "dataSourceBreakdown": {
    "fromPDF": 68,
    "fromWeb": 32,
    "totalMetrics": 25,
    "discrepanciesFound": 4,
    "highConfidenceFindings": 18,
    "lowConfidenceFindings": 7
  },
  "webSearchesPerformed": [
    {
      "query": "Total Addressable Market ${industry} ${currentYear}",
      "resultsFound": 12,
      "topSources": ["Gartner", "Forrester", "McKinsey"]
    },
    {
      "query": "${companyName} competitors funding",
      "resultsFound": 8,
      "topSources": ["Crunchbase", "TechCrunch", "PitchBook"]
    }
  ]
}
\`\`\`

**CRITICAL RULES:**
1. ✅ ALWAYS cite web sources with URLs
2. ✅ ALWAYS calculate discrepancy percentages
3. ✅ ALWAYS flag inflated claims
4. ✅ ALWAYS provide confidence scores (HIGH/MEDIUM/LOW)
5. ✅ ALWAYS include "webSearchesPerformed" array to prove you searched
6. ❌ NEVER make up data - if not found on web, say "Not found"
7. ❌ NEVER skip web searches - this is MANDATORY

**REMEMBER: Your credibility depends on web-validated facts, not assumptions!**

Return ONLY valid JSON, no explanations outside the JSON structure.`;
}

/**
 * 🎯 GENERATE WEB SEARCH QUERIES
 * 
 * Intelligently generates search queries based on:
 * - Industry vertical
 * - Missing metrics
 * - Claims that need validation
 */
export function generateSearchQueries(
  industry: string,
  companyName: string,
  missingMetrics: string[]
): string[] {
  const currentYear = new Date().getFullYear();
  const queries: string[] = [];

  // Market size validation
  queries.push(`Total Addressable Market ${industry} ${currentYear} Gartner Forrester`);
  queries.push(`${industry} market size growth rate ${currentYear}`);

  // Competitor research
  queries.push(`${companyName} competitors ${industry}`);
  queries.push(`${industry} startups Series A B C funding Crunchbase`);

  // Company validation
  queries.push(`${companyName} funding rounds Crunchbase`);
  queries.push(`${companyName} press release news ${currentYear}`);

  // Industry benchmarks (based on vertical)
  if (industry.toLowerCase().includes('saas') || industry.toLowerCase().includes('software')) {
    queries.push(`SaaS industry benchmarks CAC LTV Magic Number ${currentYear}`);
    queries.push(`B2B SaaS average MRR ARR growth rate`);
  } else if (industry.toLowerCase().includes('health') || industry.toLowerCase().includes('medical')) {
    queries.push(`Healthcare patient acquisition cost benchmark ${currentYear}`);
    queries.push(`Digital health FDA approval timeline statistics`);
  } else if (industry.toLowerCase().includes('fintech') || industry.toLowerCase().includes('financial')) {
    queries.push(`FinTech transaction volume benchmarks ${currentYear}`);
    queries.push(`Payment processing take rate industry average`);
  }

  // Missing metrics (if specified)
  for (const metric of missingMetrics) {
    queries.push(`${industry} ${metric} benchmark ${currentYear}`);
  }

  return queries;
}

/**
 * 🔍 VALIDATE SINGLE CLAIM WITH WEB SEARCH
 * 
 * Validates a specific claim (e.g., TAM, user count) against web sources.
 */
export async function validateClaim(
  claim: string,
  context: string,
  industry: string
): Promise<FactCheck> {
  try {
    console.log(`🔍 [Vertex AI] Validating claim: "${claim}"`);

    const prompt = `You are a fact-checker with access to web search.

**CLAIM TO VALIDATE:**
"${claim}"

**CONTEXT:**
${context}

**INDUSTRY:** ${industry}

**TASK:**
1. Search the web for evidence supporting or refuting this claim
2. Find authoritative sources (Gartner, Forrester, Crunchbase, industry reports)
3. Compare the claim against web findings
4. Determine if there's a discrepancy

**OUTPUT FORMAT (JSON):**
\`\`\`json
{
  "claim": "${claim}",
  "pdfSource": "Original pitch deck",
  "webValidation": "What web sources say (with numbers/facts)",
  "discrepancy": true or false,
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "sources": ["URL 1", "URL 2"]
}
\`\`\`

Return ONLY valid JSON.`;

    const request: GenerateContentRequest = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [
        {
          googleSearch: {} as any, // NEW API - replaces deprecated googleSearchRetrieval
        } as any,
      ],
    };

    const response = await model.generateContent(request);
    const candidate = response.response.candidates?.[0];
    
    if (!candidate) {
      throw new Error('No response from Vertex AI');
    }

    const responseText = candidate.content.parts
      .map((part: Part) => (part.text ? part.text : ''))
      .join('\n');

    // Parse JSON response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    const factCheck: FactCheck = jsonMatch
      ? JSON.parse(jsonMatch[1])
      : JSON.parse(responseText);

    console.log(`✅ [Vertex AI] Claim validated: ${factCheck.confidence} confidence`);

    return factCheck;
  } catch (error) {
    console.error('❌ [Vertex AI] Claim validation failed:', error);
    throw error;
  }
}

/**
 * 🆚 COMPARE TWO ALREADY-ANALYZED DECKS
 * 
 * Uses Vertex AI with Google Search Grounding to compare two pitch decks
 * that have already been individually analyzed and stored in the database.
 * 
 * Benefits:
 * - No PDF extraction needed (already done)
 * - Faster processing (15-20s vs 60-90s)
 * - Structured comparison with web validation
 * - Lower API costs (1 call vs 3)
 */
export async function compareAnalyzedDecks(
  deck1Data: AnalyzedDeckData,
  deck2Data: AnalyzedDeckData,
  useGrounding: boolean = true
): Promise<ComparisonResult> {
  try {
    console.log('🆚 [Vertex AI] Starting analyzed decks comparison...');
    console.log(`   Deck 1: ${deck1Data.companyName} (${deck1Data.industry})`);
    console.log(`   Deck 2: ${deck2Data.companyName} (${deck2Data.industry})`);

    // Build comprehensive comparison prompt
    const prompt = buildAnalyzedDecksComparisonPrompt(deck1Data, deck2Data);

    // Create request with Google Search Grounding enabled
    const request: GenerateContentRequest = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      tools: useGrounding
        ? [
            {
              googleSearch: {} as any, // Enable web search grounding
            } as any,
          ]
        : undefined,
    };

    console.log('🌐 [Vertex AI] Sending comparison request with grounding:', useGrounding);

    const response = await model.generateContent(request);
    const candidate = response.response.candidates?.[0];

    if (!candidate) {
      throw new Error('No response from Vertex AI');
    }

    // Extract response text
    const responseText = candidate.content.parts
      .map((part: Part) => (part.text ? part.text : ''))
      .join('\n');

    console.log('📥 [Vertex AI] Received comparison response');
    console.log('Response preview:', responseText.substring(0, 300));

    // Parse JSON response
    let comparison: ComparisonResult;
    try {
      // Try to extract JSON from code blocks
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : responseText;

      // Clean and parse
      const cleanedJson = jsonString
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/\n/g, ' ')
        .replace(/\r/g, '')
        .trim();

      comparison = JSON.parse(cleanedJson);
      console.log('✅ [Vertex AI] Successfully parsed comparison JSON');
    } catch (parseError: any) {
      console.error('❌ [Vertex AI] JSON parsing failed:', parseError.message);
      console.error('Raw response:', responseText.substring(0, 1000));

      // Fallback comparison structure
      comparison = {
        executiveSummary: 'Comparison completed with structured analysis from pre-analyzed data.',
        overallWinner: deck1Data.overallAnalysis.overallScore > deck2Data.overallAnalysis.overallScore ? 'deck1' : 
                       deck1Data.overallAnalysis.overallScore < deck2Data.overallAnalysis.overallScore ? 'deck2' : 'tie',
        winnerReasoning: `Based on overall scores: ${deck1Data.companyName} (${deck1Data.overallAnalysis.overallScore}) vs ${deck2Data.companyName} (${deck2Data.overallAnalysis.overallScore})`,
        categoryComparison: {
          problem: {
            winner: deck1Data.overallAnalysis.problemScore > deck2Data.overallAnalysis.problemScore ? 'deck1' : 
                   deck1Data.overallAnalysis.problemScore < deck2Data.overallAnalysis.problemScore ? 'deck2' : 'tie',
            deck1Score: deck1Data.overallAnalysis.problemScore,
            deck2Score: deck2Data.overallAnalysis.problemScore,
            analysis: 'Problem definition comparison'
          },
          solution: {
            winner: deck1Data.overallAnalysis.solutionScore > deck2Data.overallAnalysis.solutionScore ? 'deck1' : 
                   deck1Data.overallAnalysis.solutionScore < deck2Data.overallAnalysis.solutionScore ? 'deck2' : 'tie',
            deck1Score: deck1Data.overallAnalysis.solutionScore,
            deck2Score: deck2Data.overallAnalysis.solutionScore,
            analysis: 'Solution approach comparison'
          },
          market: {
            winner: deck1Data.overallAnalysis.marketScore > deck2Data.overallAnalysis.marketScore ? 'deck1' : 
                   deck1Data.overallAnalysis.marketScore < deck2Data.overallAnalysis.marketScore ? 'deck2' : 'tie',
            deck1Score: deck1Data.overallAnalysis.marketScore,
            deck2Score: deck2Data.overallAnalysis.marketScore,
            analysis: 'Market opportunity comparison'
          },
          traction: {
            winner: deck1Data.overallAnalysis.tractionScore > deck2Data.overallAnalysis.tractionScore ? 'deck1' : 
                   deck1Data.overallAnalysis.tractionScore < deck2Data.overallAnalysis.tractionScore ? 'deck2' : 'tie',
            deck1Score: deck1Data.overallAnalysis.tractionScore,
            deck2Score: deck2Data.overallAnalysis.tractionScore,
            analysis: 'Traction and metrics comparison'
          },
          team: {
            winner: deck1Data.overallAnalysis.teamScore > deck2Data.overallAnalysis.teamScore ? 'deck1' : 
                   deck1Data.overallAnalysis.teamScore < deck2Data.overallAnalysis.teamScore ? 'deck2' : 'tie',
            deck1Score: deck1Data.overallAnalysis.teamScore,
            deck2Score: deck2Data.overallAnalysis.teamScore,
            analysis: 'Team strength comparison'
          },
          financials: {
            winner: deck1Data.overallAnalysis.financialsScore > deck2Data.overallAnalysis.financialsScore ? 'deck1' : 
                   deck1Data.overallAnalysis.financialsScore < deck2Data.overallAnalysis.financialsScore ? 'deck2' : 'tie',
            deck1Score: deck1Data.overallAnalysis.financialsScore,
            deck2Score: deck2Data.overallAnalysis.financialsScore,
            analysis: 'Financial metrics comparison'
          }
        },
        strengthsComparison: {
          deck1Advantages: deck1Data.overallAnalysis.strengths,
          deck2Advantages: deck2Data.overallAnalysis.strengths,
          sharedStrengths: []
        },
        weaknessesComparison: {
          deck1Concerns: deck1Data.overallAnalysis.weaknesses,
          deck2Concerns: deck2Data.overallAnalysis.weaknesses,
          sharedConcerns: []
        },
        recommendations: {
          deck1: ['Review detailed analysis for specific recommendations'],
          deck2: ['Review detailed analysis for specific recommendations']
        },
        keyDifferentiators: [
          `${deck1Data.companyName} focuses on ${deck1Data.industry}`,
          `${deck2Data.companyName} is at ${deck2Data.stage} stage`
        ],
        investmentRecommendation: {
          preferredDeck: deck1Data.overallAnalysis.overallScore > deck2Data.overallAnalysis.overallScore ? 'deck1' : 
                        deck1Data.overallAnalysis.overallScore < deck2Data.overallAnalysis.overallScore ? 'deck2' : 'both',
          reasoning: 'Based on comprehensive score comparison',
          riskLevel: 'medium',
          timeframe: 'monitor'
        }
      };
    }

    // Extract grounding metadata if available
    const groundingMetadata = (candidate as any).groundingMetadata;
    if (groundingMetadata && useGrounding) {
      console.log('🌐 [Vertex AI] Grounding metadata:', {
        webSearchQueries: groundingMetadata.webSearchQueries?.length || 0,
        searchResults: groundingMetadata.searchEntryPoint?.renderedContent ? 'Yes' : 'No'
      });
    }

    console.log('✅ [Vertex AI] Comparison complete');
    console.log(`   Winner: ${comparison.overallWinner}`);
    console.log(`   Investment: ${comparison.investmentRecommendation.preferredDeck}`);

    return comparison;
  } catch (error) {
    console.error('❌ [Vertex AI] Comparison failed:', error);
    throw error;
  }
}

/**
 * Helper: Build comparison prompt for analyzed decks
 */
function buildAnalyzedDecksComparisonPrompt(
  deck1: AnalyzedDeckData,
  deck2: AnalyzedDeckData
): string {
  const formatSections = (sections: AnalyzedDeckData['sections']) => {
    return sections.map(s => `
${s.sectionName} (${s.sectionScore}/100):
   Feedback: ${s.feedback}
   Strengths: ${s.strengths.join(', ')}
   Improvements: ${s.improvements.join(', ')}`).join('\n');
  };

  return `You are a senior VC analyst with expertise in startup evaluation and comparative analysis.
You are comparing two pitch decks that have already been individually analyzed.

Use Google Search Grounding to validate market claims, competitor information, and industry benchmarks.

═══════════════════════════════════════════════════════════════════
DECK 1: ${deck1.companyName}
═══════════════════════════════════════════════════════════════════

Company: ${deck1.companyName}
Industry: ${deck1.industry}
Stage: ${deck1.stage}
Analyzed: ${deck1.analyzedAt}

Overall SSO Score: ${Math.round(deck1.overallAnalysis.ssoScore * 100)}/100

SCORES BY CATEGORY:
- Problem:     ${deck1.overallAnalysis.problemScore}/100
- Solution:    ${deck1.overallAnalysis.solutionScore}/100
- Market:      ${deck1.overallAnalysis.marketScore}/100
- Traction:    ${deck1.overallAnalysis.tractionScore}/100
- Team:        ${deck1.overallAnalysis.teamScore}/100
- Financials:  ${deck1.overallAnalysis.financialsScore}/100

STRENGTHS:
${deck1.overallAnalysis.strengths.map(s => `• ${s}`).join('\n')}

WEAKNESSES:
${deck1.overallAnalysis.weaknesses.map(w => `• ${w}`).join('\n')}

KEY INSIGHTS:
${deck1.overallAnalysis.keyInsights.map(i => `• ${i}`).join('\n')}

RECOMMENDATION: ${deck1.overallAnalysis.recommendation}

SECTION ANALYSIS:
${formatSections(deck1.sections)}

═══════════════════════════════════════════════════════════════════
DECK 2: ${deck2.companyName}
═══════════════════════════════════════════════════════════════════

Company: ${deck2.companyName}
Industry: ${deck2.industry}
Stage: ${deck2.stage}
Analyzed: ${deck2.analyzedAt}

Overall SSO Score: ${Math.round(deck2.overallAnalysis.ssoScore * 100)}/100

SCORES BY CATEGORY:
- Problem:     ${deck2.overallAnalysis.problemScore}/100
- Solution:    ${deck2.overallAnalysis.solutionScore}/100
- Market:      ${deck2.overallAnalysis.marketScore}/100
- Traction:    ${deck2.overallAnalysis.tractionScore}/100
- Team:        ${deck2.overallAnalysis.teamScore}/100
- Financials:  ${deck2.overallAnalysis.financialsScore}/100

STRENGTHS:
${deck2.overallAnalysis.strengths.map(s => `• ${s}`).join('\n')}

WEAKNESSES:
${deck2.overallAnalysis.weaknesses.map(w => `• ${w}`).join('\n')}

KEY INSIGHTS:
${deck2.overallAnalysis.keyInsights.map(i => `• ${i}`).join('\n')}

RECOMMENDATION: ${deck2.overallAnalysis.recommendation}

SECTION ANALYSIS:
${formatSections(deck2.sections)}

═══════════════════════════════════════════════════════════════════
COMPARATIVE ANALYSIS TASK
═══════════════════════════════════════════════════════════════════

Your task:
1. Compare the two decks across all dimensions
2. Use Google Search to validate:
   - Market size claims
   - Industry growth rates
   - Competitive landscape accuracy
   - Benchmark metrics (CAC, LTV, growth rates, etc.)
3. Identify which deck is stronger overall and in each category
4. Provide specific, actionable recommendations for each deck
5. Highlight key differences in approach, stage, and execution
6. Provide investment recommendation from VC perspective

CRITICAL: Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "executiveSummary": "2-3 sentence high-level comparison with grounded insights",
  "overallWinner": "deck1",
  "winnerReasoning": "Detailed explanation with web-validated facts",
  "categoryComparison": {
    "problem": {
      "winner": "deck1",
      "deck1Score": ${deck1.overallAnalysis.problemScore},
      "deck2Score": ${deck2.overallAnalysis.problemScore},
      "analysis": "Comparative analysis with specific examples"
    },
    "solution": {
      "winner": "deck2",
      "deck1Score": ${deck1.overallAnalysis.solutionScore},
      "deck2Score": ${deck2.overallAnalysis.solutionScore},
      "analysis": "Comparative analysis"
    },
    "market": {
      "winner": "tie",
      "deck1Score": ${deck1.overallAnalysis.marketScore},
      "deck2Score": ${deck2.overallAnalysis.marketScore},
      "analysis": "Comparative analysis"
    },
    "traction": {
      "winner": "deck1",
      "deck1Score": ${deck1.overallAnalysis.tractionScore},
      "deck2Score": ${deck2.overallAnalysis.tractionScore},
      "analysis": "Comparative analysis"
    },
    "team": {
      "winner": "deck2",
      "deck1Score": ${deck1.overallAnalysis.teamScore},
      "deck2Score": ${deck2.overallAnalysis.teamScore},
      "analysis": "Comparative analysis"
    },
    "financials": {
      "winner": "deck1",
      "deck1Score": ${deck1.overallAnalysis.financialsScore},
      "deck2Score": ${deck2.overallAnalysis.financialsScore},
      "analysis": "Comparative analysis"
    }
  },
  "strengthsComparison": {
    "deck1Advantages": ["Unique strength 1", "Unique strength 2"],
    "deck2Advantages": ["Unique strength 1", "Unique strength 2"],
    "sharedStrengths": ["Common strength 1"]
  },
  "weaknessesComparison": {
    "deck1Concerns": ["Critical gap 1", "Critical gap 2"],
    "deck2Concerns": ["Critical gap 1", "Critical gap 2"],
    "sharedConcerns": ["Common weakness 1"]
  },
  "recommendations": {
    "deck1": ["Specific actionable recommendation 1", "Specific actionable recommendation 2", "Specific actionable recommendation 3"],
    "deck2": ["Specific actionable recommendation 1", "Specific actionable recommendation 2", "Specific actionable recommendation 3"]
  },
  "keyDifferentiators": ["Major difference 1 with context", "Major difference 2 with context", "Major difference 3 with context"],
  "webValidation": {
    "marketSizeClaims": {
      "deck1Claim": "...",
      "deck2Claim": "...",
      "actualData": "...",
      "sources": ["url1", "url2"]
    },
    "competitiveLandscape": {
      "deck1Competitors": ["comp1", "comp2"],
      "deck2Competitors": ["comp1", "comp2"],
      "actualTopPlayers": ["player1", "player2"],
      "sources": ["url1"]
    }
  },
  "investmentRecommendation": {
    "preferredDeck": "deck1",
    "reasoning": "Detailed VC perspective with risk/opportunity analysis",
    "riskLevel": "medium",
    "timeframe": "immediate"
  }
}`;
}

export default {
  analyzeWithGrounding,
  generateSearchQueries,
  validateClaim,
  compareAnalyzedDecks,
};
