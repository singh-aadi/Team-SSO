/**
 * VC Personal Knowledge Extraction System
 * Extracts and synthesizes VC's personal insights from multiple sources
 * 
 * PURPOSE: Build a knowledge base of the VC's:
 * - Call transcripts and meeting notes
 * - Email threads and deal memos
 * - Slack conversations about companies
 * - Personal research and market insights
 * - Pattern recognition from past deals
 * - Investment thesis and preferences
 * 
 * This context is then used to enhance pitch deck analysis
 * 
 * AGENT WORKFLOW:
 * 1. Document Ingestion Agent - Handles audio, text, PDF, PPT, email, etc.
 * 2. Noise Reduction Agent - Removes greetings, signatures, irrelevant chatter
 * 3. Entity Extraction Agent - Identifies companies, people, markets, metrics
 * 4. Knowledge Synthesis Agent - Creates structured insights from raw data
 * 5. Context Packaging Agent - Formats for deck intelligence integration
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '../db';
import { buildVCKnowledgeExtractionPrompt } from './vcKnowledgePrompt';

console.log('🧠 Loading VC Personal Knowledge Extraction System...');

// Initialize AI Studio API (same as other services)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use Gemini 2.5 Flash (available in AI Studio)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.3, // Lower temp for more analytical output
    topP: 0.95,
    topK: 40,
  },
});

interface ContextDocument {
  id: string;
  file_name: string;
  file_type: string;
  content_text: string;
  upload_date: string;
  metadata: any;
}

interface VCIntelligenceSummary {
  // Executive Summary
  executiveSummary: string; // What's in these documents overall?
  
  // Companies & Deals Mentioned
  companiesMentioned: Array<{
    name: string;
    industry: string;
    stage: string;
    keyPoints: string[]; // What did VC learn/note about this company?
    metrics?: string[]; // Any numbers mentioned
  }>;
  
  // VC's Investment Thesis (extracted from documents)
  investmentThesis?: {
    focusAreas: string[]; // Markets/sectors VC is interested in
    dealbreakers: string[]; // Red flags VC mentioned
    greenFlags: string[]; // What VC looks for positively
    targetProfile: string; // Ideal company description
  };
  
  // Market Insights (VC's personal research/opinions)
  marketInsights: Array<{
    topic: string; // e.g., "AI in healthcare"
    insight: string; // What VC learned/believes
    source?: string; // From which document
  }>;
  
  // People & Relationships
  peopleNetworkcontact: Array<{
    name: string;
    role: string; // Founder, CEO, Advisor, etc.
    company?: string;
    context: string; // How they were mentioned
  }>;
  
  // VC's Decision Patterns
  decisionPatterns: {
    whatVCValuesМost: string[]; // Team? Traction? Market size?
    commonConcerns: string[]; // Recurring worries across deals
    successPatterns: string[]; // What worked in past wins
    missedOpportunities: string[]; // Deals they passed on but succeeded
  };
  
  // Key Insights & Learnings
  keyInsights: string[]; // Top takeaways from these documents
  
  // Actionable Intelligence for Future Decisions
  opportunities: Array<{
    insight: string;
    category?: string;
    impact?: 'High' | 'Medium' | 'Low';
  }>;
  
  risks: Array<{
    concern: string;
    category?: string;
    severity?: 'Critical' | 'High' | 'Medium' | 'Low';
    mitigation?: string;
  }>;
  
  nextSteps: Array<{
    action: string;
    priority?: 'Critical' | 'High' | 'Medium';
    rationale?: string;
  }>;
  
  // Legacy support
  recommendation?: {
    decision: string;
    confidence: number;
    rationale: string;
    valuation_guidance?: string;
    deal_terms_advice?: string;
  };
  
  quotes?: string[];
  dataPoints?: string[];
  teamAssessment?: string;
  teamIntelligence?: any;
  marketAnalysis?: any;
  businessModelAnalysis?: any;
}

/**
 * Generate PhD-level VC intelligence summary from uploaded documents
 * Multi-Agent Workflow: Extract → Analyze → Synthesize
 */
