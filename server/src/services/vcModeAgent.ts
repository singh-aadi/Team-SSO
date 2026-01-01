/**
 * VC MODE AGENTIC SYSTEM
 * 
 * 4-Layer Psychology-Informed Investment Evaluation Engine
 * - Layer 1: Dealbreaker Analysis (AI-powered rule checking)
 * - Layer 2: Pattern Recognition (Success/Failure pattern matching)
 * - Layer 3: Context Weights (Stage-specific scoring adjustments)
 * - Layer 4: Thesis Alignment (Strategic fit + bias detection)
 * 
 * Zero hardcoding - all logic driven by VC preferences
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface Dealbreaker {
  id: string;
  description: string;
  category: 'team' | 'market' | 'product' | 'traction' | 'compliance' | 'strategy';
  severity: 'HARD_NO' | 'SOFT_NO' | 'FLAG';
  enabled: boolean;
}

interface Pattern {
  id: string;
  pattern: string;
  type: 'success' | 'failure' | 'warning';
  weight: number; // 0-100%
  examples?: string;
}

interface ContextWeights {
  stage: 'Pre-seed' | 'Seed' | 'Series A' | 'Series B+';
  weights: {
    team: number;
    market: number;
    product: number;
    traction: number;
    finance: number;
  };
}

interface ThesisAlignment {
  target_sectors: string[];
  target_stages: string[];
  check_size_range: { min: number; max: number };
  geography: string[];
  strategic_priorities: string;
}

interface VCPreferences {
  dealbreakers: Dealbreaker[];
  patterns: Pattern[];
  context_weights: ContextWeights[];
  thesis_alignment: ThesisAlignment;
}

interface DeckContext {
  company_name: string;
  industry: string;
  stage: string;
  deck_text: string;
  deck_summary?: string;
  metrics?: any;
  vc_context_documents?: string[]; // Meeting notes, transcripts, etc.
}

interface DealbreakerResult {
  id: string;
  description: string;
  category: string;
  severity: string;
  triggered: boolean;
  reasoning: string;
  evidence?: string;
}

interface PatternMatch {
  pattern: string;
  type: string;
  confidence: number; // 0-1
  evidence: string;
  weight: number;
  impact: number; // Calculated score adjustment
}

interface ThesisAlignmentResult {
  overall_score: number; // 0-1
  sector_match: boolean;
  stage_match: boolean;
  geography_match: boolean;
  check_size_match: boolean;
  strategic_priorities_match: number; // 0-1
  bonus_penalty: number; // ±points
  bias_alerts: string[];
}

interface AgenticEvaluationResult {
  dealbreakers: {
    passed: boolean;
    hard_no_count: number;
    soft_no_count: number;
    flag_count: number;
    results: DealbreakerResult[];
  };
  patterns: {
    success_patterns: PatternMatch[];
    failure_patterns: PatternMatch[];
    warning_patterns: PatternMatch[];
    net_adjustment: number;
  };
  context_weights: {
    stage: string;
    weights: any;
    applied: boolean;
  };
  thesis_alignment: ThesisAlignmentResult;
  final_recommendation: {
    proceed: boolean;
    confidence: number; // 0-1
    reasoning: string;
    key_strengths: string[];
    key_concerns: string[];
  };
}

/**
 * Main orchestrator for agentic VC evaluation
 */
