# VC Preferences Enhancement - Complete Implementation

## 🎯 Objective
Ensure the weighted scoring formula is included in AI prompts and displayed in PDF reports.

## ✅ Changes Made

### 1. AI Prompt Verification Logging
**File:** `server/src/services/ai-enhanced.ts`

Added comprehensive logging to verify the weighted formula is included in the AI prompt:

```typescript
// 📝 LOG: Verify weighted instructions are included
console.log('\n' + '='.repeat(80));
console.log('🎯 DUAL PDF ANALYSIS - WEIGHTED PROMPT VERIFICATION');
console.log('='.repeat(80));
console.log('📊 VC Preferences:', vcPreferences ? 'Custom weights provided' : 'None (using defaults)');
console.log('📝 Weighted Instructions Length:', weightedInstructions.length, 'characters');
console.log('🔍 Formula Check:', weightedInstructions.includes('overallScore =') ? '✅ FOUND' : '❌ MISSING');
console.log('-'.repeat(80));
console.log('📜 WEIGHTED INSTRUCTIONS PREVIEW (first 800 chars):');
console.log(weightedInstructions.substring(0, 800));
console.log('='.repeat(80) + '\n');
```

**What it does:**
- Confirms VC preferences are loaded
- Verifies the formula string `overallScore =` is present in the prompt
- Shows first 800 characters of the weighted instructions
- Helps debug if formula is missing from AI prompts

**When you'll see it:**
Every time a pitch deck is analyzed with or without custom VC preferences, these logs will appear in the server console.

---

### 2. PDF Generator Enhancement - VC Preferences Section
**File:** `server/src/services/enhancedPdfGenerator.ts`

#### A) Updated Interface
Added `vcPreferencesUsed` to the options:

```typescript
interface EnhancedPDFOptions {
  deck: any;
  analysis: any;
  selectedStage: string;
  selectedIndustry: string;
  companyName?: string;
  webEnrichment?: { ... };
  groundingMetadata?: { ... };
  // 🎯 NEW: VC preferences used for this analysis
  vcPreferencesUsed?: {
    name?: string;
    industry?: string;
    criteria: Array<{
      id: string;
      name: string;
      weight: number;
      subcriteria: Array<{ ... }>;
    }>;
  };
}
```

#### B) New Function: `addVCPreferencesSection()`
**Location:** Lines ~1519 (before `addScoreBreakdown`)

**What it displays:**
1. **Title:** "INVESTMENT CRITERIA & WEIGHTING"
2. **Context:** Explains the analysis was customized based on specific preferences
3. **Preference Profile:**
   - Preference name (if available)
   - Industry focus (if available)
4. **Evaluation Criteria & Weights:**
   - Visual bars showing each criterion's weight (0-100%)
   - Weight badges with percentages
   - Color-coded visualization using primary colors
5. **Score Calculation Formula:**
   - Builds formula from criteria: `Overall Score = (teamScore × 40%) + (marketScore × 30%) + ...`
   - Displays in a highlighted box
   - Shows actual calculation from AI if available
6. **Validation Note:**
   - Confirms scores were validated against the formula

