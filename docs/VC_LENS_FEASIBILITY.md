# VC Lens Feature - Feasibility Analysis

## 📋 Feature Overview

**VC Lens**: A feature that tracks and visualizes how SSO scores and key metrics have evolved across multiple pitch deck uploads for the same company.

**Business Value**: 
- Track company progress over time
- Identify improvement patterns
- Spot red flags (declining scores)
- Make data-driven investment decisions based on trends
- Compare versions of pitch decks (Q1 vs Q2, pre-funding vs post-funding)

---

## ✅ **FEASIBILITY: YES - Fully Implementable with Current Schema**

### Current Database Schema Strengths

```sql
-- pitch_decks table already has:
CREATE TABLE IF NOT EXISTS pitch_decks (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),  -- ✅ COMPANY LINKAGE
    uploaded_by UUID REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,             -- ✅ FILENAME TRACKING
    file_url TEXT NOT NULL,
    sso_score DECIMAL(3, 2),                    -- ✅ SCORE TRACKING
    created_at TIMESTAMP,                       -- ✅ TIME TRACKING
    analyzed_at TIMESTAMP                       -- ✅ ANALYSIS TIME
);

-- deck_analysis table has detailed metrics:
CREATE TABLE IF NOT EXISTS deck_analysis (
    id UUID PRIMARY KEY,
    deck_id UUID REFERENCES pitch_decks(id),    -- ✅ LINKS TO DECK
    section_name VARCHAR(100) NOT NULL,
    section_score DECIMAL(3, 2),                -- ✅ SECTION SCORES
    feedback TEXT,
    strengths TEXT[],
    improvements TEXT[],
    created_at TIMESTAMP
);
```

**Key Strengths:**
1. ✅ **company_id exists** - Primary linking mechanism
2. ✅ **Timestamps exist** - Can track chronological changes
3. ✅ **Scores stored** - Both overall (sso_score) and section-level (deck_analysis)
4. ✅ **Detailed metrics stored** - Section-by-section breakdown available

---

## 🔗 Linking Strategy Options

### **Option 1: company_id (RECOMMENDED - Most Reliable)**

**How it works:**
- When uploading a deck, user selects or creates a company
- All decks for same company are linked via `company_id`
- Query: `SELECT * FROM pitch_decks WHERE company_id = $1 ORDER BY created_at`

**Pros:**
- ✅ Most accurate - explicit company relationship
- ✅ Handles renamed files (e.g., "Acme Q1.pdf" → "Acme Q2.pdf")
- ✅ Works across different file formats
- ✅ Allows company-level analytics (all decks for a startup)

**Cons:**
- ⚠️ Requires company selection during upload (minor UX addition)
- ⚠️ Need to handle cases where company_id is NULL (backward compatibility)

**Implementation Complexity:** LOW (schema already supports this)

---

### **Option 2: Filename Pattern Matching (Fallback)**

**How it works:**
- Extract company name from filename using pattern matching
- Group decks with similar names: "Acme_Q1.pdf", "Acme_Q2.pdf", "Acme_Series_A.pdf"
- Use fuzzy matching or name normalization

**Pros:**
- ✅ Works for existing data without company_id
- ✅ No UX changes needed
- ✅ Automatic grouping

**Cons:**
- ❌ Unreliable if naming conventions change
- ❌ False positives (e.g., "Apple Store App" vs "Apple Payments")
- ❌ Requires complex string matching logic

**Implementation Complexity:** MEDIUM-HIGH (complex matching logic)

---

### **Option 3: Hybrid Approach (BEST SOLUTION)**

**How it works:**
1. **Primary**: Use `company_id` if available
2. **Fallback**: Use AI-extracted company name (already extracted during analysis)
3. **Manual**: Allow users to link decks manually in UI

**Pros:**
- ✅ Most flexible and accurate
- ✅ Works for both new and existing data
- ✅ Handles edge cases gracefully

