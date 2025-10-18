# Dual PDF Analysis System - Complete Guide

## Overview

The Team-SSO platform now supports **comprehensive dual PDF analysis** for investment decisions. Unlike traditional pitch deck analysis tools, our system analyzes **TWO documents together**:

1. **Pitch Deck PDF** - Contains visual elements (charts, graphs, images) and narrative content
2. **Founder Checklist PDF** - Contains structured requirements (unit economics, growth metrics, payment info, external links)

This mirrors real VC due diligence where investors evaluate **both** the pitch narrative AND foundational metrics/documentation.

---

## 🎯 What Problem Does This Solve?

### Traditional Approach (What We Had Before)
- ❌ Single PDF upload with only text extraction
- ❌ No image/chart/graph analysis from pitch decks
- ❌ No validation against founder checklists
- ❌ Missing unit economics, growth data, payment verification

### Our Dual PDF Approach (What We Have Now)
- ✅ **Pitch Deck** uploaded separately with **Gemini Vision** analyzing:
  - Charts showing growth metrics, revenue projections
  - Graphs displaying user acquisition, retention curves
  - Infographics about product, business model, competitive landscape
  - Team photos and organizational charts
  - Financial projections and unit economics visuals
  
- ✅ **Checklist** uploaded separately with **AI parsing** extracting:
  - Unit economics requirements (CAC, LTV, LTV/CAC ratio, payback period)
  - Current growth metrics (MRR, ARR, user growth, retention)
  - Payment/financial information (bank details, revenue breakdown, burn rate)
  - External links to supporting documents
  - Compliance requirements

- ✅ **Cross-referencing** between the two documents to:
  - Verify claims in pitch deck against checklist evidence
  - Identify missing checklist items
  - Flag discrepancies between pitch narrative and actual metrics
  - Provide comprehensive investment recommendation

---

## 🔧 Technical Implementation

### 1. Database Schema (Cloud SQL PostgreSQL)

**New columns added to `pitch_decks` table:**
```sql
ALTER TABLE pitch_decks 
ADD COLUMN deck_file_path TEXT,           -- GCS path to pitch deck PDF
ADD COLUMN checklist_file_path TEXT,      -- GCS path to checklist PDF
ADD COLUMN deck_text_content TEXT,        -- Extracted text from deck
ADD COLUMN checklist_text_content TEXT,   -- Extracted text from checklist
ADD COLUMN visual_analysis TEXT,          -- AI analysis of images/charts
ADD COLUMN checklist_items JSONB;         -- Parsed checklist requirements
```

### 2. AI Service (Gemini 1.5 Pro with Vision)

**File:** `server/src/services/ai-enhanced.ts`

**Key Functions:**

#### `analyzePDFImages(pdfPath: string)`
- Uses **Gemini 1.5 Pro Vision** model
- Reads PDF as base64 and sends to Gemini
- Extracts insights from:
  - Charts showing metrics, growth, revenue
  - Graphs displaying trends
  - Business model diagrams
  - Financial projections
  - Team composition visuals
  - Competitive positioning matrices

#### `parseChecklist(checklistText: string)`
- Uses **Gemini 1.5 Pro** for intelligent parsing
- Extracts structured checklist items with:
  - Category (unit_economics, growth_metrics, payment_info, compliance, other)
  - Item name and description
  - Thresholds or criteria mentioned
  - External links (URLs)
  - Priority level (critical, important, nice-to-have)

#### `analyzeDualPDFs(deckPath, checklistPath, companyName)`
**Main comprehensive analysis function that:**

1. Extracts text from both PDFs using `pdf-parse`
2. Analyzes visual elements from pitch deck using Gemini Vision
3. Parses checklist requirements into structured data
4. Sends **comprehensive prompt** to Gemini 1.5 Pro with:
   - Full pitch deck text
   - Visual analysis results (charts/graphs insights)
   - Checklist text content
   - Parsed checklist items JSON

**Analysis Output:**
```typescript
{
  analysis: {
    problemScore: 0-100,
    solutionScore: 0-100,
    marketScore: 0-100,
    tractionScore: 0-100,
    teamScore: 0-100,
    financialsScore: 0-100,
    overallScore: 0-100,
    strengths: string[],
    weaknesses: string[],
    keyInsights: string[],
    recommendation: "INVEST | PASS | NEEDS_MORE_INFO",
    checklistVerification: {
      unitEconomicsComplete: boolean,
      growthMetricsComplete: boolean,
      paymentInfoComplete: boolean,
      foundationalChecklistScore: 0-100,
      missingItems: string[],
      verifiedItems: string[]
    },
    visualInsights: string[]
  },
  sections: [
    {
      sectionName: "Problem & Solution",
      sectionScore: 0-100,
      feedback: "...",
      strengths: [...],
      improvements: [...]
    },
    // ... 5 more sections
  ],
  checklistItems: [
    {
      category: "unit_economics",
      item: "CAC (Customer Acquisition Cost)",
      description: "Must provide CAC calculation",
      threshold: "Below $100",
      externalLink: null,
      priority: "critical"
    },
    // ... more items
  ]
}
```

### 3. Backend API Routes

