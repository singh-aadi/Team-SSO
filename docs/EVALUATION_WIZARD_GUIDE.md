# 🧙‍♂️ Evaluation Wizard - Guided Deck Analysis Flow

**Created:** November 1, 2025  
**Purpose:** Unified workflow for uploading pitch decks with optional context and custom evaluation preferences

---

## Overview

The **Evaluation Wizard** provides a **4-step guided flow** for comprehensive pitch deck analysis:

```
1. Upload Deck + Checklist
   ↓
2. Add VC Context (optional) - meeting notes, transcripts, etc.
   ↓
3. Set Evaluation Preferences (optional) - custom criteria weights
   ↓
4. AI Analysis - Deep analysis with all context + preferences
```

This replaces the fragmented workflow where users had to:
- Upload deck in one place
- Add context in a separate VC Context page
- Configure preferences in VCMode separately
- Then manually trigger analysis

---

## Key Features

### ✨ **Progressive Enhancement**
- **Step 1 (Required):** Upload pitch deck + checklist
- **Step 2 (Optional):** Add due diligence context
- **Step 3 (Optional):** Customize evaluation criteria
- **Step 4 (Automatic):** AI analyzes with all collected data

### 🎯 **Visual Progress Tracking**
- 4-step progress indicator at top
- Current step highlighted in color
- Completed steps stay visible

### 🔄 **Smart Navigation**
- "Back" buttons to revise previous steps
- "Skip" options for optional steps
- "Next" auto-advances after completion

### 🧠 **Agentic Integration**
When users save preferences in Step 3:
1. **Preferences saved** to `vc_evaluation_preferences` table
2. **Prompt regeneration triggered** via `/api/vc-agent/save-preferences`
3. **Dynamic Prompt Agent** generates custom evaluation prompt
4. **Analysis uses custom prompt** for personalized scoring

---

## User Flow

### Step 1: Upload Deck + Checklist

**Required Fields:**
- Pitch Deck PDF
- Evaluation Checklist PDF
- Funding Stage (Pre-Seed, Seed, Series A, etc.)
- Industry Vertical (SaaS, Fintech, Healthcare, etc.)

**Actions:**
- Select files via file inputs
- Choose stage and industry from dropdowns
- Click "Next: Add Context"

**Backend:**
```typescript
POST /api/decks/upload
Body: FormData {
  deckFile: File,
  checklistFile: File,
  companyId: string,
  userId: string,
  context: null // No context yet
}
```

---

### Step 2: VC Context (Optional)

**Embedded VCContextManager Component:**
- Upload meeting notes (.txt, .pdf, .docx)
- Upload transcripts (.txt, .docx)
- Upload audio/video (auto-transcribed: .mp3, .m4a, .mp4)
- Upload any due diligence materials

**Actions:**
- Upload files via drag-and-drop or file picker
- Files processed and stored in `vc_context` table
- Click "Next: Preferences" to continue
- Or "Skip Context" to proceed without

**API Calls:**
```typescript
POST /api/vc-context/:deckId/upload
Body: FormData { file, itemType }

GET /api/vc-context/:deckId/items
Returns: { success, items: ContextItem[] }
```

---

### Step 3: Evaluation Preferences (Optional)

**Custom Criteria Weights:**
- **Team & Execution:** 0-100% slider
- **Market Opportunity:** 0-100% slider
- **Product & Technology:** 0-100% slider
- **Traction & Metrics:** 0-100% slider

**Visual Feedback:**
- Total weight displayed (ideal: 100%)
- Color-coded: Green if 100%, Amber otherwise
- Sliders independent (no forced constraints)

**Actions:**
- Adjust sliders to preferred weights
- Click "Save & Analyze" to trigger agentic system
- Or "Use Defaults" to skip customization

**Agentic Backend Flow:**
```typescript
POST /api/vc-agent/save-preferences
Body: {
  userId: string,
  industry: string,
  criteria: {
    teamWeight: number,
    marketWeight: number,
    productWeight: number,
    tractionWeight: number,
    customCriteria: Array
  }
}

// Backend automatically:
1. Saves to vc_evaluation_preferences table
2. Calls promptAgent.triggerPromptRegeneration()
3. AI generates custom prompt via meta-prompting
4. Stores in vc_custom_prompts table with version
```

---

### Step 4: Analyzing

**Auto-triggered after Step 3:**
- Displays animated spinner
- Shows message: "AI is processing your deck [with context] [using custom preferences]..."
- Backend polls for analysis completion (2-10 minutes)
- Auto-redirects to analysis results when complete

**Backend Processing:**
```
1. Text extraction from dual PDFs
2. Structure analysis (sections, key points)
3. Market evaluation via web grounding
4. Team assessment
5. Traction metrics extraction
6. Unit economics analysis
7. Custom criteria scoring (if preferences set)
8. Context integration (if items uploaded)
9. SSO Score™ calculation
10. Final report generation
```

