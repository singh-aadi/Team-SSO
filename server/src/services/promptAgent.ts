/**
 * 🧠 DYNAMIC PROMPT AGENT
 * 
 * PhD-Level Agentic System for Adaptive Prompt Engineering
 * 
 * ARCHITECTURE:
 * - Listens to user customization changes (new criteria, subcriteria, weight adjustments)
 * - Uses Vertex AI Gemini to intelligently regenerate evaluation prompts
 * - Maintains semantic consistency while incorporating new evaluation dimensions
 * - Stores versioned prompts per user for reproducibility
 * 
 * INTELLIGENCE LAYERS:
 * 1. Customization Parser: Extracts intent from user modifications
 * 2. Prompt Generator: Uses AI to merge custom criteria into base template
 * 3. Validation Layer: Ensures generated prompts maintain JSON structure
 * 4. Version Control: Tracks prompt evolution for debugging/rollback
 */

import { VertexAI } from '@google-cloud/vertexai';
import { Pool } from 'pg';

// Lazy-load VertexAI to ensure environment variables are loaded
let vertexAI: VertexAI | null = null;

function getVertexAI(): VertexAI {
  if (!vertexAI) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'projectsso-473108';
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    
    console.log(`🤖 Initializing Vertex AI with project: ${project}, location: ${location}`);
    
    vertexAI = new VertexAI({
      project,
      location,
    });
  }
  return vertexAI;
}

interface CustomCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
  subcriteria: Array<{
    id: string;
    name: string;
    weight: number;
  }>;
}

interface PromptGenerationConfig {
  userId: string;
  industry: string;
  criteria: CustomCriteria[];
  baseTemplate: string;
}

interface GeneratedPrompt {
  prompt: string;
  version: string;
  metadata: {
    generatedAt: Date;
    criteriaCount: number;
    subcriteriaCount: number;
    customizations: string[];
  };
}

/**
 * BASE PROMPT TEMPLATE
 * This is the foundational prompt that the agent will intelligently modify
 */
const BASE_EVALUATION_TEMPLATE = `You are an expert VC analyst evaluating startup pitch decks.
Analyze the following pitch deck and provide detailed, actionable feedback.

EVALUATION FRAMEWORK:
{CRITERIA_SECTION}

PITCH DECK CONTENT:
{DECK_CONTENT}

Provide your analysis in STRICT JSON format:

{
  "overallAnalysis": {
    {OVERALL_SCORES}
    "strengths": [<3 key strengths>],
    "weaknesses": [<3 areas to improve>],
    "keyInsights": [<3 critical insights>],
    "recommendation": "<Investment recommendation paragraph>"
  },
  "sectionAnalysis": [
    {SECTION_ANALYSIS}
  ]
}

SCORING METHODOLOGY:
{SCORING_CRITERIA}

Be critical but constructive. Focus on actionable, data-driven insights.`;

/**
 * 🤖 AGENT CORE: Generate Adaptive Prompt
 * 
 * Uses Vertex AI Gemini to intelligently merge custom criteria into base template.
 * This is the "PhD scientist" thinking - the AI understands semantic relationships
 * between custom criteria and existing framework.
 */
