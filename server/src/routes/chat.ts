import express, { Request, Response } from 'express';
import { query } from '../db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';

const router = express.Router();

// Configuration
const PROJECT_ID = 'projectsso-473108';
const LOCATION = 'us-central1';

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION
});

// POST /api/chat/query - Conversational query about pitch deck data
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Question is required' 
      });
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('💬 [VC Chat] New Query Received');
    console.log(`${'='.repeat(80)}`);
    console.log(`Question: "${question}"`);

    // Step 1: Extract company name from question using AI
    console.log('\n📝 [Step 1] Extracting company name from question...');
    const companyName = await extractCompanyName(question);
    console.log(`   Extracted company: "${companyName}"`);

    // Step 2: Search database for company data
    console.log('\n🔍 [Step 2] Searching database...');
    const companyData = await searchCompanyInDatabase(companyName);

    if (!companyData || companyData.length === 0) {
      console.log('   ❌ No data found in database');
      
      // Step 3a: Try web search as fallback
      console.log('\n🌐 [Step 3a] Searching web (fallback)...');
      const webAnswer = await searchWeb(question, companyName);
      
      if (webAnswer.found) {
        console.log('   ✅ Answer found on web');
        return res.json({
          success: true,
          answer: webAnswer.answer,
          source: 'web',
          sourceDetails: webAnswer.sources,
          companyName,
          confidence: webAnswer.confidence
        });
      } else {
        console.log('   ❌ Answer not found on web');
        return res.json({
          success: false,
          answer: null,
          errors: [
            'Answer not found in database',
            'Answer not found on web'
          ],
          companyName
        });
      }
    }

    console.log(`   ✅ Found ${companyData.length} pitch deck(s) for "${companyName}"`);

    // Step 3b: Use AI to extract answer from database data
    console.log('\n🤖 [Step 3b] Extracting answer from database data...');
    const dbAnswer = await extractAnswerFromData(question, companyName, companyData);

    if (dbAnswer.found) {
      console.log('   ✅ Answer extracted from database');
      console.log(`   Answer: "${dbAnswer.answer.substring(0, 100)}..."`);
      
      return res.json({
        success: true,
        answer: dbAnswer.answer,
        source: 'database',
        sourceDetails: {
          decks: companyData.map(d => ({
            filename: d.filename,
            analyzedAt: d.analyzed_at,
            ssoScore: d.sso_score
          })),
          dataPoints: dbAnswer.dataPoints
        },
        companyName,
        confidence: dbAnswer.confidence
      });
    } else {
      console.log('   ⚠️  Answer not found in database data');

      // Step 4: Try web search as final fallback
      console.log('\n🌐 [Step 4] Searching web (fallback)...');
      const webAnswer = await searchWeb(question, companyName);
      
      if (webAnswer.found) {
        console.log('   ✅ Answer found on web');
        return res.json({
          success: true,
          answer: webAnswer.answer,
          source: 'web',
          sourceDetails: webAnswer.sources,
          companyName,
          confidence: webAnswer.confidence,
          note: 'Answer found on web (not in uploaded pitch decks)'
        });
      } else {
        console.log('   ❌ Answer not found on web');
        return res.json({
          success: false,
          answer: null,
          errors: [
            'Answer not found in database',
            'Answer not found on web'
          ],
          companyName,
          databaseContext: `Found ${companyData.length} pitch deck(s) but the specific information was not available`
        });
      }
    }

  } catch (error: any) {
    console.error('❌ [VC Chat] Error processing query:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process query',
      details: error.message 
    });
  }
});

