# Gemini Model Selection - Implementation Guide

## Overview
The USP Radar component has been replaced with a **Gemini Model Selector** that allows users to dynamically switch between different Gemini AI models globally across the entire application.

## What Was Implemented

### 1. Frontend Changes

#### **New Context: `GeminiModelContext.tsx`**
- Location: `src/context/GeminiModelContext.tsx`
- Manages global model selection state
- Persists selection to localStorage
- Automatically syncs with backend via API

**Available Models:**
- `gemini-2.0-flash-exp` - Fast experimental (for testing)
- `gemini-2.5-flash` - Production recommended (best price-performance)
- `gemini-2.5-pro` - Advanced reasoning
- `gemini-3-pro` - Most advanced (latest)

#### **Updated Component: `CompetitiveInfo.tsx`** (formerly USP Radar)
- Now displays as "AI Model" selector
- Shows current model with colored icon
- Dropdown with all available models
- Visual indicators for model characteristics

#### **App Integration: `App.tsx`**
- Wrapped application with `GeminiModelProvider`
- Makes model selection available to all components

### 2. Backend Changes

#### **New Route: `settings.ts`**
- Location: `server/src/routes/settings.ts`
- Endpoints:
  - `GET /api/settings/gemini-model` - Get current model
  - `POST /api/settings/gemini-model` - Update model
- Validates model selection
- Stores current model in memory

#### **New Utility: `gemini-model.ts`**
- Location: `server/src/utils/gemini-model.ts`
- Function: `getActiveGeminiModel()` - Returns currently selected model
- Used by all AI services to get dynamic model

#### **Server Registration: `index.ts`**
- Added `settingsRoutes` to Express app
- Endpoint available at `/api/settings/*`

### 3. Service Updates

#### **Updated: `ai-enhanced.ts`**
- Imports `getActiveGeminiModel` utility
- Replaces hardcoded `'gemini-2.5-flash'` with dynamic model

**Example:**
```typescript
// OLD
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// NEW
const modelName = getActiveGeminiModel();
const model = genAI.getGenerativeModel({ model: modelName });
```

## How It Works

### User Flow:
1. User clicks "AI Model" button in header
2. Dropdown shows available models
3. User selects desired model
4. Selection saved to localStorage
5. Frontend sends POST to `/api/settings/gemini-model`
6. Backend updates current model
7. All subsequent AI operations use new model

### Backend Flow:
1. AI service function called (e.g., `analyzePDFImages`)
2. Service calls `getActiveGeminiModel()`
3. Returns current model from settings
4. Creates GenAI client with selected model
5. Performs analysis with user's chosen model

## Remaining Tasks

### **CRITICAL: Update All Service Files**

The following service files still have hardcoded models that need to be updated:

1. **`contextSynthesizer.ts`** (line 7)
   ```typescript
   // Change from:
   model: 'gemini-2.5-flash',
   // To:
   model: getActiveGeminiModel(),
   ```

2. **`fileExtractor.ts`** (line 11)
   ```typescript
   // Change from:
   const MODEL = 'gemini-2.5-flash';
   // To:
   const MODEL = getActiveGeminiModel();
   ```

3. **`growthForecastAgent.ts`** (lines 142, 234)
4. **`pdfOrchestrator.ts`** (7 instances)
5. **`promptAgent.ts`** (line 115)
6. **`radarScraper.ts`** (line 42)
7. **`speechToText.ts`** (line 232)
8. **`vertex-ai.ts`** (line 16)
9. **`vertex-ai-orchestrator.ts`** (line 18)
10. **`enhancedPdfGenerator.ts`** - AI introduction generation

### **Steps to Update Each File:**

1. Add import at top:
   ```typescript
   import { getActiveGeminiModel } from '../utils/gemini-model';
   ```

2. Replace hardcoded model strings:
   ```typescript
   // For getGenerativeModel calls:
   const model = genAI.getGenerativeModel({ model: getActiveGeminiModel() });
   
   // For const declarations:
   const MODEL = getActiveGeminiModel();
   
   // For object properties:
   model: getActiveGeminiModel(),
   ```

## Testing

### Frontend Testing:
1. Open application
2. Click "AI Model" button in header
3. Verify dropdown shows 4 models
4. Select different model
5. Verify selection persists on page refresh
6. Check browser localStorage for `gemini-model` key

### Backend Testing:
```bash
# Get current model
curl http://localhost:3000/api/settings/gemini-model

# Update model
curl -X POST http://localhost:3000/api/settings/gemini-model \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-2.5-pro"}'

# Verify update
curl http://localhost:3000/api/settings/gemini-model
```

### Integration Testing:
1. Select a specific model (e.g., Gemini 2.5 Pro)
2. Upload a pitch deck for analysis
3. Check server logs for: `🤖 Using Gemini model: gemini-2.5-pro`
4. Verify analysis completes successfully

## Benefits

✅ **Flexibility** - Switch models without code changes or redeployment
✅ **Cost Control** - Use faster/cheaper models when appropriate
✅ **Testing** - Test different models for quality comparison
✅ **Performance** - Select model based on speed vs quality needs
✅ **User Preference** - Each user can choose their preferred model

## Next Steps

1. ✅ Create context and provider
2. ✅ Update UI component
3. ✅ Create backend endpoint
4. ✅ Create utility function
5. ✅ Update one service file (ai-enhanced.ts)
6. ⏳ **Update remaining 9 service files**
7. ⏳ Test end-to-end flow
8. ⏳ Add model selection to settings page (optional)
9. ⏳ Add model performance metrics (optional)

## Files Modified

### Created:
- `src/context/GeminiModelContext.tsx`
- `server/src/routes/settings.ts`
- `server/src/utils/gemini-model.ts`

### Updated:
- `src/components/CompetitiveInfo.tsx` (complete rewrite)
- `src/App.tsx` (added provider)
- `server/src/index.ts` (added route)
- `server/src/services/ai-enhanced.ts` (partial update)

### To Update:
- 9 additional service files (see list above)