export async function generateVCIntelligence(deckId: string): Promise<any> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎓 MULTI-AGENT VC INTELLIGENCE SYSTEM');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // AGENT 1: Document Extraction
    console.log('\n🤖 AGENT 1: Document Extractor');
    console.log('─────────────────────────────────────────────────');
    const documents = await fetchContextDocuments(deckId);
    console.log(`✅ Found ${documents.length} documents`);
    console.log(`✅ Total words: ${calculateTotalWords(documents).toLocaleString()}`);
    
    // Validate we have actual content
    if (documents.length === 0) {
      throw new Error('No context documents found. Upload documents first.');
    }
    
    const totalChars = documents.reduce((sum, doc) => sum + (doc.content_text?.length || 0), 0);
    if (totalChars < 100) {
      throw new Error('Documents are too short or empty. Upload substantive content.');
    }
    
    // AGENT 2: Context Builder
    console.log('\n🤖 AGENT 2: Context Builder');
    console.log('─────────────────────────────────────────────────');
    const contextText = buildContextText(documents);
    console.log(`✅ Built structured context: ${contextText.length.toLocaleString()} characters`);
    
    // Log sample to verify real content
    const sample = contextText.substring(0, 300).replace(/\n/g, ' ');
    console.log(`📝 Content sample: "${sample}..."`);
    
    // AGENT 3: Entity Extractor
    console.log('\n🤖 AGENT 3: Entity Extractor');
    console.log('─────────────────────────────────────────────────');
    const entities = await extractKeyEntities(contextText);
    console.log(`✅ Extracted entities:`, entities);
    
    // AGENT 4: Intelligence Analyzer
    console.log('\n🤖 AGENT 4: Intelligence Analyzer');
    console.log('─────────────────────────────────────────────────');
    const intelligence = await performMultiStageAnalysis(contextText, documents, entities);
    
    // AGENT 5: Quality Validator
    console.log('\n🤖 AGENT 5: Quality Validator');
    console.log('─────────────────────────────────────────────────');
    validateIntelligenceQuality(intelligence);
    
    // AGENT 6: Database Persister
    console.log('\n🤖 AGENT 6: Database Persister');
    console.log('─────────────────────────────────────────────────');
    await saveIntelligenceSummary(deckId, intelligence);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MULTI-AGENT ANALYSIS COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      success: true,
      summary: intelligence,
      metadata: {
        documentCount: documents.length,
        totalWords: calculateTotalWords(documents),
        entities: entities,
      }
    };
    
  } catch (error: any) {
    console.error('\n❌ MULTI-AGENT SYSTEM FAILURE');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack?.substring(0, 500));
    throw new Error(`VC Intelligence failed: ${error.message}`);
  }
}

/**
 * Extract key entities from context (company name, founders, etc.)
 */