**Implementation:**
```typescript
// 1. Add company_name_extracted column to pitch_decks
ALTER TABLE pitch_decks ADD COLUMN company_name_extracted VARCHAR(255);

// 2. Store AI-extracted company name during analysis
// Already available in analysis flow - just need to persist it

// 3. Query logic:
// SELECT * FROM pitch_decks 
// WHERE company_id = $1 
//    OR (company_id IS NULL AND company_name_extracted ILIKE $2)
// ORDER BY created_at
```

---

## 📊 Data Available for VC Lens Dashboard

### 1. **Overall Score Trend**
```sql
SELECT 
  filename,
  sso_score,
  created_at,
  analyzed_at
FROM pitch_decks
WHERE company_id = $1
ORDER BY created_at;
```

**Visualization:**
- Line chart: SSO Score over Time
- Show upload dates as milestones
- Highlight significant changes (>10 point increase/decrease)

---

### 2. **Section Score Evolution**
```sql
SELECT 
  pd.filename,
  pd.created_at,
  da.section_name,
  da.section_score
FROM pitch_decks pd
JOIN deck_analysis da ON da.deck_id = pd.id
WHERE pd.company_id = $1
ORDER BY pd.created_at, da.section_name;
```

**Visualization:**
- Stacked area chart or heatmap
- Sections: Problem/Solution, Market, Traction, Team, Financials
- Color-coded by score (red <50, yellow 50-75, green >75)

---

### 3. **Extracted Metrics Tracking**
Currently stored in analysis JSON, can query:
```sql
SELECT 
  pd.filename,
  pd.created_at,
  da.feedback::json->'extractedMetrics' as metrics
FROM pitch_decks pd
JOIN deck_analysis da ON da.deck_id = pd.id
WHERE pd.company_id = $1 
  AND da.section_name = 'Overall Analysis'
ORDER BY pd.created_at;
```

**Metrics to Track:**
- Revenue growth (MRR/ARR)
- CAC vs LTV ratio
- Burn rate & runway
- Team size
- Customer count
- Growth rates (YoY, MoM)

**Visualization:**
- Multiple line charts for each metric
- Comparison table showing change between versions

---

### 4. **Strengths & Weaknesses Over Time**
```sql
SELECT 
  pd.filename,
  pd.created_at,
  da.section_name,
  da.strengths,
  da.improvements
FROM pitch_decks pd
JOIN deck_analysis da ON da.deck_id = pd.id
WHERE pd.company_id = $1
ORDER BY pd.created_at;
```

**Visualization:**
- Tag cloud showing recurring strengths/weaknesses
- Sentiment analysis: Are weaknesses being addressed?
- "Fixed Issues" counter (weaknesses from v1 no longer present in v2)

---

### 5. **Checklist Completion Progress**
```sql
SELECT 
  pd.filename,
  pd.created_at,
  (da.feedback::json->'checklistVerification'->>'foundationalChecklistScore')::numeric as checklist_score
FROM pitch_decks pd
JOIN deck_analysis da ON da.deck_id = pd.id
WHERE pd.company_id = $1 
  AND da.section_name = 'Overall Analysis'
ORDER BY pd.created_at;
```

**Visualization:**
- Progress bar: Checklist completion (0-100%)
- List of "Still Missing" items vs "Recently Added" items

---

## 🛠️ Implementation Plan

### **Phase 1: Schema Enhancement (REQUIRED)**

**Step 1:** Add company name extraction to pitch_decks table
```sql
-- Migration: 010_add_company_name_extracted.sql
ALTER TABLE pitch_decks 
ADD COLUMN company_name_extracted VARCHAR(255);

CREATE INDEX idx_pitch_decks_company_name ON pitch_decks(company_name_extracted);
```

**Step 2:** Update upload route to store extracted company name
```typescript
// In decks.ts after AI analysis
const extractedCompanyName = analysis.companyName || 
  extractCompanyNameFromFilename(filename);

await query(`
  UPDATE pitch_decks 
  SET company_name_extracted = $1 
  WHERE id = $2
