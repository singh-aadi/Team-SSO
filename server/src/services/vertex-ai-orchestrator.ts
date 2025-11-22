/**
 * 🎯 VERTEX AI ORCHESTRATOR FOR PREMIUM REPORTS
 * 
 * Deep intelligence extraction for 25-30 page comprehensive reports:
 * - Company background & mission
 * - Founder profiles & experience
 * - Funding history & investor analysis
 * - Sector-specific deep classification
 * - 6 core metrics + industry-specific KPIs
 * - Competitive positioning
 * - Risk assessment & opportunities
 */

import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = 'projectsso-473108';
const LOCATION = 'us-central1';
const MODEL = 'gemini-2.0-flash-exp';

const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

const model = vertexAI.getGenerativeModel({
  model: MODEL,
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.3,
    topP: 0.9,
    topK: 40,
  },
});

/**
 * Interface for Premium Report Data
 */
export interface PremiumReportData {
  companyProfile: {
    name: string;
    tagline: string;
    mission: string;
    foundedYear: string;
    headquarters: string;
    website: string;
    industry: string;
    stage: string;
  };
  
  founderProfiles: Array<{
    name: string;
    role: string;
    background: string;
    education: string;
    previousCompanies: string[];
    expertise: string[];
    linkedIn?: string;
  }>;
  
  fundingHistory: {
    totalRaised: string;
    rounds: Array<{
      roundType: string;
      amount: string;
      date: string;
      leadInvestors: string[];
      valuation?: string;
    }>;
    currentRunway: string;
    burnRate: string;
  };
  
  sectorClassification: {
    primarySector: string;
    subSectors: string[];
    deepClassification: {
      category: string;
      subcategory: string;
      niche: string;
      specificFocus: string[];
    };
    regulatoryEnvironment: string;
  };
  
  coreMetrics: {
    problemSolution: {
      score: number;
      problemClarity: string;
      solutionInnovation: string;
      uniqueValueProp: string;
      painPointAddressed: string;
      competitiveDifferentiation: string;
    };
    
    marketOpportunity: {
      score: number;
      tam: string;
      sam: string;
      som: string;
      marketGrowthRate: string;
      marketTrends: string[];
      competitiveLandscape: string;
    };
    
    traction: {
      score: number;
      users: string;
      revenue: string;
      growthRate: string;
      keyMetrics: Record<string, string>;
      milestones: string[];
    };
    
    team: {
      score: number;
      foundingTeamStrength: string;
      domainExpertise: string;
      executionCapability: string;
      advisors: string[];
      keyHires: string[];
    };
    
    businessModel: {
      score: number;
      revenueStreams: string[];
      pricingStrategy: string;
      unitEconomics: string;
      scalability: string;
      margins: string;
    };
    
    financials: {
      score: number;
      currentRevenue: string;
      projectedRevenue: string;
      profitabilityTimeline: string;
      cashPosition: string;
      fundingNeeds: string;
    };
  };
  
  industrySpecificMetrics: Record<string, any>;
  
  competitiveAnalysis: {
    directCompetitors: Array<{
      name: string;
      funding: string;
      strengths: string[];
      weaknesses: string[];
      marketPosition: string;
    }>;
    competitiveAdvantages: string[];
    threats: string[];
    moat: string;
  };
  
  riskAssessment: {
    marketRisks: string[];
    executionRisks: string[];
    competitiveRisks: string[];
    financialRisks: string[];
    regulatoryRisks: string[];
    mitigationStrategies: string[];
  };
  
  opportunities: {
    expansionOpportunities: string[];
    partnershipPotential: string[];
    exitScenarios: string[];
    strategicOptions: string[];
  };
  
  investmentThesis: {
    bullCase: string[];
    bearCase: string[];
    keyAssumptions: string[];
    valuation: string;
    recommendedAction: string;
    targetOwnership: string;
  };
  
  overallScore: number;
  confidence: string;
  dataSources: string[];
}

/**
 * 🧠 ORCHESTRATE PREMIUM ANALYSIS
 * Extract comprehensive intelligence from deck with sector-specific deep dive
 */