async function extractKeyEntities(contextText: string): Promise<any> {
  const entityPrompt = `
Analyze the following context and extract key entities. Be VERY specific and only extract what's actually mentioned.

CONTEXT:
${contextText.substring(0, 5000)}

Extract and return ONLY a JSON object with this structure:
{
  "companyName": "Exact company name mentioned" or null,
  "founders": ["Founder 1", "Founder 2"] or [],
  "industry": "Industry/sector" or null,
  "stage": "Funding stage" or null,
  "traction": "Key metric or traction point" or null
}

Return ONLY the JSON object. If information is not found, use null or empty array.
`;

  try {
    const result = await model.generateContent(entityPrompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch (error) {
    console.warn('⚠️ Entity extraction failed, continuing without entities');
    return {};
  }
}

/**
 * Validate intelligence quality
 */
function validateIntelligenceQuality(intelligence: VCIntelligenceSummary): void {
  const issues: string[] = [];
  
  if (!intelligence.executiveSummary || intelligence.executiveSummary.length < 100) {
    issues.push('Executive summary too short or missing');
  }
  
  if (!intelligence.keyInsights || intelligence.keyInsights.length < 3) {
    issues.push('Too few key insights (< 3)');
  }
  
  if (!intelligence.opportunities || intelligence.opportunities.length === 0) {
    issues.push('No opportunities identified');
  }
  
  if (!intelligence.risks || intelligence.risks.length === 0) {
    issues.push('No risks identified');
  }
  
  if (!intelligence.recommendation) {
    issues.push('Missing investment recommendation');
  }
  
  if (issues.length > 0) {
    console.warn('⚠️ Quality issues detected:');
    issues.forEach(issue => console.warn(`   - ${issue}`));
  } else {
    console.log('✅ Intelligence quality: EXCELLENT');
  }
}

/**
 * Fetch all context documents for analysis
 */
async function fetchContextDocuments(deckId: string): Promise<ContextDocument[]> {
  const result = await query(
    `SELECT * FROM vc_context_items 
     WHERE deck_id = $1 
     ORDER BY created_at ASC`,
    [deckId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('No context documents found. Please upload context first.');
  }
  
  return result.rows;
}

/**
 * Calculate total words across all documents
 */
function calculateTotalWords(documents: ContextDocument[]): number {
  return documents.reduce((total, doc) => {
    return total + (doc.content_text?.split(/\s+/).length || 0);
  }, 0);
}

/**
 * Build structured context text for AI analysis
 */
function buildContextText(documents: ContextDocument[]): string {
  return documents.map((doc, index) => {
    const date = new Date(doc.upload_date).toLocaleDateString();
    const wordCount = doc.content_text?.split(/\s+/).length || 0;
    
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT ${index + 1} of ${documents.length}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: ${doc.file_name}
Type: ${doc.file_type || 'document'}
Date: ${date}
Length: ${wordCount} words
${doc.metadata?.companyName ? `Company: ${doc.metadata.companyName}` : ''}
${doc.metadata?.meetingType ? `Context: ${doc.metadata.meetingType}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${doc.content_text}

`;
  }).join('\n\n');
}

/**
 * Perform sophisticated multi-agent AI analysis
 * Each agent focuses on specific aspect for better quality
 */
async function performMultiStageAnalysis(
  contextText: string,
  documents: ContextDocument[],
  entities?: any
): Promise<VCIntelligenceSummary> {
  
  console.log('🎯 Starting Multi-Agent Analysis Pipeline...');
  console.log(`📄 Document Count: ${documents.length}`);
  console.log(`📝 Total Context Length: ${contextText.length} characters`);
  
  // Log first 500 chars to verify we have real content
  console.log('📖 Context Preview:', contextText.substring(0, 500));
  
  // Add entity context if available
  const entityContext = entities && Object.keys(entities).length > 0 
    ? `\n\nEXTRACTED ENTITIES (for reference):\n${JSON.stringify(entities, null, 2)}\n`
    : '';
  
  const prompt = buildVCKnowledgeExtractionPrompt(contextText + entityContext, documents.length);
  
  console.log('🚀 Calling AI Studio API - Gemini 2.5 Flash...');
  console.log(`📏 Prompt Length: ${prompt.length.toLocaleString()} characters`);
  if (entities) {
    console.log(`📊 Using extracted entities:`, entities);
  }
  
  try {
    const result = await model.generateContent(prompt);
    
    const response = result.response;
    console.log('✅ Received response from AI Studio');
    
    // Log full response structure for debugging
    console.log('📦 Response structure:', JSON.stringify({
      candidatesCount: response.candidates?.length,
      hasContent: !!response.candidates?.[0]?.content,
      partsCount: response.candidates?.[0]?.content?.parts?.length
    }));
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      console.error('❌ No text in response!');
      throw new Error('No response from Vertex AI - empty text');
    }
    
    console.log(`📊 Received ${text.length} characters of analysis`);
    console.log('📝 Response preview:', text.substring(0, 300));
    
    // Try to extract JSON - be flexible with parsing
    let intelligence: VCIntelligenceSummary;
    
    // Method 1: Look for JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        intelligence = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed JSON response');
      } catch (parseError: any) {
        console.error('❌ JSON parse error:', parseError.message);
        console.error('📄 Failed JSON:', jsonMatch[0].substring(0, 500));
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }
    } else {
      console.error('❌ No JSON found in response');
      console.error('📄 Full response:', text);
      throw new Error('AI response does not contain valid JSON object');
    }
    
    // Validate that we got actual analysis, not placeholder data
    const placeholderKeywords = ['ecoharvest', 'example company', 'placeholder', 'sample startup', '[company name]'];
    const summaryLower = intelligence.executiveSummary?.toLowerCase() || '';
    
    for (const keyword of placeholderKeywords) {
      if (summaryLower.includes(keyword)) {
        console.error(`❌ REJECTED: AI used placeholder data (found "${keyword}")`);
        console.error('📄 Offending summary:', intelligence.executiveSummary);
        throw new Error(`AI generated placeholder data instead of analyzing your documents. Found keyword: "${keyword}". Please regenerate.`);
      }
    }
    
    // Validate minimum content quality
    if (!intelligence.keyInsights || intelligence.keyInsights.length < 3) {
      console.warn('⚠️ WARNING: Low-quality response - too few insights');
    }
    
    if (!intelligence.marketAnalysis && !intelligence.teamIntelligence) {
      console.warn('⚠️ WARNING: Missing structured analysis sections');
    }
    
    console.log('✅ Analysis quality validation passed');
    return intelligence;
    
  } catch (error: any) {
    console.error('❌ Multi-Agent Analysis Failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    throw error;
  }
}

/**
 * Save intelligence summary to database
 */
async function saveIntelligenceSummary(
  deckId: string,
  intelligence: VCIntelligenceSummary
): Promise<void> {
  // First, delete any existing summaries for this deck (upsert alternative)
  await query(`DELETE FROM vc_context_summaries WHERE deck_id = $1`, [deckId]);
  
  // Then insert the new summary
  await query(
    `INSERT INTO vc_context_summaries 
     (deck_id, summary_text, key_insights, sentiment_analysis, generated_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [
      deckId,
      JSON.stringify(intelligence),
      JSON.stringify(intelligence.keyInsights || []),
      JSON.stringify({
        overall: intelligence.recommendation?.decision || 'context-extracted',
        confidence: intelligence.recommendation?.confidence || 100,
      }),
    ]
  );
  
  console.log('💾 Intelligence summary saved to database');
}

/**
 * Get latest intelligence summary for a deck
 */
export async function getLatestIntelligence(deckId: string): Promise<VCIntelligenceSummary | null> {
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
  const intelligence = JSON.parse(summary.summary_text);
  
  return {
    ...intelligence,
    generatedAt: summary.generated_at,
  };
}
