# 🤖 Gemini AI Prompt System - How It Works

## 📋 The Complete Flow

### 1. PDF Upload
```
User uploads PDF → Express/Multer saves to /uploads → Triggers analysis
```

### 2. Text Extraction
```javascript
// Uses pdf-parse library
const extractedText = await extractTextFromPDF(pdfBuffer);
// Example output: "Slide 1: Problem Statement\nWe're solving X problem..."
```

### 3. Gemini AI Prompt (THE MAGIC!)

Here's the **EXACT PROMPT** sent to Gemini Pro:

```
You are an expert VC analyst evaluating startup pitch decks. 
Analyze the following pitch deck for [Company Name] and provide detailed, actionable feedback.

PITCH DECK CONTENT:
[Full extracted PDF text - could be 1000-5000 words]

Provide your analysis in the following JSON format (be strict about the format):

{
  "overallAnalysis": {
    "problemScore": <number 0-100>,
    "solutionScore": <number 0-100>,
    "marketScore": <number 0-100>,
    "tractionScore": <number 0-100>,
    "teamScore": <number 0-100>,
    "financialsScore": <number 0-100>,
    "overallScore": <number 0-100>,
    "strengths": [<3 key strengths as strings>],
    "weaknesses": [<3 areas to improve as strings>],
    "keyInsights": [<3 critical insights as strings>],
    "recommendation": "<One paragraph investment recommendation>"
  },
  "sectionAnalysis": [
    {
      "sectionName": "Problem",
      "sectionScore": <number 0-100>,
      "feedback": "<2-3 sentences about this section>",
      "strengths": [<2 specific strengths>],
      "improvements": [<2 specific improvements>]
    },
    ... (5 more sections: Solution, Market, Traction, Team, Financials)
  ]
}

SCORING CRITERIA:
- Problem (0-100): Clarity, urgency, market pain point validation
- Solution (0-100): Innovation, differentiation, feasibility, product-market fit
- Market (0-100): TAM/SAM/SOM analysis, growth potential, competitive landscape
- Traction (0-100): Revenue, users, growth rate, key metrics, customer validation
- Team (0-100): Relevant experience, domain expertise, execution capability
- Financials (0-100): Revenue model clarity, unit economics, projections realism

Be critical but constructive. Focus on actionable insights.
```

### 4. Gemini Processes (10-60 seconds)

Gemini Pro reads the ENTIRE pitch deck text and:
- Identifies the 6 key sections
- Scores each section 0-100
- Generates specific feedback
- Finds strengths and weaknesses
- Creates actionable recommendations

### 5. Response Parsing

```javascript
// Gemini returns text with JSON embedded
const response = await model.generateContent(prompt);
const text = response.text();

// Extract JSON from response
const jsonMatch = text.match(/\{[\s\S]*\}/);
const aiResponse = JSON.parse(jsonMatch[0]);
```

### 6. Database Storage

```sql
-- Stores in deck_analysis table
INSERT INTO deck_analysis (
  deck_id,
  section_name,
  section_score,
  feedback,
  strengths,
  improvements
) VALUES (...);

-- Updates pitch_decks table
UPDATE pitch_decks 
SET analysis_status = 'completed', 
    sso_score = 0.83,
    analyzed_at = CURRENT_TIMESTAMP
WHERE id = deck_id;
```

---

## 🎯 Example Real Analysis

### Input PDF Content:
```
Slide 1: TechFlow AI - Revolutionizing Enterprise Workflows

Problem Statement:
Enterprise teams waste 40% of their time on repetitive tasks...

Our Solution:
AI-powered automation that learns from your workflows...

Market Opportunity:
$12B TAM in workflow automation...
```