export async function orchestratePremiumAnalysis(
  deckText: string,
  companyName: string
): Promise<PremiumReportData> {
  console.log('🎯 [Premium Orchestrator] Starting deep analysis...');
  console.log(`   Company: ${companyName}`);
  console.log(`   Deck text length: ${deckText.length} chars`);

  const prompt = buildPremiumAnalysisPrompt(deckText, companyName);

  try {
    const request = {
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

    console.log('🔍 [Premium Orchestrator] Sending request to Vertex AI...');
    const response = await model.generateContent(request);

    const candidate = response.response.candidates?.[0];
    if (!candidate) {
      throw new Error('No response from Vertex AI');
    }

    const analysisText = candidate.content.parts
      .map((part: any) => (part.text ? part.text : ''))
      .join('\n');

    console.log('📊 [Premium Orchestrator] Parsing response...');

    // Parse JSON from response
    let premiumData: PremiumReportData;
    try {
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        premiumData = JSON.parse(jsonMatch[1]);
      } else {
        premiumData = JSON.parse(analysisText);
      }
    } catch (parseError) {
      console.error('❌ [Premium Orchestrator] Failed to parse:', parseError);
      throw new Error('Failed to parse premium analysis');
    }

    console.log('✅ [Premium Orchestrator] Analysis complete!');
    console.log(`   Overall Score: ${premiumData.overallScore}/100`);
    console.log(`   Sector: ${premiumData.sectorClassification.primarySector}`);
    console.log(`   Sub-sectors: ${premiumData.sectorClassification.subSectors.join(', ')}`);

    return premiumData;
  } catch (error) {
    console.error('❌ [Premium Orchestrator] Error:', error);
    throw error;
  }
}

/**
 * 📝 BUILD PREMIUM ANALYSIS PROMPT
 */
