# VC Preferences in Analysis Output - Complete

## 🎯 Overview
The analysis output now includes the VC preferences (custom evaluation weights) that were used during the analysis. This provides full transparency about which weights influenced the AI's evaluation.

## ✅ What Was Implemented

### 1. **Database Schema Update**

#### New Column: `vc_preferences_used`
- **Table**: `pitch_decks`
- **Type**: `JSONB`
- **Purpose**: Stores the complete VC preferences object that was active during analysis
- **Migration**: `008_add_vc_preferences_used.sql`

```sql
ALTER TABLE pitch_decks 
ADD COLUMN IF NOT EXISTS vc_preferences_used JSONB;
```

**Stored Data Structure**:
```json
{
  "preferencesName": "SaaS Early Stage Focus",
  "industry": "Technology",
  "criteria": [
    {
      "name": "Team",
      "weight": 40,
      "subcriteria": [
        { "name": "Leadership Experience", "weight": 50 },
        { "name": "Domain Expertise", "weight": 30 },
        { "name": "Team Composition", "weight": 20 }
      ]
    },
    {
      "name": "Market",
      "weight": 30,
      "subcriteria": [...]
    }
  ]
}
```

### 2. **AI Service Layer Updates**

#### Updated Return Types
All three analysis functions now return `vcPreferencesUsed`:

**`analyzeDualPDFs()`**
```typescript
Promise<{
  analysis: AnalysisResult;
  sections: SectionAnalysis[];
  checklistItems: ChecklistItem[];
  vcPreferencesUsed?: VCPreferences; // ← NEW
}>
```

**`analyzePitchDeckFromPDF()`**
```typescript
Promise<{
  analysis: AnalysisResult;
  sections: SectionAnalysis[];
  vcPreferencesUsed?: VCPreferences; // ← NEW
}>
```

**`analyzePitchDeckWithGrounding()`**
```typescript
Promise<{
  analysis: AnalysisResult;
  sections: SectionAnalysis[];
  checklistItems: ChecklistItem[];
  webEnrichment: { ... };
  groundingMetadata?: { ... };
  vcPreferencesUsed?: VCPreferences; // ← NEW
}>
```

### 3. **API Routes Updates**

#### All Upload Endpoints Store Preferences
Three endpoints now persist `vc_preferences_used` to database:

1. **`POST /api/decks/upload-dual`** (Dual PDF upload)
2. **`POST /api/decks/upload`** (Single deck upload)
3. **`POST /api/decks/:id/analyze`** (Re-analysis)

**SQL Update Pattern**:
```typescript
await query(`
  UPDATE pitch_decks 
  SET analysis_status = 'completed',
      sso_score = $1,
      dual_pdf_analysis = $2,
      vc_preferences_used = $3,  // ← NEW
      analyzed_at = CURRENT_TIMESTAMP
  WHERE id = $4
`, [
  overallScore,
  analysisJSON,
  vcPreferences ? JSON.stringify(vcPreferences) : null,
  deckId
]);
```

#### GET Endpoint Returns Preferences
**`GET /api/decks/:id`** now includes preferences:

```typescript
res.json({
  deck: {
    ...deck,
    analysis: analysis,
    vcPreferencesUsed: deck.vc_preferences_used || null  // ← NEW
  }
});
```

### 4. **Enhanced Console Logging**

Added logging to show when preferences are used:

```
🎯 Fetching VC preferences for user 12345...
✅ Loaded VC preferences: "SaaS Early Stage Focus"
🔍 Running standard PDF analysis...
✅ Analysis with Grounding complete!
🎯 Analysis used custom VC evaluation weights from "SaaS Early Stage Focus"
   Overall Score: 82/100
   🎯 VC Preferences: "SaaS Early Stage Focus" (Technology)
```

## 📊 API Response Examples

### Analysis Response (POST /api/decks/:id/analyze)
```json
{
  "message": "AI Analysis completed successfully!",
  "sso_score": "0.82",
  "analysis": {
    "overall": { ... },
    "sections": [ ... ]
  },
  "vcPreferencesUsed": {
    "preferencesName": "SaaS Early Stage Focus",
    "industry": "Technology",
    "criteria": [
      {
        "name": "Team",
        "weight": 40,
        "subcriteria": [
          { "name": "Leadership Experience", "weight": 50 },
          { "name": "Domain Expertise", "weight": 30 }
        ]
      }
    ]
  }
}
```

### Deck Details Response (GET /api/decks/:id)
```json
{
  "deck": {
    "id": "deck-uuid-123",
    "company_name": "Acme Corp",
    "sso_score": 0.82,
    "analysis_status": "completed",
    "analysis": { ... },
    "vcPreferencesUsed": {
      "preferencesName": "Enterprise B2B Focus",
      "industry": "Enterprise Software",
      "criteria": [ ... ]
    }
  }
}
```

## 🔄 End-to-End Flow

1. **VC sets custom weights** in VC Mode
   - Team: 40%, Market: 30%, Product: 20%, Traction: 10%
   
2. **VC saves preferences** → stored in `vc_preferences` table

3. **VC uploads pitch deck** → backend fetches latest preferences

4. **AI analyzes with weights** → includes custom instructions in prompt

5. **Analysis completes** → stores both:
   - Analysis results
   - Preferences used (in `vc_preferences_used` column)

