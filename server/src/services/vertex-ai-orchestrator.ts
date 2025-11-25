/**
 * 🎯 GEMINI AI ORCHESTRATOR FOR PREMIUM REPORTS
 * 
 * Deep intelligence extraction for 25-30 page comprehensive reports:
 * - Company background & mission
 * - Founder profiles & experience
 * - Funding history & investor analysis
 * - Sector-specific deep classification
 * - 6 core metrics + industry-specific KPIs
 * - Competitive positioning
 * - Risk assessment & opportunities
 * 
 * 🔧 FIXED: Now uses Gemini AI Studio API (via GEMINI_API_KEY) instead of Vertex AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getActiveGeminiModel } from '../utils/gemini-model';

const MODEL = getActiveGeminiModel();

// Initialize Gemini AI (same as other services)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const model = genAI.getGenerativeModel({
  model: MODEL,
  generationConfig: {
    maxOutputTokens: 16384, // 🔧 INCREASED from 8192 for deeper VC alignment analysis
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
  
  // 🎯 AGENTIC FLAGGING RESULTS (NEW)
  vcAlignmentAnalysis?: {
    dealbreakerFlags: Array<{
      dealbreaker: string;
      matched: boolean;
      reasoning: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      evidenceFromDeck: string[];
    }>;
    positivePatternMatches: Array<{
      pattern: string;
      matched: boolean;
      reasoning: string;
      strength: 'strong' | 'moderate' | 'weak';
      evidenceFromDeck: string[];
    }>;
    thesisAlignment: {
      score: number; // 0-100
      alignmentAreas: string[];
      misalignmentAreas: string[];
      overallAssessment: string;
    };
    contextIntelligenceInsights?: Array<{
      insightType: 'company' | 'market' | 'people' | 'pattern';
      insight: string;
      relevanceToDeck: string;
      actionableImplication: string;
    }>;
  };
  
  overallScore: number;
  confidence: string;
  dataSources: string[];
}

/**
 * 🧠 ORCHESTRATE PREMIUM ANALYSIS WITH VC CONTEXT & PREFERENCES
 * Extract comprehensive intelligence from deck with sector-specific deep dive
 * 
 * 🎯 AGENTIC FLOW:
 * - Uses VC Context Intelligence to inform analysis
 * - Applies VC Preferences to flag dealbreakers/patterns
 * - Returns detailed flagging results showing what matched and why
 */
