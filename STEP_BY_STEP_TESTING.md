# 🔬 Step-by-Step Testing Guide - Dual PDF Upload

## Purpose
Test each component of the dual PDF upload system independently to identify exactly where failures occur.

---

## ✅ STEP 1: Verify Backend Health

### What This Tests
- Backend is running and accessible
- Basic connectivity works

### Test Command
```powershell
curl https://team-sso-backend-520480129735.us-central1.run.app/health
```

### Expected Output
```json
{
  "status": "ok",
  "message": "Startup Scout API is running",
  "timestamp": "2025-10-18T..."
}
```

### Success Criteria
- ✅ Status Code: 200 OK
- ✅ Response contains `"status": "ok"`

### If This Fails
- Backend is not deployed or crashed
- Check: `gcloud run services describe team-sso-backend --region=us-central1`

---

## ✅ STEP 2: Test Database Connection

### What This Tests
- Backend can connect to Cloud SQL
- Database has data

### Test Command
```powershell
curl https://team-sso-backend-520480129735.us-central1.run.app/api/companies
```

### Expected Output
```json
{
  "companies": [
    {
      "id": "41a84a5a-8647-4211-b568-8a36a82a27e8",
      "name": "TechFlow AI",
      "industry": "Artificial Intelligence",
      "stage": "Series A",
      ...
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

### Success Criteria
- ✅ Status Code: 200 OK
- ✅ Response contains array of 5 companies
- ✅ Company has valid UUID in `id` field

### If This Fails
- Database connection issue
- Check backend logs: `gcloud run services logs read team-sso-backend --region=us-central1 --limit=20`

---

## ✅ STEP 3: Verify Frontend is Running

### What This Tests
- Frontend dev server is running
- Can serve pages

### Test Command
```powershell
curl http://localhost:3001
```

### Expected Output
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ...
```

### Success Criteria
- ✅ Status Code: 200 OK
- ✅ Response contains HTML content

### If This Fails
**Start Frontend:**
```powershell
cd "d:\TeamSSO 2025\Team-SSO"
npm run dev
```

Wait for:
```
VITE v5.4.20 ready in XXX ms
➜ Local: http://localhost:3001/
```

---

## ✅ STEP 4: Test Frontend Can Reach Backend

### What This Tests
- Frontend correctly configured with backend URL
- CORS is working
- No network blocks

### Test in Browser
1. Open: http://localhost:3001
2. Open browser console (F12)
3. Run this JavaScript:

```javascript
fetch('https://team-sso-backend-520480129735.us-central1.run.app/health')
  .then(r => r.json())
  .then(data => console.log('✅ Backend reachable:', data))
  .catch(err => console.error('❌ Backend unreachable:', err));
```

### Expected Output
```
✅ Backend reachable: {status: "ok", message: "Startup Scout API is running", ...}
```

### Success Criteria
- ✅ No CORS errors
- ✅ Response received successfully

### If This Fails
**Check CORS Configuration:**
```powershell
# View backend CORS settings
curl -X OPTIONS https://team-sso-backend-520480129735.us-central1.run.app/api/companies -v
```

Should see:
- `access-control-allow-origin: *` or your domain
- `access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS`

---

## ✅ STEP 5: Test Companies API from Frontend

### What This Tests
- Frontend API service works
- Can fetch and display data

### Test in Browser Console
1. Open: http://localhost:3001
2. Open console (F12)
3. Run:

```javascript
// Check if API_URL is correct
console.log('API URL:', import.meta.env.VITE_API_URL);

// Test fetching companies
fetch('https://team-sso-backend-520480129735.us-central1.run.app/api/companies')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Companies loaded:', data.companies.length);
    console.log('First company ID:', data.companies[0].id);
  })
  .catch(err => console.error('❌ Error:', err));
```

### Expected Output
```
API URL: https://team-sso-backend-520480129735.us-central1.run.app
✅ Companies loaded: 5
First company ID: 41a84a5a-8647-4211-b568-8a36a82a27e8
```

### Success Criteria
- ✅ API URL is correct (not localhost:3000)
- ✅ Companies loaded successfully
- ✅ UUIDs are valid format

### If This Fails
**Check .env file:**
```powershell
cat .env
```

Should contain:
```
VITE_API_URL=https://team-sso-backend-520480129735.us-central1.run.app
```

---

## ✅ STEP 6: Test File Upload Endpoint (Backend Direct)

### What This Tests
- Backend can receive file uploads
- Multer configuration is correct
- Database insert works

### Test with PowerShell
First, create two small test PDF files or use existing ones.