### Gemini's Response:
```json
{
  "overallAnalysis": {
    "problemScore": 85,
    "solutionScore": 90,
    "marketScore": 78,
    "tractionScore": 82,
    "teamScore": 88,
    "financialsScore": 75,
    "overallScore": 83,
    "strengths": [
      "Strong technical team with ML expertise from Google and OpenAI",
      "Clear market differentiation with AI-first approach",
      "Early traction with 3 Fortune 500 customers"
    ],
    "weaknesses": [
      "Limited financial projections beyond Year 2",
      "Competitive landscape analysis needs more depth",
      "Unit economics not fully explained"
    ],
    "keyInsights": [
      "AI automation shows 40% efficiency gains vs competitors",
      "TAM of $12B growing at 25% CAGR",
      "3x YoY revenue growth demonstrates strong product-market fit"
    ],
    "recommendation": "Strong investment opportunity. The team's AI expertise combined with early Fortune 500 validation suggests significant upside. However, require deeper dive on unit economics and competitive moats before term sheet."
  },
  "sectionAnalysis": [
    {
      "sectionName": "Problem",
      "sectionScore": 85,
      "feedback": "Clear articulation of enterprise workflow inefficiencies with quantified impact (40% time waste). Strong validation through customer interviews cited.",
      "strengths": [
        "Quantified problem with specific metrics",
        "Market validation through 50+ customer interviews"
      ],
      "improvements": [
        "Add more customer testimonials or pain point quotes",
        "Expand on secondary problems solved"
      ]
    },
    {
      "sectionName": "Solution",
      "sectionScore": 90,
      "feedback": "Innovative AI-powered approach with clear technical differentiation. Product screenshots show mature UX. Integration with existing tools is well-explained.",
      "strengths": [
        "Technical innovation with proprietary ML models",
        "Clear differentiation from Zapier/Workato"
      ],
      "improvements": [
        "Add more detail on AI training methodology",
        "Include customer implementation timelines"
      ]
    }
    // ... 4 more sections
  ]
}
```

---

## 💡 Why This Works

### 1. Structured Prompt
- Clear role: "Expert VC analyst"
- Specific task: "Analyze this deck"
- Exact format: JSON schema
- Scoring criteria: Detailed rubric

### 2. Context-Rich
- Full PDF text included (not just summaries)
- Company name for personalization
- Industry-specific insights

### 3. Actionable Output
- Specific scores (not just "good" or "bad")
- Concrete strengths/weaknesses
- Improvement suggestions
- Investment recommendation

### 4. Consistent Format
- Always returns same JSON structure
- Easy to parse and display
- Database-ready format

---

## 🔍 What Gemini Actually Reads

When you upload a 15-slide pitch deck PDF, Gemini receives something like:

```
Slide 1 - Cover
TechFlow AI
Series A Fundraise

Slide 2 - Problem
Enterprise teams waste 40% of their time on repetitive tasks
Manual data entry costs companies $3.2M annually
Traditional automation tools require coding expertise

Slide 3 - Solution
AI-powered workflow automation
No-code interface
Learns from your existing workflows
Integrates with 200+ tools

Slide 4 - Market
$12B TAM in workflow automation
Growing 25% CAGR
Fortune 500 companies spending $500K-2M on automation

Slide 5 - Product Demo
[Screenshots and features]

Slide 6 - Traction
$2.4M ARR
125 enterprise customers
3 Fortune 500 logos
150% net revenue retention

Slide 7 - Team
CEO: 10 years at Google AI
CTO: Ex-OpenAI research scientist
VP Eng: Built automation at Salesforce

Slide 8 - Financials
Current: $2.4M ARR
Year 1: $8M projected
Year 2: $20M projected
45% gross margin

Slide 9 - Competition
vs Zapier, Workato, Tray.io
Our advantage: AI-first, no-code, enterprise-grade

Slide 10 - Go-to-Market
Enterprise sales team of 8
Partnerships with Salesforce, HubSpot
$120K average deal size

... etc
```

Gemini reads **ALL OF THIS** and generates the detailed analysis!

---

## 🎬 The Prompt in Action

### Step-by-Step:

1. **User uploads** `techflow_pitch.pdf`
2. **pdf-parse extracts** 3,452 words of text
3. **Prompt is constructed**:
   ```
   "You are an expert VC analyst evaluating startup pitch decks. 
    Analyze the following pitch deck for TechFlow AI..."
   ```
4. **Sent to Gemini** via API
5. **Gemini processes** for ~20 seconds
6. **Returns JSON** with all scores and feedback
7. **Saved to database** as structured data
8. **Frontend displays** beautiful analysis UI

---

## 🔧 Key Code Locations

- **Prompt**: `server/src/services/ai.ts` (line 33-108)
- **Text Extraction**: `server/src/services/ai.ts` (line 148-155)
- **Full Pipeline**: `server/src/services/ai.ts` (line 157-176)
- **Upload Handler**: `server/src/routes/decks.ts` (line 75-150)

---

## 🚀 This Is Why It's REAL

- ✅ Reads entire PDF content
- ✅ Uses actual Gemini Pro API
- ✅ Custom prompt engineered for VC analysis
- ✅ Structured JSON output
- ✅ Saved to real database
- ✅ Every upload gets unique analysis

**NO FAKE DATA - EVERY ANALYSIS IS UNIQUE TO YOUR PDF!** 🤖✨
