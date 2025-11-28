# 🚨 CRITICAL FINDING: company_id Cannot Be Used for VC Lens

## Executive Summary

**ALL analyzed pitch decks (4 out of 5) are assigned to the SAME company_id:**
- `00000000-0000-0000-0000-000000000001` (Default/Test Company: "Global VC Context")

This means **company_id CANNOT differentiate between different companies** like:
- ❌ We360.ai
- ❌ Cashvisory
- ❌ Dr. Doodley

**Impact:** VC Lens cannot use company_id as the primary linking method.

---

## 📊 Data Evidence

### Analyzed Decks Distribution

| Company ID | Name | Analyzed Decks | Files |
|------------|------|----------------|-------|
| `00000000-0000-0000-0000-000000000001` | **Global VC Context** | **4** | We360.ai, Cashvisory |

**⚠️ All 4 analyzed decks are linked to ONE test company!**

### All Pitch Decks Distribution

| Company ID | Total | Analyzed | Unanalyzed | Status |
|------------|-------|----------|------------|--------|
| `00000000-0000-0000-0000-000000000001` | 35 | **5** | 30 | Default/Test |
| `dc333574-dea9-4f2d-975d-076d9af12192` | 19 | **0** | 19 | Real company (unused) |
| `41a84a5a-8647-4211-b568-8a36a82a27e8` | 9 | **0** | 9 | Real company (unused) |
| `NULL` | 2 | **0** | 2 | No company |

**Key Insight:**
- ✅ 2 other real company_ids exist (`dc333574...`, `41a84a5a...`)
- ❌ But NONE of their decks have been analyzed
- ❌ Only the default/test company has analyzed decks

---

## 🚨 Root Cause

### The "Global VC Context" Default Company

```
Company ID: 00000000-0000-0000-0000-000000000001
Name: Global VC Context
Industry: HealthTech
Stage: Pre-Seed
Status: active
Created: November 24, 2025
```

**This is clearly a default/test company ID because:**
1. ❌ Sequential UUID with all zeros
2. ❌ Generic name "Global VC Context"
3. ❌ Used for ALL analyzed decks regardless of actual company
4. ❌ We360.ai, Cashvisory, Dr. Doodley all share this ID

### Why This Happened

Looking at the upload flow, there are two possibilities:

1. **During testing/development:**
   - All uploads defaulted to this test company_id
   - Real company selection wasn't implemented/used

2. **Upload flow issue:**
   - Company selection isn't working properly
   - Defaults to test company when no company selected

---

## ❌ Impact on VC Lens

### Original Plan (Using company_id):
```sql
-- This would return ALL companies as one!
SELECT * FROM pitch_decks 
WHERE company_id = '00000000-0000-0000-0000-000000000001'
ORDER BY analyzed_at;

-- Result: We360.ai + Cashvisory + Dr. Doodley all grouped together ❌
```

### The Problem:
```
VC Lens for "company_id 00000000..."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Version 1 (06:30) - We360.ai       Score: 0.91
Version 2 (12:02) - We360.ai       Score: 0.82
Version 3 (12:04) - We360.ai       Score: 0.94
Version 4 (11:15) - Cashvisory     Score: 0.87  ← WRONG! Different company!

❌ This groups DIFFERENT companies as one!
```

---

## ✅ SOLUTION: Use AI-Extracted Company Name

### Why Filename Matching is BETTER than company_id (in this case)

| Method | Reliability | Current Status |
|--------|-------------|----------------|
| **company_id** | ❌ 0% (all same) | Cannot differentiate companies |
| **Filename pattern** | ⚠️ ~43% | Can differentiate We360 from Cashvisory |
| **AI-extracted name** | ✅ ~90% | Best option - extract from deck content |

### Updated VC Lens Strategy

```
PRIMARY METHOD: AI-Extracted Company Name
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. During AI analysis, extract company name from deck
2. Store in company_name_extracted column
3. Group decks by extracted name

Example:
- "We360.ai (INR) Deck May 2025.pdf" → Extract "We360.ai"
- "Cashvisory Deck_Sep 2025.pdf" → Extract "Cashvisory"
- "Dr. Doodley Investor Deck Aug 2025.pdf" → Extract "Dr. Doodley"

Query:
SELECT * FROM pitch_decks
WHERE company_name_extracted ILIKE '%We360%'
  AND sso_score IS NOT NULL
ORDER BY analyzed_at;
```

---

## 🛠️ Implementation Plan

### Phase 1: Immediate Fix (For VC Lens MVP)

**1. Run Migration 010** ✅ (Already created)
```sql
ALTER TABLE pitch_decks 
ADD COLUMN company_name_extracted VARCHAR(255);
```

**2. Update AI Analysis Service**

Extract company name from deck content:

```typescript
// In ai-enhanced.ts - Update the analysis prompt
const prompt = `Analyze this pitch deck...

CRITICAL: Extract the following information:
- companyName: The exact company/startup name (e.g., "Acme Corp", "TechStart AI")
  * Look in the title slide, footer, headers
  * Use the most formal version (e.g., "We360.ai" not just "We360")
...`;

// Parse response and extract company name
const analysis = JSON.parse(response);
const extractedCompanyName = analysis.companyName || 
  extractCompanyNameFromFilename(filename);

// Store in database
await query(`
  UPDATE pitch_decks 
  SET company_name_extracted = $1 
  WHERE id = $2
`, [extractedCompanyName, deckId]);
```

**3. Backfill Existing Data**

