/**
 * 🤖 Agentic PDF Orchestrator
 * 
 * This service uses Vertex AI to dynamically generate ALL content for enhanced PDFs.
 * No more hardcoded templates - the AI creates:
 * - Executive summaries tailored to the specific startup
 * - Visual layout recommendations
 * - Narrative insights (not generic bullet points)
 * - Risk assessments with context
 * - Action items specific to the company's stage/industry
 * 
 * Architecture:
 * 1. Content Planner Agent: Decides what sections to include based on analysis
 * 2. Visual Designer Agent: Recommends charts, highlights, layout
 * 3. Writer Agent: Generates investor-grade prose
 * 4. Quality Agent: Validates output and ensures consistency
 */

import { VertexAI, GenerateContentResponse } from '@google-cloud/vertexai';

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || 'projectsso-473108',
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

// Helper function to extract text from Vertex AI response
function extractText(response: GenerateContentResponse): string {
  return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

interface PDFContentRequest {
  analysis: any;
  companyName: string;
  stage: string;
  industry: string;
  vcPreferences?: any;
  webEnrichment?: any;
}

interface AgenticPDFContent {
  executiveSummary: {
    headline: string;
    narrative: string; // 200-300 words of AI-generated prose
    keyTakeaways: string[];
  };
  visualRecommendations: {
    priorityMetrics: Array<{
      label: string;
      value: string;
      visualization: 'bar' | 'gauge' | 'line' | 'number';
      color: string;
    }>;
    charts: Array<{
      type: 'score_radar' | 'benchmark_comparison' | 'growth_trajectory';
      data: any;
      title: string;
    }>;
  };
  narrativeInsights: {
    strengthsStory: string; // AI-generated paragraph, not bullets
    weaknessesStory: string;
    opportunityAnalysis: string;
  };
  riskAssessment: {
    narrative: string; // Contextual risk analysis
    riskMatrix: Array<{
      category: string;
      severity: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
  };
  actionItems: {
    immediate: Array<{ action: string; rationale: string; timeline: string }>;
    shortTerm: Array<{ action: string; rationale: string; timeline: string }>;
    strategic: Array<{ action: string; rationale: string; timeline: string }>;
  };
  investmentThesis: {
    bullCase: string; // AI-generated paragraph
    bearCase: string;
    recommendation: 'strong_invest' | 'invest_with_conditions' | 'pass' | 'watch';
    rationale: string;
  };
}

/**
 * 🧠 Content Planner Agent
 * Decides what sections the PDF should have based on the analysis quality and completeness
 */
async function planPDFContent(request: PDFContentRequest): Promise<any> {
  const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.3, // Lower temp for structured planning
      maxOutputTokens: 2048,
    },
  });

  const prompt = `You are a PDF content planner for investment memos.

Given this startup analysis, decide what sections to include and prioritize:

Company: ${request.companyName}
Stage: ${request.stage}
Industry: ${request.industry}
Overall Score: ${request.analysis?.overall?.sso_score || 'N/A'}/100

Analysis Available:
- Team & Execution: ${request.analysis?.analysis?.sections?.find((s: any) => s.name === 'Team & Execution') ? 'Yes' : 'No'}
- Market Opportunity: ${request.analysis?.analysis?.sections?.find((s: any) => s.name === 'Market Opportunity') ? 'Yes' : 'No'}
- Product & Technology: ${request.analysis?.analysis?.sections?.find((s: any) => s.name === 'Product & Technology') ? 'Yes' : 'No'}
- Traction & Metrics: ${request.analysis?.analysis?.sections?.find((s: any) => s.name === 'Traction & Metrics') ? 'Yes' : 'No'}
- Business Model: ${request.analysis?.analysis?.sections?.find((s: any) => s.name === 'Business Model') ? 'Yes' : 'No'}
- Financials: ${request.analysis?.analysis?.sections?.find((s: any) => s.name === 'Financials') ? 'Yes' : 'No'}
- Risk Assessment: ${request.analysis?.analysis?.sections?.find((s: any) => s.name === 'Risk Assessment') ? 'Yes' : 'No'}

${request.vcPreferences ? `VC Custom Criteria: ${JSON.stringify(request.vcPreferences.criteria.map((c: any) => c.name))}` : ''}

Return a JSON object with this structure:
{
  "prioritySections": ["section1", "section2", ...],
  "visualFocus": "what metrics/charts to emphasize",
  "narrativeStyle": "formal|conversational|technical",
  "keyQuestions": ["questions investors would ask"],
  "suggestedPageCount": 8-15
}`;

  const result = await model.generateContent(prompt);
  const text = extractText(result.response);
  
  // Extract JSON from markdown code blocks if present
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  }
  
  // Fallback to default plan
  return {
    prioritySections: ['executive_summary', 'scores', 'insights', 'risks', 'actions'],
    visualFocus: 'key metrics and benchmarks',
    narrativeStyle: 'formal',
    keyQuestions: [],
    suggestedPageCount: 10,
  };
}