6. **Frontend fetches results** → receives:
   - Full analysis
   - **Exact preferences that influenced the analysis**

7. **User can see**:
   - "This analysis used: 'SaaS Early Stage Focus' weights"
   - "Team weighted at 40%, Market at 30%..."

## 🎨 Frontend Display Possibilities

### Option 1: Badge Display
```jsx
{deck.vcPreferencesUsed && (
  <div className="badge">
    📊 Analyzed using: {deck.vcPreferencesUsed.preferencesName}
  </div>
)}
```

### Option 2: Expandable Details
```jsx
{deck.vcPreferencesUsed && (
  <details>
    <summary>
      🎯 Custom Evaluation Weights Used
    </summary>
    <ul>
      {deck.vcPreferencesUsed.criteria.map(c => (
        <li key={c.name}>
          {c.name}: {c.weight}%
          <ul>
            {c.subcriteria.map(sc => (
              <li>{sc.name}: {sc.weight}%</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  </details>
)}
```

### Option 3: Visual Weight Chart
```jsx
<WeightVisualization 
  preferences={deck.vcPreferencesUsed} 
  title="Evaluation Weights Used"
/>
```

## 🧪 Testing

### 1. Verify Column Added
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pitch_decks' 
AND column_name = 'vc_preferences_used';
```

### 2. Test Analysis with Preferences
```bash
# 1. Save VC preferences in UI
# 2. Upload a pitch deck
# 3. Check logs for: "✅ Loaded VC preferences"
# 4. Check database:
```

```sql
SELECT 
  id, 
  company_id, 
  sso_score,
  vc_preferences_used->>'preferencesName' as preferences_name,
  vc_preferences_used->'criteria' as weights
FROM pitch_decks 
WHERE vc_preferences_used IS NOT NULL;
```

### 3. Test API Response
```bash
curl http://localhost:3000/api/decks/{deck-id} | jq '.deck.vcPreferencesUsed'
```

Expected output:
```json
{
  "preferencesName": "SaaS Early Stage Focus",
  "industry": "Technology",
  "criteria": [...]
}
```

### 4. Test Without Preferences
- Upload deck without being logged in OR without saved preferences
- Verify `vcPreferencesUsed` is `null` in response
- Analysis should still complete successfully (uses defaults)

## 🔐 Data Integrity

### NULL Handling
- Column accepts NULL (no preferences used)
- All queries use `vcPreferences ? JSON.stringify(vcPreferences) : null`
- Frontend checks `deck.vcPreferencesUsed || null`

### Historical Analysis
- Each analysis stores snapshot of preferences at time of analysis
- Changing preferences later doesn't affect past analyses
- Can see evolution of evaluation criteria over time

### Query for Preference Usage
```sql
-- See all analyses done with custom preferences
SELECT 
  d.id,
  c.name as company,
  d.sso_score,
  d.vc_preferences_used->>'preferencesName' as pref_name,
  d.analyzed_at
FROM pitch_decks d
JOIN companies c ON d.company_id = c.id
WHERE d.vc_preferences_used IS NOT NULL
ORDER BY d.analyzed_at DESC;
```

## 📈 Benefits

1. **Transparency**: Users know exactly which weights were used
2. **Reproducibility**: Can replicate analysis with same weights
3. **Audit Trail**: Historical record of evaluation criteria evolution
4. **Debugging**: Easy to identify if wrong preferences were applied
5. **Comparison**: Compare analyses done with different preference sets
6. **Education**: New team members can see expert VCs' evaluation frameworks

## 🚀 Future Enhancements

1. **Preference Comparison View**
   - Show side-by-side: analysis with weights A vs weights B
   
2. **Weight Impact Visualization**
   - Heatmap showing which weights most influenced the score
   
3. **Preference Templates Library**
   - Share successful weight configurations across team
   
4. **Time-Series Analysis**
   - Track how a company scores under different preference sets over time
   
5. **Preference Recommendations**
   - AI suggests optimal weights based on successful past investments

## 📝 Files Modified

### Backend
- ✅ `server/migrations/008_add_vc_preferences_used.sql` - NEW
- ✅ `server/migrate-008.js` - NEW (migration runner)
- ✅ `server/src/services/ai-enhanced.ts` - Updated return types
- ✅ `server/src/routes/decks.ts` - Store and return preferences

### Database
- ✅ `pitch_decks.vc_preferences_used` column added (JSONB)

## ✅ Migration Status

**Migration 008**: ✅ **COMPLETED**
```
✅ Migration 008 completed successfully!
✅ Column verified: { column_name: 'vc_preferences_used', data_type: 'jsonb' }
```

## 📊 Summary

- ✅ Database column added
- ✅ All analysis functions return preferences used
- ✅ All upload endpoints store preferences
- ✅ GET endpoint returns preferences
- ✅ Enhanced logging shows preference usage
- ✅ No compilation errors
- ✅ Backward compatible (NULL for no preferences)

**Users can now see exactly which evaluation weights influenced every analysis!** 🎯

---

**Status**: ✅ **COMPLETE**  
**Date**: 2024  
**Related Docs**: `VC_MODE_PREFERENCES.md`, `VC_PREFERENCES_AI_INTEGRATION.md`