// Helper: Extract company name from natural language question
async function extractCompanyName(question: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Extract the company name from this question. Return ONLY the company name, nothing else.

Question: "${question}"

Examples:
- "What's the ARR of We360.ai?" → "We360.ai"
- "Tell me about Cashvisory's revenue" → "Cashvisory"
- "How many employees does Dr. Doodley have?" → "Dr. Doodley"
- "What is the burn rate for Sensesemi?" → "Sensesemi"

Company name:`;

    const result = await model.generateContent(prompt);
    const companyName = result.response.text().trim();
    
    return companyName;
  } catch (error) {
    console.error('Error extracting company name:', error);
    // Fallback: try to extract from question using regex
    const match = question.match(/\b([A-Z][a-zA-Z0-9]*(?:\.[a-z]{2,})?)\b/);
    return match ? match[1] : 'Unknown';
  }
}

// Helper: Search database for company pitch decks
async function searchCompanyInDatabase(companyName: string): Promise<any[]> {
  try {
    // Search by filename (most reliable for current data)
    const result = await query(`
      SELECT 
        pd.id,
        pd.filename,
        pd.sso_score,
        pd.analyzed_at,
        pd.created_at,
        pd.dual_pdf_analysis,
        pd.extracted_metrics,
        pd.sector,
        pd.web_enrichment,
        pd.deck_text_content
      FROM pitch_decks pd
      WHERE pd.filename ILIKE $1
        AND pd.sso_score IS NOT NULL
        AND pd.analysis_status = 'completed'
      ORDER BY pd.analyzed_at DESC
    `, [`%${companyName}%`]);

    return result.rows;
  } catch (error) {
    console.error('Database search error:', error);
    return [];
  }
}

// Helper: Extract answer from database data using AI
async function extractAnswerFromData(
  question: string, 
  companyName: string, 
  companyData: any[]
): Promise<{ found: boolean; answer: string; confidence: string; dataPoints: any[] }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Compile all available data
    const dataContext = companyData.map((deck, index) => {
      const analysis = deck.dual_pdf_analysis;
      const metrics = deck.extracted_metrics;
      
      return `
PITCH DECK ${index + 1}:
Filename: ${deck.filename}
Analyzed: ${new Date(deck.analyzed_at).toLocaleDateString()}
SSO Score: ${(parseFloat(deck.sso_score) * 100).toFixed(0)}/100
Sector: ${deck.sector || 'Not specified'}

EXTRACTED METRICS:
${metrics ? JSON.stringify(metrics, null, 2) : 'No metrics extracted'}

ANALYSIS SUMMARY:
${analysis ? JSON.stringify(analysis, null, 2) : 'No analysis available'}

DECK TEXT CONTENT (first 2000 chars):
${deck.deck_text_content ? deck.deck_text_content.substring(0, 2000) : 'No text content'}
`;
    }).join('\n' + '='.repeat(80) + '\n');

    const prompt = `You are a VC analyst assistant. A VC has asked a question about ${companyName}.

Your task:
1. Search through the provided pitch deck data
2. Find the answer to the VC's question
3. If found, provide a clear, concise answer with the specific data point
4. If NOT found, respond with exactly: "NOT_FOUND"

VC's Question: "${question}"

Available Data:
${dataContext}

Instructions:
- Look in EXTRACTED METRICS for numerical data (ARR, revenue, CAC, LTV, burn rate, etc.)
- Look in ANALYSIS SUMMARY for qualitative information
- Look in DECK TEXT CONTENT for any additional details
- Be specific and cite numbers when available
- If you find the answer, format it clearly and professionally
- If the information is not in the data, respond with exactly: "NOT_FOUND"

Answer:`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();

    if (answer === 'NOT_FOUND' || answer.includes('NOT_FOUND')) {
      return {
        found: false,
        answer: '',
        confidence: 'none',
        dataPoints: []
      };
    }

    // Extract data points that were used
    const dataPoints = [];
    if (companyData[0]?.extracted_metrics) {
      dataPoints.push({
        type: 'metrics',
        data: companyData[0].extracted_metrics
      });
    }

    return {
      found: true,
      answer,
      confidence: 'high',
      dataPoints
    };

  } catch (error) {
    console.error('Error extracting answer from data:', error);
    return {
      found: false,
      answer: '',
      confidence: 'none',
      dataPoints: []
    };
  }
}

// Helper: Search web using Vertex AI Grounding
async function searchWeb(
  question: string, 
  companyName: string
): Promise<{ found: boolean; answer: string; confidence: string; sources: any[] }> {
  try {
    const model = vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    });

    const prompt = `Answer this question about ${companyName}: "${question}"

Provide a clear, factual answer based on web search results. If you cannot find reliable information, respond with exactly: "NOT_FOUND"`;

    const request = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      tools: [
        {
          googleSearch: {} as any // New API for grounded search
        } as any
      ]
    };

    const result = await model.generateContent(request);
    const response = result.response;
    const answer = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (answer === 'NOT_FOUND' || answer.includes('NOT_FOUND') || !answer) {
      return {
        found: false,
        answer: '',
        confidence: 'none',
        sources: []
      };
    }

    // Extract grounding metadata (sources)
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.webSearchQueries || [];

    return {
      found: true,
      answer,
      confidence: 'medium',
      sources
    };

  } catch (error) {
    console.error('Web search error:', error);
    return {
      found: false,
      answer: '',
      confidence: 'none',
      sources: []
    };
  }
}

// POST /api/chat/query-deck - Query specific pitch deck with AI
router.post('/query-deck', async (req: Request, res: Response) => {
  try {
    const { deckId, question } = req.body;

    // Validation
    if (!deckId || typeof deckId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'deckId is required and must be a string'
      });
    }

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'question is required and must be a string'
      });
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('💬 [VC Chat - Deck Query] New Query Received');
    console.log(`${'='.repeat(80)}`);
    console.log(`Deck ID: ${deckId}`);
    console.log(`Question: "${question}"`);

    // Step 1: Get deck data from database
    console.log('\n🔍 [Step 1] Fetching deck data from database...');
    const deckResult = await query(`
      SELECT 
        pd.*,
        c.name as company_name,
        c.stage,
        c.industry
      FROM pitch_decks pd
      LEFT JOIN companies c ON pd.company_id = c.id
      WHERE pd.id = $1
        AND pd.analysis_status = 'completed'
    `, [deckId]);

    if (deckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pitch deck not found or analysis not completed'
      });
    }

    const deck = deckResult.rows[0];
    console.log(`   ✅ Found deck: ${deck.filename}`);
    console.log(`   Company: ${deck.company_name || 'Unknown'}`);
    console.log(`   SSO Score: ${deck.sso_score ? (deck.sso_score * 100).toFixed(0) : 'N/A'}/100`);

    // Step 2: Get section analysis data
    console.log('\n📊 [Step 2] Fetching section analysis...');
    const sectionsResult = await query(`
      SELECT section_name, section_score, feedback, strengths, improvements
      FROM deck_analysis
      WHERE deck_id = $1
      ORDER BY section_name
    `, [deckId]);

    console.log(`   ✅ Found ${sectionsResult.rows.length} section(s)`);

    // Step 3: Compile context for AI
    console.log('\n🤖 [Step 3] Preparing context for AI...');
    const context = buildDeckContext(deck, sectionsResult.rows);
    console.log(`   Context length: ${context.length} characters`);

    // Step 4: Query AI with structured prompt
    console.log('\n💭 [Step 4] Querying AI...');
    const aiResponse = await queryAIWithDeck(question, context, deck);

    console.log('   ✅ AI response received');
    console.log(`   Source: ${aiResponse.source}`);
    console.log(`   Confidence: ${aiResponse.confidence}`);

    // Return structured response
    const response = {
      success: true,
      answer: aiResponse.answer,
      source: aiResponse.source,
      deckName: deck.filename,
      companyName: deck.company_name,
      sectionsUsed: aiResponse.sectionsUsed,
      webSources: aiResponse.webSources,
      confidence: aiResponse.confidence
    };

    console.log(`\n✅ Query completed successfully`);
    console.log(`${'='.repeat(80)}\n`);

    return res.json(response);

  } catch (error: any) {
    console.error('❌ [VC Chat - Deck Query] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process query',
      details: error.message
    });
  }
});

// Helper: Build comprehensive deck context
function buildDeckContext(deck: any, sections: any[]): string {
  const companyName = deck.company_name || 'Unknown Company';
  
  let context = `PITCH DECK ANALYSIS FOR: ${companyName}\n`;
  context += `Filename: ${deck.filename}\n`;
  context += `Analyzed: ${new Date(deck.analyzed_at).toLocaleDateString()}\n`;
  context += `SSO Score: ${deck.sso_score ? (deck.sso_score * 100).toFixed(0) : 'N/A'}/100\n`;
  if (deck.sector) context += `Sector: ${deck.sector}\n`;
  if (deck.stage) context += `Stage: ${deck.stage}\n`;
  if (deck.industry) context += `Industry: ${deck.industry}\n`;
  context += `\n${'='.repeat(80)}\n\n`;

  // Add extracted metrics
  if (deck.extracted_metrics) {
    context += `EXTRACTED METRICS:\n`;
    context += JSON.stringify(deck.extracted_metrics, null, 2);
    context += `\n\n${'='.repeat(80)}\n\n`;
  }

  // Add overall analysis
  if (deck.dual_pdf_analysis) {
    context += `OVERALL ANALYSIS:\n`;
    const analysis = deck.dual_pdf_analysis;
    if (analysis.overallScore) context += `Overall Score: ${analysis.overallScore}/100\n`;
    if (analysis.recommendation) context += `Recommendation: ${analysis.recommendation}\n`;
    if (analysis.strengths) context += `Strengths: ${JSON.stringify(analysis.strengths)}\n`;
    if (analysis.weaknesses) context += `Weaknesses: ${JSON.stringify(analysis.weaknesses)}\n`;
    if (analysis.insights) context += `Insights: ${JSON.stringify(analysis.insights)}\n`;
    context += `\n${'='.repeat(80)}\n\n`;
  }

  // Add section-by-section analysis
  if (sections.length > 0) {
    context += `SECTION-BY-SECTION ANALYSIS:\n\n`;
    sections.forEach((section, index) => {
      context += `${index + 1}. ${section.section_name.toUpperCase()}\n`;
      context += `   Score: ${(section.section_score * 100).toFixed(0)}/100\n`;
      if (section.feedback) context += `   Feedback: ${section.feedback}\n`;
      if (section.strengths && section.strengths.length > 0) {
        context += `   Strengths: ${section.strengths.join(', ')}\n`;
      }
      if (section.improvements && section.improvements.length > 0) {
        context += `   Improvements: ${section.improvements.join(', ')}\n`;
      }
      context += `\n`;
    });
    context += `${'='.repeat(80)}\n\n`;
  }

  // Add deck text content (truncated)
  if (deck.deck_text_content) {
    context += `DECK TEXT CONTENT (First 3000 characters):\n`;
    context += deck.deck_text_content.substring(0, 3000);
    context += `\n\n${'='.repeat(80)}\n\n`;
  }

  // Add web enrichment if available
  if (deck.web_enrichment) {
    context += `WEB ENRICHMENT DATA:\n`;
    context += JSON.stringify(deck.web_enrichment, null, 2);
    context += `\n`;
  }

  return context;
}

// Helper: Query AI with structured prompt for source attribution
async function queryAIWithDeck(
  question: string,
  deckContext: string,
  deck: any
): Promise<{
  answer: string;
  source: 'deck_analysis' | 'web_search' | 'both';
  sectionsUsed: string[];
  webSources: string[];
  confidence: number;
}> {
  try {
    const model = vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      }
    });

    const prompt = `You are a VC analyst assistant. Answer the user's question about this pitch deck using the provided analysis data.

IMPORTANT INSTRUCTIONS:
1. First, search thoroughly through the provided pitch deck analysis data
2. If you find the answer in the deck analysis, use it and cite which sections you used
3. If the information is NOT in the deck analysis, perform a web search to supplement
4. Return your response in this EXACT JSON format (no markdown, no code blocks):

{
  "answer": "Your detailed answer here",
  "source": "deck_analysis" | "web_search" | "both",
  "sections_used": ["section1", "section2"],
  "web_sources_used": true/false,
  "confidence": 0.0-1.0
}

USER QUESTION:
${question}

PITCH DECK ANALYSIS DATA:
${deckContext}

Remember: Return ONLY the JSON object, no other text.`;

    // First attempt: Try to answer from deck only
    const deckOnlyResult = await model.generateContent(prompt);
    const deckOnlyText = deckOnlyResult.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Try to parse JSON response
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      const cleanText = deckOnlyText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanText);
    } catch (parseError) {
      // If JSON parsing fails, return the text as-is
      console.warn('⚠️  Failed to parse AI JSON response, using fallback');
      return {
        answer: deckOnlyText,
        source: 'deck_analysis',
        sectionsUsed: [],
        webSources: [],
        confidence: 0.7
      };
    }

    // If answer found in deck, return it
    if (parsedResponse.source === 'deck_analysis' || parsedResponse.source === 'both') {
      return {
        answer: parsedResponse.answer,
        source: parsedResponse.source,
        sectionsUsed: parsedResponse.sections_used || [],
        webSources: [],
        confidence: parsedResponse.confidence || 0.8
      };
    }

    // If not found in deck, do web search
    console.log('   ℹ️  Answer not in deck, performing web search...');
    const companyName = deck.company_name || 'the company';
    
    const webPrompt = `Answer this question about ${companyName}: "${question}"

Provide a clear, factual answer based on web search results. Be specific and cite information sources.

Return response in this JSON format:
{
  "answer": "Your answer with web data",
  "source": "web_search",
  "confidence": 0.0-1.0
}`;

    const webRequest = {
      contents: [{
        role: 'user',
        parts: [{ text: webPrompt }]
      }],
      tools: [
        {
          googleSearch: {} as any
        } as any
      ]
    };

    const webResult = await model.generateContent(webRequest);
    const webText = webResult.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    try {
      const cleanWebText = webText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const webResponse = JSON.parse(cleanWebText);
      
      // Get grounding metadata
      const groundingMetadata = webResult.response.candidates?.[0]?.groundingMetadata;
      const webSources = groundingMetadata?.webSearchQueries || [];

      return {
        answer: `${parsedResponse.answer}\n\n[Additional web search data:]\n${webResponse.answer}`,
        source: 'both',
        sectionsUsed: parsedResponse.sections_used || [],
        webSources: webSources,
        confidence: 0.75
      };
    } catch {
      return {
        answer: `${parsedResponse.answer}\n\n[Additional web search data:]\n${webText}`,
        source: 'both',
        sectionsUsed: parsedResponse.sections_used || [],
        webSources: [],
        confidence: 0.7
      };
    }

  } catch (error) {
    console.error('Error querying AI:', error);
    throw new Error('Failed to get AI response');
  }
}

// GET /api/chat/history - Get recent chat queries (optional feature)
router.get('/history', async (req: Request, res: Response) => {
  try {
    // TODO: Implement chat history storage if needed
    res.json({
      success: true,
      history: []
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch chat history' 
    });
  }
});

export default router;