---

## File Structure

```
src/components/
├── EvaluationWizard.tsx          # Main wizard component (593 lines)
│   ├── Step navigation logic
│   ├── Upload step UI
│   ├── Context step (embeds VCContextManager)
│   ├── Preferences step UI
│   └── Analyzing step UI
│
├── DeckIntelligence.tsx          # Updated with wizard toggle
│   ├── "Guided Evaluation" button (top-right)
│   ├── handleWizardComplete() callback
│   └── Falls back to classic upload if wizard disabled
│
└── VCContextManager.tsx          # Updated for embedded mode
    ├── embedded prop (boolean)
    ├── Hides navigation when embedded
    └── Simplified header in wizard mode
```

---

## Technical Implementation

### State Management

**EvaluationWizard State:**
```typescript
type WizardStep = 'upload' | 'context' | 'preferences' | 'analyzing';

interface VCPreferences {
  teamWeight: number;
  marketWeight: number;
  productWeight: number;
  tractionWeight: number;
  customCriteria: Array<{
    name: string;
    weight: number;
    subCriteria: string[];
  }>;
}

const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
const [uploadedDeckId, setUploadedDeckId] = useState<string | null>(null);
const [hasContext, setHasContext] = useState(false);
const [hasCustomPreferences, setHasCustomPreferences] = useState(false);
```

### Navigation Flow

```typescript
// Step 1 → Step 2
const handleUploadStep = async () => {
  const deck = await api.uploadDualDeck(...);
  setUploadedDeckId(deck.id);
  setCurrentStep('context');
};

// Step 2 → Step 3
const handleContextComplete = async () => {
  const response = await vcContextApi.getContextItems(uploadedDeckId);
  setHasContext(response.items.length > 0);
  setCurrentStep('preferences');
};

// Step 3 → Step 4
const handleSavePreferences = async () => {
  await fetch('/api/vc-agent/save-preferences', {...});
  setHasCustomPreferences(true);
  startAnalysis();
};

// Step 4 → Parent component
const startAnalysis = () => {
  setCurrentStep('analyzing');
  setTimeout(() => {
    onComplete(uploadedDeckId, hasContext, hasCustomPreferences);
  }, 2000);
};
```

---

## UI Components

### Progress Indicator

```tsx
<div className="flex items-center justify-between">
  {/* Step 1 */}
  <div className={currentStep === 'upload' ? 'text-blue-600' : 'text-slate-400'}>
    <div className={currentStep === 'upload' ? 'bg-blue-600' : 'bg-slate-200'}>1</div>
    <span>Upload</span>
  </div>
  
  <div className="flex-1 h-0.5 bg-slate-200"></div>
  
  {/* Step 2 */}
  <div className={currentStep === 'context' ? 'text-purple-600' : 'text-slate-400'}>
    <div className={currentStep === 'context' ? 'bg-purple-600' : 'bg-slate-200'}>2</div>
    <span>Context</span>
  </div>
  
  {/* ... similar for steps 3 & 4 */}
</div>
```

### Embedded VCContextManager

```tsx
{uploadedDeckId && (
  <VCContextManager 
    deckId={uploadedDeckId} 
    companyName={`Deck ${uploadedDeckId.slice(0, 8)}`}
    embedded={true}  // Hides navigation, simplifies header
  />
)}
```

---

## API Integration

### Agentic System Endpoints

**Save Preferences + Regenerate Prompt:**
```
POST /api/vc-agent/save-preferences
{
  userId: string,
  industry: string,
  criteria: VCPreferences
}

Response:
{
  success: true,
  promptVersion: "v1.2.3",
  regenerated: true
}
```

**Get Custom Prompt:**
```
GET /api/vc-agent/prompt/:userId

Response:
{
  success: true,
  prompt: {
    id: string,
    version: string,
    generatedPrompt: string,
    criteriaConfig: object,
    createdAt: string
  }
}
```

### Context Endpoints

**Upload Context:**
```
POST /api/vc-context/:deckId/upload
FormData { file, itemType }

Response:
{
  success: true,
  item: {
    id: string,
    fileName: string,
    fileType: string,
    transcription?: string
  }
}
```

**Get Context Items:**
```
GET /api/vc-context/:deckId/items

Response:
{
  success: true,
  items: ContextItem[]
}
```

---

## Database Schema

### vc_evaluation_preferences
```sql
CREATE TABLE vc_evaluation_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  industry VARCHAR(100) NOT NULL,
  criteria JSONB NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

### vc_custom_prompts
```sql
CREATE TABLE vc_custom_prompts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  prompt_version VARCHAR(50),
  criteria_config JSONB,
  generated_prompt TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### vc_context
