// Enhanced AI service for dual PDF analysis with vision capabilities
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { getCache, wrapCache, setCache } from './cache';
// @ts-ignore - pptx2json doesn't have TypeScript definitions
import pptx2json from 'pptx2json';
// 🌐 NEW: Vertex AI with Grounding for web-validated analysis
import { analyzeWithGrounding } from './vertex-ai';
import { enrichWithWebSearch, extractMetricsFromText } from './grounding';
import { mergeSourcesAndValidate, formatForPDF } from './dual-source-analyzer';
import { getActiveGeminiModel } from '../utils/gemini-model';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface MetricValue {
  value: number | null;
  unit: string;
  period?: string;
}

interface ExtractedMetrics {
  common: {
    revenue?: MetricValue | null;
    growth_rate?: MetricValue | null;
    cac?: MetricValue | null;
    ltv?: MetricValue | null;
    ltv_cac_ratio?: MetricValue | null;
    burn_rate?: MetricValue | null;
    runway?: MetricValue | null;
    gross_margin?: MetricValue | null;
    employees?: MetricValue | null;
    funding_raised?: MetricValue | null;
  };
  sector_specific: {
    [key: string]: MetricValue | null;
  };
}

interface AnalysisResult {
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
  checklistVerification: ChecklistVerification;
  visualInsights: string[];
  extractedMetrics?: ExtractedMetrics;
}

interface ChecklistVerification {
  unitEconomicsComplete: boolean;
  growthMetricsComplete: boolean;
  paymentInfoComplete: boolean;
  foundationalChecklistScore: number;
  missingItems: string[];
  verifiedItems: string[];
}