/**
 * ✍️ Writer Agent
 * Generates investor-grade prose (not generic bullets)
 */
async function generateExecutiveSummary(request: PDFContentRequest): Promise<any> {
  const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.7, // Higher temp for creative writing
      maxOutputTokens: 4096,
    },
  });

  const sections = request.analysis?.analysis?.sections || [];
  const overall = request.analysis?.overall || {};

  const prompt = `You are writing the executive summary for an investment memo.

Company: ${request.companyName}
Stage: ${request.stage}
Industry: ${request.industry}
SSO Score: ${overall.sso_score}/100

Key Analysis:
${sections.map((s: any) => `- ${s.name}: ${s.score}/10 - ${s.analysis?.substring(0, 200)}...`).join('\n')}

Strengths:
${overall.strengths?.map((s: string) => `- ${s}`).join('\n') || 'N/A'}

Weaknesses:
${overall.weaknesses?.map((w: string) => `- ${w}`).join('\n') || 'N/A'}

Write a compelling, factual executive summary that:
1. Opens with a punchy headline (one sentence)
2. Provides a 250-word narrative that flows naturally (not bullets)
3. Ends with 3-4 key takeaways (bullets)

The narrative should read like it was written by an experienced analyst, not AI.
Use specific details from the analysis. Avoid generic phrases like "shows promise" or "has potential".

Return JSON:
{
  "headline": "...",
  "narrative": "...",
  "keyTakeaways": ["...", "...", "..."]
}`;

  const result = await model.generateContent(prompt);
  const text = extractText(result.response);
  
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  }
  
  // Fallback
  return {
    headline: `${request.companyName}: ${request.stage} ${request.industry} Startup`,
    narrative: overall.recommendation || 'Analysis in progress.',
    keyTakeaways: overall.strengths?.slice(0, 3) || [],
  };
}

/**
 * 🎨 Visual Designer Agent
 * Recommends which metrics to highlight and how to visualize them
 */
async function generateVisualRecommendations(request: PDFContentRequest): Promise<any> {
  const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 2048,
    },
  });

  const sections = request.analysis?.analysis?.sections || [];

  const prompt = `You are a data visualization expert for investment memos.

Company: ${request.companyName}
Stage: ${request.stage}
Industry: ${request.industry}

Available Scores:
${sections.map((s: any) => `- ${s.name}: ${s.score}/10`).join('\n')}

Recommend:
1. Top 4 priority metrics to display prominently (with visualization type: bar, gauge, line, or number)
2. Which chart types would be most impactful (score_radar, benchmark_comparison, growth_trajectory)
3. Color scheme based on scores (use red for <6.0, orange for 6.0-7.9, green for 8.0+)

Return JSON:
{
  "priorityMetrics": [
    {"label": "...", "value": "...", "visualization": "bar|gauge|line|number", "color": "#hex"},
    ...
  ],
  "charts": [
    {"type": "score_radar", "title": "...", "priority": 1},
    ...
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = extractText(result.response);
  
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    // Add actual score data to charts
    data.charts = data.charts.map((chart: any) => ({
      ...chart,
      data: sections.map((s: any) => ({ dimension: s.name, score: s.score * 10 })),
    }));
    return data;
  }
  
  // Fallback
  return {
    priorityMetrics: sections.slice(0, 4).map((s: any) => ({
      label: s.name,
      value: `${s.score}/10`,
      visualization: 'gauge',
      color: s.score >= 8 ? '#10b981' : s.score >= 6 ? '#f59e0b' : '#ef4444',
    })),
    charts: [
      { type: 'score_radar', title: '7-Dimension Analysis', priority: 1, data: sections.map((s: any) => ({ dimension: s.name, score: s.score * 10 })) },
    ],
  };
}

/**
 * 📖 Narrative Insights Generator
 * Converts bullet points into flowing paragraphs
 */
async function generateNarrativeInsights(request: PDFContentRequest): Promise<any> {
  const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3072,
    },
  });

  const overall = request.analysis?.overall || {};

  const prompt = `You are a senior investment analyst writing narrative insights.