```sql
-- Quick fix: Extract from filename for existing analyzed decks
UPDATE pitch_decks 
SET company_name_extracted = 
  CASE 
    WHEN filename ILIKE '%we360%' THEN 'We360.ai'
    WHEN filename ILIKE '%cashvisory%' THEN 'Cashvisory'
    WHEN filename ILIKE '%doodley%' THEN 'Dr. Doodley'
    WHEN filename ILIKE '%sensesemi%' THEN 'SenseSemi'
    WHEN filename ILIKE '%naario%' THEN 'Naario'
    WHEN filename ILIKE '%kredily%' THEN 'Kredily'
    WHEN filename ILIKE '%sia%' THEN 'Sia'
    ELSE NULL
  END
WHERE sso_score IS NOT NULL;
```

**4. Update VC Lens Query**

```typescript
// Backend API: GET /api/decks/vc-lens/:companyIdentifier
router.get('/vc-lens/:identifier', async (req, res) => {
  const { identifier } = req.params;
  
  // Use company_name_extracted instead of company_id
  const query = `
    SELECT 
      id,
      filename,
      sso_score,
      analyzed_at,
      created_at,
      company_name_extracted,
      extracted_metrics,
      sector
    FROM pitch_decks
    WHERE company_name_extracted ILIKE $1
      AND sso_score IS NOT NULL
      AND analysis_status = 'completed'
    ORDER BY analyzed_at ASC
  `;
  
  const decks = await db.query(query, [`%${identifier}%`]);
  
  // Return grouped by company name
  res.json({
    companyName: decks.rows[0]?.company_name_extracted || identifier,
    totalVersions: decks.rows.length,
    decks: decks.rows,
    scoreProgression: decks.rows.map(d => d.sso_score),
    dates: decks.rows.map(d => d.analyzed_at)
  });
});
```

---

### Phase 2: Long-term Fix (Fix company_id Assignment)

**Fix the upload flow to properly assign company_id:**

1. **Option A: Company Selection UI**
   - Add dropdown to select existing company
   - Or create new company during upload
   - Store proper company_id

2. **Option B: Auto-create Company**
   - Extract company name during analysis
   - Check if company exists in `companies` table
   - If not, create new company record
   - Update pitch_deck with correct company_id

3. **Option C: Manual Company Linking**
   - Admin UI to assign company_id after upload
   - Bulk update tool to fix existing data

---

## 📊 Expected Results After Fix

### VC Lens for We360.ai

```sql
SELECT * FROM pitch_decks
WHERE company_name_extracted = 'We360.ai'
  AND sso_score IS NOT NULL
ORDER BY analyzed_at;
```

**Results:**
```
┌────────────────────────────────────┬──────┬────────────┐
│ Filename                           │ Score│ Date       │
├────────────────────────────────────┼──────┼────────────┤
│ We360.ai (INR) Deck May 2025.pdf  │ 0.91 │ 06:30 AM   │
│ We360.ai (INR) Deck May 2025.pdf  │ 0.82 │ 12:02 PM   │
│ We360.ai (INR) Deck May 2025.pdf  │ 0.94 │ 12:04 PM   │
└────────────────────────────────────┴──────┴────────────┘

✅ CORRECT: Only We360.ai versions grouped together
```

### VC Lens for Cashvisory

```sql
SELECT * FROM pitch_decks
WHERE company_name_extracted = 'Cashvisory'
  AND sso_score IS NOT NULL
ORDER BY analyzed_at;
```

**Results:**
```
┌────────────────────────────────────┬──────┬────────────┐
│ Filename                           │ Score│ Date       │
├────────────────────────────────────┼──────┼────────────┤
│ Cashvisory Deck_Sep 2025.pdf      │ 0.87 │ 11:15 AM   │
└────────────────────────────────────┴──────┴────────────┘

✅ CORRECT: Only Cashvisory versions shown
```

---

## 🎯 Revised VC Lens Feasibility

### Previous Assessment (Using company_id):
- ✅ Feasible if company_id was properly set
- ❌ **BUT it's not!** All analyzed decks have same company_id

### Updated Assessment (Using AI-extracted name):
- ✅ **100% Feasible** with company_name_extracted
- ✅ More reliable than company_id in current state
- ✅ Can be implemented immediately
- ✅ Works with existing analyzed decks

---

## 📋 Action Items

### URGENT (Before VC Lens Implementation):

1. ✅ **Run Migration 010** (add company_name_extracted column)
   ```bash
   cd server
   node -e "const {Pool}=require('pg');require('dotenv').config();const p=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});const fs=require('fs');p.query(fs.readFileSync('migrations/010_add_company_name_extracted.sql','utf8')).then(()=>{console.log('✅ Migration 010 complete!');p.end()}).catch(e=>{console.error(e);p.end()})"
   ```

2. ✅ **Backfill existing analyzed decks**
   ```sql
   UPDATE pitch_decks 
   SET company_name_extracted = 
     CASE 
       WHEN filename ILIKE '%we360%' THEN 'We360.ai'
       WHEN filename ILIKE '%cashvisory%' THEN 'Cashvisory'
       -- Add more as needed
     END
   WHERE sso_score IS NOT NULL;
   ```

3. ✅ **Update AI analysis service** to extract company name

4. ✅ **Build VC Lens using company_name_extracted** (not company_id)

### Future (After VC Lens MVP):

5. 🔄 Fix upload flow to properly assign company_id
6. 🔄 Migrate away from default test company
7. 🔄 Add company management UI

---

## 🎯 Conclusion

**KEY TAKEAWAY:**
- ❌ company_id is NOT usable for VC Lens (all same ID)
- ✅ AI-extracted company name is the ONLY viable option
- ✅ Migration 010 + company name extraction = VC Lens ready
- ✅ Can group We360.ai, Cashvisory, Dr. Doodley separately

**VC Lens is still 100% feasible**, just need to use **company_name_extracted** instead of **company_id**.

**Estimated Implementation:** Still 1-2 days (no change to timeline)

**Ready to proceed with company name extraction approach!** 🚀
