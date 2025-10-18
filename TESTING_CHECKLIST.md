# Quick Testing Checklist - Dual PDF Analysis

## ✅ Pre-Testing Verification

- [x] Database migration applied to Cloud SQL
- [x] Backend deployed to Cloud Run (revision 00003-bm2)
- [x] Frontend code updated for dual PDF upload
- [x] Gemini 1.5 Pro Vision enabled in AI service
- [ ] Frontend dev server running on port 3001
- [ ] Sample pitch deck PDF prepared (with charts/graphs)
- [ ] Sample checklist PDF prepared (unit economics, growth metrics)

## 🧪 Testing Steps

### 1. Start Frontend (if not running)
```powershell
cd "d:\TeamSSO 2025\Team-SSO"
npm run dev
# Should open http://localhost:3001
```

### 2. Navigate to Deck Intelligence
- Click "Deck Intelligence" in sidebar
- Should see dual upload interface

### 3. Upload Test Files
- [ ] Select company from dropdown
- [ ] Click "Choose Deck" → select pitch deck PDF
- [ ] Verify green checkmark shows deck filename
- [ ] Click "Choose Checklist" → select checklist PDF  
- [ ] Verify green checkmark shows checklist filename
- [ ] Click "Upload & Analyze Both Documents"

### 4. Monitor Upload
- [ ] Should see "Uploading..." state
- [ ] Then "AI analyzing visuals + checklist..." state
- [ ] Wait 10-30 seconds for analysis

### 5. Verify Results Display
- [ ] Overall SSO Score shown (0-10)
- [ ] Overall Score shown (0-100)
- [ ] Recommendation shown (INVEST/PASS/NEEDS_MORE_INFO)
- [ ] 6 section scores displayed
- [ ] Each section has feedback, strengths, improvements
- [ ] Checklist verification section visible
- [ ] Missing items listed (if any)
- [ ] Verified items listed
- [ ] Visual insights shown

## 🔍 What to Look For

### Pitch Deck Analysis Quality
- [ ] AI mentions specific charts/graphs from your deck
- [ ] Numerical data extracted from visuals (growth rates, revenue, etc.)
- [ ] Team composition insights if team slide has photos
- [ ] Market size numbers from TAM/SAM/SOM charts
- [ ] Financial projections referenced from projection charts

### Checklist Parsing Quality
- [ ] Unit economics items identified (CAC, LTV, etc.)
- [ ] Growth metrics items identified (MRR, ARR, etc.)
- [ ] Payment info items identified
- [ ] External links extracted (if any in checklist)
- [ ] Priorities assigned (critical/important/nice-to-have)

