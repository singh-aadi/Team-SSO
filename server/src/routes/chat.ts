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
