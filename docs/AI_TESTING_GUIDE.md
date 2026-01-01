# AI Analysis Testing Guide

## 🎯 Your System is Ready for REAL AI Analysis!

### What We Built:
✅ Gemini Pro AI integration  
✅ PDF text extraction  
✅ Automatic analysis on upload  
✅ Real scoring (0-100) for 6 sections  
✅ Actionable feedback and insights  

---

## 🧪 Testing with Your PDFs

### Method 1: Via API (Recommended for Testing)

1. **Start the backend server:**
```powershell
cd "d:\TeamSSO 2025\Team-SSO\server"
npm run dev
```

2. **Upload a PDF and trigger analysis:**
```powershell
# Upload your pitch deck PDF
curl -X POST http://localhost:3000/api/decks/upload `
  -F "deck=@C:\path\to\your\pitch_deck.pdf" `
  -F "company_id=<uuid-from-database>" `
  -F "uploaded_by=<user-uuid>"

# The response will include the deck ID
# Analysis starts automatically!
```

3. **Check analysis progress:**
```powershell
# Replace <deck-id> with the ID from upload response
curl http://localhost:3000/api/decks/<deck-id>
```

### Method 2: Manual Analysis Trigger

If you already have decks in the database:
```powershell
# Get existing deck IDs
curl http://localhost:3000/api/decks

# Trigger analysis for a specific deck
curl -X POST http://localhost:3000/api/decks/<deck-id>/analyze
```

---

## 📊 What the AI Analyzes

### 6 Key Sections (Each scored 0-100):

1. **Problem** - How clear and urgent is the pain point?
2. **Solution** - Innovation, differentiation, feasibility
3. **Market** - TAM/SAM/SOM, growth potential, competition
4. **Traction** - Revenue, users, growth metrics
5. **Team** - Experience, expertise, execution capability
6. **Financials** - Revenue model, unit economics, projections

### AI Returns:
- Overall score (average of all sections)
- 3 key strengths
- 3 areas to improve  
- 3 critical insights
- Investment recommendation

---

## 🔍 Real Example Output

```json
{
  "message": "AI Analysis completed successfully!",
  "sso_score": "0.83",
  "analysis": {
    "overall": {
      "problemScore": 85,
      "solutionScore": 90,
      "marketScore": 78,
      "tractionScore": 82,
      "teamScore": 88,
      "financialsScore": 75,
      "overallScore": 83,
      "strengths": [
        "Strong technical team with ML expertise",
        "Clear market differentiation",
        "Early traction with Fortune 500 customers"
      ],
      "weaknesses": [
        "Limited financial projections detail",
        "Competitive landscape needs depth",
        "Unit economics not fully explained"
      ],
      "keyInsights": [
        "AI-powered automation shows 40% efficiency gains",
        "TAM of $12B in workflow automation",
        "3x YoY revenue growth demonstrates market fit"
      ],
      "recommendation": "Strong investment opportunity with proven traction..."
    },
    "sections": [
      {
        "sectionName": "Problem",
        "sectionScore": 85,
        "feedback": "Clear articulation of workflow inefficiencies...",
        "strengths": ["Quantified impact", "Market validation"],
        "improvements": ["Add more customer testimonials", "Expand on secondary problems"]
      }
      // ... 5 more sections
    ]
  }
}
```

---

## 🚀 Quick Test Steps

### 1. Start Backend
```powershell
cd "d:\TeamSSO 2025\Team-SSO\server"
npm run dev
```

### 2. Get a Company ID (from database)
```powershell
curl http://localhost:3000/api/companies
# Copy one of the company IDs
```

### 3. Upload Your PDF
```powershell
# Replace paths and IDs
$companyId = "paste-company-uuid-here"
$userId = "paste-user-uuid-here"
$pdfPath = "C:\path\to\your\pitch_deck.pdf"

curl -X POST http://localhost:3000/api/decks/upload `
  -F "deck=@$pdfPath" `
  -F "company_id=$companyId" `
  -F "uploaded_by=$userId"
```

### 4. Watch the Magic!
Check your terminal - you'll see:
```
🤖 Analyzing deck for TechFlow AI with Gemini AI...
✅ AI Analysis complete! Overall score: 83
```

### 5. View Results
```powershell
# Get the deck ID from step 3 response
curl http://localhost:3000/api/decks/<deck-id>
```

---

## 💡 Tips for Best Results

### PDF Quality Matters:
✅ **Good PDFs:**
- Text-based (not scanned images)
- Clear slide structure
- Standard fonts
- 10-20 slides optimal

❌ **Problematic PDFs:**
- Image-only slides (no extractable text)
- Heavily encrypted
- Corrupted files
- Over 50 slides (may timeout)

### For Image-Based PDFs:
You'll need OCR (Optical Character Recognition). Options:
1. Google Cloud Vision API
2. Tesseract.js
3. Pre-process PDFs with Adobe Acrobat

---

## 🔧 Troubleshooting

### "PDF appears to be empty"
- PDF is image-based (needs OCR)
- File is corrupted
- Try opening in Adobe Reader first

### "AI analysis failed"
- Check Gemini API key is correct
- Check API quota (free tier: 60 req/min)
- PDF text might be too short (<100 chars)

### "Failed to extract text"
- Install pdf-parse correctly: `npm install pdf-parse`
- Check file permissions
- Try a different PDF

---

## 📈 Next Steps

Once tested locally:
1. Deploy to Cloud Run (with Gemini API key in env)
2. Connect frontend upload UI
3. Add progress indicators
4. Optional: Add webhooks for completion notifications

---

## 🎬 Ready to Test?

1. Make sure backend is running: `npm run dev`
2. Grab one of your management PDFs
3. Upload via curl or Postman
4. Watch the AI work its magic! 🤖✨

**The fake 5 companies are still there as fallback - they won't be analyzed unless you upload decks for them!**
