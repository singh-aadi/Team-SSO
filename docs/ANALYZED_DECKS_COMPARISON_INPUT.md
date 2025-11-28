# Analyzed Decks Comparison - Vertex AI Input Structure

## Overview
When comparing two **already-analyzed** pitch decks (Option 1), we fetch their complete analysis data from the database and send it to Vertex AI for comparative analysis.

---

## 📊 Data Flow

```
1. Frontend: User selects two analyzed decks (Deck A ID + Deck B ID)
2. Backend: Fetch full analysis from database for both decks
3. Backend: Format data into structured input
4. Backend: Send to Vertex AI with grounding for comparison
5. Backend: Return comparison results to frontend
```

---

## 🗄️ Database Data Retrieved (Per Deck)

### From `pitch_decks` table:
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "company_name": "TechFlow AI",
  "industry": "Enterprise SaaS",
  "stage": "Series A",
  "filename": "techflow_pitch_deck.pdf",
  "file_url": "https://storage.googleapis.com/...",
  "analysis_status": "completed",
  "sso_score": 0.85,
  "analyzed_at": "2025-11-28T10:30:00Z",
  "dual_pdf_analysis": {
    "problemScore": 88,
    "solutionScore": 92,
    "marketScore": 85,
    "tractionScore": 78,
    "teamScore": 90,
    "financialsScore": 82,
    "overallScore": 85.83,
    "strengths": [
      "Strong technical team with relevant industry experience",
      "Clear product differentiation with AI-powered automation",
      "Validated market need with early customer traction"
    ],
    "weaknesses": [
      "Limited financial projections beyond 18 months",
      "Competitive landscape analysis could be deeper",
      "Customer acquisition strategy needs more detail"
    ],
    "keyInsights": [
      "Enterprise SaaS with strong unit economics (LTV:CAC 5:1)",
      "Growing market with 40% CAGR",
      "Product-led growth with viral coefficient >1.2"
    ],
    "recommendation": "STRONG RECOMMEND - Solid fundamentals with clear path to Series A"
  }
}
```

### From `deck_analysis` table (Section breakdown):
```json
[
  {
    "section_name": "Problem",
    "section_score": 0.88,
    "feedback": "Clearly articulates the workflow automation pain points in enterprise settings...",
    "strengths": [
      "Quantifies the problem with compelling statistics",
      "Shows deep understanding of customer pain points"
    ],
    "improvements": [
      "Could include more customer quotes or case studies"
    ]
  },
  {
    "section_name": "Solution",
    "section_score": 0.92,
    "feedback": "Well-defined solution with clear technical differentiators...",
    "strengths": [
      "Clear product demonstration",
      "Technical architecture is well-explained"
    ],
    "improvements": [
      "More emphasis on competitive advantages"
    ]
  },
  // ... (Market, Traction, Team, Financials sections)
]
```

---

## 🤖 Input Format for Vertex AI Comparison

### Function Signature:
```typescript
export async function compareAnalyzedDecks(
  deck1Data: AnalyzedDeckData,
  deck2Data: AnalyzedDeckData,
  useGrounding: boolean = true
): Promise<ComparisonResult>
```

### Input Structure (deck1Data / deck2Data):
```typescript
interface AnalyzedDeckData {
  // Basic Info
  deckId: string;
  companyName: string;
  industry: string;
  stage: string;
  filename: string;
  analyzedAt: string;
  
  // Overall Analysis
  overallAnalysis: {
    ssoScore: number;           // 0-1 scale (0.85)
    problemScore: number;        // 0-100 scale (88)
    solutionScore: number;       // 0-100 scale (92)
    marketScore: number;         // 0-100 scale (85)
    tractionScore: number;       // 0-100 scale (78)
    teamScore: number;           // 0-100 scale (90)
    financialsScore: number;     // 0-100 scale (82)
    overallScore: number;        // 0-100 scale (85.83)
    strengths: string[];
    weaknesses: string[];
    keyInsights: string[];
    recommendation: string;
  };
  