export async function orchestratePremiumAnalysis(
  deckText: string,
  companyName: string,
  vcContextIntelligence?: any,
  vcPreferences?: any
): Promise<PremiumReportData> {
  console.log('🎯 [Premium Orchestrator] Starting AGENTIC deep analysis...');
  console.log(`   Company: ${companyName}`);
  console.log(`   Deck text length: ${deckText.length} chars`);
  
  if (vcContextIntelligence) {
    console.log(`   🧠 Using VC Context Intelligence (${vcContextIntelligence.items?.length || 0} items)`);
  }
  
  if (vcPreferences) {
    console.log(`   🎯 Using VC Preferences: "${vcPreferences.preferencesName || 'Custom'}"`);
    if (vcPreferences.dealbreakers) {
      console.log(`      ⚠️  ${vcPreferences.dealbreakers.length} dealbreakers to check`);
    }
    if (vcPreferences.positivePatterns) {
      console.log(`      ✓ ${vcPreferences.positivePatterns.length} positive patterns to look for`);
    }
  }

  const prompt = buildPremiumAnalysisPrompt(deckText, companyName, vcContextIntelligence, vcPreferences);

  try {
    console.log('🔍 [Premium Orchestrator] Sending AGENTIC request to Gemini AI...');
    
    // 🔧 FIXED: Use standard Gemini AI Studio API (no googleSearch tool support)
    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response || !response.text) {
      throw new Error('No response from Gemini AI');
    }

    const analysisText = response.text();

    console.log('📊 [Premium Orchestrator] Parsing response...');
    console.log(`   Response length: ${analysisText.length} chars`);

    // Parse JSON from response
    let premiumData: PremiumReportData;
    try {
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
      let jsonText = jsonMatch ? jsonMatch[1] : analysisText;
      
      // 🔧 AGGRESSIVE JSON CLEANING
      jsonText = jsonText
        .replace(/```json/g, '') // Remove any leftover markdown
        .replace(/```/g, '')
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/\\n/g, ' ') // Replace escaped newlines
        .replace(/\n/g, ' ') // Remove actual newlines
        .replace(/\r/g, '') // Remove carriage returns
        .replace(/\t/g, ' ') // Remove tabs
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\\"/g, '"') // Fix escaped quotes
        .replace(/\\'/g, "'") // Fix escaped single quotes
        .trim();
      
      // Try to find JSON object boundaries
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }
      
      console.log(`   Cleaned JSON length: ${jsonText.length} chars`);
      
      // Try to parse
      try {
        premiumData = JSON.parse(jsonText);
      } catch (firstParseError: any) {
        console.warn('⚠️  First parse attempt failed, trying repair...');
        console.warn(`   Error: ${firstParseError.message}`);
        
        // Try to repair JSON by removing the vcAlignmentAnalysis section if it's causing issues
        if (jsonText.includes('"vcAlignmentAnalysis"')) {
          console.log('   Attempting to remove vcAlignmentAnalysis section...');
          jsonText = jsonText.replace(/"vcAlignmentAnalysis"\s*:\s*\{[^}]*\}/g, '');
          jsonText = jsonText.replace(/,\s*,/g, ','); // Fix double commas
          jsonText = jsonText.replace(/,(\s*})/g, '$1'); // Remove trailing commas again
        }
        
        // Second attempt
        premiumData = JSON.parse(jsonText);
        console.log('   ✅ JSON repaired and parsed successfully');
      }
      
    } catch (parseError: any) {
      console.error('❌ [Premium Orchestrator] Failed to parse:', parseError);
      console.error('   Error message:', parseError.message);
      console.error('   First 500 chars:', analysisText.substring(0, 500));
      console.error('   Last 500 chars:', analysisText.substring(Math.max(0, analysisText.length - 500)));
      
      // Find the error position if available
      const match = parseError.message.match(/position (\d+)/);
      if (match) {
        const errorPos = parseInt(match[1]);
        console.error('   Error context:', analysisText.substring(Math.max(0, errorPos - 100), Math.min(analysisText.length, errorPos + 100)));
      }
      
      throw new Error('Failed to parse premium analysis');
    }

    console.log('✅ [Premium Orchestrator] Analysis complete!');
    console.log(`   Overall Score: ${premiumData.overallScore}/100`);
    console.log(`   Sector: ${premiumData.sectorClassification.primarySector}`);
    console.log(`   Sub-sectors: ${premiumData.sectorClassification.subSectors.join(', ')}`);
    
    // 🔍 DEBUG: Check if VC Alignment Analysis was returned
    if (premiumData.vcAlignmentAnalysis) {
      console.log(`   🎯 VC Alignment Analysis FOUND in response!`);
      console.log(`      Dealbreaker Flags: ${premiumData.vcAlignmentAnalysis.dealbreakerFlags?.length || 0}`);
      console.log(`      Positive Patterns: ${premiumData.vcAlignmentAnalysis.positivePatternMatches?.length || 0}`);
      console.log(`      Has Thesis Alignment: ${!!premiumData.vcAlignmentAnalysis.thesisAlignment}`);
      console.log(`      Context Insights: ${premiumData.vcAlignmentAnalysis.contextIntelligenceInsights?.length || 0}`);
    } else {
      console.log(`   ⚠️  VC Alignment Analysis NOT in response (this is why PDF section is empty!)`);
    }

    return premiumData;
  } catch (error) {
    console.error('❌ [Premium Orchestrator] Error:', error);
    throw error;
  }
}

/**
 * 📝 BUILD PREMIUM ANALYSIS PROMPT WITH VC CONTEXT & PREFERENCES
 */
