# Additional Documents Feature Implementation

## Summary
Implemented support for **optional checklist** and **additional supporting documents** (up to 5 files) for pitch deck analysis.

## Changes Made

### Backend Changes

#### 1. Database Migration (`server/migrations/009_add_additional_docs.sql`)
- Added `additional_doc_paths` JSONB column to `pitch_decks` table
- Stores array of document metadata: `[{ filename, path, type, size }]`
- Created GIN index for JSONB queries

#### 2. Route Updates (`server/src/routes/decks.ts`)
**Multer Configuration:**
- Updated to handle 3 file fields:
  - `deck` (required, maxCount: 1)
  - `checklist` (optional, maxCount: 1)
  - `additional_docs` (optional, maxCount: 5)
- Updated filename prefix logic for additional docs

**Upload Route (`/api/decks/upload-dual`):**
- Removed checklist requirement - only deck is required
- Added logic to process additional documents:
  - Extract text from each document
  - Store metadata in database
  - Append text to analysis context
- Updated validation to only require deck file
- Calculate total file size across all uploads
- Insert additional_doc_paths into database
- Updated response message to reflect uploaded files

**Analysis Trigger:**
- Updated to pass `additionalDocsText` to analysis functions
- Support both dual PDF (deck + checklist) and single deck analysis
- Include additional docs count in logs

#### 3. AI Service Updates (`server/src/services/ai-enhanced.ts`)
**Function Signatures Updated:**
- `analyzePitchDeckWithGrounding()` - Added `additionalDocsText?: string | null` parameter
- `analyzeDualPDFs()` - Added `additionalDocsText?: string | null` parameter
- `analyzePitchDeckFromPDF()` - Added `additionalDocsText?: string | null` parameter

**Analysis Logic:**
- Append additional docs text to deck text BEFORE VC context
- Clear marking with headers:
  ```
  === SUPPORTING DOCUMENTS ===
  Additional documents provided for validation and context
  [document content]
  ```
- Updated AI prompts to mention supporting documents
- Documents influence scoring and validation

### Frontend Changes

#### 1. API Service (`src/services/api.ts`)
**Updated `uploadDualDeck()` method:**
- Changed signature:
  ```typescript
  async uploadDualDeck(
    deckFile: File,              // Required
    checklistFile: File | null,  // Optional
    additionalDocs: File[],      // Optional array
    companyId: string,
    userId: string,
    industry?: string,
    stage?: string,
    additionalContext?: any
  )
  ```
- Updated FormData construction:
  - Only append checklist if present
  - Loop through additional_docs array
  - All additional docs use same field name for multer array handling

#### 2. Component State (`src/components/DeckIntelligence.tsx`)
**New State Variables:**
```typescript
const [additionalDocs, setAdditionalDocs] = useState<File[]>([]);
const [totalUploadSize, setTotalUploadSize] = useState(0);
const MAX_ADDITIONAL_DOCS = 5;
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB
```

**New useEffect:**
- Calculates total upload size across deck, checklist, and additional docs

#### 3. Handler Functions
**`handleAdditionalDocsChange()`:**
- Validates file count (max 5)
- Validates total upload size (max 500MB)
- Validates file types (PDF, DOCX, DOC, PPT, PPTX)
- Validates individual file sizes (max 100MB each)
- Adds files to additionalDocs array

**`removeAdditionalDoc()`:**
- Removes file from array by index

**`handleUpload()`:**
- Updated validation to only require deck
- Removed checklist requirement
- Added total size validation
- Pass additional docs to API call

#### 4. UI Updates
**Checklist Section:**
- Changed label to "Founder Checklist (Optional - Recommended)"
- Changed border to dashed (visual indicator of optional)
- Added "×" button to remove checklist
- Updated helper text

**New Additional Documents Section:**
- Located after checklist
- Accepts multiple files via `<input multiple>`
- Shows file counter: "Files (2 of 5)"
- Lists uploaded files with:
  - File icon
  - Filename
  - File size in KB
  - Remove button
- Shows total upload size progress
- Dashed border styling (optional)

**Upload Button:**
- Removed checklist from disabled condition
- Only requires: deck, stage, industry

**Instructions Updated:**
- Changed from "both" to emphasize deck is required
- Mentions optional checklist and additional docs

## File Size Limits

| Limit | Value |
|-------|-------|
| Individual file | 100MB |
| Additional docs count | 5 files |
| Total upload size | 500MB |

## File Types Supported
- PDF (`.pdf`)
- Microsoft Word (`.docx`, `.doc`)
- Microsoft PowerPoint (`.pptx`, `.ppt`)

## Analysis Flow

```
1. User uploads:
   - Deck (required) ✅
   - Checklist (optional)
   - Additional docs (optional, 0-5 files)

2. Backend processes:
   - Extract text from deck
   - If additional docs present:
     → Extract text from each
     → Append to deck text with headers
   - If checklist present:
     → Use analyzeDualPDFs()
   - Else:
     → Use analyzePitchDeckFromPDF()
   - If VC context present:
     → Append after additional docs

3. Enriched text sent to AI:
   [Deck Text]
   [Additional Docs Text] (if present)
   [VC Context] (if present)

4. AI analyzes with:
   - All supporting evidence
   - Custom VC preferences weights
   - Web validation (grounding)
```

## Database Schema

**pitch_decks table:**
```sql
additional_doc_paths JSONB
-- Example:
[
  {
    "filename": "financial_audit_2024.pdf",
    "path": "/uploads/additional-1732799123456-123456789.pdf",
    "type": "application/pdf",
    "size": 2145728
  },
  {
    "filename": "market_research.docx",
    "path": "/uploads/additional-1732799123457-987654321.docx",
    "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "size": 891264
  }
]
```

## Testing Checklist

- [ ] Upload deck only (no checklist, no additional docs)
- [ ] Upload deck + checklist (no additional docs)
- [ ] Upload deck + 1 additional doc
- [ ] Upload deck + checklist + 5 additional docs
- [ ] Try uploading 6 additional docs (should error)
- [ ] Try uploading files exceeding 500MB total (should error)
- [ ] Try uploading 101MB file (should error)
- [ ] Try uploading invalid file type (should error)
- [ ] Verify additional docs text appears in analysis
- [ ] Verify additional docs influence scoring
- [ ] Check database stores metadata correctly
- [ ] Test remove document functionality
- [ ] Test with different file types (PDF, DOCX, PPTX)

## UI/UX Improvements

**Visual Hierarchy:**
1. **Pitch Deck** - Bold border, required indicator
2. **Checklist** - Dashed border, "Optional - Recommended" label
3. **Additional Docs** - Dashed border, lightest styling, "Optional" label

**User Feedback:**
- Real-time file size counter
- Visual file list with remove buttons
- Clear error messages for validation failures
- Success indicators (green checkmarks)

## Benefits

✅ **Flexible** - Users can upload only what they have  
✅ **Comprehensive** - Support for various document types  
✅ **Validated** - AI uses additional docs for fact-checking  
✅ **User-Friendly** - Clear visual hierarchy (required vs optional)  
✅ **Scalable** - Can increase file limits if needed  

## Notes

- Additional documents are processed sequentially
- Text extraction failures for individual docs don't block upload
- Documents are stored permanently in `/uploads/` directory
- Metadata stored in JSONB for flexible querying
- All documents indexed by GIN for fast JSONB queries