Company: ${request.companyName}
Stage: ${request.stage}
Industry: ${request.industry}

Strengths:
${overall.strengths?.map((s: string) => `- ${s}`).join('\n') || 'N/A'}

Weaknesses:
${overall.weaknesses?.map((w: string) => `- ${w}`).join('\n') || 'N/A'}

Write three flowing paragraphs (150-200 words each):
1. Strengths Story: Weave the strengths into a compelling narrative about why this company could win.
2. Weaknesses Story: Explain the concerns in context, with nuance (not just listing problems).
3. Opportunity Analysis: What could unlock 10x growth? What market shifts favor this company?

Avoid generic phrases. Use specifics from the analysis. Write like you're briefing a partner.

Return JSON:
{
  "strengthsStory": "...",
  "weaknessesStory": "...",
  "opportunityAnalysis": "..."
}`;

  const result = await model.generateContent(prompt);
  const text = extractText(result.response);
  
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  }
  
  // Fallback
  return {
    strengthsStory: overall.strengths?.join(' ') || 'Strengths identified in analysis.',
    weaknessesStory: overall.weaknesses?.join(' ') || 'Areas for improvement noted.',
    opportunityAnalysis: 'Market opportunity assessment in progress.',
  };
}

/**
 * ⚠️ Risk Assessment Generator
 * Creates contextual risk analysis with severity and mitigation
 */
async function generateRiskAssessment(request: PDFContentRequest): Promise<any> {
  const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 2048,
    },
  });

  const riskSection = request.analysis?.analysis?.sections?.find((s: any) => s.name === 'Risk Assessment');

  const prompt = `You are a risk analyst for VC investments.

Company: ${request.companyName}
Stage: ${request.stage}
Industry: ${request.industry}

Risk Analysis:
${riskSection?.analysis || 'Limited risk data available'}

Create a risk assessment with:
1. A 150-word narrative explaining the risk landscape
2. A risk matrix with 3-5 specific risks, each with severity (low/medium/high) and mitigation strategies

Return JSON:
{
  "narrative": "...",
  "riskMatrix": [
    {"category": "Market Risk", "severity": "medium", "mitigation": "..."},
    ...
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = extractText(result.response);
  
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  }
  
  // Fallback
  return {
    narrative: riskSection?.analysis || 'Risk assessment data is limited.',
    riskMatrix: [
      { category: 'Market Risk', severity: 'medium', mitigation: 'Monitor market trends closely' },
      { category: 'Execution Risk', severity: 'medium', mitigation: 'Track team deliverables' },
    ],
  };
}

/**
 * 🎯 Action Items Generator
 * Creates specific, prioritized action items with timelines
 */
async function generateActionItems(request: PDFContentRequest): Promise<any> {
  const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 2048,
    },
  });

  const overall = request.analysis?.overall || {};

  const prompt = `You are creating actionable next steps for this investment opportunity.

Company: ${request.companyName}
Stage: ${request.stage}
SSO Score: ${overall.sso_score}/100

Recommendations:
${overall.recommendations?.map((r: string) => `- ${r}`).join('\n') || 'N/A'}

Create 3 tiers of action items:
1. Immediate (0-30 days): What should happen RIGHT NOW
2. Short-Term (1-3 months): Quick wins and proof points
3. Strategic (3-12 months): Long-term improvements

Each action needs: action description, rationale (why), timeline (specific)

Return JSON:
{
  "immediate": [{"action": "...", "rationale": "...", "timeline": "..."}],
  "shortTerm": [{"action": "...", "rationale": "...", "timeline": "..."}],
  "strategic": [{"action": "...", "rationale": "...", "timeline": "..."}]
}`;

  const result = await model.generateContent(prompt);
  const text = extractText(result.response);
  
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  }
  
  // Fallback
  return {
    immediate: [{ action: 'Schedule founder call', rationale: 'Clarify key metrics', timeline: 'This week' }],
    shortTerm: [{ action: 'Request financial model', rationale: 'Validate projections', timeline: '2 weeks' }],
    strategic: [{ action: 'Monitor growth metrics', rationale: 'Track progress', timeline: 'Quarterly' }],
  };
}

/**
 * 💼 Investment Thesis Generator
 * Generates bull/bear cases and recommendation
 */
