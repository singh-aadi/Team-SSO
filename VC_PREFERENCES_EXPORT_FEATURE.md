# VC Preferences Export Feature ✅

## What Was Added

Added **"Export JSON"** button to the VC Preferences step in the evaluation wizard, allowing users to download their preferences configuration as a JSON file.

## Changes Made

### 1. **EvaluationWizard.tsx**

#### Import Added:
```tsx
import { Download } from 'lucide-react';
```

#### Export Handler Function:
```tsx
const handleExportPreferences = () => {
  // Transforms criteria into structured preferences data
  // - Extracts dealbreakers (subcriteria with "must not", "avoid", "red flag")
  // - Extracts positive patterns (subcriteria with "must have", "should", "positive")
  // - Builds context weights map (criterion.name → criterion.weight)
  // - Builds investment thesis from industry + top 3 weighted criteria
  
  const exportData = {
    preferencesName: 'Wizard Preferences',
    industry: selectedIndustry || 'all',
    criteria: criteria,
    dealbreakers,
    positivePatterns,
    investmentThesis,
    contextWeights,
    exportedAt: new Date().toISOString(),
    userId: userId
  };
  
  // Download as JSON file
  // Filename: vc-preferences-{industry}-{timestamp}.json
}
```

#### UI Button Added:
```tsx
<button
  onClick={handleExportPreferences}
  className="px-6 py-2.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 
             border border-emerald-200 rounded-lg flex items-center space-x-2 
             transition-colors"
  title="Export preferences as JSON file"
>
  <Download className="h-5 w-5" />
  <span>Export JSON</span>
</button>
```

## Where to Find It

**Location**: Step 3 (VC Preferences) in the Evaluation Wizard

**Button Position**: Bottom right, between "Use Defaults" and "Save & Analyze"

**Visual Style**: 
- Emerald green color scheme (matches export/download actions)
- Download icon from lucide-react
- Hover state for better UX

## How It Works

1. **User configures preferences** in the wizard (industry, criteria, weights)
2. **Clicks "Export JSON"** button
3. **Data is transformed**:
   - Criteria → Full structured data
   - Dealbreakers extracted from subcriteria
   - Positive patterns extracted from subcriteria
   - Investment thesis generated
   - Context weights mapped
4. **JSON file downloads** with filename: `vc-preferences-{industry}-{timestamp}.json`
5. **Success alert** shown to user

## Export Data Structure

```json
{
  "preferencesName": "Wizard Preferences",
  "industry": "fintech",
  "criteria": [
    {
      "id": "team",
      "name": "Team",
      "weight": 25,
      "description": "...",
      "subcriteria": [...]
    }
  ],
  "dealbreakers": [
    "Must not have single founder with no advisory board",
    "Avoid companies with no technical co-founder"
  ],
  "positivePatterns": [
    "Must have proven track record in industry",
    "Should have strong product-market fit"
  ],
  "investmentThesis": "Focus on fintech sector. Priority: Team, Market Opportunity, Product & Technology",
  "contextWeights": {
    "Team": 25,
    "Market Opportunity": 25,
    "Product & Technology": 25,
    "Traction & Metrics": 15,
    "Finance": 10
  },
  "exportedAt": "2025-11-25T12:39:00.000Z",
  "userId": "user-abc-123"
}
```

## Use Cases

1. **Backup**: Save preferences configuration for later use
2. **Sharing**: Share evaluation criteria with team members
3. **Version Control**: Track changes to preferences over time
4. **Import**: Can be used as reference for recreating preferences
5. **Analysis**: External tools can analyze preferences structure

## Benefits

✅ **No backend dependency** - Works even if save-preferences API fails  
✅ **Immediate download** - No network latency  
✅ **Full data capture** - Includes all transformed data (dealbreakers, patterns, thesis)  
✅ **User-friendly** - Simple one-click export  
✅ **Timestamped** - Files include export date and time  

## Testing

1. Go to http://localhost:3001
2. Start evaluation wizard
3. Configure VC Preferences (Step 3)
4. Click "Export JSON" button
5. Check Downloads folder for: `vc-preferences-{industry}-{timestamp}.json`
6. Open file to verify all data is included

## Status

✅ **Implemented and Live** (via HMR - Hot Module Reload)  
🚀 **Ready to use immediately**

---

**Built**: November 25, 2025  
**Feature**: Export VC Preferences as JSON  
**Location**: `src/components/EvaluationWizard.tsx`
