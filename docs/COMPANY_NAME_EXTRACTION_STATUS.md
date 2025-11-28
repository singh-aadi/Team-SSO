# Company Name Extraction - Current Implementation Status

## ✅ **PARTIALLY IMPLEMENTED**

### What's Currently Working:

**1. Company Name is Extracted from Filename**

Location: `server/src/routes/decks.ts` (lines ~1830-1840 and ~2110-2120)

```typescript
const extractedCompanyName = deck.filename
  .replace(/\.(pdf|ppt|pptx|docx|doc)$/i, '')
  .replace(/[-_()]/g, ' ')
  .replace(/\b(pitch|deck|presentation|slide|v\d+|final|draft|inr|usd|may|june|july|aug|sep|oct|nov|dec|\d{4})\b/gi, '')
  .trim();

const finalCompanyName = (extractedCompanyName && extractedCompanyName.length > 2) 
  ? extractedCompanyName 
  : (deck.company_name || 'Startup Company');
```

**Examples:**
- `"We360.ai (INR) Deck May 2025.pdf"` → Extracts: `"We360.ai"`
- `"Cashvisory Deck_Sep 2025.pdf"` → Extracts: `"Cashvisory"`
- `"Dr. Doodley Investor Deck Aug 2025.pdf"` → Extracts: `"Dr. Doodley Investor"`

**Where it's Used:**
1. ✅ Report generation (PDF/Markdown/Text reports)
2. ✅ Console logging during analysis
3. ✅ Display purposes

---

### ❌ What's NOT Implemented:

**Company Name is NOT Saved to Database**

**Problem:**
- Extraction happens at report generation time
- It's NOT stored in the `pitch_decks` table
- No `company_name_extracted` column exists yet
- Cannot query database by extracted company name

**Impact:**
- Cannot use for VC Lens grouping
- Lost after report generation
- Must re-extract every time
- No historical tracking

---

## 🔍 Current Database Status

### Schema Check:

```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'pitch_decks' 
AND column_name = 'company_name_extracted';

-- Result: Column does NOT exist ❌
```

### Analysis Storage:

Currently, when analysis completes (lines ~1060-1090):

```typescript
UPDATE pitch_decks 
SET analysis_status = 'completed', 
    sso_score = $1, 
    dual_pdf_analysis = $2,
    extracted_metrics = $3,
    web_enrichment = $4,
    vc_preferences_used = $5,
    analyzed_at = CURRENT_TIMESTAMP
WHERE id = $6

// ❌ company_name_extracted is NOT included in UPDATE
```

**Missing:** No storage of extracted company name!

---

## 🎯 What Needs to Be Done for VC Lens

### Step 1: Add Database Column ✅ (Migration ready)

```sql
-- migrations/010_add_company_name_extracted.sql (Already created)
ALTER TABLE pitch_decks 
ADD COLUMN IF NOT EXISTS company_name_extracted VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_pitch_decks_company_name 
ON pitch_decks(company_name_extracted);
```

---

### Step 2: Save Extracted Name During Analysis ❌ (Needs implementation)

**Where:** After analysis completes in `decks.ts`

**Current code** (line ~1060):
```typescript
UPDATE pitch_decks 
SET analysis_status = 'completed', 
    sso_score = $1, 
    dual_pdf_analysis = $2,
    extracted_metrics = $3,
    web_enrichment = $4,
    vc_preferences_used = $5,
    analyzed_at = CURRENT_TIMESTAMP
WHERE id = $6
```

**Needs to become:**
```typescript
// Extract company name from filename
const extractedCompanyName = deck.filename
  .replace(/\.(pdf|ppt|pptx|docx|doc)$/i, '')
  .replace(/[-_()]/g, ' ')
  .replace(/\b(pitch|deck|presentation|slide|v\d+|final|draft|inr|usd|may|june|july|aug|sep|oct|nov|dec|\d{4})\b/gi, '')
  .trim();

const finalCompanyName = (extractedCompanyName && extractedCompanyName.length > 2) 
  ? extractedCompanyName 
  : null;

// Store with analysis results
UPDATE pitch_decks 
SET analysis_status = 'completed', 
    sso_score = $1, 
    dual_pdf_analysis = $2,
    extracted_metrics = $3,
    web_enrichment = $4,
    vc_preferences_used = $5,
    company_name_extracted = $7,  // ✅ NEW: Store extracted name
    analyzed_at = CURRENT_TIMESTAMP
WHERE id = $6
```

