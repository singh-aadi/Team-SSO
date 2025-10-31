# 🔍 WEB SEARCH GROUNDING - DEBUGGING GUIDE

## ⚠️ WHY WEB SEARCH MIGHT NOT BE WORKING

### **ROOT CAUSES:**

1. **Grounding API Not Fully Enabled**
   - Vertex AI API is enabled ✅
   - **BUT** Grounding with Google Search may need separate activation
   - **Location:** us-central1 (might have regional limitations)

2. **Dynamic Retrieval Not Triggering**
   - Vertex AI uses **automatic decision-making** for grounding
   - If the model thinks it has enough info in training data, it WON'T search
   - Our prompts must be VERY explicit

3. **Cost/Quota Limitations**
   - Grounding costs $35 per 1,000 requests
   - Your project might have quotas or billing limits

4. **Model Version Issues**
   - `gemini-2.0-flash-exp` is experimental
   - Grounding might be limited or not fully supported

---

## 🛠️ **CHANGES MADE TO FIX**

### **1. Simplified Grounding Configuration**
**Before (BROKEN):**
```typescript
googleSearchRetrieval: {
  dynamicRetrievalConfig: {
    mode: 'MODE_DYNAMIC',
    dynamicThreshold: 0.3,
  },
}
```

**After (FIXED):**
```typescript
googleSearchRetrieval: {}, // Let Vertex AI auto-decide
```

**Why:** The `dynamicRetrievalConfig` API might not be stable in `gemini-2.0-flash-exp`.

---

### **2. More Explicit Prompts**
**Added to prompts:**
```
**CRITICAL: You MUST use web search (grounding) to validate ALL claims below.**

**🌐 MANDATORY WEB SEARCHES (Use Google Search Grounding):**
You MUST search the web for:

a) Market Validation:
   - Search Google: "Total Addressable Market Healthcare 2024 Gartner"
   - Search Google: "Total Addressable Market Healthcare 2024 Forrester"

b) Competitor Intelligence:
   - Search Google: "CompanyName competitors Healthcare funding"
   - Search Google: "Healthcare startups Series A Crunchbase"
```

**Why:** Vertex AI needs explicit instructions to trigger grounding. Vague prompts = no web search.

---

### **3. Enhanced Logging**
**New logs added:**
```typescript
console.log('📊 [Vertex AI] Response structure:', {
  hasCandidate: !!candidate,
  hasGroundingMetadata: !!groundingMetadata,
  candidateKeys: Object.keys(candidate),
});

if (groundingMetadata) {
  console.log('✅ Grounding metadata found!');
  console.log('   Metadata keys:', Object.keys(groundingMetadata));
  webSearchQueries.forEach((q, i) => console.log(`     ${i + 1}. "${q}"`));
} else {
  console.log('⚠️ NO GROUNDING METADATA FOUND!');
  console.log('   Possible reasons:');
  console.log('   1. Prompt did not require external information');
  console.log('   2. Grounding API not enabled in GCP project');
}
```

**What you'll see:**
- ✅ If grounding works: You'll see web search queries logged
- ⚠️ If grounding fails: You'll see detailed reasons why

---

## 🧪 **HOW TO TEST IF GROUNDING WORKS**

### **STEP 1: Restart Backend**
```powershell
cd server
npm run dev
```

### **STEP 2: Upload a Deck**
- Use a healthcare or SaaS startup deck
- Make sure it mentions TAM, competitors, etc.

### **STEP 3: Watch Server Logs**
Look for these log lines:

**✅ WORKING (Grounding triggered):**
```
🌐 [Vertex AI] Starting analysis with Grounding...
🔍 [Vertex AI] Sending request with Grounding enabled...
   Tool: googleSearchRetrieval (automatic mode)
   Prompt length: 4523 chars
✅ [Vertex AI] Response received!
   Checking for grounding metadata...
📊 [Vertex AI] Response structure: { hasCandidate: true, hasGroundingMetadata: true }
✅ [Vertex AI] Grounding metadata found!
   Metadata keys: [ 'webSearchQueries', 'groundingChunks', 'retrievalScore' ]
   Web searches performed: 5
     1. "Total Addressable Market Healthcare 2024 Gartner"
     2. "Healthcare startups Series A Crunchbase"
     3. "Healthcare patient acquisition cost benchmark"
   Processing 12 grounding chunks...
   ✅ Web sources extracted: 12
     1. Gartner Healthcare Market Report 2024
        https://www.gartner.com/...
     2. Forrester Digital Health Analysis
        https://www.forrester.com/...
```