### Cross-Referencing Accuracy
- [ ] Items marked "verified" are actually in pitch deck
- [ ] Items marked "missing" are truly absent from deck
- [ ] No false positives (claiming something exists when it doesn't)
- [ ] No false negatives (missing something that's clearly there)

### Overall Decision Quality
- [ ] Recommendation matches the quality of your deck
- [ ] Strengths are specific and evidence-based
- [ ] Weaknesses are specific and actionable
- [ ] Key insights provide value beyond obvious observations

## 🚨 Common Issues & Solutions

### Issue: "Failed to fetch"
**Solution:** Check backend is running
```powershell
curl https://team-sso-backend-520480129735.us-central1.run.app/health
# Should return {"status":"healthy"}
```

### Issue: "Both files required" error
**Solution:** Ensure you selected BOTH deck and checklist PDFs before clicking upload

### Issue: Analysis stays in "processing" forever
**Solution:** Check Cloud Run logs for errors
```powershell
gcloud run services logs read team-sso-backend --region=us-central1 --limit=50
```

### Issue: Visual analysis says "Visual analysis unavailable"
**Solution:** 
- Check if PDF has actual images/charts (not just text)
- Gemini Vision might have rate limits - wait a minute and retry
- Check Cloud Run logs for Gemini API errors

### Issue: Checklist parsing returns empty array
**Solution:**
- Verify checklist PDF has readable text (not scanned images)
- Check if checklist format is too unusual for AI to parse
- Review Cloud Run logs for parsing errors

### Issue: Low scores despite good deck
**Solution:** This is valuable feedback! The AI might be:
- Identifying genuine weaknesses you missed
- Looking for specific evidence (unit economics, metrics)
- Comparing against VC investment standards

## 📊 Expected Results by Document Quality

### Excellent Pitch Deck + Complete Checklist
- Overall Score: **80-95**
- Recommendation: **INVEST**
- Checklist Score: **90-100%**
- Missing Items: **0-2**
- Visual Insights: Rich, specific numbers from charts

### Good Pitch Deck + Incomplete Checklist  
- Overall Score: **65-80**
- Recommendation: **NEEDS_MORE_INFO**
- Checklist Score: **60-80%**
- Missing Items: **3-6** (CAC, LTV, burn rate, etc.)
- Visual Insights: Moderate, some numbers extracted

### Weak Pitch Deck + Complete Checklist
- Overall Score: **50-65**
- Recommendation: **PASS**
- Checklist Score: **80-100%** (but metrics themselves are concerning)
- Missing Items: **0-2**
- Visual Insights: Identifies concerning trends in charts

### Poor Pitch Deck + Incomplete Checklist
- Overall Score: **30-50**
- Recommendation: **PASS**
- Checklist Score: **30-60%**
- Missing Items: **7+**
- Visual Insights: May note missing critical charts

## 🎯 Success Criteria

Analysis is successful if:
- [x] Both PDFs upload without errors
- [x] Analysis completes within 30 seconds
- [x] At least 3 visual insights extracted from pitch deck charts
- [x] At least 5 checklist items parsed from checklist PDF
- [x] Checklist verification shows realistic completion percentage
- [x] Missing items are specific and actionable
- [x] Recommendation matches document quality
- [x] All 6 sections have scores and feedback

## 📝 Test Results Template

```
Date: [YYYY-MM-DD]
Time: [HH:MM]

Documents Tested:
- Pitch Deck: [filename] ([X]MB)
- Checklist: [filename] ([Y]MB)

Upload Status: ✅/❌
Analysis Time: [XX] seconds
Analysis Status: ✅/❌

Results:
- Overall Score: [X]/100
- SSO Score: [X]/10
- Recommendation: [INVEST/PASS/NEEDS_MORE_INFO]
- Checklist Verified: [X]%
- Missing Items: [count]
- Visual Insights: [count]

Quality Assessment:
- Visual Analysis Quality: ⭐⭐⭐⭐⭐ [1-5 stars]
- Checklist Parsing Quality: ⭐⭐⭐⭐⭐ [1-5 stars]
- Cross-Reference Accuracy: ⭐⭐⭐⭐⭐ [1-5 stars]
- Decision Quality: ⭐⭐⭐⭐⭐ [1-5 stars]

Notes:
[Any observations, issues, or insights]
```

## 🔄 If Testing Fails

1. **Check all services are running:**
   - Backend: `https://team-sso-backend-520480129735.us-central1.run.app/health`
   - Frontend: `http://localhost:3001`
   - Database: Cloud SQL `team-sso-db` instance running

2. **Review logs in order:**
   - Browser console (F12 → Console)
   - Cloud Run logs (`gcloud run services logs read team-sso-backend`)
   - Cloud SQL logs (`gcloud sql operations list --instance=team-sso-db`)

3. **Verify environment variables:**
   ```powershell
   gcloud run services describe team-sso-backend --region=us-central1 --format="value(spec.template.spec.containers[0].env)"
   ```

4. **Test backend directly with curl:**
   ```powershell
   # Test companies endpoint
   curl https://team-sso-backend-520480129735.us-central1.run.app/api/companies
   
   # Should return JSON with 5 companies
   ```

## ✨ Ready to Test!

Once you have your sample documents ready:
1. Start frontend: `npm run dev`
2. Navigate to http://localhost:3001
3. Go to Deck Intelligence
4. Upload both PDFs
5. Wait for analysis
6. Review results
7. Fill out test results template above

**Good luck with testing! 🚀**