```sql
CREATE TABLE vc_context (
  id UUID PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES pitch_decks(id),
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_url TEXT,
  transcription TEXT,
  summary TEXT,
  content_length INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Testing Guide

### Manual Test Flow

**1. Access Wizard:**
- Navigate to Deck Intelligence
- Click "Guided Evaluation" button (top-right)
- Verify wizard opens with Step 1

**2. Upload Step:**
- Select pitch deck PDF
- Select checklist PDF
- Choose "Seed" stage
- Choose "SaaS" industry
- Click "Next: Add Context"
- Verify deck uploads successfully
- Verify step indicator shows Step 2 active

**3. Context Step:**
- Upload a meeting notes PDF
- Verify file appears in list
- Click "Next: Preferences"
- Verify step indicator shows Step 3 active

**Optional: Skip Context:**
- Click "Skip Context" instead
- Verify moves to Step 3 without uploads

**4. Preferences Step:**
- Adjust Team slider to 35%
- Adjust Market slider to 30%
- Adjust Product slider to 20%
- Adjust Traction slider to 15%
- Verify total shows "100%" in green
- Click "Save & Analyze"
- Check console for "🤖 Prompt regeneration triggered"
- Verify moves to Step 4

**Optional: Use Defaults:**
- Click "Use Defaults" to skip customization
- Verify analysis starts with default weights

**5. Analysis Step:**
- Verify "Analyzing..." screen appears
- Wait 2-10 minutes for completion
- Verify redirects to analysis results
- Check analysis includes custom criteria scores

---

## Error Handling

### Upload Errors
```typescript
if (!deckFile || !checklistFile) {
  setError('Please select both pitch deck and checklist PDFs');
  return;
}

if (!selectedStage || !selectedIndustry) {
  setError('Please select funding stage and industry');
  return;
}
```

### Context Errors
```typescript
try {
  const response = await vcContextApi.getContextItems(uploadedDeckId);
  // Process items
} catch (err) {
  console.error('Failed to check context:', err);
  setCurrentStep('preferences'); // Proceed anyway
}
```

### Preferences Errors
```typescript
try {
  await fetch('/api/vc-agent/save-preferences', {...});
} catch (err) {
  setError('Failed to save preferences. Analysis will use defaults.');
  setTimeout(startAnalysis, 2000); // Proceed anyway
}
```

---

## Performance Considerations

**Build Size:**
- EvaluationWizard: ~20KB gzipped
- No additional dependencies
- Uses existing components (VCContextManager)

**API Efficiency:**
- Single upload endpoint call (Step 1)
- Batch context items query (Step 2)
- Single preferences save (Step 3)
- Efficient polling in parent component

**User Experience:**
- Progress saved at each step
- Can go back to revise
- Skip options prevent blocking
- Clear error messages
- Visual feedback throughout

---

## Future Enhancements

**Planned:**
- [ ] Save wizard progress to localStorage (resume later)
- [ ] Add "Save as Template" for preferences
- [ ] Multi-deck batch upload in wizard
- [ ] Export wizard summary as PDF report
- [ ] Add more custom criteria types (ESG, Diversity, etc.)
- [ ] Voice notes upload (transcribe on-the-fly)
- [ ] Real-time collaboration (multiple VCs)

**Possible:**
- [ ] AI-suggested criteria based on industry
- [ ] Benchmark comparisons during wizard
- [ ] Integration with calendar for meeting context
- [ ] Automated follow-up reminders

---

## Troubleshooting

### Wizard Not Appearing
**Symptom:** "Guided Evaluation" button missing  
**Fix:** Verify `useWizardMode` state in DeckIntelligence.tsx  
**Check:** `const [useWizardMode, setUseWizardMode] = useState(false);`

### Context Upload Fails
**Symptom:** File upload returns 400 error  
**Fix:** Check `deckId` is valid UUID (not "demo")  
**Verify:** `/api/vc-context/:deckId/upload` route receives UUID

### Preferences Not Saving
**Symptom:** "Failed to save preferences" error  
**Fix:** Verify backend route `/api/vc-agent/save-preferences` exists  
**Check:** `server/src/routes/vcAgent.ts` loaded in `server/src/index.ts`

### Analysis Stuck
**Symptom:** Step 4 "Analyzing..." never completes  
**Fix:** Check backend logs for processing errors  
**Verify:** `pollForAnalysis()` in DeckIntelligence.tsx is running

---

## Related Documentation

- **Agentic System:** `docs/AGENTIC_VC_SYSTEM.md`
- **VC Context:** `docs/features/DUAL_PDF_ANALYSIS.md`
- **Prompt Agent:** `server/src/services/promptAgent.ts`
- **Growth Forecast:** `server/src/services/growthForecastAgent.ts`

---

**Status:** ✅ Implemented and tested  
**Version:** 1.0.0  
**Last Updated:** November 1, 2025