**⚠️ NOT WORKING (No grounding):**
```
🌐 [Vertex AI] Starting analysis with Grounding...
🔍 [Vertex AI] Sending request with Grounding enabled...
✅ [Vertex AI] Response received!
   Checking for grounding metadata...
📊 [Vertex AI] Response structure: { hasCandidate: true, hasGroundingMetadata: false }
⚠️ [Vertex AI] NO GROUNDING METADATA FOUND!
   This means Vertex AI did NOT trigger web search.
   Possible reasons:
   1. Prompt did not require external information
   2. Grounding API not enabled in GCP project
   3. Model decided all info available in training data
```

---

## 🔧 **TROUBLESHOOTING STEPS**

### **Issue 1: No Grounding Metadata**

**Solution A: Enable Grounding API in GCP**
```bash
gcloud services enable discoveryengine.googleapis.com --project=projectsso-473108
```

**Solution B: Check IAM Permissions**
Your service account needs:
- `roles/aiplatform.user`
- `roles/discoveryengine.admin` (for grounding)

Run:
```bash
gcloud projects add-iam-policy-binding projectsso-473108 \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@projectsso-473108.iam.gserviceaccount.com" \
  --role="roles/discoveryengine.admin"
```

**Solution C: Try Different Model**
Change from experimental to stable:
```typescript
const MODEL = 'gemini-1.5-pro'; // Instead of gemini-2.0-flash-exp
```

**Solution D: Force Grounding with System Instruction**
```typescript
const model = vertexAI.getGenerativeModel({
  model: MODEL,
  systemInstruction: {
    parts: [{ text: 'You MUST use Google Search to validate all factual claims. Never rely solely on training data for current market data.' }],
  },
});
```

---

### **Issue 2: Grounding Works But No Sources**

**Check:** `groundingChunks` might be empty even with metadata

**Solution:** Add to prompt:
```
For each claim, provide the EXACT URL you found the information from.
Example: "TAM: $100M (Source: https://www.gartner.com/report-2024)"
```

---

### **Issue 3: "Grounding not available in this region"**

**Current:** us-central1  
**Try:** Change to `europe-west4` or `us-east1`

In `server/src/services/vertex-ai.ts`:
```typescript
const LOCATION = 'us-east1'; // Instead of us-central1
```

---

## 📝 **MANUAL GROUNDING TEST**

Create a test file to verify grounding works independently:

**`server/test-grounding.ts`:**
```typescript
import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = 'projectsso-473108';
const LOCATION = 'us-central1';

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
const model = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

async function testGrounding() {
  console.log('Testing Vertex AI Grounding...');

  const request = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'Search Google for: "Total Addressable Market Healthcare 2024 Gartner". What is the TAM for digital health in 2024?',
          },
        ],
      },
    ],
    tools: [
      {
        googleSearchRetrieval: {},
      },
    ],
  };

  const response = await model.generateContent(request);
  const candidate = response.response.candidates?.[0];

  console.log('Response:', response.response);
  console.log('Grounding metadata:', candidate?.groundingMetadata);

  if (candidate?.groundingMetadata) {
    console.log('✅ GROUNDING WORKS!');
  } else {
    console.log('❌ GROUNDING FAILED!');
  }
}

testGrounding().catch(console.error);
```

**Run:**
```powershell
cd server
npx ts-node test-grounding.ts
```

---

## 🌐 **ALTERNATIVE: FORCE WEB SEARCH (If Grounding Fails)**

If Vertex AI grounding doesn't work, we can use **SerpAPI** or **Google Custom Search API** as fallback:

**Option 1: SerpAPI (Paid, $50/month)**
```bash
npm install serpapi
```

```typescript
import { getJson } from 'serpapi';

async function manualWebSearch(query: string) {
  const result = await getJson({
    engine: 'google',
    q: query,
    api_key: process.env.SERPAPI_KEY,
  });

  return result.organic_results.slice(0, 5);
}
```

**Option 2: Google Custom Search API (Free 100/day, then $5/1000)**
```bash
npm install googleapis
```

```typescript
import { google } from 'googleapis';

const customsearch = google.customsearch('v1');

async function googleSearch(query: string) {
  const res = await customsearch.cse.list({
    auth: process.env.GOOGLE_API_KEY,
    cx: process.env.GOOGLE_CSE_ID,
    q: query,
  });

  return res.data.items?.slice(0, 5);
}
```

**Which to use:**
- **Vertex AI Grounding**: Best (integrated, citations, free trial)
- **SerpAPI**: If grounding fails (paid but reliable)
- **Google CSE**: Budget option (100 free/day)

