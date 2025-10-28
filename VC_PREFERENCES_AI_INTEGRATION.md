# VC Preferences AI Integration - Complete

## 🎯 Overview
Successfully integrated VC preferences (custom evaluation weights) into the AI analysis pipeline. When VCs upload pitch decks for analysis, their saved custom weights will now influence how the AI evaluates startups.

## ✅ What Was Done

### 1. **AI Service Layer Updates** (`server/src/services/ai-enhanced.ts`)

#### Added Type Definition
```typescript
interface VCPreferences {
  preferencesName: string;
  industry: string;
  criteria: Array<{
    name: string;
    weight: number;
    subcriteria: Array<{
      name: string;
      weight: number;
    }>;
  }>;
}
```

#### Created Helper Function
```typescript
function buildWeightedEvaluationInstructions(vcPreferences?: VCPreferences): string
```
- Returns default evaluation instructions if no preferences provided
- Builds custom weighted instructions from saved criteria
- Formats output with main criteria weights (e.g., "Team: 35% importance")
- Includes subcriteria weights indented under parent criteria
- Emphasizes that AI MUST prioritize higher-weighted areas

#### Updated Function Signatures
All three analysis functions now accept optional `vcPreferences` parameter:

1. **`analyzeDualPDFs()`**
   - Before: `(deckPath, checklistPath, companyName)`
   - After: `(deckPath, checklistPath, companyName, vcPreferences?)`
   - Comprehensive prompt now includes: `${weightedInstructions}`

2. **`analyzePitchDeckFromPDF()`**
   - Before: `(pdfPath, companyName)`
   - After: `(pdfPath, companyName, vcPreferences?)`
   - Prompt includes weighted instructions and note to apply custom weights

3. **`analyzePitchDeckWithGrounding()`**
   - Before: `(deckPath, checklistPath, companyName, industry, additionalContext?)`
   - After: `(deckPath, checklistPath, companyName, industry, additionalContext?, vcPreferences?)`
   - Passes preferences to underlying analysis functions

### 2. **API Routes Updates** (`server/src/routes/decks.ts`)

Added VC preferences fetching logic to **three upload endpoints**:

#### `/api/decks/upload-dual` (Primary dual PDF upload)
```typescript
// Fetch user's most recent VC preferences
let vcPreferences: { ... } | undefined;
if (uploaded_by) {
  const prefResult = await query(
    `SELECT preferences_name, industry, criteria 
     FROM vc_preferences 
     WHERE user_id = $1 
     ORDER BY updated_at DESC 
     LIMIT 1`,
    [uploaded_by]
  );
  
  if (prefResult.rows.length > 0) {
    vcPreferences = { ... };
    console.log(`✅ Loaded VC preferences: "${vcPreferences.preferencesName}"`);
  }
}

// Pass to analysis
await analyzePitchDeckWithGrounding(..., vcPreferences);
```

#### `/api/decks/upload` (Single deck upload)
- Same preference fetching logic
- Passes to `analyzePitchDeckFromPDF()`

#### `/api/decks/:id/analyze` (Re-analysis trigger)
- Same preference fetching logic
- Ensures re-analysis uses current preferences

## 🔄 End-to-End Flow

1. **VC customizes weights** in VCMode component (frontend)
2. **Clicks Save** → POST to `/api/vc-preferences`
3. **Preferences stored** in `vc_preferences` table with JSONB criteria
4. **VC uploads pitch deck** → POST to `/api/decks/upload-dual`
5. **Backend fetches** user's latest preferences from DB
6. **Preferences passed** through call stack: route → service → AI prompt
7. **AI receives prompt** with custom weighted instructions
8. **Gemini analyzes** startup with emphasis on high-weighted criteria
9. **Results reflect** VC's priorities (e.g., 40% weight on Team = more detailed team analysis)

## 📊 Example: How Weights Influence Analysis

### Default Analysis (no preferences)
```
Evaluate the startup across these criteria:
- Team
- Market
- Product
- Traction
```

