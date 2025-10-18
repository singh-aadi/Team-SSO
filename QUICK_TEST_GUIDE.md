# 🚀 QUICK START - Upload Testing Guide

## ✅ System Status (October 18, 2025)

### All Systems Ready!
- ✅ **Frontend:** http://localhost:3001 (RUNNING)
- ✅ **Backend:** https://team-sso-backend-520480129735.us-central1.run.app (HEALTHY)
- ✅ **Database:** Cloud SQL with dual PDF columns (READY)
- ✅ **AI Service:** Gemini 1.5 Pro Vision (CONFIGURED)

---

## 🔧 What Was Fixed

1. ✅ **Backend URL** - Frontend correctly points to Cloud Run
2. ✅ **Status Mapping** - `analysis_status` → `status` 
3. ✅ **TypeScript Types** - Added 'completed' and 'processing' statuses
4. ✅ **Polling Logic** - Checks for 'completed' status
5. ✅ **UUID Generation** - Uses crypto.randomUUID()

---

## 🧪 Test Now in 3 Steps!

### Step 1: Open Browser
Navigate to: **http://localhost:3001**

### Step 2: Upload Two PDFs
1. Select company: "TechFlow AI" (or any company)
2. Choose **Pitch Deck PDF** (contains charts/graphs/images)
3. Choose **Checklist PDF** (contains unit economics/metrics)
4. Click **"Upload & Analyze Both Documents"**

### Step 3: Watch Analysis
- Status: `pending` → `processing` → `completed` (10-30 seconds)
- Results: 6-section scores + checklist verification + recommendations

---

## 📊 What You'll See

### During Upload:
```
Browser Console (F12):
📤 Uploading dual PDFs: {deckName: "...", checklistName: "..."}
📡 Upload response status: 201
✅ Upload successful: {deck: {...}}
```

### During Analysis:
- Loading spinner: "AI analyzing visuals + checklist..."
- Polls every 1 second

### When Complete:
- ✅ **Problem & Solution Score:** 85/100
- ✅ **Market Score:** 90/100
- ✅ **Traction Score:** 75/100
- ✅ **Team Score:** 82/100
- ✅ **Financials Score:** 78/100
- ✅ **Overall Score:** 83/100
- ✅ **Checklist Verification:** Unit economics verified, 2 items missing
- ✅ **Visual Insights:** "Revenue chart shows 25% MoM growth..."
- ✅ **Recommendation:** INVEST / PASS / NEEDS_MORE_INFO

---

## 🐛 If Something Goes Wrong

### "Failed to upload files"
- Check: Both PDFs selected? Files < 15MB? Actual PDF format?
- Debug: Open browser console (F12), check error message

### Analysis Stuck on "pending"
- Wait: Up to 60 seconds for Gemini API
- Check Backend: `gcloud run services logs read team-sso-backend --region=us-central1 --limit=20`

### CORS Error
- Fix: Hard refresh (Ctrl+Shift+R)
- Verify: `.env` has correct `VITE_API_URL`

---

## 📱 Test with Postman (Alternative)

See: **`POSTMAN_API_TESTING.md`** for complete API testing guide

**Quick Test:**
1. Health: `GET https://team-sso-backend-520480129735.us-central1.run.app/health`
2. Companies: `GET https://team-sso-backend-520480129735.us-central1.run.app/api/companies`
3. Upload: `POST https://team-sso-backend-520480129735.us-central1.run.app/api/decks/upload-dual`
   - Body: form-data
   - Fields: `deck` (File), `checklist` (File), `company_id` (Text), `uploaded_by` (Text/UUID)

---

## 🎯 Expected Success

### Successful Upload (201 Created):
```json
{
  "deck": {
    "id": "uuid-here",
    "analysis_status": "pending",
    "deck_file_path": "/uploads/deck-123.pdf",
    "checklist_file_path": "/uploads/checklist-456.pdf"
  },
  "message": "Pitch deck and checklist uploaded successfully!"
}
```

### Analysis Complete (200 OK):
```json
{
  "deck": {
    "id": "uuid-here",
    "analysis_status": "completed",
    "sso_score": 0.83
  },
  "analysis": {
    "overall": {
      "overallScore": 83,
      "recommendation": "INVEST",
      "checklistVerification": {...},
      "visualInsights": [...]
    },
    "sections": [...]
  }
}
```

---

## 📚 Documentation Files

- **`POSTMAN_API_TESTING.md`** - Complete Postman API guide
- **`UPLOAD_FIX_COMPLETE.md`** - Detailed fix documentation
- **`DUAL_PDF_ANALYSIS_GUIDE.md`** - Technical implementation guide
- **`TESTING_CHECKLIST.md`** - Step-by-step testing instructions

---

## 🚀 Ready to Test!

**Everything is fixed and ready to go!**

1. Open: http://localhost:3001
2. Upload: Pitch Deck + Checklist PDFs
3. Watch: AI analysis in real-time
4. Review: Comprehensive investment analysis

**Good luck! 🎉**