export async function evaluateWithVCMode(
  deckContext: DeckContext,
  vcPreferences: VCPreferences
): Promise<AgenticEvaluationResult> {
  console.log('🤖 Starting agentic VC evaluation...');
  console.log(`   Company: ${deckContext.company_name}`);
  console.log(`   Industry: ${deckContext.industry}`);
  console.log(`   Stage: ${deckContext.stage}`);

  // Layer 1: Apply Dealbreakers
  const dealbreakerResults = await applyDealbreakers(deckContext, vcPreferences.dealbreakers);
  
  // Layer 2: Apply Patterns
  const patternResults = await applyPatterns(deckContext, vcPreferences.patterns);
  
  // Layer 3: Context Weights
  const contextWeights = getContextWeights(deckContext.stage, vcPreferences.context_weights);
  
  // Layer 4: Thesis Alignment
  const thesisResults = await applyThesisAlignment(deckContext, vcPreferences.thesis_alignment);
  
  // Generate final recommendation
  const finalRecommendation = generateFinalRecommendation(
    dealbreakerResults,
    patternResults,
    thesisResults
  );

  console.log('✅ Agentic evaluation complete');
  console.log(`   Proceed: ${finalRecommendation.proceed}`);
  console.log(`   Confidence: ${(finalRecommendation.confidence * 100).toFixed(0)}%`);

  return {
    dealbreakers: dealbreakerResults,
    patterns: patternResults,
    context_weights: contextWeights,
    thesis_alignment: thesisResults,
    final_recommendation: finalRecommendation
  };
}

/**
 * Layer 1: AI-powered dealbreaker analysis
 */