**Visual Design:**
- Professional color scheme (primary blue #2563eb)
- Weight bars with transparency
- Badge-style weight indicators
- Formula displayed in a background box
- Page overflow prevention

#### C) Added to PDF Generation Flow
**Location:** After score breakdown, before section details

```typescript
// PAGE: VC Preferences Used (if available)
if (options.vcPreferencesUsed) {
  doc.addPage();
  addVCPreferencesSection(doc, options.vcPreferencesUsed, analysis);
}
```

**Result:** If VC preferences were used for the analysis, a dedicated page will be added to the PDF report showing exactly what weights were applied.

---

### 3. Route Update - Pass VC Preferences to PDF
**File:** `server/src/routes/decks.ts`

Updated the enhanced PDF generation call to include VC preferences:

```typescript
const pdfPath = await generateEnhancedPDF({
  deck: { ... },
  analysis: analysisData,
  selectedStage: stage as string,
  selectedIndustry: industry as string,
  companyName: undefined,
  webEnrichment: deck.web_enrichment || undefined,
  groundingMetadata: deck.web_enrichment?.groundingMetadata || undefined,
  // 🎯 NEW: Include VC preferences used for this analysis
  vcPreferencesUsed: deck.vc_preferences_used || undefined
});
```

**Data flow:**
1. VC preferences stored in `pitch_decks.vc_preferences_used` (JSONB column)
2. Retrieved when generating enhanced PDF
3. Passed to PDF generator
4. Displayed in new VC Preferences section

---

## 🔍 How to Verify

### 1. Verify Formula in AI Prompt
**Steps:**
1. Go to VC Mode and set custom weights (e.g., Team=100%, others=0%)
2. Upload and analyze a pitch deck
3. Check the **server console** for the verification logs:
   ```
   ================================================================================
   🎯 DUAL PDF ANALYSIS - WEIGHTED PROMPT VERIFICATION
   ================================================================================
   📊 VC Preferences: Custom weights provided
   📝 Weighted Instructions Length: 1234 characters
   🔍 Formula Check: ✅ FOUND
   --------------------------------------------------------------------------------
   📜 WEIGHTED INSTRUCTIONS PREVIEW (first 800 chars):
   
   ==========================================
   🎯 WEIGHTED SCORING FORMULA
   ==========================================
   ...
   overallScore = (teamScore × 1.00) + (marketScore × 0.00) + ...
   ```
4. Confirm you see:
   - ✅ Formula Check: **✅ FOUND**
   - Formula preview showing your custom weights

### 2. Verify Formula in PDF Report
**Steps:**
1. After analysis completes, click **"Download Enhanced Report"**
2. Open the PDF
3. Look for the new page: **"INVESTMENT CRITERIA & WEIGHTING"**
4. Verify it shows:
   - Your preference profile name/industry (if set)
   - Each criterion with visual weight bars
   - Weight badges (e.g., "100%" for Team)
   - Score Calculation Formula box
   - Actual calculation used (if provided by AI)
   - Validation note at bottom

### 3. Test Score Validation
**Test case:**
- Set Team weight to 100%, all others to 0%
- Analyze a deck that gets Team score = 65
- **Expected:** Overall score should be 65 (or close due to rounding)
- **What happens:**
  1. AI generates score (might be wrong, e.g., 78)
  2. `validateAndCorrectScore()` recalculates: 65 × 1.00 = 65
  3. If difference > 2 points, score is corrected
  4. Corrected score saved to database
  5. Logs show: "⚠️ Score corrected: AI said 78, should be 65, corrected to 65"

---

## 🐛 Troubleshooting

### Formula Not Found in Logs
**If you see:** `🔍 Formula Check: ❌ MISSING`

**Possible causes:**
1. `buildWeightedEvaluationInstructions()` function has a bug
2. VC preferences not loaded correctly
3. Formula template changed

**Check:**
- Look at the "WEIGHTED INSTRUCTIONS PREVIEW" in logs
- Should contain text like: `overallScore = (teamScore × 0.40) + ...`
- If missing, check lines 68-200 in `ai-enhanced.ts`

### VC Preferences Page Not in PDF
**If the page is missing from PDF:**

**Possible causes:**
1. `deck.vc_preferences_used` is null/undefined
2. VC preferences weren't saved during analysis
3. Using old analysis before this feature

**Check:**
1. Verify the deck was analyzed AFTER implementing migration 008
2. Re-analyze the deck to get new vc_preferences_used data
3. Check database: `SELECT vc_preferences_used FROM pitch_decks WHERE id = X;`

### Score Still Wrong After Validation
**If overall score doesn't match expected weighted average:**

**Check:**
1. Server logs for validation message:
   ```
   ⚠️ Score corrected: AI said 78, should be 65, corrected to 65
   ```
2. If not appearing, validation might not be running
3. Check `analyzeDualPDFs()` calls `validateAndCorrectScore()`
4. Verify threshold: only corrects if difference > 2 points

---

## 📊 Database Schema Reference

### VC Preferences Storage
```sql
-- Stored in pitch_decks table
vc_preferences_used JSONB

-- Example data:
{
  "criteria": [
    {
      "id": "team",
      "name": "Team",
      "weight": 1.0,
      "subcriteria": []
    },
    {
      "id": "market",
      "name": "Market",
      "weight": 0.0,
      "subcriteria": []
    }
  ]
}
```

### Where It's Set
**File:** `server/src/routes/decks.ts` (all upload endpoints)

After AI analysis, before saving to database:
```typescript
vc_preferences_used = $14
```
Value: `vcPreferences || null`

---

## 🎨 PDF Design Specs

### Colors Used
- **Primary:** `#2563eb` (Professional Blue)
- **Primary Light:** `#60a5fa` (Badge backgrounds)
- **Dark:** `#1e293b` (Titles)
- **Medium Dark:** `#475569` (Body text)
- **Medium:** `#64748b` (Notes)
- **Background:** `#f8fafc` (Formula box)
- **White:** `#ffffff` (Badge text)

### Layout
- **Title:** 26pt Helvetica-Bold
- **Section headers:** 14pt Helvetica-Bold
- **Body text:** 11-12pt Helvetica
- **Formula:** 11pt Helvetica in background box
- **Weight badges:** 60px × 22px rounded rectangles
- **Weight bars:** Full width minus 220px

---

## 🚀 Next Steps

### Testing Checklist
- [ ] Upload deck with default weights → verify logs show default formula
- [ ] Upload deck with custom weights → verify logs show custom formula
- [ ] Download enhanced PDF → verify VC preferences page exists
- [ ] Test Team=100% scenario → verify overall score matches team score
- [ ] Test multiple criteria → verify formula shows all weights
- [ ] Test with Team=0% → verify calculation handles zero weights

### Optional Enhancements
1. **Add subcriteria display** - Show nested weights if used
2. **Add comparison** - Show default vs custom weights side-by-side
3. **Add impact analysis** - Show how scores would differ with default weights
4. **Add criterion mapping** - Show which deck sections map to which criteria

---

## 📝 Files Modified

1. ✅ `server/src/services/ai-enhanced.ts` - Added prompt verification logging
2. ✅ `server/src/services/enhancedPdfGenerator.ts` - Added VC preferences section
3. ✅ `server/src/routes/decks.ts` - Pass VC preferences to PDF generator

**No breaking changes** - All changes are additive and backward compatible.

---

## 🎓 How It Works

### Flow Diagram
```
User Sets Weights in VC Mode
         ↓
Saved to vc_preferences table
         ↓
User Uploads Deck
         ↓
Route fetches VC preferences
         ↓
buildWeightedEvaluationInstructions() generates formula
         ↓
Logs verify formula is in prompt ← NEW
         ↓
Prompt sent to Gemini AI
         ↓
AI returns analysis with scores
         ↓
validateAndCorrectScore() checks math
         ↓
Corrected scores saved to database
         ↓
Preferences snapshot saved in vc_preferences_used
         ↓
User downloads PDF
         ↓
PDF generator includes VC Preferences page ← NEW
         ↓
Formula and weights displayed visually
```

---

## ✨ Summary

**Before:**
- ❌ No visibility into whether formula was in AI prompt
- ❌ PDF didn't show what weights were used
- ❌ Users couldn't verify the calculation

**After:**
- ✅ Console logs confirm formula is in every prompt
- ✅ PDF has dedicated page showing all weights and formula
- ✅ Actual calculation displayed for transparency
- ✅ Validation note confirms scores are mathematically correct
- ✅ Professional visual design with bars and badges

**Result:** Full transparency and verifiability of weighted scoring system! 🎉