interface SectionAnalysis {
  sectionName: string;
  sectionScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface ChecklistItem {
  item: string;
  status: 'verified' | 'missing' | 'unclear';
  foundIn: 'pitch_deck' | 'checklist' | 'neither';
  details: string;
}

interface VCPreferences {
  criteria: Array<{
    id: string;
    name: string;
    weight: number;
    subcriteria: Array<{
      id: string;
      name: string;
      weight: number;
    }>;
  }>;
}

// Helper function to build weighted evaluation instructions based on VC preferences
function buildWeightedEvaluationInstructions(preferences?: VCPreferences): string {
  if (!preferences || !preferences.criteria) {
    // Default equal weighting
    return `Use standard VC evaluation criteria with balanced weighting across all dimensions.

**SCORING METHODOLOGY:**
Calculate the overall score as an average of all section scores (Team, Market, Product, Traction, etc.).`;
  }

  const criteria = preferences.criteria;
  
  // Check if criteria is old format (array) or new format (object)
  if (Array.isArray(criteria)) {
    // OLD FORMAT - Handle array of criteria with weights
    if (criteria.length === 0) {
      return `Use standard VC evaluation criteria with balanced weighting across all dimensions.

**SCORING METHODOLOGY:**
Calculate the overall score as an average of all section scores (Team, Market, Product, Traction, etc.).`;
    }

    let instructions = `**═══════════════════════════════════════════════════════════**\n`;
    instructions += `**MANDATORY WEIGHTED SCORING - READ CAREFULLY**\n`;
    instructions += `**═══════════════════════════════════════════════════════════**\n\n`;
    
    instructions += `⚠️ THE VC HAS SET CUSTOM WEIGHTS. YOU MUST USE THESE EXACT VALUES:\n\n`;
    
    // Build the criteria map and formula
    const criteriaMap: { [key: string]: { weight: number; field: string } } = {};
    const formulaParts: string[] = [];
    let totalWeight = 0;
    
    // First pass: Show weights prominently with field mapping
    criteria.forEach(criterion => {
    const weight = criterion.weight;
    const field = mapCriteriaToScoreField(criterion.name);
    const decimal = (weight / 100).toFixed(2);
    
    instructions += `   ${criterion.name.toUpperCase()}: ${weight}% (use ${decimal} as multiplier for ${field})\n`;
    
    totalWeight += weight;
    criteriaMap[criterion.name] = { weight, field };
    
    if (weight > 0) {
      formulaParts.push(`(${field} × ${decimal})`);
    }
  });
  
  instructions += `\n🔍 Weight verification: Total = ${totalWeight}% (must equal 100%)\n\n`;
  
  // Second pass: Show subcriteria (optional detail)
  preferences.criteria.forEach(criterion => {
    if (criterion.subcriteria && criterion.subcriteria.length > 0) {
      instructions += `   ${criterion.name} breakdown:\n`;
      criterion.subcriteria.forEach(sub => {
        instructions += `      • ${sub.name}: ${sub.weight}%\n`;
      });
      instructions += `\n`;
    }
  });

  instructions += `\n**═══════════════════════════════════════════════════════════**\n`;
  instructions += `**CRITICAL: EXACT CALCULATION FORMULA**\n`;
  instructions += `**═══════════════════════════════════════════════════════════**\n\n`;
  
  instructions += `You MUST calculate overallScore using this EXACT formula:\n\n`;
  instructions += `overallScore = ${formulaParts.join(' + ')}\n\n`;
  
  instructions += `**IMPORTANT:** The weights above are ALREADY IN DECIMAL FORM (0.00 to 1.00).\n`;
  instructions += `DO NOT use percentages in your calculation. Use the decimal weights shown above.\n\n`;
  
  instructions += `**STEP-BY-STEP EXAMPLE:**\n`;
  instructions += `Given weights: `;
  preferences.criteria.forEach((c, i) => {
    instructions += `${c.name}=${c.weight}% (which is ${(c.weight / 100).toFixed(2)} as a decimal)`;
    if (i < preferences.criteria.length - 1) instructions += ', ';
  });
  instructions += `\n`;
  
  instructions += `If section scores are: `;
  preferences.criteria.forEach((c, i) => {
    const exampleScore = 70 + (i * 5);
    instructions += `${mapCriteriaToScoreField(c.name)}=${exampleScore}`;
    if (i < preferences.criteria.length - 1) instructions += ', ';
  });
  instructions += `\n`;
  
  instructions += `Correct calculation using DECIMALS: `;
  preferences.criteria.forEach((c, i) => {
    const exampleScore = 70 + (i * 5);
    const decimalWeight = (c.weight / 100).toFixed(2);
    const contribution = (exampleScore * c.weight / 100).toFixed(1);
    instructions += `(${exampleScore} × ${decimalWeight})`;
    if (i < preferences.criteria.length - 1) instructions += ' + ';
  });
  
  let exampleTotal = 0;
  preferences.criteria.forEach((c, i) => {
    const exampleScore = 70 + (i * 5);
    exampleTotal += (exampleScore * c.weight / 100);
  });
  instructions += ` = ${exampleTotal.toFixed(1)}\n\n`;
  
  instructions += `When reporting your calculation in scoreCalculation, use this format:\n`;
  instructions += `"(score1 × decimal_weight1) + (score2 × decimal_weight2) + ... = result"\n`;
  instructions += `Example: "(70 × 0.40) + (75 × 0.30) + (80 × 0.30) = 74.5"\n\n`;

  // Special case for extreme weights
  const hasExtremeWeight = preferences.criteria.some(c => c.weight === 100);
  if (hasExtremeWeight) {
    const dominantCriterion = preferences.criteria.find(c => c.weight === 100);
    instructions += `⚠️ **SPECIAL CASE DETECTED:**\n`;
    instructions += `${dominantCriterion?.name} has 100% weight!\n`;
    instructions += `This means: overallScore = ${mapCriteriaToScoreField(dominantCriterion!.name)} (exactly)\n`;
    instructions += `All other scores are informational only and DO NOT affect the overall score.\n\n`;
  }

  const zeroWeights = preferences.criteria.filter(c => c.weight === 0);
  if (zeroWeights.length > 0) {
    instructions += `⚠️ **NOTE:** The following criteria have 0% weight:\n`;
    zeroWeights.forEach(c => {
      instructions += `• ${c.name} - Evaluate this for completeness, but it has ZERO impact on overallScore\n`;
    });
    instructions += `\n`;
  }

  instructions += `**═══════════════════════════════════════════════════════════**\n`;
  instructions += `**MANDATORY REQUIREMENTS - NO EXCEPTIONS**\n`;
  instructions += `**═══════════════════════════════════════════════════════════**\n\n`;
  instructions += `1. ✓ Use the EXACT formula above to calculate overallScore\n`;
  instructions += `2. ✓ Show your calculation in the "scoreCalculation" field\n`;
  instructions += `3. ✓ Round the final overallScore to 1 decimal place\n`;
  instructions += `4. ✓ If a weight is 0%, that score has ZERO impact\n`;
  instructions += `5. ✓ If a weight is 100%, overallScore = that section's score exactly\n`;
  instructions += `6. ✓ Double-check your math before responding\n\n`;

    return instructions;
  } else {
    // NEW FORMAT - Handle object with dealbreakers, patterns, context_weights, thesis_alignment
    const newCriteria = criteria as any; // Type cast since this is the new format
    
    let instructions = `**═══════════════════════════════════════════════════════════**\n`;
    instructions += `**VC ADVANCED EVALUATION CRITERIA ACTIVE**\n`;
    instructions += `**═══════════════════════════════════════════════════════════**\n\n`;
    
    // Handle dealbreakers
    if (newCriteria.dealbreakers && Array.isArray(newCriteria.dealbreakers) && newCriteria.dealbreakers.length > 0) {
      instructions += `⚠️ **DEALBREAKERS (Auto-reject if found):**\n`;
      newCriteria.dealbreakers.forEach((db: any) => {
        instructions += `   - ${db.criterion}: ${db.description}\n`;
      });
      instructions += `\n`;
    }
    
    // Handle patterns
    if (newCriteria.patterns && Array.isArray(newCriteria.patterns) && newCriteria.patterns.length > 0) {
      instructions += `🎯 **POSITIVE PATTERNS TO LOOK FOR:**\n`;
      newCriteria.patterns.forEach((pattern: any) => {
        instructions += `   - ${pattern.pattern}: ${pattern.description}\n`;
      });
      instructions += `\n`;
    }
    
    // Handle thesis alignment
    if (newCriteria.thesis_alignment) {
      instructions += `🎯 **INVESTMENT THESIS:**\n${newCriteria.thesis_alignment}\n\n`;
    }
    
    // Handle context weights if available
    if (newCriteria.context_weights && typeof newCriteria.context_weights === 'object') {
      instructions += `⚠️ **CUSTOM WEIGHTS:**\n`;
      for (const [key, value] of Object.entries(newCriteria.context_weights)) {
        if (typeof value === 'number') {
          instructions += `   - ${key}: ${value}%\n`;
        }
      }
      instructions += `\n`;
    }
    
    instructions += `Use these criteria to guide your evaluation and highlight any matches or concerns.\n\n`;
    
    return instructions;
  }
}

// Helper function to map criteria names to score field names
function mapCriteriaToScoreField(criteriaName: string): string {
  const name = criteriaName.toLowerCase();
  if (name.includes('team')) return 'teamScore';
  if (name.includes('market')) return 'marketScore';
  if (name.includes('product') || name.includes('technology')) {
    // Product & Technology encompasses problem, solution, and traction
    return 'productScore';
  }
  if (name.includes('traction') || name.includes('metric')) return 'tractionScore';
  if (name.includes('financial') || name.includes('finance')) return 'financialsScore';
  return criteriaName.toLowerCase().replace(/\s+/g, '') + 'Score';
}

// Function to validate and correct overall score based on VC preferences
function validateAndCorrectScore(analysis: AnalysisResult, preferences?: VCPreferences): void {
  if (!preferences || !preferences.criteria) {
    console.log('ℹ️ No VC preferences - keeping AI calculated score');
    return;
  }

  const criteria = preferences.criteria;
  
  // Check if using new format (object) or old format (array)
  if (!Array.isArray(criteria)) {
    // New format - no validation needed yet
    console.log('ℹ️ Using new VC preferences format - keeping AI calculated score');
    return;
  }
  
  if (criteria.length === 0) {
    console.log('ℹ️ No VC preferences - keeping AI calculated score');
    return;
  }

  // Calculate the correct weighted score
  let calculatedScore = 0;
  const scoreMap: { [key: string]: number } = {
    'teamScore': analysis.teamScore,
    'marketScore': analysis.marketScore,
    'productScore': (analysis.problemScore + analysis.solutionScore) / 2, // Average of problem + solution
    'tractionScore': analysis.tractionScore,
    'financialsScore': analysis.financialsScore,
  };

  console.log('📊 Score mapping for validation:');
  console.log('   teamScore:', analysis.teamScore);
  console.log('   marketScore:', analysis.marketScore);
  console.log('   productScore (problem+solution avg):', scoreMap['productScore']);
  console.log('   tractionScore:', analysis.tractionScore);
  console.log('   financialsScore:', analysis.financialsScore);

  criteria.forEach(criterion => {
    const field = mapCriteriaToScoreField(criterion.name);
    const score = scoreMap[field];
    const weight = criterion.weight / 100;
    
    if (score !== undefined) {
      calculatedScore += score * weight;
      console.log(`📊 ${criterion.name}: ${score} × ${weight} = ${(score * weight).toFixed(2)}`);
    }
  });

  const aiScore = analysis.overallScore;
  const difference = Math.abs(aiScore - calculatedScore);
  
  console.log(`\n🔍 Score Validation:`);
  console.log(`   AI calculated: ${aiScore}`);
  console.log(`   Should be: ${calculatedScore.toFixed(1)}`);
  console.log(`   Difference: ${difference.toFixed(1)}`);

  // If difference is significant (>2 points), correct it
  if (difference > 2) {
    console.log(`⚠️ Correcting score from ${aiScore} to ${calculatedScore.toFixed(1)}`);
    analysis.overallScore = Math.round(calculatedScore * 10) / 10; // Round to 1 decimal
    
    // Add a note to the analysis
    if (!analysis.keyInsights) analysis.keyInsights = [];
    analysis.keyInsights.unshift(
      `Note: Overall score corrected to reflect custom VC weights (${calculatedScore.toFixed(1)}) based on weighted formula.`
    );
  } else {
    console.log(`✓ Score is within acceptable range`);
  }
}

// Extract text from PDF
export async function extractTextFromPDF(pdfPath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Extract text from Word document (.docx)
export async function extractTextFromWord(docxPath: string): Promise<string> {
  try {
    const buffer = fs.readFileSync(docxPath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from Word document:', error);
    throw new Error('Failed to extract text from Word document');
  }
}

// Extract text from PowerPoint (.ppt, .pptx)
export async function extractTextFromPowerPoint(pptPath: string): Promise<string> {
  try {
    console.log(`📊 Extracting text from PowerPoint: ${path.basename(pptPath)}`);
    
    // Parse PowerPoint to JSON
    const slides = await pptx2json(pptPath);
    
    let extractedText = '';
    
    // Extract text from each slide
    if (Array.isArray(slides)) {
      slides.forEach((slide: any, index: number) => {
        extractedText += `\n\n--- SLIDE ${index + 1} ---\n`;
        
        // Extract text from shapes
        if (slide.shapes && Array.isArray(slide.shapes)) {
          slide.shapes.forEach((shape: any) => {
            if (shape.text) {
              extractedText += shape.text + '\n';
            }
          });
        }
        
        // Extract text from content
        if (slide.content) {
          extractedText += slide.content + '\n';
        }
      });
    }
    
    if (!extractedText.trim()) {
      throw new Error('No text content found in PowerPoint file');
    }
    
    console.log(`✅ Extracted ${extractedText.length} characters from PowerPoint`);
    return extractedText;
  } catch (error: any) {
    console.error('Error extracting text from PowerPoint:', error);
    throw new Error(`Failed to extract text from PowerPoint: ${error.message}`);
  }
}

// Universal text extractor - handles PDF, Word, and PowerPoint documents
export async function extractTextFromDocument(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    return extractTextFromPDF(filePath);
  } else if (ext === '.docx' || ext === '.doc') {
    return extractTextFromWord(filePath);
  } else if (ext === '.ppt' || ext === '.pptx') {
    return extractTextFromPowerPoint(filePath);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

// Analyze PDF images using Gemini Vision (for pitch decks with graphs/charts)
export async function analyzePDFImages(pdfPath: string): Promise<string> {
  try {
    // Use dynamically selected Gemini model
    const modelName = getActiveGeminiModel();
    const model = genAI.getGenerativeModel({ model: modelName });

    // Read PDF as base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    const prompt = `You are analyzing a startup pitch deck PDF. This document likely contains:
- Charts showing growth metrics, revenue projections, market size
- Graphs displaying user acquisition, retention curves
- Infographics about the product, business model, or competitive landscape
- Team photos and organizational charts
- Financial projections and unit economics

Please analyze ALL visual elements (charts, graphs, images, diagrams) in this PDF and provide:

1. **Key Metrics from Charts/Graphs**: Extract specific numbers, trends, growth rates
2. **Market Size Visual Analysis**: Any TAM/SAM/SOM charts or market opportunity graphics
3. **Traction Indicators**: Growth curves, user metrics, revenue trends visible in charts
4. **Business Model Clarity**: Visual representation of how the company makes money
5. **Financial Projections**: Revenue forecasts, burn rate, runway from financial charts
6. **Team Composition**: Insights from team slides or organizational structure
7. **Product Visuals**: Screenshots, mockups, architecture diagrams that show product maturity
8. **Competitive Positioning**: Any competitive matrix or positioning charts

For each visual insight, provide:
- What the chart/image shows
- Specific numbers or trends you can identify
- Investment implications (positive or concerning)

Format as a detailed analysis focusing on QUANTITATIVE data from visuals.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBase64,
          mimeType: 'application/pdf',
        },
      },
      prompt,
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing PDF images:', error);
    return 'Visual analysis unavailable - text analysis will be used instead.';
  }
}

// Parse checklist PDF to extract structured items
export async function parseChecklist(checklistText: string): Promise<ChecklistItem[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are parsing a founder checklist document. This document typically contains:
- Unit economics requirements (CAC, LTV, LTV/CAC ratio, payback period)
- Current growth metrics (MRR, ARR, user growth rate, retention rate)
- Payment/financial information (bank details, revenue breakdown, burn rate)
- External links to supporting documents
- Compliance requirements
- Fundraising milestones

Parse this checklist and extract all items mentioned. For each item:
- Identify what metric/document is required
- Note any specific thresholds or criteria mentioned
- Extract any URLs or external links
- Categorize as: unit_economics, growth_metrics, payment_info, compliance, or other

CHECKLIST CONTENT:
${checklistText}

Return a JSON array with this format:
[
  {
    "category": "unit_economics" | "growth_metrics" | "payment_info" | "compliance" | "other",
    "item": "Name of required item",
    "description": "What is needed",
    "threshold": "Any specific criteria or numbers mentioned",
    "externalLink": "URL if present, otherwise null",
    "priority": "critical" | "important" | "nice-to-have"
  }
]

Be thorough - extract ALL requirements mentioned in the checklist.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Error parsing checklist:', error);
    return [];
  }
}

// Main comprehensive analysis function
export async function analyzeDualPDFs(
  deckPath: string,
  checklistPath: string,
  companyName: string = 'the company',
  vcPreferences?: VCPreferences,
  additionalDocsText?: string | null
): Promise<{
  analysis: AnalysisResult;
  sections: SectionAnalysis[];
  checklistItems: ChecklistItem[];
  vcPreferencesUsed?: VCPreferences;
}> {
  try {
    console.log(`🚀 Starting PARALLEL dual PDF analysis for ${companyName}...`);
    const startTime = Date.now();

    // Compute file hashes for caching
    let deckHash = '';
    let checklistHash = '';
    try {
      const deckBuf = fs.readFileSync(deckPath);
      deckHash = crypto.createHash('sha256').update(deckBuf).digest('hex');
    } catch (e) {
      console.warn('Could not hash deck file for caching:', String(e));
    }
    try {
      const checklistBuf = fs.readFileSync(checklistPath);
      checklistHash = crypto.createHash('sha256').update(checklistBuf).digest('hex');
    } catch (e) {
      console.warn('Could not hash checklist file for caching:', String(e));
    }

    const analysisCacheKey = `analysis:${deckHash}:${checklistHash}`;
    // Try returning full analysis from cache
    const cachedAnalysis = await getCache<any>(analysisCacheKey);
    if (cachedAnalysis) {
      console.log('🗄️  Full analysis cache HIT — returning cached result');
      return cachedAnalysis;
    }

    // ⚡ OPTIMIZATION: Parallel data extraction (with caching for extracted results)
    console.log('📥 Extracting data in parallel (with cache)...');
    const extractedDeckKey = `extracted:${deckHash}`;
    const extractedChecklistKey = `extracted_checklist:${checklistHash}`;

    const deckExtractionPromise = wrapCache(extractedDeckKey, 86400, async () => {
      const text = await extractTextFromDocument(deckPath);
      const visuals = await analyzePDFImages(deckPath);
      return { text, visuals };
    }).catch(err => {
      console.error('Error during cached deck extraction:', err);
      return { text: '', visuals: [] };
    });

    const checklistExtractionPromise = wrapCache(extractedChecklistKey, 86400, async () => {
      const text = await extractTextFromDocument(checklistPath);
      return { text };
    }).catch(err => {
      console.error('Error during cached checklist extraction:', err);
      return { text: '' };
    });

    const [deckExtraction, checklistExtraction] = await Promise.all([
      deckExtractionPromise,
      checklistExtractionPromise
    ]);

    let deckText = deckExtraction?.text || '';
    const visualAnalysis = deckExtraction?.visuals || [];
    const checklistText = checklistExtraction?.text || '';

    // Append additional documents text if present
    if (additionalDocsText) {
      deckText += `\n\n=== SUPPORTING DOCUMENTS ===\n`;
      deckText += `Additional documents provided for validation and context:\n`;
      deckText += additionalDocsText;
      console.log(`📎 Added additional documents to analysis (+${additionalDocsText.length} chars)`);
    }

    console.log(`✅ Parallel extraction complete in ${Date.now() - startTime}ms`);

    if (!deckText || deckText.length < 100) {
      throw new Error('Insufficient text content extracted from pitch deck');
    }

    // ⚡ OPTIMIZATION: Parse checklist in parallel with AI model setup
    console.log('📋 Parsing checklist...');
    const checklistPromise = parseChecklist(checklistText);

    // ⚡ OPTIMIZATION: Get checklist items (was started in parallel earlier)
    const checklistItems = await checklistPromise;

    // Step 4: Comprehensive analysis using Gemini 2.5 Flash
    console.log('🤖 Performing comprehensive AI analysis...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const weightedInstructions = buildWeightedEvaluationInstructions(vcPreferences);

    // 📝 LOG: Verify weighted instructions are included
    console.log('\n' + '='.repeat(80));
    console.log('🎯 DUAL PDF ANALYSIS - WEIGHTED PROMPT VERIFICATION');
    console.log('='.repeat(80));
    console.log('📊 VC Preferences:', vcPreferences ? 'Custom weights provided' : 'None (using defaults)');
    console.log('📝 Weighted Instructions Length:', weightedInstructions.length, 'characters');
    console.log('🔍 Formula Check:', weightedInstructions.includes('overallScore =') ? '✅ FOUND' : '❌ MISSING');
    console.log('-'.repeat(80));
    console.log('📜 WEIGHTED INSTRUCTIONS PREVIEW (first 800 chars):');
    console.log(weightedInstructions.substring(0, 800));
    console.log('='.repeat(80) + '\n');

    const comprehensivePrompt = `You are a senior VC partner making an investment decision. You have received:

1. **PITCH DECK TEXT**:
${deckText}

2. **VISUAL ANALYSIS FROM PITCH DECK** (charts, graphs, metrics):
${visualAnalysis}

3. **FOUNDER CHECKLIST REQUIREMENTS**:
${checklistText}

4. **PARSED CHECKLIST ITEMS** (${checklistItems.length} requirements identified):
${JSON.stringify(checklistItems, null, 2)}

${weightedInstructions}

Your task: Perform a comprehensive due diligence analysis by:
- Analyzing the pitch deck content (text + visual data)
- Verifying each checklist requirement against the pitch deck
- Cross-referencing claims in the deck with checklist evidence
- Identifying gaps, red flags, and strong signals
- **CRITICAL: Calculate the overall score using the EXACT weighted formula specified above**
- **EXTRACT ALL QUANTITATIVE METRICS** from the deck (revenue, growth rate, CAC, LTV, burn rate, etc.) in structured format for benchmarking

⚠️ METRICS EXTRACTION REQUIREMENTS:
- Search the ENTIRE deck text and visual analysis for ALL numeric metrics
- Extract exact values (e.g., "$2.5M ARR", "180% YoY growth", "CAC of $250")
- If a metric is mentioned as a range, use the midpoint or most conservative estimate
- Convert all monetary values to raw numbers (e.g., "$2.5M" → 2500000)
- Mark metrics as null if not found - do NOT make up numbers
- For sector-specific metrics, identify relevant KPIs based on the company's industry

⚠️ BEFORE YOU RESPOND: Verify your overallScore calculation matches the weighted formula!

Provide your analysis in JSON format:

{
  "overallAnalysis": {
    "problemScore": <0-100, how well they articulate the problem>,
    "solutionScore": <0-100, product/service clarity and differentiation>,
    "marketScore": <0-100, TAM/SAM/SOM analysis, market opportunity>,
    "tractionScore": <0-100, based on visual metrics AND checklist verification>,
    "teamScore": <0-100, founder backgrounds and expertise>,
    "financialsScore": <0-100, unit economics, growth, burn rate from checklist>,
    "overallScore": <0-100, MANDATORY: Use ONLY the weighted formula above. Do NOT use default 15/15/15/15/15/25 weights!>,
    "scoreCalculation": "<MANDATORY: Show exact calculation with DECIMAL weights from formula above, e.g., '(teamScore × 0.40) + (marketScore × 0.30) + ... = 76.5'>",
    "strengths": ["List 3-5 key strengths with specific evidence from deck or checklist"],
    "weaknesses": ["List 3-5 concerns or gaps"],
    "keyInsights": ["List 3-5 critical observations that would inform investment decision"],
    "recommendation": "INVEST | PASS | NEEDS_MORE_INFO - with brief justification",
    "checklistVerification": {
      "unitEconomicsComplete": <true/false, based on checklist items found>,
      "growthMetricsComplete": <true/false>,
      "paymentInfoComplete": <true/false>,
      "foundationalChecklistScore": <0-100, percentage of checklist items verified in deck>,
      "missingItems": ["List checklist requirements NOT found in pitch deck"],
      "verifiedItems": ["List checklist requirements confirmed in pitch deck"]
    },
    "visualInsights": ["List 3-5 key takeaways from charts, graphs, financial projections"],
    "extractedMetrics": {
      "common": {
        "revenue": { "value": <number>, "unit": "USD", "period": "ARR|MRR|annual" } OR null,
        "growth_rate": { "value": <number>, "unit": "percent", "period": "YoY|MoM" } OR null,
        "cac": { "value": <number>, "unit": "USD" } OR null,
        "ltv": { "value": <number>, "unit": "USD" } OR null,
        "ltv_cac_ratio": { "value": <number>, "unit": "ratio" } OR null,
        "burn_rate": { "value": <number>, "unit": "USD", "period": "monthly" } OR null,
        "runway": { "value": <number>, "unit": "months" } OR null,
        "gross_margin": { "value": <number>, "unit": "percent" } OR null,
        "employees": { "value": <number>, "unit": "count" } OR null,
        "funding_raised": { "value": <number>, "unit": "USD" } OR null
      },
      "sector_specific": {
        "Add any sector-specific metrics you find (e.g., for AI: model_accuracy, dataset_size, api_calls; for SaaS: churn_rate, net_revenue_retention, mrr_growth)"
      }
    }
  },
  "sections": [
    {
      "sectionName": "Problem & Solution",
      "sectionScore": <0-100>,
      "feedback": "Detailed evaluation with evidence from deck and visuals",
      "strengths": ["2-3 specific strengths"],
      "improvements": ["2-3 specific gaps or areas to strengthen"]
    },
    {
      "sectionName": "Market Opportunity",
      "sectionScore": <0-100>,
      "feedback": "Market size, competitive landscape, GTM strategy",
      "strengths": ["2-3 specific strengths"],
      "improvements": ["2-3 specific gaps"]
    },
    {
      "sectionName": "Traction & Growth",
      "sectionScore": <0-100>,
      "feedback": "User/revenue metrics from visuals AND checklist verification",
      "strengths": ["2-3 specific strengths"],
      "improvements": ["2-3 specific gaps"]
    },
    {
      "sectionName": "Business Model & Unit Economics",
      "sectionScore": <0-100>,
      "feedback": "Based on checklist items: CAC, LTV, margins, etc.",
      "strengths": ["2-3 specific strengths"],
      "improvements": ["2-3 specific gaps"]
    },
    {
      "sectionName": "Team & Execution",
      "sectionScore": <0-100>,
      "feedback": "Founder backgrounds, advisors, hiring plans",
      "strengths": ["2-3 specific strengths"],
      "improvements": ["2-3 specific gaps"]
    },
    {
      "sectionName": "Financials & Use of Funds",
      "sectionScore": <0-100>,
      "feedback": "Based on financial projections, burn rate, runway from visuals and checklist",
      "strengths": ["2-3 specific strengths"],
      "improvements": ["2-3 specific gaps"]
    }
  ]
}

**CRITICAL REQUIREMENTS**: 
- Cross-reference the pitch deck with checklist requirements
- Call out any discrepancies or missing checklist items
- Use visual data (metrics from charts) to validate claims
- Be specific with numbers and evidence
- **MANDATORY: Use the weighted scoring formula provided in the custom weights section**
- **MANDATORY: Show your score calculation in the scoreCalculation field**
- If a criterion has 0% weight, evaluate it but ensure it has minimal/no impact on overall score
- Your analysis will directly inform a multi-million dollar investment decision

**IMPORTANT**: Return ONLY valid JSON, no markdown, no code blocks, no extra text. Start with { and end with }. Ensure overallScore matches your weighted calculation.`;

    const result = await model.generateContent(comprehensivePrompt);
    const response = await result.response;
    let text = response.text();

    console.log('Parsing AI response...');
    
    // AGGRESSIVE cleanup - remove ALL non-JSON content
    // Step 1: Remove markdown code blocks
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Step 2: Remove any text before first { and after last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }
    
    // Step 3: Log what we're about to parse (for debugging)
    console.log('Cleaned text length:', text.length);
    console.log('First 300 chars:', text.substring(0, 300));
    console.log('Last 300 chars:', text.substring(text.length - 300));
    
    // Step 4: Try to parse
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError: any) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Problematic text around position:', text.substring(Math.max(0, parseError.position - 100), parseError.position + 100));
      
      // Try more aggressive cleaning
      // Remove comments (both // and /* */)
      text = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
      
      // Remove any $ symbols (could be from variables or markdown)
      text = text.replace(/\$/g, '');
      
      // Try parsing again
      try {
        parsedResponse = JSON.parse(text);
        console.log('✓ Successfully parsed after aggressive cleaning');
      } catch (secondError) {
        console.error('Still failed after aggressive cleaning');
        console.error('Full response (first 1000 chars):', text.substring(0, 1000));
        throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
      }
    }

    // Validate required fields
    if (!parsedResponse.overallAnalysis || !parsedResponse.sections) {
      throw new Error('Invalid AI response structure');
    }

    // Validate and correct the overall score based on VC preferences
    console.log('🔍 Validating score with preferences:', vcPreferences ? 'YES' : 'NO');
    if (vcPreferences) {
      console.log('   Criteria count:', vcPreferences.criteria?.length || 0);
    }
    validateAndCorrectScore(parsedResponse.overallAnalysis, vcPreferences);

    console.log('Analysis complete!');

    // Cache full analysis for 7 days (604800 seconds)
    try {
      const resultToCache = {
        analysis: parsedResponse.overallAnalysis,
        sections: parsedResponse.sections,
        checklistItems: checklistItems,
        vcPreferencesUsed: vcPreferences,
      };
      if (analysisCacheKey) {
        await setCache(analysisCacheKey, resultToCache, 604800);
        console.log('🗄️  Stored full analysis in cache:', analysisCacheKey);
      }
    } catch (e) {
      console.warn('Failed to cache analysis result:', String(e));
    }

    return {
      analysis: parsedResponse.overallAnalysis,
      sections: parsedResponse.sections,
      checklistItems: checklistItems,
      vcPreferencesUsed: vcPreferences,
    };
  } catch (error) {
    console.error('Error in dual PDF analysis:', error);
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Backward compatibility: single PDF analysis
export async function analyzePitchDeckFromPDF(
  pdfPath: string, 
  companyName: string = 'the company',
  vcPreferences?: VCPreferences,
  additionalDocsText?: string | null
): Promise<{
  analysis: AnalysisResult;
  sections: SectionAnalysis[];
  vcPreferencesUsed?: VCPreferences;
}> {
  try {
    let text = await extractTextFromPDF(pdfPath);
    
    if (!text || text.length < 100) {
      throw new Error('Insufficient text content extracted from PDF');
    }

    // Append additional documents text if present
    if (additionalDocsText) {
      text += `\n\n=== SUPPORTING DOCUMENTS ===\n`;
      text += `Additional documents provided for validation and context:\n`;
      text += additionalDocsText;
      console.log(`📎 Added additional documents to single deck analysis (+${additionalDocsText.length} chars)`);
    }

    // Single PDF analysis - create a minimal checklist verification
    const visualAnalysis = await analyzePDFImages(pdfPath);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const weightedInstructions = buildWeightedEvaluationInstructions(vcPreferences);
    
    const prompt = `Analyze this pitch deck for ${companyName}.

DECK TEXT: ${text}

VISUAL ANALYSIS: ${visualAnalysis}

${weightedInstructions}

⚠️ CRITICAL REMINDER: The weighted formula above is MANDATORY. Do NOT use default equal weights!

Provide analysis in JSON format with overallAnalysis and sections arrays. 

**SCORING REQUIREMENTS**: 
- Calculate overallScore using ONLY the weighted formula specified above with DECIMAL weights
- If the formula says (teamScore × 0.40) + (marketScore × 0.60), use those EXACT decimals
- Do NOT use 0.15, 0.15, 0.15, 0.15, 0.15, 0.25 unless those are the specified weights
- Include "scoreCalculation" field showing your calculation with decimal weights
- Example: If Team=100%, Market=0%, and teamScore=85, then overallScore must be 85

**JSON FORMATTING REQUIREMENTS**:
- Return ONLY valid JSON - no markdown, no code blocks, no explanatory text
- Use double quotes for all strings
- Escape special characters properly (use \\\\ for backslash, \\" for quotes)
- No trailing commas
- No line breaks within string values

Return valid JSON only, no markdown.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text_response = response.text();
    
    console.log('🔍 Raw AI response (first 500 chars):', text_response.substring(0, 500));
    
    const jsonMatch = text_response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response - no JSON found');
    }

    let parsed;
    try {
      // Clean the JSON string before parsing
      let jsonString = jsonMatch[0];
      
      // Remove any markdown code blocks
      jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Fix common JSON issues
      jsonString = jsonString
        .replace(/\\/g, '\\\\') // Escape backslashes first
        .replace(/\\\\"/g, '\\"') // Fix over-escaped quotes
        .replace(/\\\\n/g, '\\n') // Fix over-escaped newlines
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/[\r\n\t]/g, ' ') // Replace special chars with spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Try to fix bad escape sequences
      jsonString = jsonString.replace(/\\([^"\\\/bfnrtu])/g, '\\\\$1');
      
      console.log('🧹 Cleaned JSON (first 500 chars):', jsonString.substring(0, 500));
      
      parsed = JSON.parse(jsonString);
    } catch (parseError: any) {
      console.error('❌ JSON parsing failed in analyzePitchDeckFromPDF:', parseError.message);
      console.error('📄 Problematic JSON:', jsonMatch[0].substring(0, 1000));
      
      // Provide a minimal fallback analysis
      parsed = {
        overallAnalysis: {
          overallScore: 50,
          strengths: ['Analysis completed but encountered formatting issues'],
          weaknesses: ['Unable to parse detailed analysis'],
          keyInsights: ['Please retry analysis or check deck format'],
          recommendation: 'Analysis encountered technical issues. Please retry or upload a different format.'
        },
        sections: []
      };
      
      console.log('⚠️ Using fallback analysis structure');
    }
    
    // Validate and correct the overall score based on VC preferences
    if (parsed.overallAnalysis) {
      validateAndCorrectScore(parsed.overallAnalysis, vcPreferences);
    }
    
    return {
      analysis: parsed.overallAnalysis,
      sections: parsed.sections,
      vcPreferencesUsed: vcPreferences,
    };
  } catch (error) {
    console.error('Error in single PDF analysis:', error);
    throw error;
  }
}

// 🌐 NEW: ENHANCED ANALYSIS WITH VERTEX AI + GROUNDING
/**
 * Analyzes pitch deck using Vertex AI with Google Search Grounding
 * for web-validated metrics, competitor research, and fact-checking.
 * 
 * @param deckPath - Path to pitch deck PDF
 * @param checklistPath - Path to checklist document (optional)
 * @param companyName - Name of the company
 * @param industry - Industry vertical (for targeted web searches)
 * @param additionalContext - Optional VC context from notes/meetings
 * @param vcPreferences - Optional VC evaluation criteria weights
 * @returns Combined analysis with PDF + web sources, fact-checks, and citations
 */
export async function analyzePitchDeckWithGrounding(
  deckPath: string,
  checklistPath: string | null,
  companyName: string,
  industry: string,
  additionalContext?: any,
  vcPreferences?: VCPreferences,
  additionalDocsText?: string | null
): Promise<{
  analysis: AnalysisResult;
  sections: SectionAnalysis[];
  checklistItems: ChecklistItem[];
  webEnrichment: {
    validatedMetrics: any;
    additionalCompetitors: any[];
    industryBenchmarks: any;
    factChecks: any;
    dataSources: any;
    confidence: any;
  };
  groundingMetadata?: {
    webSearchQueries: string[];
    webSources: any[];
  };
  vcPreferencesUsed?: VCPreferences;
}> {
  try {
    console.log(`🌐 [Enhanced Analysis] Starting with Grounding for ${companyName} (${industry})...`);
    
    if (additionalContext) {
      console.log(`📝 [Additional Context] Using VC context:`, {
        companyName: additionalContext.companyName,
        documents: additionalContext.itemCount,
        hasExecutiveSummary: !!additionalContext.summary?.executiveSummary
      });
    }

    // Step 1: Extract text from deck
    console.log('📄 Extracting text from pitch deck...');
    const deckText = await extractTextFromDocument(deckPath);
    
    if (!deckText || deckText.length < 100) {
      throw new Error('Insufficient text content extracted from pitch deck');
    }
    
    // Build enriched text with additional documents first, then VC context
    let enrichedDeckText = deckText;
    
    // Append additional supporting documents if present
    if (additionalDocsText) {
      enrichedDeckText += `\n\n=== SUPPORTING DOCUMENTS ===\n`;
      enrichedDeckText += `The following additional documents provide supporting evidence and validation:\n`;
      enrichedDeckText += `(Financial audits, market research, memos, technical documentation)\n`;
      enrichedDeckText += additionalDocsText;
      console.log(`📎 Enhanced with additional documents (+${additionalDocsText.length} characters)`);
    }
    
    // Append VC context to deck text for enhanced analysis
    if (additionalContext?.summary?.executiveSummary) {
      enrichedDeckText += `\n\n=== ADDITIONAL VC CONTEXT ===\n`;
      enrichedDeckText += `Based on ${additionalContext.itemCount} documents (meeting notes, emails, etc.):\n\n`;
      enrichedDeckText += `${additionalContext.summary.executiveSummary}\n`;
      
      if (additionalContext.summary.keyInsights?.length > 0) {
        enrichedDeckText += `\nKey Insights from VC Interactions:\n`;
        additionalContext.summary.keyInsights.forEach((insight: string, idx: number) => {
          enrichedDeckText += `${idx + 1}. ${insight}\n`;
        });
      }
      
      console.log(`✨ Enhanced deck text with VC context (+${additionalContext.itemCount} documents)`);
    }

    // Step 2: Extract metrics from PDF
    console.log('📊 Extracting metrics from PDF...');
    const pdfMetrics = extractMetricsFromText(enrichedDeckText);

    // Step 3: Run standard analysis (existing logic) with VC preferences and additional docs
    console.log('🔍 Running standard PDF analysis...');
    let standardAnalysis;
    if (checklistPath) {
      standardAnalysis = await analyzeDualPDFs(deckPath, checklistPath, companyName, vcPreferences, additionalDocsText);
    } else {
      standardAnalysis = await analyzePitchDeckFromPDF(deckPath, companyName, vcPreferences, additionalDocsText);
    }

    // Step 4: Enrich with web search (Vertex AI + Grounding)
    console.log('🌐 Enriching with web search and grounding...');
    const webEnrichment = await enrichWithWebSearch(
      pdfMetrics,
      industry,
      companyName,
      enrichedDeckText // Use enriched text with VC context
    );

    console.log(`✅ Web enrichment complete:`);
    console.log(`   Sources found: ${webEnrichment.sources.length}`);
    console.log(`   Discrepancies: ${webEnrichment.discrepancies.length}`);

    // Step 5: Merge PDF + Web data
    console.log('🔄 Merging PDF and web data...');
    const pdfAnalysis = {
      summary: standardAnalysis.analysis.keyInsights?.join('. ') || 'Analysis complete',
      strengths: standardAnalysis.analysis.strengths || [],
      weaknesses: standardAnalysis.analysis.weaknesses || [],
      opportunities: [],
      threats: [],
      competitiveAdvantage: 'See analysis',
      marketOpportunity: {
        tam: pdfMetrics.tam,
        sam: pdfMetrics.sam,
        som: pdfMetrics.som,
      },
      team: {},
      financials: {
        revenue: pdfMetrics.revenue,
        mrr: pdfMetrics.mrr,
        arr: pdfMetrics.arr,
        cac: pdfMetrics.cac,
        ltv: pdfMetrics.ltv,
      },
      product: {},
      traction: {
        users: pdfMetrics.users,
      },
      scores: {
        overall: standardAnalysis.analysis.overallScore,
        problem: standardAnalysis.analysis.problemScore,
        solution: standardAnalysis.analysis.solutionScore,
        market: standardAnalysis.analysis.marketScore,
        team: standardAnalysis.analysis.teamScore,
        traction: standardAnalysis.analysis.tractionScore,
        financials: standardAnalysis.analysis.financialsScore,
      },
    };

    const combined = await mergeSourcesAndValidate(pdfAnalysis, webEnrichment);

    console.log('✅ [Enhanced Analysis] Complete with Grounding!');
    console.log(`   Overall confidence: ${combined.confidence.overall}`);
    console.log(`   Verified claims: ${combined.factChecks.verified.length}`);
    console.log(`   Discrepancies: ${combined.factChecks.discrepancies.length}`);

    // Return enhanced analysis with web enrichment
    return {
      analysis: standardAnalysis.analysis,
      sections: standardAnalysis.sections,
      checklistItems: 'checklistItems' in standardAnalysis ? (standardAnalysis.checklistItems as ChecklistItem[]) : [],
      webEnrichment: {
        validatedMetrics: combined.webEnrichment.validatedMetrics,
        additionalCompetitors: combined.webEnrichment.additionalCompetitors,
        industryBenchmarks: combined.webEnrichment.industryBenchmarks,
        factChecks: combined.factChecks,
        dataSources: combined.dataSourceBreakdown,
        confidence: combined.confidence,
      },
      groundingMetadata: {
        webSearchQueries: webEnrichment.enrichedMetrics.webValidation
          ? Object.keys(webEnrichment.enrichedMetrics.webValidation)
          : [],
        webSources: webEnrichment.sources,
      },
      vcPreferencesUsed: vcPreferences,
    };
  } catch (error) {
    console.error('❌ [Enhanced Analysis] Failed:', error);
    // Fallback to standard analysis if grounding fails
    console.warn('⚠️ Falling back to standard analysis without grounding...');
    
    if (checklistPath) {
      const fallback = await analyzeDualPDFs(deckPath, checklistPath, companyName, vcPreferences);
      return {
        ...fallback,
        webEnrichment: {
          validatedMetrics: {},
          additionalCompetitors: [],
          industryBenchmarks: {},
          factChecks: { verified: [], discrepancies: [], unverified: [] },
          dataSources: { fromPDF: 100, fromWeb: 0, totalMetrics: 0, discrepanciesFound: 0 },
          confidence: { overall: 'MEDIUM', reasons: ['Grounding unavailable - using PDF only'] },
        },
      };
    } else {
      const fallback = await analyzePitchDeckFromPDF(deckPath, companyName, vcPreferences);
      return {
        ...fallback,
        checklistItems: [],
        webEnrichment: {
          validatedMetrics: {},
          additionalCompetitors: [],
          industryBenchmarks: {},
          factChecks: { verified: [], discrepancies: [], unverified: [] },
          dataSources: { fromPDF: 100, fromWeb: 0, totalMetrics: 0, discrepanciesFound: 0 },
          confidence: { overall: 'MEDIUM', reasons: ['Grounding unavailable - using PDF only'] },
        },
      };
    }
  }
}

// 📊 NEW: Compare two pitch decks side-by-side
export async function comparePitchDecks(
  deck1Path: string,
  deck2Path: string
): Promise<{
  deck1Analysis: any;
  deck2Analysis: any;
  comparison: {
    summary: string;
    winnerOverall: string;
    categoryWinners: {
      team: string;
      market: string;
      product: string;
      traction: string;
      financials: string;
    };
    strengths: {
      deck1: string[];
      deck2: string[];
    };
    weaknesses: {
      deck1: string[];
      deck2: string[];
    };
    recommendations: {
      deck1: string[];
      deck2: string[];
    };
    keyDifferences: string[];
  };
}> {
  try {
    console.log('📊 Starting side-by-side deck comparison...');
    
    // Extract text from both decks
    const deck1Text = await extractTextFromDocument(deck1Path);
    const deck2Text = await extractTextFromDocument(deck2Path);
    
    if (!deck1Text || deck1Text.length < 100) {
      throw new Error('Insufficient text content extracted from first deck');
    }
    if (!deck2Text || deck2Text.length < 100) {
      throw new Error('Insufficient text content extracted from second deck');
    }

    // Analyze both decks individually first
    console.log('🔍 Analyzing Deck 1...');
    const deck1Analysis = await analyzePitchDeckFromPDF(deck1Path, 'Company 1');
    console.log('✓ Deck 1 analyzed:', {
      hasAnalysis: !!deck1Analysis.analysis,
      overallScore: deck1Analysis.analysis?.overallScore,
      hasStrengths: !!deck1Analysis.analysis?.strengths,
      strengthsCount: deck1Analysis.analysis?.strengths?.length || 0
    });
    
    console.log('🔍 Analyzing Deck 2...');
    const deck2Analysis = await analyzePitchDeckFromPDF(deck2Path, 'Company 2');
    console.log('✓ Deck 2 analyzed:', {
      hasAnalysis: !!deck2Analysis.analysis,
      overallScore: deck2Analysis.analysis?.overallScore,
      hasStrengths: !!deck2Analysis.analysis?.strengths,
      strengthsCount: deck2Analysis.analysis?.strengths?.length || 0
    });

    // Now do comparative analysis with Gemini
    console.log('⚖️ Running comparative analysis...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Safely extract data with fallbacks
    const deck1Score = deck1Analysis.analysis?.overallScore || 0;
    const deck1Strengths = deck1Analysis.analysis?.strengths || [];
    const deck1Weaknesses = deck1Analysis.analysis?.weaknesses || [];
    
    const deck2Score = deck2Analysis.analysis?.overallScore || 0;
    const deck2Strengths = deck2Analysis.analysis?.strengths || [];
    const deck2Weaknesses = deck2Analysis.analysis?.weaknesses || [];
    
    const comparisonPrompt = `You are a senior VC analyst comparing two pitch decks side-by-side.

**DECK 1 TEXT:**
${deck1Text.substring(0, 15000)}

**DECK 2 TEXT:**
${deck2Text.substring(0, 15000)}

**INDIVIDUAL ANALYSES:**

Deck 1 Overall Score: ${deck1Score}/100
Deck 1 Strengths: ${deck1Strengths.length > 0 ? deck1Strengths.join(', ') : 'Not analyzed'}
Deck 1 Weaknesses: ${deck1Weaknesses.length > 0 ? deck1Weaknesses.join(', ') : 'Not analyzed'}

Deck 2 Overall Score: ${deck2Score}/100
Deck 2 Strengths: ${deck2Strengths.length > 0 ? deck2Strengths.join(', ') : 'Not analyzed'}
Deck 2 Weaknesses: ${deck2Weaknesses.length > 0 ? deck2Weaknesses.join(', ') : 'Not analyzed'}

**YOUR TASK:**
Provide a detailed comparative analysis in JSON format with:
1. Executive summary of the comparison
2. Determine which deck is stronger overall and in each category (Team, Market, Product, Traction, Financials)
3. Comparative strengths and weaknesses for each deck
4. Actionable recommendations for improving each deck
5. Key differences between the two approaches

CRITICAL: Return ONLY valid, properly formatted JSON. No markdown, no code blocks, no explanatory text.
Use proper JSON syntax: double quotes for strings, no trailing commas, no line breaks within strings.

Return in this exact format:
{
  "summary": "2-3 sentence executive summary of the comparison",
  "winnerOverall": "deck1",
  "categoryWinners": {
    "team": "deck1",
    "market": "deck2", 
    "product": "tie",
    "traction": "deck1",
    "financials": "deck2"
  },
  "strengths": {
    "deck1": ["strength 1", "strength 2", "strength 3"],
    "deck2": ["strength 1", "strength 2", "strength 3"]
  },
  "weaknesses": {
    "deck1": ["weakness 1", "weakness 2"],
    "deck2": ["weakness 1", "weakness 2"]
  },
  "recommendations": {
    "deck1": ["recommendation 1", "recommendation 2", "recommendation 3"],
    "deck2": ["recommendation 1", "recommendation 2", "recommendation 3"]
  },
  "keyDifferences": ["difference 1", "difference 2", "difference 3", "difference 4"]
}`;

    const result = await model.generateContent(comparisonPrompt);
    const response = await result.response;
    const text_response = response.text();
    
    console.log('🔍 Raw AI response (first 500 chars):', text_response.substring(0, 500));
    
    const jsonMatch = text_response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI comparison response - no JSON found');
    }

    let comparison;
    try {
      // Clean the JSON string before parsing
      let jsonString = jsonMatch[0];
      
      // Remove any markdown code blocks
      jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Fix common JSON issues
      jsonString = jsonString
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\r/g, '') // Remove carriage returns
        .replace(/\t/g, ' ') // Replace tabs with spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      console.log('🧹 Cleaned JSON (first 500 chars):', jsonString.substring(0, 500));
      
      comparison = JSON.parse(jsonString);
    } catch (parseError: any) {
      console.error('❌ JSON parsing failed:', parseError.message);
      console.error('📄 Problematic JSON:', jsonMatch[0].substring(0, 1000));
      
      // Provide a fallback comparison structure
      comparison = {
        summary: 'Comparison analysis completed but encountered formatting issues. Please review individual deck analyses.',
        winnerOverall: 'tie',
        categoryWinners: {
          team: 'tie',
          market: 'tie',
          product: 'tie',
          traction: 'tie',
          financials: 'tie'
        },
        strengths: {
          deck1: ['Analysis available in detailed report'],
          deck2: ['Analysis available in detailed report']
        },
        weaknesses: {
          deck1: ['Please review individual analysis'],
          deck2: ['Please review individual analysis']
        },
        recommendations: {
          deck1: ['Refer to individual deck analysis for detailed recommendations'],
          deck2: ['Refer to individual deck analysis for detailed recommendations']
        },
        keyDifferences: ['Please compare individual deck analyses for detailed differences']
      };
      
      console.log('⚠️ Using fallback comparison structure');
    }
    
    console.log('✅ Comparison analysis complete');
    console.log(`   Winner: ${comparison.winnerOverall}`);
    
    return {
      deck1Analysis: {
        overallScore: deck1Analysis.analysis?.overallScore || 0,
        sections: deck1Analysis.sections || [],
        strengths: deck1Analysis.analysis?.strengths || [],
        weaknesses: deck1Analysis.analysis?.weaknesses || [],
        recommendation: deck1Analysis.analysis?.recommendation || 'No recommendation available'
      },
      deck2Analysis: {
        overallScore: deck2Analysis.analysis?.overallScore || 0,
        sections: deck2Analysis.sections || [],
        strengths: deck2Analysis.analysis?.strengths || [],
        weaknesses: deck2Analysis.analysis?.weaknesses || [],
        recommendation: deck2Analysis.analysis?.recommendation || 'No recommendation available'
      },
      comparison
    };
  } catch (error) {
    console.error('Error comparing pitch decks:', error);
    throw error;
  }
}
