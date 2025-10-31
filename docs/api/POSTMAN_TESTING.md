# Postman API Testing Guide - Team SSO Backend

## 🎯 API Base URL
```
https://team-sso-backend-520480129735.us-central1.run.app
```

---

## 📋 Table of Contents
1. [Health Check](#1-health-check)
2. [Get Companies](#2-get-companies)
3. [Upload Dual PDFs (Pitch Deck + Checklist)](#3-upload-dual-pdfs)
4. [Get Deck Details](#4-get-deck-details)
5. [Get All Decks](#5-get-all-decks)

---

## 1. Health Check

### Request
```
GET https://team-sso-backend-520480129735.us-central1.run.app/health
```

### Headers
None required

### Expected Response (200 OK)
```json
{
  "status": "ok",
  "message": "Startup Scout API is running",
  "timestamp": "2025-10-18T12:40:00.000Z"
}
```

---

## 2. Get Companies

### Request
```
GET https://team-sso-backend-520480129735.us-central1.run.app/api/companies
```

### Headers
None required

### Expected Response (200 OK)
```json
{
  "companies": [
    {
      "id": "41a84a5a-8647-4211-b568-8a36a82a27e8",
      "name": "TechFlow AI",
      "industry": "Artificial Intelligence",
      "stage": "Series A",
      "founded_year": 2022,
      "location": "San Francisco, CA",
      "website_url": "https://techflow.ai",
      "description": "AI-powered workflow automation for enterprise teams",
      "funding_amount": "5000000.00",
      "valuation": "20000000.00",
      "employee_count": 25,
      "status": "active"
    },
    // ... 4 more companies
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

---

## 3. Upload Dual PDFs (Pitch Deck + Checklist)

### ⭐ MAIN TEST ENDPOINT

### Request
```
POST https://team-sso-backend-520480129735.us-central1.run.app/api/decks/upload-dual
```

### Headers
```
Content-Type: multipart/form-data
```

### Body (form-data)
| Key | Type | Value | Description |
|-----|------|-------|-------------|
| `deck` | File | `[SELECT YOUR PITCH DECK PDF]` | The main pitch deck PDF with charts/graphs |
| `checklist` | File | `[SELECT YOUR CHECKLIST PDF]` | The founder checklist PDF with unit economics |
| `company_id` | Text | `41a84a5a-8647-4211-b568-8a36a82a27e8` | UUID of the company (get from /api/companies) |
| `uploaded_by` | Text | `550e8400-e29b-41d4-a716-446655440000` | UUID of the user (any valid UUID) |

### Postman Setup Steps:
1. Set request type to `POST`
2. Enter the URL above
3. Go to **Body** tab
4. Select **form-data** (NOT raw or x-www-form-urlencoded)
5. Add 4 rows:
   - Row 1: Key=`deck`, Type=`File`, Value=Click "Select Files" and choose your pitch deck PDF
   - Row 2: Key=`checklist`, Type=`File`, Value=Click "Select Files" and choose your checklist PDF
   - Row 3: Key=`company_id`, Type=`Text`, Value=`41a84a5a-8647-4211-b568-8a36a82a27e8`
   - Row 4: Key=`uploaded_by`, Type=`Text`, Value=`550e8400-e29b-41d4-a716-446655440000`

### Expected Response (201 Created)
```json
{
  "deck": {
    "id": "7f3e8c9a-1234-5678-90ab-cdef12345678",
    "company_id": "41a84a5a-8647-4211-b568-8a36a82a27e8",
    "uploaded_by": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "my-pitch-deck.pdf",
    "file_url": "/uploads/deck-1760791234567-abc123.pdf",
    "deck_file_path": "/uploads/deck-1760791234567-abc123.pdf",
    "checklist_file_path": "/uploads/checklist-1760791234567-def456.pdf",
    "file_size": 2500000,
    "file_type": "application/pdf",
    "analysis_status": "pending",
    "created_at": "2025-10-18T12:40:00.000Z"
  },
  "message": "Pitch deck and checklist uploaded successfully! Comprehensive AI analysis started.",
  "files": {
    "deck": "my-pitch-deck.pdf",
    "checklist": "founder-checklist.pdf"
  }
}
```

### What Happens After Upload:
1. Files are saved to Cloud Run `/uploads` directory
2. Database record created with status `pending`
3. Background AI analysis starts automatically
4. After ~10-30 seconds, status changes to `completed` or `failed`
5. You can poll `/api/decks/{deck_id}` to check status

---

## 4. Get Deck Details

### Request
```
GET https://team-sso-backend-520480129735.us-central1.run.app/api/decks/{deck_id}
```

Replace `{deck_id}` with the ID returned from the upload response.

### Headers
None required

### Expected Response (200 OK)
```json
{
  "deck": {
    "id": "7f3e8c9a-1234-5678-90ab-cdef12345678",
    "company_id": "41a84a5a-8647-4211-b568-8a36a82a27e8",
    "company_name": "TechFlow AI",
    "filename": "my-pitch-deck.pdf",
    "deck_file_path": "/uploads/deck-1760791234567-abc123.pdf",
    "checklist_file_path": "/uploads/checklist-1760791234567-def456.pdf",
    "file_size": 2500000,
    "analysis_status": "completed",
    "sso_score": 0.85,
    "analyzed_at": "2025-10-18T12:40:30.000Z",
    "created_at": "2025-10-18T12:40:00.000Z"
  },
  "analysis": {
    "overall": {
      "problemScore": 88,
      "solutionScore": 85,
      "marketScore": 90,
      "tractionScore": 75,
      "teamScore": 82,
      "financialsScore": 78,
      "overallScore": 83,
      "strengths": [
        "Strong product-market fit with 25% MoM growth",
        "Clear unit economics: LTV/CAC of 4.2x",
        "Experienced founding team with relevant domain expertise"
      ],
      "weaknesses": [
        "Limited runway (12 months remaining)",
        "High customer concentration risk (top 3 = 60% revenue)",
        "Missing cohort retention analysis"
      ],
      "keyInsights": [
        "Revenue chart shows exponential growth: $50k → $125k over 6 months",
        "Checklist verifies strong unit economics but highlights burn rate concerns",
        "Team slide shows technical depth but lacks GTM experience"
      ],
      "recommendation": "INVEST",
      "checklistVerification": {
        "unitEconomicsComplete": true,
        "growthMetricsComplete": true,
        "paymentInfoComplete": true,
        "foundationalChecklistScore": 92,
        "missingItems": [
          "Cohort retention analysis",
          "Customer acquisition channel breakdown"
        ],
        "verifiedItems": [
          "CAC: $120 (found in checklist)",
          "LTV: $504 (found in checklist)",
          "LTV/CAC: 4.2x (verified)",
          "Monthly burn rate: $45k (found in checklist)",
          "Current runway: 12 months (verified)"
        ]
      },
      "visualInsights": [
        "Revenue chart (Slide 7) shows exponential growth trajectory",
        "User growth graph indicates 25% month-over-month increase",
        "Unit economics table shows CAC payback period of 3 months",
        "Team slide shows 3 technical co-founders",
        "Market size chart indicates $12B TAM with clear segmentation"
      ]
    },
    "sections": [
      {
        "sectionName": "Problem & Solution",
        "sectionScore": 88,
        "feedback": "Clear articulation of enterprise workflow inefficiency. Solution demonstrates strong product-market fit with automated AI-driven workflows. Customer testimonials validate problem urgency.",
        "strengths": [
          "Problem validated with customer interviews (50+ enterprises)",
          "Solution addresses $2B market gap in workflow automation",
          "Clear differentiation from legacy tools (Zapier, IFTTT)"
        ],
        "improvements": [
          "Quantify time/cost savings with specific customer examples",
          "Show competitive advantage beyond feature comparison"
        ]
      },
      // ... 5 more sections
    ]
  }
}
```

---

## 5. Get All Decks

### Request
```
GET https://team-sso-backend-520480129735.us-central1.run.app/api/decks
```

### Query Parameters (Optional)
- `company_id` - Filter by company UUID
- `status` - Filter by analysis status (pending, processing, completed, failed)

Example with filters:
```
GET https://team-sso-backend-520480129735.us-central1.run.app/api/decks?status=completed&company_id=41a84a5a-8647-4211-b568-8a36a82a27e8
```

### Expected Response (200 OK)
```json
{
  "decks": [
    {
      "id": "7f3e8c9a-1234-5678-90ab-cdef12345678",
      "company_id": "41a84a5a-8647-4211-b568-8a36a82a27e8",
      "company_name": "TechFlow AI",
      "filename": "my-pitch-deck.pdf",
      "analysis_status": "completed",
      "sso_score": 0.85,
      "created_at": "2025-10-18T12:40:00.000Z",
      "analyzed_at": "2025-10-18T12:40:30.000Z"
    }
    // ... more decks
  ]
}
```

---

## 🧪 Testing Workflow in Postman

### Step 1: Health Check
1. Create new request in Postman
2. Set to `GET`
3. URL: `https://team-sso-backend-520480129735.us-central1.run.app/health`
4. Click **Send**
5. ✅ Should return 200 OK with `"status": "ok"`

### Step 2: Get Companies
1. Create new request
2. Set to `GET`
3. URL: `https://team-sso-backend-520480129735.us-central1.run.app/api/companies`
4. Click **Send**
5. ✅ Should return 200 OK with array of 5 companies
6. 📝 **Copy a `company_id`** for next step (e.g., `41a84a5a-8647-4211-b568-8a36a82a27e8`)

### Step 3: Upload Dual PDFs ⭐ MAIN TEST
1. Create new request
2. Set to `POST`
3. URL: `https://team-sso-backend-520480129735.us-central1.run.app/api/decks/upload-dual`
4. Go to **Body** tab
5. Select **form-data** radio button
6. Add these 4 rows:
   
   | Key | Type | Value |
   |-----|------|-------|
   | deck | File | [Browse and select your pitch deck PDF] |
   | checklist | File | [Browse and select your checklist PDF] |
   | company_id | Text | 41a84a5a-8647-4211-b568-8a36a82a27e8 |
   | uploaded_by | Text | 550e8400-e29b-41d4-a716-446655440000 |

7. Click **Send**
8. ✅ Should return 201 Created with deck object
9. 📝 **Copy the `deck.id`** from response

### Step 4: Monitor Analysis (Poll for Completion)
1. Create new request
2. Set to `GET`
3. URL: `https://team-sso-backend-520480129735.us-central1.run.app/api/decks/[PASTE_DECK_ID_HERE]`
4. Click **Send**
5. Check `analysis_status`:
   - `pending` → Analysis hasn't started yet (wait 2-3 seconds, try again)
   - `processing` → AI is analyzing (wait 10-20 seconds, try again)
   - `completed` → ✅ Analysis done! See full results in response
   - `failed` → ❌ Analysis failed (check backend logs)

### Step 5: View Complete Analysis
Once status is `completed`, the GET request from Step 4 will return:
- Overall scores for 6 sections
- Checklist verification (what's missing/verified)
- Visual insights from charts/graphs
- Investment recommendation (INVEST/PASS/NEEDS_MORE_INFO)
- Detailed feedback for each section

---

## 🐛 Troubleshooting

### Error: "Both pitch deck and checklist PDFs are required"
**Fix:** Make sure you selected **File** type (not Text) for both `deck` and `checklist` in form-data body.

### Error: "invalid input syntax for type uuid"
**Fix:** Use valid UUID format for `company_id` and `uploaded_by`. Get company UUIDs from `/api/companies` endpoint.

### Error: "Failed to upload files"
**Fix:** 
- Ensure files are actual PDFs (not images or other formats)
- Check file size is under 15MB per file
- Verify backend is running: Test `/health` endpoint first

### Analysis Status Stuck on "pending" or "processing"
**Fix:**
- Wait at least 30 seconds for Gemini AI analysis
- Check backend logs: `gcloud run services logs read team-sso-backend --region=us-central1 --limit=30`
- If stuck for >60 seconds, analysis may have failed (check logs)

### CORS Errors in Postman
**Fix:** CORS shouldn't affect Postman (only browsers). If you see CORS errors, you're using Postman web version. Use Postman desktop app instead.

---

## 📊 Sample Valid UUIDs for Testing

### Company IDs (from seed data):
```
41a84a5a-8647-4211-b568-8a36a82a27e8  (TechFlow AI)
52b95b6b-9758-5322-c679-9b47b93b38f9  (HealthMetrics)
63c06c7c-0869-6433-d78a-0c58c04c49g0  (GreenChain)
74d17d8d-1970-7544-e89b-1d69d15d50h1  (FinSync)
85e28e9e-2081-8655-f90c-2e70e26e61i2  (EduConnect)
```

### User ID (any valid UUID):
```
550e8400-e29b-41d4-a716-446655440000
123e4567-e89b-12d3-a456-426614174000
c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd
```

Generate random UUIDs: https://www.uuidgenerator.net/

---

## 🎯 Expected Test Results

### Successful Upload:
- Status Code: **201 Created**
- Response contains: `deck` object with `id`, `analysis_status: "pending"`, both file paths
- Message: "Pitch deck and checklist uploaded successfully!"

### Successful Analysis (after 10-30 seconds):
- Status Code: **200 OK** (when polling GET /api/decks/{id})
- `analysis_status`: **"completed"**
- Response contains:
  - `sso_score`: 0-1 decimal (e.g., 0.85 = 85%)
  - `analysis.overall`: Scores for 6 sections + recommendation
  - `analysis.overall.checklistVerification`: What's verified/missing
  - `analysis.overall.visualInsights`: Insights from charts/graphs
  - `analysis.sections`: Array of 6 section analyses

### What Gemini AI Analyzes:
1. **From Pitch Deck PDF:**
   - Charts showing growth, revenue, metrics
   - Graphs displaying trends and projections
   - Infographics about product and business model
   - Team composition and structure
   - Financial projections and forecasts

2. **From Checklist PDF:**
   - Unit economics (CAC, LTV, LTV/CAC ratio)
   - Growth metrics (MRR, ARR, retention)
   - Payment information (burn rate, runway)
   - External links to supporting documents

3. **Cross-Referencing:**
   - Verifies pitch deck claims against checklist evidence
   - Identifies missing checklist requirements
   - Flags discrepancies between documents
   - Provides investment-grade recommendation

---

## 📚 Additional Resources

- **Backend URL:** https://team-sso-backend-520480129735.us-central1.run.app
- **Health Check:** https://team-sso-backend-520480129735.us-central1.run.app/health
- **View Logs:** `gcloud run services logs read team-sso-backend --region=us-central1`
- **Frontend:** http://localhost:3001 (when running locally)

---

## ✅ Quick Test Checklist

- [ ] Health check returns 200 OK
- [ ] Get companies returns 5 companies
- [ ] Upload dual PDFs returns 201 with deck object
- [ ] Poll deck status shows "processing" then "completed"
- [ ] Completed analysis has 6 section scores
- [ ] Checklist verification shows verified/missing items
- [ ] Visual insights extracted from charts/graphs
- [ ] Investment recommendation provided (INVEST/PASS/NEEDS_MORE_INFO)

---

**Ready to test!** Start with the Health Check and work through the steps above. 🚀