```powershell
# Set variables
$backendUrl = "https://team-sso-backend-520480129735.us-central1.run.app"
$deckPath = "C:\path\to\your\pitch-deck.pdf"
$checklistPath = "C:\path\to\your\checklist.pdf"
$companyId = "41a84a5a-8647-4211-b568-8a36a82a27e8"
$userId = [guid]::NewGuid().ToString()

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"deck`"; filename=`"test-deck.pdf`"",
    "Content-Type: application/pdf$LF",
    [System.IO.File]::ReadAllBytes($deckPath),
    "--$boundary",
    "Content-Disposition: form-data; name=`"checklist`"; filename=`"test-checklist.pdf`"",
    "Content-Type: application/pdf$LF",
    [System.IO.File]::ReadAllBytes($checklistPath),
    "--$boundary",
    "Content-Disposition: form-data; name=`"company_id`"$LF",
    $companyId,
    "--$boundary",
    "Content-Disposition: form-data; name=`"uploaded_by`"$LF",
    $userId,
    "--$boundary--$LF"
) -join $LF

# Send request
Invoke-RestMethod -Uri "$backendUrl/api/decks/upload-dual" `
  -Method POST `
  -ContentType "multipart/form-data; boundary=$boundary" `
  -Body $bodyLines
```

### Alternative: Use curl (Simpler)
```powershell
curl -X POST https://team-sso-backend-520480129735.us-central1.run.app/api/decks/upload-dual `
  -F "deck=@C:\path\to\pitch-deck.pdf" `
  -F "checklist=@C:\path\to\checklist.pdf" `
  -F "company_id=41a84a5a-8647-4211-b568-8a36a82a27e8" `
  -F "uploaded_by=550e8400-e29b-41d4-a716-446655440000"
```

### Expected Output
```json
{
  "deck": {
    "id": "new-uuid-here",
    "company_id": "41a84a5a-8647-4211-b568-8a36a82a27e8",
    "filename": "test-deck.pdf",
    "analysis_status": "pending",
    "deck_file_path": "/uploads/deck-1234567890-abc.pdf",
    "checklist_file_path": "/uploads/checklist-1234567890-def.pdf"
  },
  "message": "Pitch deck and checklist uploaded successfully! Comprehensive AI analysis started."
}
```

### Success Criteria
- ✅ Status Code: 201 Created
- ✅ Deck object returned with ID
- ✅ Both file paths present
- ✅ analysis_status: "pending"

### If This Fails
**Check Backend Logs:**
```powershell
gcloud run services logs read team-sso-backend --region=us-central1 --limit=50
```

Look for:
- `📥 Received dual PDF upload request`
- `❌ Missing files:` (if files not received)
- `Error uploading dual PDFs:` (database error)

---

## ✅ STEP 7: Test Frontend Upload Function

### What This Tests
- Frontend can create FormData
- Frontend sends correct format
- API service mapping works

### Test in Browser Console
1. Open: http://localhost:3001
2. Navigate to Deck Intelligence section
3. Open console (F12)
4. Run this test:

```javascript
// Create test function
async function testUpload() {
  console.log('🧪 Testing upload function...');
  
  // Create fake PDF files (just for structure testing)
  const deckBlob = new Blob(['fake deck pdf content'], { type: 'application/pdf' });
  const checklistBlob = new Blob(['fake checklist pdf content'], { type: 'application/pdf' });
  
  const deckFile = new File([deckBlob], 'test-deck.pdf', { type: 'application/pdf' });
  const checklistFile = new File([checklistBlob], 'test-checklist.pdf', { type: 'application/pdf' });
  
  console.log('📄 Deck file:', deckFile.name, deckFile.size, 'bytes');
  console.log('📄 Checklist file:', checklistFile.name, checklistFile.size, 'bytes');
  
  // Test FormData creation
  const formData = new FormData();
  formData.append('deck', deckFile);
  formData.append('checklist', checklistFile);
  formData.append('company_id', '41a84a5a-8647-4211-b568-8a36a82a27e8');
  formData.append('uploaded_by', crypto.randomUUID());
  
  console.log('✅ FormData created');
  
  // Log what we're sending
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value);
  }
  
  return formData;
}

// Run test
testUpload();
```

### Expected Output
```
🧪 Testing upload function...
📄 Deck file: test-deck.pdf 22 bytes
📄 Checklist file: test-checklist.pdf 29 bytes
✅ FormData created
  deck: File {name: 'test-deck.pdf', size: 22, type: 'application/pdf'}
  checklist: File {name: 'test-checklist.pdf', size: 29, type: 'application/pdf'}
  company_id: 41a84a5a-8647-4211-b568-8a36a82a27e8
  uploaded_by: 550e8400-e29b-41d4-a716-446655440000
```

### Success Criteria
- ✅ Files created correctly
- ✅ FormData contains all 4 fields
- ✅ UUID generated properly

---

## ✅ STEP 8: Test Complete Upload Flow (Frontend → Backend)

### What This Tests
- End-to-end upload from browser
- All previous steps working together

### Test in Browser
1. Open: http://localhost:3001
2. Navigate to "Deck Intelligence"
3. Open console (F12) to watch logs
4. **Select company** from dropdown
5. **Choose Pitch Deck PDF** - browse and select
6. **Choose Checklist PDF** - browse and select
7. Click **"Upload & Analyze Both Documents"**

