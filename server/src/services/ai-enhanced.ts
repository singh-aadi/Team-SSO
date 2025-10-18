// Enhanced AI service for dual PDF analysis with vision capabilities
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

// Universal text extractor - handles both PDF and Word documents
export async function extractTextFromDocument(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    return extractTextFromPDF(filePath);
  } else if (ext === '.docx' || ext === '.doc') {
    return extractTextFromWord(filePath);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

// Analyze PDF images using Gemini Vision (for pitch decks with graphs/charts)
export async function analyzePDFImages(pdfPath: string): Promise<string> {
  try {
    // Use Gemini 2.0 Flash - latest model with vision support
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
  companyName: string = 'the company'
): Promise<{
  analysis: AnalysisResult;
  sections: SectionAnalysis[];
  checklistItems: ChecklistItem[];
}> {
  try {
    console.log(`Starting dual PDF analysis for ${companyName}...`);

    // Step 1: Extract text from both documents (PDF or Word)
    console.log('Extracting text from pitch deck...');
    const deckText = await extractTextFromDocument(deckPath);
    
    console.log('Extracting text from checklist...');
    const checklistText = await extractTextFromDocument(checklistPath);

    if (!deckText || deckText.length < 100) {
      throw new Error('Insufficient text content extracted from pitch deck');
    }

    // Step 2: Analyze visual elements from pitch deck
    console.log('Analyzing visual elements (charts, graphs, images)...');
    const visualAnalysis = await analyzePDFImages(deckPath);

    // Step 3: Parse checklist requirements
    console.log('Parsing checklist requirements...');
    const checklistItems = await parseChecklist(checklistText);

    // Step 4: Comprehensive analysis using Gemini 2.0 Flash
    console.log('Performing comprehensive investment analysis...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const comprehensivePrompt = `You are a senior VC partner making an investment decision. You have received:

1. **PITCH DECK TEXT**:
${deckText}

2. **VISUAL ANALYSIS FROM PITCH DECK** (charts, graphs, metrics):
${visualAnalysis}

3. **FOUNDER CHECKLIST REQUIREMENTS**:
${checklistText}

4. **PARSED CHECKLIST ITEMS** (${checklistItems.length} requirements identified):
${JSON.stringify(checklistItems, null, 2)}

Your task: Perform a comprehensive due diligence analysis by:
- Analyzing the pitch deck content (text + visual data)
- Verifying each checklist requirement against the pitch deck
- Cross-referencing claims in the deck with checklist evidence
- Identifying gaps, red flags, and strong signals

Provide your analysis in JSON format:

{
  "overallAnalysis": {
    "problemScore": <0-100, how well they articulate the problem>,
    "solutionScore": <0-100, product/service clarity and differentiation>,
    "marketScore": <0-100, TAM/SAM/SOM analysis, market opportunity>,
    "tractionScore": <0-100, based on visual metrics AND checklist verification>,
    "teamScore": <0-100, founder backgrounds and expertise>,
    "financialsScore": <0-100, unit economics, growth, burn rate from checklist>,
    "overallScore": <0-100, weighted average>,
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
    "visualInsights": ["List 3-5 key takeaways from charts, graphs, financial projections"]
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

**CRITICAL**: 
- Cross-reference the pitch deck with checklist requirements
- Call out any discrepancies or missing checklist items
- Use visual data (metrics from charts) to validate claims
- Be specific with numbers and evidence
- Your analysis will directly inform a multi-million dollar investment decision

**IMPORTANT**: Return ONLY valid JSON, no markdown, no code blocks, no extra text. Start with { and end with }.`;

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

    console.log('Analysis complete!');

    return {
      analysis: parsedResponse.overallAnalysis,
      sections: parsedResponse.sections,
      checklistItems: checklistItems,
    };
  } catch (error) {
    console.error('Error in dual PDF analysis:', error);
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Backward compatibility: single PDF analysis
export async function analyzePitchDeckFromPDF(pdfPath: string, companyName: string = 'the company'): Promise<{
  analysis: AnalysisResult;
  sections: SectionAnalysis[];
}> {
  try {
    const text = await extractTextFromPDF(pdfPath);
    
    if (!text || text.length < 100) {
      throw new Error('Insufficient text content extracted from PDF');
    }

    // Single PDF analysis - create a minimal checklist verification
    const visualAnalysis = await analyzePDFImages(pdfPath);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const prompt = `Analyze this pitch deck for ${companyName}.

DECK TEXT: ${text}

VISUAL ANALYSIS: ${visualAnalysis}

Provide analysis in JSON format with overallAnalysis and sections arrays.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text_response = response.text();
    
    const jsonMatch = text_response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      analysis: parsed.overallAnalysis,
      sections: parsed.sections,
    };
  } catch (error) {
    console.error('Error in single PDF analysis:', error);
    throw error;
  }
}