**File:** `server/src/routes/decks.ts`

#### **POST /api/decks/upload-dual** (New Route)
- Accepts **two files**: `deck` and `checklist`
- Multer configuration: `upload.fields([{name:'deck'}, {name:'checklist'}])`
- Stores both files in `uploads/` directory
- Saves both paths to database
- Triggers comprehensive dual PDF analysis in background
- Returns deck record with both file info

#### **POST /api/decks/upload** (Backward Compatible)
- Still accepts single file for legacy support
- Uses `analyzePitchDeckFromPDF()` for single-file analysis

### 4. Frontend Integration

**File:** `src/components/DeckIntelligence.tsx`

**UI Changes:**
- **Two separate file upload inputs:**
  1. "Pitch Deck PDF" (blue button, `deckFile` state)
  2. "Checklist PDF" (teal button, `checklistFile` state)
  
- **Validation:**
  - Both files required
  - PDF format only
  - 15MB max per file
  - Company selection required

- **Upload Flow:**
  ```typescript
  const handleUpload = async () => {
    // Calls api.uploadDualDeck(deckFile, checklistFile, companyId, userId)
    // Polls for analysis completion every 1 second
    // Displays analysis results with checklist verification
  }
  ```

**File:** `src/services/api.ts`

```typescript
async uploadDualDeck(
  deckFile: File, 
  checklistFile: File, 
  companyId: string, 
  userId: string
): Promise<PitchDeck>
```

---

## 🎬 How to Test with Your Sample Documents

### Step 1: Prepare Your Documents

**Pitch Deck PDF Requirements:**
- Must contain **visual elements**: charts, graphs, financial projections
- Images showing product, team, competitive landscape
- Typical sections: Problem, Solution, Market Size, Traction, Team, Financials

**Checklist PDF Requirements:**
- **Unit Economics:** CAC, LTV, LTV/CAC ratio, payback period, margins
- **Growth Metrics:** MRR, ARR, month-over-month growth, retention rate
- **Payment Info:** Bank details, revenue breakdown, burn rate, runway
- Can include **external links** to supporting documents
- Can have specific thresholds or requirements listed

### Step 2: Access the Application

1. **Backend:** Already deployed to Cloud Run
   - URL: `https://team-sso-backend-520480129735.us-central1.run.app`
   - Revision: `team-sso-backend-00003-bm2`
   - Health check: `https://team-sso-backend-520480129735.us-central1.run.app/health`

2. **Frontend:** Start local dev server
   ```powershell
   cd "d:\TeamSSO 2025\Team-SSO"
   npm run dev
   # Opens at http://localhost:3001
   ```

### Step 3: Upload Dual PDFs

1. Navigate to **Deck Intelligence** section
2. Select a company from dropdown (or use one of 5 fallback companies)
3. Click **"Choose Deck"** → select your pitch deck PDF
4. Click **"Choose Checklist"** → select your checklist PDF
5. Both files should show green checkmarks ✅
6. Click **"Upload & Analyze Both Documents"**

### Step 4: Monitor Analysis

**In Browser:**
- Shows "AI analyzing visuals + checklist..." loading state
- Polls backend every 1 second for up to 30 seconds
- Displays results when status changes to 'completed'

**In Cloud Run Logs:**
```bash
# View real-time logs
gcloud run services logs read team-sso-backend --region=us-central1 --limit=50
```

Look for these log messages:
- `🚀 Starting DUAL PDF analysis for deck [id]...`
- `📊 Analyzing pitch deck visuals, checklist requirements...`
- `💾 Storing analysis results...`
- `✅ DUAL PDF Analysis complete for deck [id]!`
- `Overall Score: [score]/100`
- `Checklist Items Verified: [count]`
- `Recommendation: INVEST | PASS | NEEDS_MORE_INFO`

### Step 5: Review Results

The analysis will show:

**Overall Metrics:**
- SSO Readiness Score (0-10)
- Overall Score (0-100)
- Recommendation (INVEST/PASS/NEEDS_MORE_INFO)

**6 Section Scores:**
1. Problem & Solution (0-100)
2. Market Opportunity (0-100)
3. Traction & Growth (0-100)
4. Business Model & Unit Economics (0-100)
5. Team & Execution (0-100)
6. Financials & Use of Funds (0-100)

**For Each Section:**
- Detailed feedback
- 2-3 specific strengths (with evidence from deck or checklist)
- 2-3 areas for improvement

**Checklist Verification:**
- Unit economics complete? ✅/❌
- Growth metrics complete? ✅/❌
- Payment info complete? ✅/❌
- Foundational checklist score (percentage of items verified)
- **Missing Items:** List of checklist requirements NOT found in deck
- **Verified Items:** List of checklist requirements confirmed in deck

**Visual Insights:**
- 3-5 key takeaways from charts, graphs, financial projections
- Specific numbers extracted from visuals
- Investment implications from visual data

---

## 🧪 Example Test Scenarios

### Scenario 1: Strong Deck + Complete Checklist
**Expected Result:**
- Overall Score: 75-90
- All checklist items verified
- Recommendation: INVEST
- Visual insights show strong growth metrics
- No missing items