async function applyDealbreakers(
  deckContext: DeckContext,
  dealbreakers: Dealbreaker[]
): Promise<any> {
  console.log('📋 Layer 1: Analyzing dealbreakers...');
  
  const enabledDealbreakers = dealbreakers.filter(d => d.enabled);
  console.log(`   Checking ${enabledDealbreakers.length} enabled dealbreakers`);

  if (enabledDealbreakers.length === 0) {
    return {
      passed: true,
      hard_no_count: 0,
      soft_no_count: 0,
      flag_count: 0,
      results: []
    };
  }

  const results: DealbreakerResult[] = [];
  let hardNoCount = 0;
  let softNoCount = 0;
  let flagCount = 0;

  // Analyze each dealbreaker with AI
  for (const dealbreaker of enabledDealbreakers) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      const prompt = `You are a VC investment analyst. Analyze if this pitch deck triggers the following dealbreaker rule:

**Dealbreaker Rule:**
Category: ${dealbreaker.category}
Description: ${dealbreaker.description}
Severity: ${dealbreaker.severity}

**Company Information:**
Name: ${deckContext.company_name}
Industry: ${deckContext.industry}
Stage: ${deckContext.stage}

**Deck Content:**
${deckContext.deck_text.substring(0, 3000)}

**Your Task:**
1. Determine if this dealbreaker is triggered (true/false)
2. Provide clear reasoning with specific evidence from the deck
3. Be objective and evidence-based

Return ONLY a JSON object with this exact structure:
{
  "triggered": true or false,
  "reasoning": "Your detailed reasoning here",
  "evidence": "Specific quote or data point from deck"
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse AI response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }
      
      const aiResult = JSON.parse(jsonMatch[0]);
      
      results.push({
        id: dealbreaker.id,
        description: dealbreaker.description,
        category: dealbreaker.category,
        severity: dealbreaker.severity,
        triggered: aiResult.triggered,
        reasoning: aiResult.reasoning,
        evidence: aiResult.evidence
      });

      // Count by severity
      if (aiResult.triggered) {
        if (dealbreaker.severity === 'HARD_NO') hardNoCount++;
        else if (dealbreaker.severity === 'SOFT_NO') softNoCount++;
        else if (dealbreaker.severity === 'FLAG') flagCount++;
      }

    } catch (error) {
      console.error(`   ❌ Error analyzing dealbreaker ${dealbreaker.id}:`, error);
      // Add a failed result
      results.push({
        id: dealbreaker.id,
        description: dealbreaker.description,
        category: dealbreaker.category,
        severity: dealbreaker.severity,
        triggered: false,
        reasoning: 'Analysis failed - assuming not triggered',
        evidence: 'N/A'
      });
    }
  }

  console.log(`   Results: ${hardNoCount} HARD_NO, ${softNoCount} SOFT_NO, ${flagCount} FLAG`);

  return {
    passed: hardNoCount === 0,
    hard_no_count: hardNoCount,
    soft_no_count: softNoCount,
    flag_count: flagCount,
    results
  };
}

/**
 * Layer 2: AI-powered pattern matching
 */
async function applyPatterns(
  deckContext: DeckContext,
  patterns: Pattern[]
): Promise<any> {
  console.log('🔍 Layer 2: Matching patterns...');
  console.log(`   Analyzing ${patterns.length} patterns`);

  if (patterns.length === 0) {
    return {
      success_patterns: [],
      failure_patterns: [],
      warning_patterns: [],
      net_adjustment: 0
    };
  }

  const successPatterns: PatternMatch[] = [];
  const failurePatterns: PatternMatch[] = [];
  const warningPatterns: PatternMatch[] = [];

  // Batch analyze patterns with AI
  for (const pattern of patterns) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      const prompt = `You are a VC investment analyst. Analyze if this pitch deck matches the following ${pattern.type} pattern:

**Pattern to Match:**
Type: ${pattern.type}
Description: ${pattern.pattern}
Weight: ${pattern.weight}%
${pattern.examples ? `Examples: ${pattern.examples}` : ''}

**Company Information:**
Name: ${deckContext.company_name}
Industry: ${deckContext.industry}
Stage: ${deckContext.stage}

**Deck Content:**
${deckContext.deck_text.substring(0, 3000)}

**Your Task:**
1. Rate confidence this pattern matches (0.0 to 1.0)
2. Provide specific evidence from the deck
3. Estimate impact on investment decision (+/- points)

Return ONLY a JSON object:
{
  "confidence": 0.0 to 1.0,
  "evidence": "Specific evidence from deck",
  "impact": number (positive for success patterns, negative for failure patterns)
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }
      
      const aiResult = JSON.parse(jsonMatch[0]);
      
      // Only include if confidence > 0.3
      if (aiResult.confidence > 0.3) {
        const match: PatternMatch = {
          pattern: pattern.pattern,
          type: pattern.type,
          confidence: aiResult.confidence,
          evidence: aiResult.evidence,
          weight: pattern.weight / 100,
          impact: aiResult.impact * (pattern.weight / 100)
        };

        if (pattern.type === 'success') successPatterns.push(match);
        else if (pattern.type === 'failure') failurePatterns.push(match);
        else warningPatterns.push(match);
      }

    } catch (error) {
      console.error(`   ❌ Error analyzing pattern:`, error);
    }
  }

  // Calculate net adjustment
  const successTotal = successPatterns.reduce((sum, p) => sum + p.impact, 0);
  const failureTotal = failurePatterns.reduce((sum, p) => sum + p.impact, 0);
  const netAdjustment = successTotal + failureTotal;

  console.log(`   Matches: ${successPatterns.length} success, ${failurePatterns.length} failure, ${warningPatterns.length} warning`);
  console.log(`   Net adjustment: ${netAdjustment.toFixed(1)} points`);

  return {
    success_patterns: successPatterns,
    failure_patterns: failurePatterns,
    warning_patterns: warningPatterns,
    net_adjustment: netAdjustment
  };
}

/**
 * Layer 3: Stage-specific context weights
 */
function getContextWeights(
  deckStage: string,
  contextWeights: ContextWeights[]
): any {
  console.log('⚖️ Layer 3: Applying context weights...');
  
  // Map deck stage to closest preference stage
  let targetStage = 'Seed';
  if (deckStage.toLowerCase().includes('pre-seed')) targetStage = 'Pre-seed';
  else if (deckStage.toLowerCase().includes('seed')) targetStage = 'Seed';
  else if (deckStage.toLowerCase().includes('series a') || deckStage.toLowerCase().includes('a round')) targetStage = 'Series A';
  else if (deckStage.toLowerCase().includes('series b') || deckStage.toLowerCase().includes('series c')) targetStage = 'Series B+';

  const weights = contextWeights.find(cw => cw.stage === targetStage);
  
  if (!weights) {
    console.log(`   ⚠️ No weights found for stage ${targetStage}, using defaults`);
    return {
      stage: targetStage,
      weights: {
        team: 25,
        market: 25,
        product: 25,
        traction: 15,
        finance: 10
      },
      applied: false
    };
  }

  console.log(`   Applied ${targetStage} weights`);
  return {
    stage: targetStage,
    weights: weights.weights,
    applied: true
  };
}