function buildPremiumAnalysisPrompt(deckText: string, companyName: string): string {
  const currentYear = new Date().getFullYear();

  return `You are a senior venture capital analyst creating a COMPREHENSIVE INVESTMENT REPORT.

🔍 **MANDATORY WEB SEARCHES (Execute these first):**

1. 🔍 SEARCH: "${companyName} company founder CEO LinkedIn background"
2. 🔍 SEARCH: "${companyName} funding rounds Crunchbase investors valuation"
3. 🔍 SEARCH: "${companyName} competitors market analysis ${currentYear}"
4. 🔍 SEARCH: "industry analysis market size TAM SAM related to ${companyName}"
5. 🔍 SEARCH: "${companyName} news press releases product launch"

---

**PITCH DECK CONTENT:**
${deckText.substring(0, 20000)}${deckText.length > 20000 ? '... (truncated)' : ''}

---

**YOUR MISSION:**

Extract COMPREHENSIVE intelligence for a 25-30 page premium investment report.

**OUTPUT FORMAT (EXACT JSON):**

\`\`\`json
{
  "companyProfile": {
    "name": "${companyName}",
    "tagline": "Extract from deck - one compelling sentence",
    "mission": "Extract company mission/vision statement",
    "foundedYear": "YYYY or 'Not specified'",
    "headquarters": "City, Country",
    "website": "URL if mentioned",
    "industry": "Primary industry",
    "stage": "Pre-seed/Seed/Series A/B/C etc."
  },
  
  "founderProfiles": [
    {
      "name": "Founder name from deck or web",
      "role": "CEO/CTO/etc.",
      "background": "2-3 sentences about their background",
      "education": "University, degree",
      "previousCompanies": ["Company1", "Company2"],
      "expertise": ["AI", "Healthcare", "etc."],
      "linkedIn": "URL if found via web search"
    }
  ],
  
  "fundingHistory": {
    "totalRaised": "$X million",
    "rounds": [
      {
        "roundType": "Seed/Series A/etc.",
        "amount": "$X million",
        "date": "Month YYYY",
        "leadInvestors": ["Investor1", "Investor2"],
        "valuation": "$X million (if known)"
      }
    ],
    "currentRunway": "X months (calculate from deck data)",
    "burnRate": "$X per month (estimate from deck)"
  },
  
  "sectorClassification": {
    "primarySector": "Healthcare/SaaS/Fintech/etc.",
    "subSectors": ["Digital Health", "Telemedicine", "etc."],
    "deepClassification": {
      "category": "E.g., Healthcare",
      "subcategory": "E.g., Digital Health",
      "niche": "E.g., Remote Patient Monitoring",
      "specificFocus": ["Chronic Disease Management", "Wearable Integration", "etc."]
    },
    "regulatoryEnvironment": "FDA/HIPAA/etc. - describe requirements"
  },
  
  "coreMetrics": {
    "problemSolution": {
      "score": 85,
      "problemClarity": "Describe how clearly the problem is defined",
      "solutionInnovation": "How innovative is the solution",
      "uniqueValueProp": "What makes it unique",
      "painPointAddressed": "Specific pain point being solved",
      "competitiveDifferentiation": "How it differs from alternatives"
    },
    
    "marketOpportunity": {
      "score": 78,
      "tam": "$X billion - Total Addressable Market",
      "sam": "$X million - Serviceable Available Market",
      "som": "$X million - Serviceable Obtainable Market",
      "marketGrowthRate": "X% CAGR",
      "marketTrends": ["Trend1", "Trend2", "Trend3"],
      "competitiveLandscape": "Describe competitive intensity"
    },
    
    "traction": {
      "score": 72,
      "users": "X users/customers",
      "revenue": "$X (ARR/MRR)",
      "growthRate": "X% MoM or YoY",
      "keyMetrics": {
        "metric1": "value1",
        "metric2": "value2"
      },
      "milestones": ["Milestone1", "Milestone2"]
    },
    
    "team": {
      "score": 88,
      "foundingTeamStrength": "Assessment of team strength",
      "domainExpertise": "Relevant experience",
      "executionCapability": "Track record of execution",
      "advisors": ["Advisor1", "Advisor2"],
      "keyHires": ["Recent key hires"]
    },
    
    "businessModel": {
      "score": 75,
      "revenueStreams": ["Stream1", "Stream2"],
      "pricingStrategy": "Describe pricing model",
      "unitEconomics": "LTV:CAC ratio, payback period",
      "scalability": "How scalable is the model",
      "margins": "Gross margin percentage"
    },
    
    "financials": {
      "score": 70,
      "currentRevenue": "$X (annual)",
      "projectedRevenue": "$X in Y years",
      "profitabilityTimeline": "Expected in X months/years",
      "cashPosition": "$X in bank",
      "fundingNeeds": "$X for next 18-24 months"
    }
  },
  
  "industrySpecificMetrics": {
    "// IMPORTANT: Fill with REAL metrics for the company's actual industry. Remove comment keys and examples.": "",
    "// Examples by sector (ONLY include metrics relevant to THIS company):": "",
    "// Healthcare: regulatoryApprovals, clinicalValidation, reimbursementStrategy, dataPrivacy": "",
    "// SaaS: arr_mrr, churnRate, nps, ltv_cac, customerCount": "",
    "// Fintech: licenses, aum, transactionVolume, fraudRate, complianceStatus": "",
    "// E-commerce: gmv, averageOrderValue, conversionRate, repeatPurchaseRate": "",
    "// AI/ML: modelAccuracy, datasetSize, inferenceSpeed, computeCosts": "",
    "// Extract 4-6 actual KPIs from the deck or web for THIS company's sector": {
      "kpi1Name": "actual value from deck",
      "kpi2Name": "actual value from deck",
      "kpi3Name": "actual value from deck",
      "kpi4Name": "actual value from deck"
    }
  },
  
  "competitiveAnalysis": {
    "directCompetitors": [
      {
        "name": "Competitor name (from web search)",
        "funding": "$X raised (from Crunchbase)",
        "strengths": ["Strength1", "Strength2"],
        "weaknesses": ["Weakness1", "Weakness2"],
        "marketPosition": "Leader/Challenger/Niche"
      }
    ],
    "competitiveAdvantages": ["Advantage1", "Advantage2", "Advantage3"],
    "threats": ["Threat1", "Threat2"],
    "moat": "Describe defensibility - network effects, IP, etc."
  },
  
  "riskAssessment": {
    "marketRisks": ["Risk1", "Risk2"],
    "executionRisks": ["Risk1", "Risk2"],
    "competitiveRisks": ["Risk1", "Risk2"],
    "financialRisks": ["Risk1", "Risk2"],
    "regulatoryRisks": ["Risk1", "Risk2"],
    "mitigationStrategies": ["Strategy1", "Strategy2"]
  },
  
  "opportunities": {
    "expansionOpportunities": ["Opportunity1", "Opportunity2"],
    "partnershipPotential": ["Partner type 1", "Partner type 2"],
    "exitScenarios": ["Strategic acquisition by X", "IPO potential"],
    "strategicOptions": ["Option1", "Option2"]
  },
  
  "investmentThesis": {
    "bullCase": ["Reason1", "Reason2", "Reason3"],
    "bearCase": ["Risk1", "Risk2", "Risk3"],
    "keyAssumptions": ["Assumption1", "Assumption2"],
    "valuation": "$X million (explain basis)",
    "recommendedAction": "INVEST/PASS/MONITOR - with reasoning",
    "targetOwnership": "X% for $Y investment"
  },
  
  "overallScore": 82,
  "confidence": "HIGH/MEDIUM/LOW",
  "dataSources": ["Deck", "Crunchbase", "LinkedIn", "Company website", "etc."]
}
\`\`\`

**CRITICAL INSTRUCTIONS:**

1. **Sector Classification**: Be EXTREMELY specific. For Healthcare, break down to sub-specialty (e.g., "Digital Health > Telemedicine > Remote Patient Monitoring > Chronic Disease Management")

2. **Founder Profiles**: Use web search to find LinkedIn profiles, previous companies, education

3. **Funding History**: Cross-reference deck with Crunchbase data via web search

4. **Industry-Specific Metrics**: Populate the section that matches the detected sector. Leave others empty.

5. **Scores**: Use 0-100 scale. Be honest and critical.

6. **Data Sources**: List all sources used (deck sections, web URLs)

7. **Depth**: Provide 2-3 sentence explanations, not just bullet points

Execute web searches FIRST, then analyze the deck, then synthesize into JSON.`;
}