`, [extractedCompanyName, deckId]);
```

---

### **Phase 2: Backend API (2-3 hours)**

**New Route: GET /api/decks/vc-lens/:identifier**

```typescript
// Get all decks for a company with trend data
router.get('/vc-lens/:identifier', async (req, res) => {
  const { identifier } = req.params; // Can be company_id or company name
  
  // Try UUID first (company_id)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  
  let query;
  if (isUUID) {
    query = `
      SELECT 
        pd.*,
        c.name as company_name,
        c.industry,
        c.stage
      FROM pitch_decks pd
      LEFT JOIN companies c ON c.id = pd.company_id
      WHERE pd.company_id = $1
      ORDER BY pd.created_at ASC
    `;
  } else {
    // Fallback to fuzzy name matching
    query = `
      SELECT 
        pd.*,
        c.name as company_name,
        c.industry,
        c.stage
      FROM pitch_decks pd
      LEFT JOIN companies c ON c.id = pd.company_id
      WHERE pd.company_name_extracted ILIKE $1
         OR c.name ILIKE $1
      ORDER BY pd.created_at ASC
    `;
  }
  
  const decks = await db.query(query, [isUUID ? identifier : `%${identifier}%`]);
  
  // Enrich with section scores
  const enrichedDecks = await Promise.all(
    decks.rows.map(async (deck) => {
      const sections = await db.query(`
        SELECT section_name, section_score, strengths, improvements
        FROM deck_analysis
        WHERE deck_id = $1
      `, [deck.id]);
      
      return {
        ...deck,
        sections: sections.rows
      };
    })
  );
  
  res.json({
    companyName: enrichedDecks[0]?.company_name || identifier,
    totalVersions: enrichedDecks.length,
    decks: enrichedDecks,
    trends: calculateTrends(enrichedDecks) // Helper function
  });
});

// Helper: Calculate trends
function calculateTrends(decks: any[]) {
  if (decks.length < 2) return null;
  
  const first = decks[0];
  const latest = decks[decks.length - 1];
  
  return {
    scoreChange: latest.sso_score - first.sso_score,
    scoreChangePercent: ((latest.sso_score - first.sso_score) / first.sso_score) * 100,
    daysElapsed: daysBetween(first.created_at, latest.created_at),
    improvementRate: (latest.sso_score - first.sso_score) / decks.length,
    sectionsImproved: countImprovedSections(first, latest),
    sectionsDeclined: countDeclinedSections(first, latest)
  };
}
```

---

### **Phase 3: Frontend UI (4-6 hours)**

**New Component: `VCLens.tsx`**

**UI Structure:**
```
┌─────────────────────────────────────────────┐
│  VC Lens: [Acme Corp]                  🔍  │
├─────────────────────────────────────────────┤
│  📈 Score History                           │
│  ┌─────────────────────────────────────┐   │
│  │    100 ┤                       ●85   │   │
│  │     75 ┤              ●72            │   │
│  │     50 ┤       ●58                   │   │
│  │     25 ┤                             │   │
│  │      0 ┤───────────────────────────  │   │
│  │        Jan '25  Mar '25   Nov '25    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  📊 Section Breakdown                       │
│  ┌────────────────┬───────┬───────┬─────┐  │
│  │ Section        │ v1.0  │ v2.0  │ Δ   │  │
│  ├────────────────┼───────┼───────┼─────┤  │
│  │ Problem        │  65   │  78   │ +13 │  │
│  │ Solution       │  72   │  85   │ +13 │  │
│  │ Market         │  55   │  70   │ +15 │  │
│  │ Traction       │  48   │  88   │ +40 │  │
│  │ Team           │  70   │  75   │  +5 │  │
│  │ Financials     │  50   │  92   │ +42 │  │
│  └────────────────┴───────┴───────┴─────┘  │
│                                             │
│  📝 Version Comparison                      │
│  [v1.0 (Jan 2025)] vs [v2.0 (Nov 2025)] 🔄 │
│                                             │
│  💪 Improvements Made:                      │
│  • Added 180% YoY growth metrics            │
│  • Included founder backgrounds             │
│  • Added CAC/LTV ratios                     │
│                                             │
│  ⚠️  Still Missing:                         │
│  • Burn rate projections                    │
│  • Competitive analysis depth               │
└─────────────────────────────────────────────┘
```