### Expected Console Output
```
📤 Uploading dual PDFs: {
  deckName: "your-deck.pdf",
  deckSize: 2345678,
  checklistName: "your-checklist.pdf",
  checklistSize: 1234567,
  companyId: "41a84a5a-8647-4211-b568-8a36a82a27e8",
  userId: "generated-uuid-here"
}
📡 Upload response status: 201
✅ Upload successful: {
  deck: {
    id: "new-deck-uuid",
    analysis_status: "pending",
    ...
  }
}
```

### Success Criteria
- ✅ No errors in console
- ✅ Status: 201
- ✅ Deck object received
- ✅ Loading indicator appears

### If This Fails
**Common Issues:**

1. **"Failed to upload files"**
   - Check: Are both files selected?
   - Check: Are files actual PDFs?
   - Check: Files under 15MB each?

2. **CORS Error**
   - Refresh page with Ctrl+Shift+R
   - Check `.env` has correct backend URL

3. **Network Error**
   - Check: Backend is healthy (Step 1)
   - Check: Internet connection

4. **"invalid input syntax for type uuid"**
   - Check: Frontend using `crypto.randomUUID()`
   - Check: Not using hardcoded string

---

## ✅ STEP 9: Test Analysis Polling

### What This Tests
- Frontend polls for status updates
- Status mapping works correctly
- Analysis completes

### Monitor in Browser Console
After upload succeeds, watch console for polling:

```
Polling for deck analysis... (attempt 1/30)
Polling for deck analysis... (attempt 2/30)
Status: processing
Polling for deck analysis... (attempt 3/30)
...
Status: completed
✅ Analysis complete!
```

### Check Backend Logs
```powershell
gcloud run services logs read team-sso-backend --region=us-central1 --limit=50 --format=json
```

Look for:
```
🚀 Starting DUAL PDF analysis for deck {deck-id}...
📊 Analyzing pitch deck visuals, checklist requirements...
💾 Storing analysis results...
✅ DUAL PDF Analysis complete for deck {deck-id}!
```

### Success Criteria
- ✅ Status changes: pending → processing → completed
- ✅ Frontend stops polling after completion
- ✅ Results displayed

### If Analysis Fails
Check backend logs for:
- Gemini API errors
- PDF parsing errors
- Database insert errors

---

## ✅ STEP 10: Verify Results Retrieved

### What This Tests
- GET /api/decks/:id works
- Analysis results stored correctly
- Frontend displays results

### Test Backend Directly
```powershell
# Replace {deck-id} with actual deck ID from upload
curl https://team-sso-backend-520480129735.us-central1.run.app/api/decks/{deck-id}
```

### Expected Output
```json
{
  "deck": {
    "id": "deck-uuid",
    "analysis_status": "completed",
    "sso_score": 0.83,
    "checklist_items": {...},
    ...
  },
  "analysis": [
    {
      "section_name": "Problem & Solution",
      "section_score": 0.88,
      "feedback": "...",
      "strengths": [...],
      "improvements": [...]
    },
    ...
  ]
}
```

### Success Criteria
- ✅ analysis_status: "completed"
- ✅ sso_score present (0-1 decimal)
- ✅ 6 sections in analysis array
- ✅ checklist_items JSONB populated

### If This Fails
- Analysis may have failed during processing
- Check backend logs for analysis errors

---

## 🎯 Quick Test Summary

Run these commands in order:

```powershell
# STEP 1: Health Check
curl https://team-sso-backend-520480129735.us-central1.run.app/health

# STEP 2: Database Connection
curl https://team-sso-backend-520480129735.us-central1.run.app/api/companies

# STEP 3: Frontend Running
curl http://localhost:3001

# If not running, start it:
# cd "d:\TeamSSO 2025\Team-SSO"
# npm run dev

# STEP 4-10: Use browser testing at http://localhost:3001
```

---

## 📊 Troubleshooting Matrix

| Failing Step | Likely Cause | Solution |
|-------------|--------------|----------|
| Step 1 | Backend not deployed | Check Cloud Run service status |
| Step 2 | Database connection | Check Cloud SQL, service account permissions |
| Step 3 | Frontend not started | Run `npm run dev` |
| Step 4 | CORS issue | Check backend CORS config, refresh browser |
| Step 5 | Wrong API URL | Check `.env` file, restart frontend |
| Step 6 | File upload issue | Check file paths, Multer config, database schema |
| Step 7 | FormData issue | Check browser console, file selection |
| Step 8 | End-to-end issue | Check all previous steps, backend logs |
| Step 9 | Analysis failure | Check backend logs, Gemini API key |
| Step 10 | Results not saved | Check database, analysis error logs |

---

## 🚀 Ready to Test!

**Start with Step 1 and work through each step.**  
**Report which step fails and we'll debug that specific component!**