### With Custom Preferences (Team: 40%, Market: 30%, Product: 20%, Traction: 10%)
```
CUSTOM VC EVALUATION WEIGHTS:
You MUST prioritize the following criteria based on these custom weights:

Main Criteria:
- Team: 40% importance
  - Leadership Experience: 50%
  - Domain Expertise: 30%
  - Team Composition: 20%
- Market: 30% importance
  - Market Size: 60%
  - Growth Rate: 40%
- Product: 20% importance
  - Innovation: 70%
  - Scalability: 30%
- Traction: 10% importance
  - Revenue: 50%
  - User Growth: 50%

IMPORTANT: Your analysis MUST give significantly more weight and depth to higher-weighted criteria.
```

## 🎯 Console Output Examples

When analysis runs with preferences:
```
🎯 Fetching VC preferences for user 12345...
✅ Loaded VC preferences: "SaaS Early Stage Focus"
🔍 Running standard PDF analysis...
🎯 Analysis used custom VC evaluation weights from "SaaS Early Stage Focus"
```

When no preferences found:
```
🎯 Fetching VC preferences for user 12345...
ℹ️ No VC preferences found for this user, using defaults
```

## 🧪 Testing the Integration

### 1. Verify Preferences Saved
```sql
SELECT * FROM vc_preferences WHERE user_id = 'YOUR_USER_ID';
```

### 2. Upload Test Deck
- Go to Deck Intelligence or Deal Flow Hub
- Upload a pitch deck (with checklist if using dual mode)
- Check server console logs for preference loading messages

### 3. Verify Analysis Reflects Weights
- View analysis results
- Sections with higher weights should have:
  - More detailed feedback
  - More comprehensive strengths/improvements
  - Greater impact on overall score

### 4. Test Re-analysis
- Modify VC preferences (change weights)
- Save new preferences
- Trigger re-analysis of existing deck
- Verify analysis changes to reflect new weights

## 📁 Files Modified

1. `server/src/services/ai-enhanced.ts`
   - Added VCPreferences interface
   - Added buildWeightedEvaluationInstructions() helper
   - Updated analyzeDualPDFs() signature and prompt
   - Updated analyzePitchDeckFromPDF() signature and prompt
   - Updated analyzePitchDeckWithGrounding() signature and calls

2. `server/src/routes/decks.ts`
   - Updated `/upload-dual` endpoint with preference fetching
   - Updated `/upload` endpoint with preference fetching
   - Updated `/:id/analyze` endpoint with preference fetching

## 🔐 Security Considerations

- Preferences are user-specific (filtered by `user_id`)
- Only most recent preferences are used (ORDER BY `updated_at DESC LIMIT 1`)
- Graceful fallback if preference fetching fails (continues with default evaluation)
- Type-safe with TypeScript interfaces

## 🚀 Future Enhancements

1. **Multiple Preference Sets**: Allow users to select which preference set to use per upload
2. **Industry-Specific Defaults**: Pre-populate preferences based on industry selection
3. **Preference Templates**: Share successful evaluation frameworks across team
4. **Weight Visualization**: Show how weights affected specific scores in UI
5. **A/B Testing**: Compare analyses using different weight configurations

## ✅ Success Criteria

- [x] VCPreferences interface matches database schema
- [x] Helper function correctly formats weighted instructions
- [x] All three analysis functions accept preferences parameter
- [x] Prompts include weighted instructions when preferences provided
- [x] All three upload endpoints fetch and pass preferences
- [x] No TypeScript compilation errors
- [x] Graceful handling when preferences not found
- [x] Console logs provide visibility into preference loading

## 📝 Notes

- Preferences are **optional** - analysis works with or without them
- Uses **most recent** preferences per user (no preference selection UI yet)
- Weights are **percentages** (0-100) stored in criteria array
- AI is **instructed** to prioritize based on weights, but ultimate behavior depends on model
- All changes are **backward compatible** - existing code without preferences still works

---

**Status**: ✅ **COMPLETE**  
**Last Updated**: 2024  
**Related Docs**: `VC_MODE_PREFERENCES.md`, `docs/features/GEMINI_PROMPTS.md`