**Key Features:**
1. **Search by company** - Autocomplete with company names
2. **Timeline view** - All deck versions with upload dates
3. **Score trend chart** - Line graph showing SSO score evolution
4. **Section heatmap** - Color-coded matrix of section scores
5. **Side-by-side comparison** - Select 2 versions to compare
6. **Improvement tracker** - List of addressed weaknesses
7. **Metrics dashboard** - Track revenue, growth, CAC, etc.

---

### **Phase 4: AI Enhancement (Optional - 2 hours)**

**Extract company name during analysis:**
```typescript
// In ai-enhanced.ts - add to analysis prompt
const prompt = `...
Additionally, identify:
- companyName: The exact company/startup name (e.g., "Acme Corp", "TechStart AI")
- Extract from the first few pages of the pitch deck
...`;

// Store in pitch_decks table
await query(`
  UPDATE pitch_decks 
  SET company_name_extracted = $1 
  WHERE id = $2
`, [analysis.companyName, deckId]);
```

---

## 🎯 Recommended Approach

### **Linking Strategy: Hybrid (company_id + extracted name)**

**Why?**
1. ✅ **Backward compatible** - Works with existing data
2. ✅ **Most accurate** - Uses explicit company_id when available
3. ✅ **Automatic fallback** - Uses AI-extracted name for old data
4. ✅ **User override** - Allow manual linking in UI

### **Implementation Timeline**
- **Phase 1 (Schema):** 30 minutes
- **Phase 2 (Backend API):** 2-3 hours
- **Phase 3 (Frontend UI):** 4-6 hours
- **Phase 4 (AI Enhancement):** 1-2 hours

**Total Estimate:** 1-2 days for full implementation

---

## 💡 Additional Ideas

### **1. VC Lens Insights (AI-Powered)**
- Auto-generate narrative: "Acme Corp has improved their SSO score by 27 points over 10 months. Key improvements: Added financial projections (+42 points in Financials), demonstrated traction (+40 points). Still needs work on market analysis."

### **2. Benchmark Against Similar Companies**
- "Acme Corp's score improvement rate (2.7 points/month) is 30% faster than the average SaaS startup in our database."

### **3. Alert System**
- Notify VCs when a watchlist company uploads a new deck
- Flag significant score changes (>15 points up/down)

### **4. Export Reports**
- Generate PDF report: "Acme Corp Progress Report (Jan-Nov 2025)"
- Include charts, score trends, key improvements

---

## ✅ Conclusion

**FEASIBILITY: ✅ YES - Fully Doable**

**Best Linking Method:** 
1. Primary: `company_id` (most reliable)
2. Fallback: AI-extracted `company_name_extracted`
3. Manual: User can link/group decks in UI

**Schema Changes Needed:**
- Add `company_name_extracted` column (1 line SQL)
- No breaking changes to existing functionality

**Effort Required:** 1-2 days for MVP

**Value Proposition:** HIGH - Unique feature that provides longitudinal insights into startup progress, helping VCs track improvement over time and make data-driven investment decisions.

---

## 🚀 Next Steps

1. **Approve approach** - Confirm hybrid linking strategy
2. **Run migration** - Add `company_name_extracted` column
3. **Update AI service** - Store extracted company name
4. **Build backend API** - New `/vc-lens` endpoint
5. **Build frontend UI** - VCLens component
6. **Test with real data** - Upload multiple versions of same company

**Ready to proceed when you are!** 🎯
