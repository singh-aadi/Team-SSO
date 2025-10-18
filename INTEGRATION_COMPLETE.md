# 🎉 AI Integration Complete - Testing Guide

## ✅ What's Been Integrated

Your Team SSO application now has **REAL AI-powered pitch deck analysis** using Google Gemini Pro!

### Frontend Integration:
- ✅ `src/services/api.ts` - Complete API service for backend communication
- ✅ `src/components/DeckIntelligence.tsx` - Updated with real AI analysis display
- ✅ `.env` - Backend URL configured (http://localhost:3000)
- ✅ Fallback to 5 sample companies if backend is offline

### Backend Features:
- ✅ Google Gemini Pro API integration
- ✅ PDF text extraction with pdf-parse
- ✅ Automatic analysis on upload
- ✅ 6-section analysis (Problem, Solution, Market, Traction, Team, Financials)
- ✅ SSO Readiness Score™ (0-100)
- ✅ Strengths, weaknesses, and key insights

---

## 🚀 How to Start & Test

### Step 1: Start Cloud SQL Proxy (If Testing with Real Database)

```powershell
cd "d:\TeamSSO 2025\Team-SSO"
.\cloud-sql-proxy.exe projectsso-473108:us-central1:team-sso-db --port 5432 --credentials-file=server\service-account-key.json
```

### Step 2: Start Backend Server

```powershell
cd "d:\TeamSSO 2025\Team-SSO\server"
npm run dev
```

Wait for: `🚀 Server running on http://localhost:3000`

### Step 3: Start Frontend

```powershell
cd "d:\TeamSSO 2025\Team-SSO"
npm run dev
```

Wait for: Frontend opens at `http://localhost:5173`

### Step 4: Test AI Analysis

1. **Login** to the application
2. **Navigate to** "Deck Intelligence" (from sidebar)
3. **Select a company** from dropdown (5 fallback companies available):
   - TechFlow AI - Enterprise SaaS
   - HealthMetrics - HealthTech
   - GreenChain - ClimateTech
   - FinSync - FinTech
   - EduConnect - EdTech

4. **Click "Choose File"** and select a PDF pitch deck
5. **Click "Upload & Analyze"**
6. **Watch the magic!** 🤖
   - File uploads to backend
   - PDF text is extracted
   - Gemini AI analyzes the deck
   - Results display in ~10-30 seconds

---

## 📊 What You'll See

### Analysis Results Include:

**SSO Readiness Score™** - Overall score out of 10

**6 Detailed Sections:**
- 🎯 **Problem** - How clear is the pain point?
- 💡 **Solution** - Innovation and differentiation
- 📈 **Market** - TAM/SAM/SOM analysis
- 🚀 **Traction** - Revenue, users, growth
- 👥 **Team** - Experience and expertise
- 💰 **Financials** - Revenue model & projections

**AI-Generated Insights:**
- ✅ Strengths (what's working)
- ⚠️ Weaknesses (areas to improve)
- 🔑 Key Insights (critical observations)
- 📝 Investment Recommendation

---

## 🔄 Fallback System

If the backend is offline or fails:
- **Companies**: Shows 5 sample companies (TechFlow AI, etc.)
- **Analysis**: You can still upload but won't get AI analysis
- **No Crashes**: Frontend gracefully handles backend errors

---

## 🧪 Testing with Real PDFs

### Good Test PDFs:
- ✅ Text-based PDFs (not scanned images)
- ✅ 10-20 slides optimal
- ✅ Standard pitch deck structure
- ✅ Clear sections (problem, solution, market, etc.)

### PDFs That Won't Work:
- ❌ Image-only PDFs (need OCR first)
- ❌ Encrypted or password-protected
- ❌ Over 10MB file size
- ❌ Non-English text (Gemini works best in English)

### For Image-Based PDFs:
You'll see: "PDF appears to be empty or image-based"
Solution: Use OCR tool first or provide text-based PDF

---

## 🎯 Quick Test (Alternative)

### Use the Test Server:

```powershell
# In server directory
cd "d:\TeamSSO 2025\Team-SSO\server"
node test-server.js
```

Then open browser to `http://localhost:3000/health`

---

## 🐛 Troubleshooting

### Backend won't start?
- Check Cloud SQL Proxy is running
- Check port 3000 is not in use: `netstat -ano | findstr ":3000"`
- Check .env file has GEMINI_API_KEY

### Frontend can't connect?
- Verify backend is running on port 3000
- Check `.env` has `VITE_API_URL=http://localhost:3000`
- Restart frontend: `npm run dev`

### Analysis fails?
- Check Gemini API key is valid
- Check PDF is text-based (not images)
- Check file size < 10MB
- Check backend logs for errors

### Companies not loading?
- Fallback companies will show even if backend is offline
- Check backend `/api/companies` endpoint

---

## 📝 Code Examples

### Upload via API (cURL):

```bash
curl -X POST http://localhost:3000/api/decks/upload \
  -F "deck=@/path/to/pitch_deck.pdf" \
  -F "company_id=1" \
  -F "uploaded_by=demo-user-123"
```

### Check Analysis Status:

```bash
curl http://localhost:3000/api/decks/<deck-id>
```

---

## 🎬 Ready to Test!

1. ✅ Cloud SQL Proxy running (optional for testing)
2. ✅ Backend server running (port 3000)
3. ✅ Frontend server running (port 5173)
4. ✅ PDF ready to upload
5. ✅ Gemini API working (key in server/.env)

**Now go to http://localhost:5173 and upload a pitch deck!** 🚀

The AI will analyze it and show you:
- Detailed scores for each section
- Strengths and weaknesses
- Key insights
- Investment recommendation

**No more fake data - this is REAL AI analysis powered by Google Gemini!** 🤖✨