  // Section-by-Section Analysis
  sections: Array<{
    sectionName: string;         // "Problem", "Solution", "Market", etc.
    sectionScore: number;        // 0-100 scale
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
}
```

---

## 📤 Actual Vertex AI Prompt (Example)

```
You are a senior VC analyst with expertise in startup evaluation and comparative analysis. 
You are comparing two pitch decks that have already been individually analyzed.

Use Google Search Grounding to validate market claims, competitor information, and industry benchmarks.

═══════════════════════════════════════════════════════════════════
DECK 1: TechFlow AI
═══════════════════════════════════════════════════════════════════

Company: TechFlow AI
Industry: Enterprise SaaS
Stage: Series A
Analyzed: 2025-11-28

Overall SSO Score: 85/100

SCORES BY CATEGORY:
- Problem:     88/100
- Solution:    92/100
- Market:      85/100
- Traction:    78/100
- Team:        90/100
- Financials:  82/100

STRENGTHS:
• Strong technical team with relevant industry experience
• Clear product differentiation with AI-powered automation
• Validated market need with early customer traction

WEAKNESSES:
• Limited financial projections beyond 18 months
• Competitive landscape analysis could be deeper
• Customer acquisition strategy needs more detail

KEY INSIGHTS:
• Enterprise SaaS with strong unit economics (LTV:CAC 5:1)
• Growing market with 40% CAGR
• Product-led growth with viral coefficient >1.2

SECTION ANALYSIS:
1. Problem (88/100):
   Strengths: Quantifies the problem with compelling statistics, Shows deep understanding of customer pain points
   Improvements: Could include more customer quotes or case studies
   
2. Solution (92/100):
   Strengths: Clear product demonstration, Technical architecture is well-explained
   Improvements: More emphasis on competitive advantages

[... continues for all sections]

═══════════════════════════════════════════════════════════════════
DECK 2: DataStream Analytics
═══════════════════════════════════════════════════════════════════

Company: DataStream Analytics
Industry: Data Analytics
Stage: Seed
Analyzed: 2025-11-27

Overall SSO Score: 72/100

SCORES BY CATEGORY:
- Problem:     75/100
- Solution:    80/100
- Market:      78/100
- Traction:    65/100
- Team:        72/100
- Financials:  62/100

STRENGTHS:
• Innovative approach to real-time data processing
• Large addressable market with clear growth trajectory
• Founding team has domain expertise

WEAKNESSES:
• Limited customer traction at current stage
• Financial model lacks detail on unit economics
• Go-to-market strategy is underdeveloped

KEY INSIGHTS:
• Early-stage with MVP launched but limited user base
• Market is competitive with several established players
• Technology is differentiated but needs more validation

[... continues with sections]

═══════════════════════════════════════════════════════════════════
COMPARATIVE ANALYSIS TASK
═══════════════════════════════════════════════════════════════════

Your task:
1. Compare the two decks across all dimensions
2. Use Google Search to validate:
   - Market size claims
   - Industry growth rates (40% CAGR vs actual)
   - Competitive landscape accuracy
   - Benchmark metrics (LTV:CAC ratios, etc.)
3. Identify which deck is stronger overall and in each category
4. Provide specific, actionable recommendations for each deck
5. Highlight key differences in approach, stage, and execution

CRITICAL: Return ONLY valid JSON in this exact format:
{
  "executiveSummary": "2-3 sentence high-level comparison with grounded insights",
  "overallWinner": "deck1" | "deck2" | "tie",
  "winnerReasoning": "Detailed explanation with web-validated facts",
  "categoryComparison": {
    "problem": {
      "winner": "deck1" | "deck2" | "tie",
      "deck1Score": 88,
      "deck2Score": 75,
      "analysis": "Comparative analysis with specific examples"
    },
    "solution": { ... },
    "market": { ... },
    "traction": { ... },
    "team": { ... },
    "financials": { ... }
  },
  "strengthsComparison": {
    "deck1Advantages": ["Unique strength 1", "Unique strength 2"],
    "deck2Advantages": ["Unique strength 1", "Unique strength 2"],
    "sharedStrengths": ["Common strength 1"]
  },
  "weaknessesComparison": {
    "deck1Concerns": ["Critical gap 1", "Critical gap 2"],
    "deck2Concerns": ["Critical gap 1", "Critical gap 2"],
    "sharedConcerns": ["Common weakness 1"]
  },
  "recommendations": {
    "deck1": [
      "Specific actionable recommendation 1",
      "Specific actionable recommendation 2",
      "Specific actionable recommendation 3"
    ],
    "deck2": [
      "Specific actionable recommendation 1",
      "Specific actionable recommendation 2",
      "Specific actionable recommendation 3"
    ]
  },
  "keyDifferentiators": [
    "Major difference 1 (with context)",
    "Major difference 2 (with context)",
    "Major difference 3 (with context)"
  ],
  "webValidation": {
    "marketSizeClaims": {
      "deck1Claim": "...",
      "deck2Claim": "...",
      "actualData": "...",
      "sources": ["url1", "url2"]
    },
    "competitiveLandscape": {
      "deck1Competitors": ["comp1", "comp2"],
      "deck2Competitors": ["comp1", "comp2"],
      "actualTopPlayers": ["player1", "player2"],
      "sources": ["url1"]
    },
    "industryGrowthRate": {
      "claimed": "40% CAGR",
      "validated": "35% CAGR",
      "sources": ["url1"]
    }
  },
  "investmentRecommendation": {
    "preferredDeck": "deck1" | "deck2" | "both" | "neither",
    "reasoning": "Detailed VC perspective with risk/opportunity analysis",
    "riskLevel": "low" | "medium" | "high",
    "timeframe": "immediate" | "monitor" | "pass"
  }
}
```

---

## 🎯 Key Differences from Current Implementation

### Current Implementation (Upload Both):
- Extracts text from PDF files
- Analyzes both decks from scratch with AI
- Sends raw text to Gemini (15,000 chars each)
- Limited structured data

### New Implementation (Both Analyzed):
- Uses pre-analyzed structured data from database
- Sends organized scores, insights, and sections
- No need to re-extract or re-analyze
- Faster processing (no PDF parsing)
- More accurate comparison (uses validated analysis)
- Can leverage Vertex AI Grounding for market validation

---

## ⚡ Performance Benefits

| Aspect | Upload Both | Both Analyzed |
|--------|------------|---------------|
| PDF Extraction | ✅ Required | ❌ Not needed |
| Individual Analysis | ✅ Required (2x) | ❌ Already done |
| Processing Time | ~60-90 seconds | ~15-20 seconds |
| Data Quality | Raw text | Structured analysis |
| Web Validation | Limited | Full grounding |
| Cost (API calls) | 3 calls | 1 call |

---

## 🔧 Implementation Steps

1. **Create new function**: `compareAnalyzedDecks(deck1Id, deck2Id)`
2. **Fetch both analyses**: Query database with deck IDs
3. **Format input**: Build structured AnalyzedDeckData objects
4. **Call Vertex AI**: Send comparison prompt with grounding
5. **Parse response**: Extract JSON comparison result
6. **Save to DB**: Store in `deck_comparisons` table
7. **Return**: Send to frontend

---

## 📝 Database Schema for Results

```sql
-- deck_comparisons table already exists
CREATE TABLE IF NOT EXISTS deck_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck1_id UUID REFERENCES pitch_decks(id),
    deck2_id UUID REFERENCES pitch_decks(id),
    user_id UUID REFERENCES users(id),
    comparison_type VARCHAR(20), -- 'analyzed', 'upload', 'mixed'
    comparison_result JSONB,      -- Stores the full comparison JSON
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ✅ Ready for Implementation

All data structures are defined. The input to Vertex AI will be:
1. **Two AnalyzedDeckData objects** (from database)
2. **Structured prompt** with scores, insights, and sections
3. **Grounding enabled** for market validation
4. **JSON response schema** for consistent parsing

Would you like me to implement this function now?