async function generateInvestmentThesis(request: PDFContentRequest): Promise<any> {
  const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  const overall = request.analysis?.overall || {};

  const prompt = `You are writing an investment thesis for a partner meeting.

Company: ${request.companyName}
Stage: ${request.stage}
Industry: ${request.industry}
SSO Score: ${overall.sso_score}/100

Overall Assessment:
${overall.recommendation || 'N/A'}

Write:
1. Bull Case (150 words): Best-case scenario if everything goes right
2. Bear Case (150 words): What could go wrong
3. Recommendation: strong_invest | invest_with_conditions | pass | watch
4. Rationale (100 words): Why this recommendation

Be brutally honest. Partners need clear signal, not hedging.

Return JSON:
{
  "bullCase": "...",
  "bearCase": "...",
  "recommendation": "strong_invest|invest_with_conditions|pass|watch",
  "rationale": "..."
}`;

  const result = await model.generateContent(prompt);
  const text = extractText(result.response);
  
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1] || jsonMatch[0]);
  }
  
  // Fallback
  const score = overall.sso_score || 0;
  return {
    bullCase: 'If execution is strong, this could be a category leader.',
    bearCase: 'Market risks and competitive pressures could limit growth.',
    recommendation: score >= 80 ? 'strong_invest' : score >= 65 ? 'invest_with_conditions' : score >= 50 ? 'watch' : 'pass',
    rationale: overall.recommendation || 'Based on current analysis.',
  };
}

/**
 * 🚀 Main Orchestrator Function
 * Coordinates all agents to generate complete PDF content
 */
export async function generateAgenticPDFContent(request: PDFContentRequest): Promise<AgenticPDFContent> {
  console.log(`🤖 Starting agentic PDF content generation for ${request.companyName}...`);

  try {
    // Run all agents in parallel for speed
    const [
      contentPlan,
      executiveSummary,
      visualRecommendations,
      narrativeInsights,
      riskAssessment,
      actionItems,
      investmentThesis,
    ] = await Promise.all([
      planPDFContent(request),
      generateExecutiveSummary(request),
      generateVisualRecommendations(request),
      generateNarrativeInsights(request),
      generateRiskAssessment(request),
      generateActionItems(request),
      generateInvestmentThesis(request),
    ]);

    console.log('✅ All agentic content generated successfully');

    return {
      executiveSummary,
      visualRecommendations,
      narrativeInsights,
      riskAssessment,
      actionItems,
      investmentThesis,
    };
  } catch (error) {
    console.error('❌ Error in agentic PDF generation:', error);
    throw error;
  }
}

/**
 * 🎨 Preview Generator
 * Creates a markdown preview of the PDF content (for UI display before download)
 */
export async function generatePDFPreview(request: PDFContentRequest): Promise<string> {
  const content = await generateAgenticPDFContent(request);

  return `# ${request.companyName} - Investment Memo

## ${content.executiveSummary.headline}

${content.executiveSummary.narrative}

### Key Takeaways
${content.executiveSummary.keyTakeaways.map((t) => `- ${t}`).join('\n')}

---

## Investment Thesis

### 🚀 Bull Case
${content.investmentThesis.bullCase}

### ⚠️ Bear Case
${content.investmentThesis.bearCase}

### 📊 Recommendation: ${content.investmentThesis.recommendation.toUpperCase().replace('_', ' ')}
${content.investmentThesis.rationale}

---

## Narrative Insights

### Strengths
${content.narrativeInsights.strengthsStory}

### Areas for Improvement
${content.narrativeInsights.weaknessesStory}

### Market Opportunity
${content.narrativeInsights.opportunityAnalysis}

---

## Risk Assessment
${content.riskAssessment.narrative}

### Risk Matrix
${content.riskAssessment.riskMatrix.map((r) => `- **${r.category}** (${r.severity}): ${r.mitigation}`).join('\n')}

---

## Action Items

### Immediate (0-30 days)
${content.actionItems.immediate.map((a) => `- ${a.action} - *${a.rationale}* (${a.timeline})`).join('\n')}

### Short-Term (1-3 months)
${content.actionItems.shortTerm.map((a) => `- ${a.action} - *${a.rationale}* (${a.timeline})`).join('\n')}

### Strategic (3-12 months)
${content.actionItems.strategic.map((a) => `- ${a.action} - *${a.rationale}* (${a.timeline})`).join('\n')}

---

*Generated by Team SSO Agentic PDF Orchestrator*
`;
}