---

### Step 3: Backfill Existing Data ❌ (Needs SQL update)

For the 4 already-analyzed decks:

```sql
UPDATE pitch_decks 
SET company_name_extracted = 
  CASE 
    WHEN filename ILIKE '%we360%' THEN 'We360.ai'
    WHEN filename ILIKE '%cashvisory%' THEN 'Cashvisory'
    WHEN filename ILIKE '%doodley%' THEN 'Dr. Doodley'
    ELSE NULL
  END
WHERE sso_score IS NOT NULL;
```

---

### Step 4: Create VC Lens API ❌ (Needs new endpoint)

```typescript
// GET /api/decks/vc-lens/:companyName
router.get('/vc-lens/:companyName', async (req, res) => {
  const { companyName } = req.params;
  
  const decks = await query(`
    SELECT 
      id,
      filename,
      sso_score,
      analyzed_at,
      created_at,
      company_name_extracted,
      extracted_metrics
    FROM pitch_decks
    WHERE company_name_extracted ILIKE $1
      AND sso_score IS NOT NULL
      AND analysis_status = 'completed'
    ORDER BY analyzed_at ASC
  `, [`%${companyName}%`]);
  
  res.json({
    companyName,
    versions: decks.rows
  });
});
```

---

## 📋 Implementation Checklist

### For VC Lens to Work:

- [ ] **1. Run Migration 010** (add `company_name_extracted` column)
  - File: `migrations/010_add_company_name_extracted.sql` ✅ Ready
  - Command: See below

- [ ] **2. Update Analysis Storage** (save extracted name)
  - File: `server/src/routes/decks.ts` 
  - Lines: ~1060-1090 (UPDATE pitch_decks query)
  - Add extraction logic before UPDATE
  - Add column to UPDATE statement

- [ ] **3. Backfill Existing Data** (4 analyzed decks)
  - Run SQL UPDATE for We360.ai, Cashvisory, Dr. Doodley
  - Or re-analyze decks to populate field

- [ ] **4. Create VC Lens Endpoint**
  - New route: `GET /api/decks/vc-lens/:companyName`
  - Query by `company_name_extracted`
  - Return version history

- [ ] **5. Build Frontend UI**
  - Search by company name
  - Display score timeline
  - Show version comparison

---

## 🚀 Quick Start Commands

### 1. Run Migration:
```bash
cd server
node -e "const {Pool}=require('pg');require('dotenv').config();const p=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});const fs=require('fs');p.query(fs.readFileSync('migrations/010_add_company_name_extracted.sql','utf8')).then(()=>{console.log('✅ Migration 010 complete!');p.end()}).catch(e=>{console.error(e);p.end()})"
```

### 2. Backfill Data:
```bash
node -e "const {Pool}=require('pg');require('dotenv').config();const p=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});p.query(\"UPDATE pitch_decks SET company_name_extracted = CASE WHEN filename ILIKE '%we360%' THEN 'We360.ai' WHEN filename ILIKE '%cashvisory%' THEN 'Cashvisory' WHEN filename ILIKE '%doodley%' THEN 'Dr. Doodley' END WHERE sso_score IS NOT NULL\").then(r=>{console.log('✅ Backfilled',r.rowCount,'rows');p.end()}).catch(e=>{console.error(e);p.end()})"
```

### 3. Verify:
```bash
node -e "const {Pool}=require('pg');require('dotenv').config();const p=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});p.query('SELECT filename, company_name_extracted FROM pitch_decks WHERE sso_score IS NOT NULL').then(r=>{console.log('\\n✅ Extracted company names:');r.rows.forEach(row=>{console.log('  -',row.filename,'→',row.company_name_extracted)});p.end()}).catch(e=>{console.error(e);p.end()})"
```

---

## 🎯 Summary

**Current Status:**
- ✅ Extraction logic EXISTS (filename parsing)
- ✅ Used for reports and display
- ❌ NOT saved to database
- ❌ Cannot query by company name
- ❌ VC Lens cannot use it yet

**To Enable VC Lens:**
1. Run migration (1 minute)
2. Update analysis storage code (10 minutes)
3. Backfill existing data (1 minute)
4. Build VC Lens API + UI (4-6 hours)

**Estimated Total Time:** 1 day

**Ready to implement when you are!** 🚀
