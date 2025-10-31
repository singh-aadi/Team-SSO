import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../db';

// Initialize Gemini with API Key (simpler than Vertex AI)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.4,
  }
});

interface ContextItem {
  id: string;
  file_name: string;
  file_type: string;
  content_text: string;
  upload_date: string;
  metadata: any;
}

interface SynthesisResult {
  executiveSummary: string;
  keyInsights: string[];
  opportunities: string[];
  risks: string[];
  teamAssessment: string;
  nextSteps: string[];
  recommendation: {
    decision: 'Proceed' | 'Pause' | 'Pass';
    confidence: number;
    rationale: string;
  };
}

/**
 * Synthesize VC context using Gemini AI
 * @param deckId - ID of the pitch deck
 * @returns Synthesis result with summary and insights
 */
export async function synthesizeVCContext(deckId: string): Promise<any> {
  try {
    console.log(`🤖 Starting AI synthesis for deck: ${deckId}`);
    
    // Fetch all context items for this deck
    const result = await query(
      `SELECT * FROM vc_context_items 
       WHERE deck_id = $1 
       ORDER BY created_at ASC`,
      [deckId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('No context items found for this deck');
    }
    
    const contextItems: ContextItem[] = result.rows;
    console.log(`📄 Found ${contextItems.length} context items`);
    
    // Build the context text
    const contextText = contextItems
      .map(item => {
        const date = new Date(item.upload_date).toLocaleDateString();
        return `[${item.file_type || 'document'}] ${date} - ${item.file_name}\n${item.content_text}`;
      })
      .join('\n\n---\n\n');
    
    // Build the prompt
    const prompt = buildSynthesisPrompt(contextText, contextItems.length);
    
    // Call Gemini API
    console.log('🚀 Calling Gemini API...');
    const response = await model.generateContent(prompt);
    const text = response.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('✅ Received AI response');
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }
    
    const synthesis: SynthesisResult = JSON.parse(jsonMatch[0]);
    
    // Save summary to database
    const saveResult = await query(
      `INSERT INTO vc_context_summaries 
       (deck_id, summary_text, key_insights, sentiment_analysis, generated_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        deckId,
        JSON.stringify(synthesis),
        JSON.stringify(synthesis.keyInsights || []),
        JSON.stringify({ overall: 'positive' })
      ]
    );
    
    console.log('💾 Summary saved to database');
    
    return {
      success: true,
      summary: {
        id: saveResult.rows[0].id,
        ...synthesis
      }
    };
  } catch (error: any) {
    console.error('❌ Synthesis error:', error);
    throw new Error(`Failed to synthesize context: ${error.message}`);
  }
}

/**
 * Build the synthesis prompt for Gemini
 */
function buildSynthesisPrompt(contextText: string, itemCount: number): string {
  return `
You are a senior venture capital analyst reviewing ${itemCount} context documents for a startup investment opportunity.

CONTEXT DOCUMENTS:
${contextText}

Analyze these documents thoroughly and provide a comprehensive investment analysis.

Return your analysis as a JSON object with the following structure:

{
  "executiveSummary": "3-4 sentence overview of the opportunity",
  "keyInsights": [
    "First major insight with details",
    "Second insight...",
    "Continue for 5-7 total insights"
  ],
  "opportunities": [
    "Strength or positive signal 1",
    "Strength or positive signal 2",
    "Continue for 3-5 opportunities"
  ],
  "risks": [
    "Risk factor or concern 1",
    "Risk factor or concern 2",
    "Continue for 3-5 risks"
  ],
  "teamAssessment": "2-3 sentence assessment of founder capabilities and team dynamics",
  "nextSteps": [
    "Follow-up question or diligence item 1",
    "Follow-up question or diligence item 2",
    "Continue for 3-5 next steps"
  ],
  "recommendation": {
    "decision": "Proceed|Pause|Pass",
    "confidence": 85,
    "rationale": "2-3 sentence explanation of the recommendation"
  }
}

Guidelines:
- Be specific and reference details from the documents
- Balance optimism with critical analysis
- Focus on actionable insights
- Use professional VC language
- Confidence should be 0-100
- Decision must be exactly "Proceed", "Pause", or "Pass"

Return ONLY the JSON object, no additional text.
`;
}

/**
 * Get the latest summary for a deck
 */
export async function getLatestSummary(deckId: string): Promise<any> {
  try {
    const result = await query(
      `SELECT * FROM vc_context_summaries 
       WHERE deck_id = $1 
       ORDER BY generated_at DESC 
       LIMIT 1`,
      [deckId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const summary = result.rows[0];
    return {
      id: summary.id,
      deckId: summary.deck_id,
      generatedAt: summary.generated_at,
      ...JSON.parse(summary.summary_text)
    };
  } catch (error: any) {
    console.error('Error fetching summary:', error);
    throw error;
  }
}