### Scenario 2: Good Deck + Incomplete Checklist
**Expected Result:**
- Overall Score: 60-75
- Some checklist items missing
- Recommendation: NEEDS_MORE_INFO
- Missing items clearly listed (e.g., "CAC not provided", "No burn rate information")

### Scenario 3: Weak Deck Despite Checklist
**Expected Result:**
- Overall Score: 40-60
- Checklist may be complete BUT pitch deck shows concerning metrics
- Recommendation: PASS
- Visual analysis flags issues (e.g., "Flat growth curve in chart", "High burn rate visible")

---

## 🔍 What Gemini Vision Actually Sees

When analyzing pitch deck images/charts, Gemini Vision can:

✅ **Identify Chart Types:**
- Line charts (growth over time)
- Bar charts (comparisons, revenue breakdown)
- Pie charts (market share, revenue sources)
- Area charts (cumulative metrics)
- Tables (financial projections, unit economics)

✅ **Extract Specific Numbers:**
- Revenue figures from charts
- Growth percentages from trend lines
- Market size numbers (TAM/SAM/SOM)
- User counts, conversion rates
- Financial projections (Year 1, Year 2, etc.)

✅ **Understand Context:**
- Axis labels (Time, Revenue, Users, etc.)
- Chart titles and legends
- Annotations and callouts
- Trend directions (growing, declining, flat)

✅ **Identify Visual Red Flags:**
- Flat or declining growth curves
- Unrealistic hockey stick projections
- Inconsistent data between charts
- Missing data points or unclear scales

---

## 📊 Database Storage

After analysis completes, data is stored in:

**Table: `pitch_decks`**
- `deck_file_path`: `/uploads/deck-1760789123456-abc123.pdf`
- `checklist_file_path`: `/uploads/checklist-1760789123456-def456.pdf`
- `analysis_status`: 'completed'
- `sso_score`: 0.75 (decimal 0-1)
- `checklist_items`: `[{category:"unit_economics", item:"CAC", ...}, ...]` (JSONB)

**Table: `deck_analysis`**
- Multiple rows per deck (one per section)
- `section_name`: "Problem & Solution", "Market Opportunity", etc.
- `section_score`: 0.82 (decimal 0-1)
- `feedback`: Full text feedback
- `strengths`: Array of strength strings
- `improvements`: Array of improvement strings

---

## 🚀 Next Steps

1. **Test with your sample documents:**
   - Upload the pitch deck with charts/graphs
   - Upload the founder checklist
   - Review the comprehensive analysis

2. **Iterate based on results:**
   - If analysis misses something, we can refine the prompt
   - If visual analysis needs improvement, we can adjust Gemini Vision instructions
   - If checklist parsing is incomplete, we can enhance the parsing logic

3. **Scale testing:**
   - Test with multiple different deck styles
   - Try various checklist formats
   - Compare analysis quality across different industries/stages

4. **Production readiness:**
   - Add user authentication (replace 'demo-user-123')
   - Implement job queue for background processing (Bull/BeeQueue)
   - Add email notifications when analysis completes
   - Store files in Google Cloud Storage instead of local uploads
   - Add rate limiting and quota management for Gemini API

---

## 🔐 Security & Privacy

- **File Validation:** Only PDF files accepted, 15MB max per file
- **Temporary Storage:** Files stored in Cloud Run `/uploads` (ephemeral)
- **API Keys:** Gemini API key stored in environment variables (not in code)
- **Database:** Cloud SQL with SSL, private IP
- **Authentication:** Currently using demo user, production will require OAuth

---

## 💡 Key Advantages Over Competitors

1. **Dual Document Analysis:** Nobody else cross-references pitch deck visuals with founder checklists
2. **Gemini Vision:** Extracts real data from charts/graphs, not just text
3. **Checklist Verification:** Automated validation of unit economics, growth, payment info
4. **Comprehensive Scoring:** 6-section breakdown + overall recommendation
5. **Evidence-Based Feedback:** Every insight backed by specific evidence from deck or checklist
6. **Investment Decision:** Clear INVEST/PASS/NEEDS_MORE_INFO recommendation

---

## 📞 Support

If you encounter issues during testing:

1. **Check Cloud Run logs:**
   ```powershell
   gcloud run services logs read team-sso-backend --region=us-central1 --limit=100
   ```

2. **Verify database migration:**
   ```powershell
   gcloud sql operations list --instance=team-sso-db --limit=5
   ```

3. **Test backend health:**
   ```powershell
   curl https://team-sso-backend-520480129735.us-central1.run.app/health
   ```

4. **Browser console:** Open DevTools (F12) → Console tab to see frontend errors

---

## 🎉 Ready to Test!

You now have a **fully functional dual PDF analysis system** that:
- ✅ Analyzes pitch deck images/charts with Gemini Vision
- ✅ Parses founder checklists for unit economics, growth, payment info
- ✅ Cross-references both documents for comprehensive due diligence
- ✅ Provides investment recommendation with verified evidence
- ✅ Deployed to Cloud Run and ready for production testing

**Upload your sample pitch deck and checklist to see it in action!** 🚀