---

## 📊 **CURRENT STATUS**

### ✅ **Implemented:**
- Vertex AI client with grounding config
- Explicit prompts requesting web search
- Enhanced logging for debugging
- Fallback to standard analysis if grounding fails

### ⚠️ **To Verify:**
- [ ] Does grounding metadata appear in logs?
- [ ] Are web search queries logged?
- [ ] Do web sources get extracted?
- [ ] Does PDF show web citations?

### 🔄 **Next Steps:**
1. Restart backend server
2. Upload test deck
3. Check server logs for grounding metadata
4. If NO metadata → Enable Discovery Engine API
5. If still failing → Try gemini-1.5-pro instead
6. If still failing → Use SerpAPI fallback

---

## 🎯 **EXPECTED LOG OUTPUT (SUCCESS)**

```
POST /api/decks/123/analyze-dual 200
🌐 [Enhanced Analysis] Starting with Grounding for HealthTech Inc (Healthcare)...
📄 Extracting text from pitch deck...
📊 Extracting metrics from PDF...
   Missing metrics: Total Addressable Market (TAM), Patient Acquisition Cost (PAC), FDA approval status
🔍 Running standard PDF analysis...
🌐 Enriching with web search and grounding...
🌐 [Vertex AI] Starting analysis with Grounding...
   Industry: Healthcare
   Missing metrics: Total Addressable Market (TAM), Patient Acquisition Cost (PAC), FDA approval status
🔍 [Vertex AI] Sending request with Grounding enabled...
   Tool: googleSearchRetrieval (automatic mode)
   Prompt length: 4523 chars
✅ [Vertex AI] Response received!
   Checking for grounding metadata...
📊 [Vertex AI] Response structure: { hasCandidate: true, hasGroundingMetadata: true, candidateKeys: [...] }
✅ [Vertex AI] Grounding metadata found!
   Metadata keys: [ 'webSearchQueries', 'groundingChunks' ]
   Web searches performed: 6
     1. "Total Addressable Market Healthcare 2024 Gartner"
     2. "Total Addressable Market Healthcare 2024 Forrester"
     3. "Healthcare patient acquisition cost benchmark 2024"
     4. "HealthTech Inc competitors Healthcare funding"
     5. "Healthcare startups Series A Series B Crunchbase"
     6. "HealthTech Inc Crunchbase funding"
   Processing 15 grounding chunks...
   ✅ Web sources extracted: 15
     1. Gartner: Digital Health Market Forecast 2024
        https://www.gartner.com/en/documents/healthcare-2024
     2. Forrester: Healthcare Technology Trends
        https://www.forrester.com/report/healthcare-tech/
     3. Crunchbase: HealthTech Funding Rounds
        https://www.crunchbase.com/organization/healthtech-inc
✅ [Vertex AI] Analysis complete!
   Total web sources: 15
✅ Web enrichment complete:
   Sources found: 15
   Discrepancies: 2
🔄 Merging PDF and web data...
✅ [Enhanced Analysis] Complete with Grounding!
   Overall confidence: HIGH
   Verified claims: 8
   Discrepancies: 2
💾 Storing analysis results...
✅ DUAL PDF Analysis with Grounding complete for deck 123!
   Overall Score: 8.2/10
   Confidence: HIGH
   Web sources: 15
```

---

## 🚨 **IF NOTHING WORKS: CONTACT SUPPORT**

If grounding still doesn't work after all troubleshooting:

1. **Check GCP Console**:
   - https://console.cloud.google.com/vertex-ai/generative/grounding
   - Verify "Grounding with Google Search" is enabled

2. **Check Billing**:
   - https://console.cloud.google.com/billing
   - Grounding requires active billing account

3. **Check Quotas**:
   - https://console.cloud.google.com/iam-admin/quotas
   - Search for "Vertex AI" quotas

4. **Open Support Ticket**:
   - https://console.cloud.google.com/support
   - Topic: "Vertex AI Grounding not working"
   - Include: Project ID, region, model, error logs

---

## 📖 **DOCUMENTATION**

- **Grounding Overview**: https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/overview
- **Google Search Grounding**: https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/ground-gemini
- **Gemini API Reference**: https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/gemini

---

**TL;DR:**
- ✅ Fixed grounding configuration (removed broken `dynamicRetrievalConfig`)
- ✅ Made prompts MUCH more explicit ("MUST use web search")
- ✅ Added detailed logging to see what's happening
- ⏳ Now test by uploading a deck and watching server logs
- ⚠️ If still not working → Enable Discovery Engine API or try gemini-1.5-pro