/**
 * Layer 4: Thesis alignment + bias detection
 */
async function applyThesisAlignment(
  deckContext: DeckContext,
  thesis: ThesisAlignment
): Promise<ThesisAlignmentResult> {
  console.log('🎯 Layer 4: Evaluating thesis alignment...');

  // Basic matching
  const sectorMatch = thesis.target_sectors.some(sector => 
    deckContext.industry.toLowerCase().includes(sector.toLowerCase())
  );
  
  const stageMatch = thesis.target_stages.some(stage => 
    deckContext.stage.toLowerCase().includes(stage.toLowerCase())
  );

  // For now, default geography and check size to true (would need more context)
  const geographyMatch = true;
  const checkSizeMatch = true;

  // AI-powered strategic priorities matching
  let strategicMatch = 0.5;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `You are a VC analyst. Rate how well this company aligns with these strategic investment priorities:

**VC Strategic Priorities:**
${thesis.strategic_priorities}

**Company Information:**
Name: ${deckContext.company_name}
Industry: ${deckContext.industry}
Stage: ${deckContext.stage}

**Deck Summary:**
${deckContext.deck_text.substring(0, 2000)}

Return ONLY a JSON object:
{
  "alignment_score": 0.0 to 1.0,
  "reasoning": "Brief explanation of alignment or misalignment"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const aiResult = JSON.parse(jsonMatch[0]);
      strategicMatch = aiResult.alignment_score;
    }
  } catch (error) {
    console.error('   ❌ Error evaluating strategic alignment:', error);
  }

  // Calculate overall score
  const overallScore = (
    (sectorMatch ? 0.25 : 0) +
    (stageMatch ? 0.25 : 0) +
    (geographyMatch ? 0.15 : 0) +
    (checkSizeMatch ? 0.15 : 0) +
    (strategicMatch * 0.2)
  );

  // Bonus/Penalty logic
  let bonusPenalty = 0;
  if (overallScore > 0.75) bonusPenalty = 10;
  else if (overallScore < 0.4) bonusPenalty = -10;

  // Bias detection
  const biasAlerts: string[] = [];
  if (overallScore > 0.85) {
    biasAlerts.push(`HALO_EFFECT: Very strong thesis match (${(overallScore * 100).toFixed(0)}%). Watch for overoptimism.`);
  }
  if (overallScore < 0.3) {
    biasAlerts.push(`HORN_EFFECT: Very weak thesis match (${(overallScore * 100).toFixed(0)}%). Ensure fair evaluation.`);
  }

  console.log(`   Overall alignment: ${(overallScore * 100).toFixed(0)}%`);
  console.log(`   Bonus/Penalty: ${bonusPenalty} points`);
  if (biasAlerts.length > 0) {
    console.log(`   ⚠️ Bias alerts: ${biasAlerts.length}`);
  }

  return {
    overall_score: overallScore,
    sector_match: sectorMatch,
    stage_match: stageMatch,
    geography_match: geographyMatch,
    check_size_match: checkSizeMatch,
    strategic_priorities_match: strategicMatch,
    bonus_penalty: bonusPenalty,
    bias_alerts: biasAlerts
  };
}

/**
 * Generate final proceed/reject recommendation
 */
function generateFinalRecommendation(
  dealbreakers: any,
  patterns: any,
  thesis: ThesisAlignmentResult
): any {
  console.log('🎯 Generating final recommendation...');

  const strengths: string[] = [];
  const concerns: string[] = [];

  // Check dealbreakers first
  if (dealbreakers.hard_no_count > 0) {
    concerns.push(`HARD_NO: ${dealbreakers.hard_no_count} critical dealbreaker(s) triggered`);
  }
  if (dealbreakers.soft_no_count > 0) {
    concerns.push(`SOFT_NO: ${dealbreakers.soft_no_count} significant concern(s) flagged`);
  }
  if (dealbreakers.flag_count > 0) {
    concerns.push(`FLAG: ${dealbreakers.flag_count} item(s) need investigation`);
  }

  // Pattern insights
  if (patterns.success_patterns.length > 0) {
    const topSuccess = patterns.success_patterns[0];
    strengths.push(`Strong ${topSuccess.type} pattern match: ${topSuccess.pattern} (${(topSuccess.confidence * 100).toFixed(0)}% confidence)`);
  }
  if (patterns.failure_patterns.length > 0) {
    const topFailure = patterns.failure_patterns[0];
    concerns.push(`Failure pattern detected: ${topFailure.pattern} (${(topFailure.confidence * 100).toFixed(0)}% confidence)`);
  }

  // Thesis alignment
  if (thesis.overall_score > 0.7) {
    strengths.push(`Strong thesis alignment (${(thesis.overall_score * 100).toFixed(0)}%) with ${thesis.bonus_penalty > 0 ? '+' : ''}${thesis.bonus_penalty} bonus`);
  } else if (thesis.overall_score < 0.4) {
    concerns.push(`Weak thesis alignment (${(thesis.overall_score * 100).toFixed(0)}%) with ${thesis.bonus_penalty} penalty`);
  }

  // Bias alerts
  if (thesis.bias_alerts.length > 0) {
    concerns.push(...thesis.bias_alerts);
  }

  // Decision logic
  let proceed = true;
  let confidence = 0.5;
  let reasoning = '';

  if (dealbreakers.hard_no_count > 0) {
    // Hard No = Auto-reject
    proceed = false;
    confidence = 0.1 + (dealbreakers.hard_no_count * 0.05);
    if (confidence > 0.5) confidence = 0.5; // Cap at 50% confidence in rejection
    reasoning = `REJECT: ${dealbreakers.hard_no_count} critical dealbreaker(s) triggered. Hard No rules override all positive signals.`;
  } else {
    // Calculate confidence score
    let baseConfidence = 0.5;
    
    // Adjust for patterns
    baseConfidence += (patterns.net_adjustment / 100);
    
    // Adjust for thesis alignment
    baseConfidence += (thesis.overall_score - 0.5) * 0.4;
    
    // Adjust for soft concerns
    if (dealbreakers.soft_no_count > 0) {
      baseConfidence -= (dealbreakers.soft_no_count * 0.1);
    }
    
    // Clamp confidence
    confidence = Math.max(0.1, Math.min(0.95, baseConfidence));
    
    // Decision threshold
    if (confidence >= 0.6) {
      proceed = true;
      reasoning = `STRONG INTEREST: High confidence (${(confidence * 100).toFixed(0)}%) based on ${strengths.length} key strengths${concerns.length > 0 ? ` with ${concerns.length} concerns to address` : ''}.`;
    } else if (confidence >= 0.4) {
      proceed = true; // Marginal pass
      reasoning = `PROCEED WITH CAUTION: Moderate confidence (${(confidence * 100).toFixed(0)}%). Requires deeper diligence on ${concerns.length} concern areas.`;
    } else {
      proceed = false;
      reasoning = `REJECT: Low confidence (${(confidence * 100).toFixed(0)}%). ${concerns.length} significant concerns outweigh ${strengths.length} strengths.`;
    }
  }

  console.log(`   Decision: ${proceed ? 'PROCEED' : 'REJECT'}`);
  console.log(`   Confidence: ${(confidence * 100).toFixed(0)}%`);

  return {
    proceed,
    confidence,
    reasoning,
    key_strengths: strengths,
    key_concerns: concerns
  };
}