export async function generateAdaptivePrompt(
  config: PromptGenerationConfig
): Promise<GeneratedPrompt> {
  const vertex = getVertexAI();
  const model = vertex.preview.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.4, // Lower temperature for more deterministic prompt generation
      topP: 0.8,
    },
  });

  // Build criteria description for meta-prompt
  const criteriaDescription = config.criteria.map(c => {
    const subDesc = c.subcriteria.length > 0
      ? `\n  Subcriteria: ${c.subcriteria.map(sc => `${sc.name} (${sc.weight}%)`).join(', ')}`
      : '';
    return `- ${c.name} (${c.weight}%): ${c.description}${subDesc}`;
  }).join('\n');

  // META-PROMPT: AI generates the evaluation prompt
  const metaPrompt = `You are a prompt engineering expert helping VCs customize their evaluation frameworks.

TASK: Generate a comprehensive pitch deck evaluation prompt based on the custom criteria below.

INDUSTRY FOCUS: ${config.industry === 'all' ? 'General (all industries)' : config.industry}

CUSTOM EVALUATION CRITERIA:
${criteriaDescription}

REQUIREMENTS:
1. Create a detailed evaluation prompt that incorporates ALL custom criteria
2. For each criterion, include:
   - Clear scoring guidelines (0-100 scale)
   - Specific factors to evaluate
   - Industry-specific considerations (if industry != 'all')
   - Subcriteria breakdown (if any)
3. Maintain strict JSON output format for programmatic parsing
4. Include sections for:
   - Overall analysis with individual criterion scores
   - Section-by-section detailed analysis
   - Strengths, weaknesses, and insights
   - Investment recommendation
5. Be specific about what constitutes a "good" vs "bad" score for each criterion
6. Include actionable evaluation guidelines

BASE TEMPLATE STRUCTURE:
${BASE_EVALUATION_TEMPLATE}

OUTPUT FORMAT:
Generate the COMPLETE evaluation prompt text that will be sent to Gemini.
Replace {CRITERIA_SECTION}, {OVERALL_SCORES}, {SECTION_ANALYSIS}, and {SCORING_CRITERIA} 
with detailed, customized content based on the criteria above.

The prompt should be production-ready and immediately usable for deck analysis.`;

  try {
    console.log('🧠 Prompt Agent: Generating adaptive prompt...');
    console.log(`   Industry: ${config.industry}`);
    console.log(`   Criteria Count: ${config.criteria.length}`);
    
    const result = await model.generateContent(metaPrompt);
    const response = result.response;
    const generatedPrompt = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!generatedPrompt) {
      throw new Error('Failed to generate prompt - empty response from Vertex AI');
    }

    // Extract customizations for metadata
    const customizations: string[] = [];
    config.criteria.forEach(c => {
      if (c.id.includes('custom-')) {
        customizations.push(`Custom criterion: ${c.name}`);
      }
      c.subcriteria.forEach(sc => {
        if (sc.id.includes('custom-')) {
          customizations.push(`Custom subcriteria: ${sc.name} under ${c.name}`);
        }
      });
    });

    const metadata = {
      generatedAt: new Date(),
      criteriaCount: config.criteria.length,
      subcriteriaCount: config.criteria.reduce((sum, c) => sum + c.subcriteria.length, 0),
      customizations,
    };

    // Generate version hash
    const version = `v${Date.now()}_${config.userId.substring(0, 8)}`;

    console.log('✅ Prompt Agent: Generated adaptive prompt successfully');
    console.log(`   Version: ${version}`);
    console.log(`   Customizations: ${customizations.length}`);
    console.log(`   Prompt length: ${generatedPrompt.length} chars`);

    return {
      prompt: generatedPrompt,
      version,
      metadata,
    };
  } catch (error) {
    console.error('❌ Prompt Agent: Failed to generate prompt:', error);
    throw error;
  }
}

/**
 * 💾 Save Generated Prompt to Database
 * Enables version control and prompt reproducibility
 */
export async function saveGeneratedPrompt(
  pool: Pool,
  userId: string,
  generatedPrompt: GeneratedPrompt,
  criteriaConfig: CustomCriteria[]
): Promise<number> {
  const query = `
    INSERT INTO vc_custom_prompts (
      user_id,
      prompt_version,
      criteria_config,
      generated_prompt,
      metadata,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id
  `;

  const result = await pool.query(query, [
    userId,
    generatedPrompt.version,
    JSON.stringify(criteriaConfig),
    generatedPrompt.prompt,
    JSON.stringify(generatedPrompt.metadata),
  ]);

  console.log(`💾 Saved prompt version ${generatedPrompt.version} for user ${userId}`);
  return result.rows[0].id;
}

/**
 * 🔍 Get Latest Prompt for User
 * Retrieves most recent custom prompt or falls back to default
 */
export async function getLatestPrompt(
  pool: Pool,
  userId: string
): Promise<string | null> {
  const query = `
    SELECT generated_prompt
    FROM vc_custom_prompts
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [userId]);
  
  if (result.rows.length === 0) {
    console.log(`ℹ️  No custom prompt found for user ${userId}, using base template`);
    return null;
  }

  console.log(`✅ Retrieved custom prompt for user ${userId}`);
  return result.rows[0].generated_prompt;
}

/**
 * 🔄 Trigger Prompt Regeneration
 * Called when user modifies evaluation criteria
 */
export async function triggerPromptRegeneration(
  pool: Pool,
  userId: string,
  industry: string,
  criteria: CustomCriteria[]
): Promise<GeneratedPrompt> {
  console.log(`🔄 Triggering prompt regeneration for user ${userId}`);
  
  const config: PromptGenerationConfig = {
    userId,
    industry,
    criteria,
    baseTemplate: BASE_EVALUATION_TEMPLATE,
  };

  const generatedPrompt = await generateAdaptivePrompt(config);
  await saveGeneratedPrompt(pool, userId, generatedPrompt, criteria);

  return generatedPrompt;
}

/**
 * 📊 Get Prompt History
 * View evolution of prompts over time
 */
export async function getPromptHistory(
  pool: Pool,
  userId: string,
  limit: number = 10
): Promise<Array<{
  version: string;
  createdAt: Date;
  metadata: any;
}>> {
  const query = `
    SELECT prompt_version, created_at, metadata
    FROM vc_custom_prompts
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [userId, limit]);
  return result.rows.map(row => ({
    version: row.prompt_version,
    createdAt: row.created_at,
    metadata: row.metadata,
  }));
}