function buildPremiumAnalysisPrompt(
  deckText: string, 
  companyName: string,
  vcContextIntelligence?: any,
  vcPreferences?: any
): string {
  const currentYear = new Date().getFullYear();

  // Build VC Context section if available
  let vcContextSection = '';
  if (vcContextIntelligence) {
    vcContextSection = `\n\n🧠 **VC CONTEXT INTELLIGENCE (USE THIS TO INFORM YOUR ANALYSIS):**

**Investment Thesis:**
${vcContextIntelligence.summary || 'No thesis available'}

**Companies in Portfolio/Network:**
${vcContextIntelligence.items?.filter((item: any) => item.type === 'company').map((item: any) => 
  `- ${item.title}: ${item.content}`).join('\n') || 'None'}

**Market Insights:**
${vcContextIntelligence.items?.filter((item: any) => item.type === 'market').map((item: any) => 
  `- ${item.title}: ${item.content}`).join('\n') || 'None'}

**People Network:**
${vcContextIntelligence.items?.filter((item: any) => item.type === 'people').map((item: any) => 
  `- ${item.title}: ${item.content}`).join('\n') || 'None'}

**Decision Patterns:**
${vcContextIntelligence.items?.filter((item: any) => item.type === 'pattern').map((item: any) => 
  `- ${item.title}: ${item.content}`).join('\n') || 'None'}
`;
  }

  // Build VC Preferences section if available
  let vcPreferencesSection = '';
  if (vcPreferences) {
    vcPreferencesSection = `\n\n🎯 **VC EVALUATION PREFERENCES (CRITICALLY IMPORTANT - CHECK THESE):**

**Preferences Name:** ${vcPreferences.preferencesName || 'Custom Evaluation'}
**Target Industry:** ${vcPreferences.industry || 'All'}

${vcPreferences.investmentThesis ? `**Investment Thesis:**
${vcPreferences.investmentThesis}
` : ''}

${vcPreferences.dealbreakers && vcPreferences.dealbreakers.length > 0 ? `
⚠️ **DEALBREAKERS (AUTO-REJECT IF FOUND):**
${vcPreferences.dealbreakers.map((db: string, idx: number) => `${idx + 1}. ${db}`).join('\n')}

**YOU MUST:**
- Check each dealbreaker against the deck
- Flag any that match with CRITICAL severity
- Provide specific evidence from the deck for each match
` : ''}

${vcPreferences.positivePatterns && vcPreferences.positivePatterns.length > 0 ? `
✓ **POSITIVE PATTERNS (ACTIVELY LOOK FOR THESE):**
${vcPreferences.positivePatterns.map((pp: string, idx: number) => `${idx + 1}. ${pp}`).join('\n')}

**YOU MUST:**
- Identify which positive patterns are present
- Rate match strength (strong/moderate/weak)
- Provide evidence from the deck for each match
` : ''}

${vcPreferences.contextWeights ? `
**EVALUATION WEIGHTS:**
${JSON.stringify(vcPreferences.contextWeights, null, 2)}
` : ''}
`;
  }

  return `You are a senior venture capital analyst creating a COMPREHENSIVE INVESTMENT REPORT.

🔍 **MANDATORY WEB SEARCHES (Execute these first):**

1. 🔍 SEARCH: "${companyName} company founder CEO LinkedIn background"
2. 🔍 SEARCH: "${companyName} funding rounds Crunchbase investors valuation"
3. 🔍 SEARCH: "${companyName} competitors market analysis ${currentYear}"
4. 🔍 SEARCH: "industry analysis market size TAM SAM related to ${companyName}"
5. 🔍 SEARCH: "${companyName} news press releases product launch"

---

**PITCH DECK CONTENT:**
${deckText.substring(0, 20000)}${deckText.length > 20000 ? '... (truncated)' : ''}${vcContextSection}${vcPreferencesSection}

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

8. **JSON FORMAT**: Return ONLY valid JSON. No markdown. No code blocks. No extra text. Just pure JSON starting with { and ending with }.

Execute web searches FIRST, then analyze the deck, then synthesize into JSON.

${vcPreferences || vcContextIntelligence ? `
---

🎯 **ADDITIONAL TASK: VC ALIGNMENT ANALYSIS**

After completing the main JSON above, add ONE MORE top-level field called "vcAlignmentAnalysis" with the following structure:

"vcAlignmentAnalysis": {
  ${vcPreferences?.dealbreakers && vcPreferences.dealbreakers.length > 0 ? `
  "dealbreakerFlags": [
    // For EACH dealbreaker in the list below, create one object:
    {
      "dealbreaker": "EXACT text from dealbreaker list",
      "matched": true or false,
      "reasoning": "Why this does or doesn't apply to this deck (2-3 sentences)",
      "severity": "critical",
      "evidenceFromDeck": ["Specific quote from deck", "Another quote"]
    }
  ],
  
  DEALBREAKERS TO CHECK:
  ${vcPreferences.dealbreakers.map((db: string, i: number) => `${i + 1}. "${db}"`).join('\n  ')}
  ` : ''}
  
  ${vcPreferences?.positivePatterns && vcPreferences.positivePatterns.length > 0 ? `
  "positivePatternMatches": [
    // For EACH positive pattern in the list below, create one object:
    {
      "pattern": "EXACT text from pattern list",
      "matched": true or false,
      "reasoning": "How this pattern appears (or doesn't) in the deck",
      "strength": "strong" or "moderate" or "weak",
      "evidenceFromDeck": ["Quote supporting this", "Another quote"]
    }
  ],
  
  PATTERNS TO LOOK FOR:
  ${vcPreferences.positivePatterns.map((pp: string, i: number) => `${i + 1}. "${pp}"`).join('\n  ')}
  ` : ''}
  
  ${vcPreferences?.investmentThesis ? `
  "thesisAlignment": {
    "score": 0-100,
    "alignmentAreas": ["Where deck aligns", "Another alignment"],
    "misalignmentAreas": ["Where it doesn't align", "Another gap"],
    "overallAssessment": "2-3 sentences summary"
  }
  ` : ''}
}

**IMPORTANT**: Keep the vcAlignmentAnalysis section SIMPLE and SHORT. Maximum 2 evidence quotes per item.
` : ''}`;
}
