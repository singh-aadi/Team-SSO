# VC Context Input Expansion + Enhanced PDF Output - Implementation Plan

## 🎯 Goals

### Goal 1: Expand VC Context File Support
Add support for presentations and media files:
- **Presentations:** `.ppt`, `.pptx` (extract text from slides)
- **Audio:** `.mp3`, `.wav`, `.m4a` (transcribe speech-to-text)
- **Video:** `.mp4` (extract audio → transcribe)

### Goal 2: Enhanced Deck Intelligence PDF Output
Improve the generated PDF report to leverage all 3 data sources:
- Pitch Deck
- Founder Checklist
- VC Context (meeting notes, emails, calls)

Include comprehensive industry vertical benchmarking.

---

## 📋 Part 1: Expand VC Context File Support

### Current State
✅ **Working:** `.txt`, `.pdf`, `.docx`
❌ **Missing:** `.ppt`, `.pptx`, `.mp3`, `.mp4`, `.wav`, `.m4a`

### Architecture

```
Upload File (.pptx, .mp3, .mp4)
    ↓
Multer validates file type
    ↓
Extract/Transcribe content
    ↓
Store in vc_context_items
    ↓
Use in AI synthesis
```

### Implementation

#### Phase 1A: PowerPoint Support (45 min)

**New Dependency:**
```json
"officegen": "^0.6.5"  // For .ppt (old format)
"pptx2json": "^2.0.0"  // For .pptx parsing
```

**Alternative (Better):**
```json
"mammoth": "^1.11.0"  // Already installed ✅
"pptxtojson": "^0.1.0"
```

**Or use Python script:**
```bash
pip install python-pptx
```

**File:** `server/src/services/fileExtractor.ts`

**Add function:**
```typescript
async function extractTextFromPowerPoint(filePath: string): Promise<string> {
  const extension = path.extname(filePath).toLowerCase();
  
  if (extension === '.pptx') {
    // Use python-pptx via child_process
    const pythonScript = path.join(__dirname, '../scripts/extract_pptx.py');
    const result = await execPromise(`python ${pythonScript} "${filePath}"`);
    return result.stdout;
  } else if (extension === '.ppt') {
    // Fallback: convert to .pptx first or use libreoffice
    throw new Error('.ppt format not yet supported. Please convert to .pptx');
  }
}
```

**Python Script:** `server/src/scripts/extract_pptx.py`
```python
import sys
from pptx import Presentation

def extract_text_from_pptx(file_path):
    prs = Presentation(file_path)
    text_content = []
    
    for slide_num, slide in enumerate(prs.slides, 1):
        text_content.append(f"=== Slide {slide_num} ===")
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                text_content.append(shape.text)
    
    return "\n".join(text_content)

if __name__ == "__main__":
    file_path = sys.argv[1]
    text = extract_text_from_pptx(file_path)
    print(text)
```

#### Phase 1B: Audio/Video Transcription (90 min)

**Services Available:**
1. **Google Speech-to-Text** (already using Google Cloud) ✅ Recommended
2. **OpenAI Whisper API** (more accurate, $0.006/min)
3. **AssemblyAI** (good for meetings, speaker diarization)

**Recommended:** Google Speech-to-Text (already authenticated)

**New Dependencies:**
```json
"@google-cloud/speech": "^6.7.0",
"fluent-ffmpeg": "^2.1.3"  // For audio extraction from video
```

**File:** `server/src/services/audioTranscriber.ts` (NEW)

```typescript
import speech from '@google-cloud/speech';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const client = new speech.SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

/**
 * Extract audio from video file (.mp4)
 */
async function extractAudioFromVideo(
  videoPath: string
): Promise<string> {
  const audioPath = videoPath.replace(/\.mp4$/, '.wav');
  
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .toFormat('wav')
      .audioChannels(1)
      .audioFrequency(16000)
      .on('end', () => resolve(audioPath))
      .on('error', reject)
      .save(audioPath);
  });
}

/**
 * Transcribe audio file using Google Speech-to-Text
 */
export async function transcribeAudio(
  filePath: string
): Promise<string> {
  console.log(`🎤 Transcribing audio: ${filePath}`);
  
  // Convert to WAV if needed
  let audioPath = filePath;
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.mp4') {
    console.log('📹 Extracting audio from video...');
    audioPath = await extractAudioFromVideo(filePath);
  } else if (ext === '.mp3' || ext === '.m4a') {
    console.log('🔄 Converting to WAV format...');
    const wavPath = filePath.replace(ext, '.wav');
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .toFormat('wav')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('end', resolve)
        .on('error', reject)
        .save(wavPath);
    });
    audioPath = wavPath;
  }
  
  // Read audio file
  const audioBytes = fs.readFileSync(audioPath).toString('base64');
  
  // Configure request
  const request = {
    audio: {
      content: audioBytes,
    },
    config: {
      encoding: 'LINEAR16' as const,
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: false,
      model: 'default',
      useEnhanced: true,
    },
  };
  
  console.log('☁️ Sending to Google Speech-to-Text...');
  
  // Detect speech in the audio file
  const [response] = await client.recognize(request);
  const transcription = response.results
    ?.map(result => result.alternatives?.[0]?.transcript)
    .join('\n') || '';
  
  console.log(`✅ Transcription complete: ${transcription.length} characters`);
  
  // Clean up temporary WAV file if created
  if (audioPath !== filePath && fs.existsSync(audioPath)) {
    fs.unlinkSync(audioPath);
  }
  
  return transcription;
}

/**
 * Check if file is audio/video
 */
export function isMediaFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ['.mp3', '.wav', '.m4a', '.mp4'].includes(ext);
}
```

#### Phase 1C: Update File Extractor (30 min)

**File:** `server/src/services/fileExtractor.ts`

**Update:**
```typescript
import { transcribeAudio, isMediaFile } from './audioTranscriber';

export async function extractTextFromFile(filePath: string): Promise<string> {
  const extension = path.extname(filePath).toLowerCase();
  
  console.log(`📄 Extracting text from: ${filePath} (${extension})`);

  try {
    // Text files
    if (extension === '.txt') {
      return fs.readFileSync(filePath, 'utf-8');
    }
    
    // PDF files
    if (extension === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    }
    
    // Word documents
    if (extension === '.docx' || extension === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    
    // PowerPoint presentations
    if (extension === '.pptx' || extension === '.ppt') {
      return await extractTextFromPowerPoint(filePath);
    }
    
    // Audio/Video files
    if (isMediaFile(filePath)) {
      return await transcribeAudio(filePath);
    }
    
    throw new Error(`Unsupported file type: ${extension}`);
  } catch (error: any) {
    console.error(`❌ Failed to extract text from ${filePath}:`, error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

export function isSupportedFileType(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return [
    '.txt', '.pdf', '.docx', '.doc',
    '.pptx', '.ppt',
    '.mp3', '.wav', '.m4a', '.mp4'
  ].includes(ext);
}
```

#### Phase 1D: Update Routes & UI (20 min)

**File:** `server/src/routes/vc-context.ts`

**Update multer config:**
```typescript
const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for video files
  },
  fileFilter: (req, file, cb) => {
    if (isSupportedFileType(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});
```

**File:** `src/components/VCContextManager.tsx`

**Update upload UI:**
```tsx
<span className="block text-xs text-slate-500">
  Supported: .txt, .pdf, .docx, .pptx, .mp3, .mp4, .wav, .m4a (Max 100MB)
</span>
<input
  type="file"
  className="hidden"
  accept=".txt,.pdf,.docx,.doc,.pptx,.ppt,.mp3,.wav,.m4a,.mp4"
  onChange={handleUpload}
  disabled={uploading}
/>
```

---

## 📋 Part 2: Enhanced Deck Intelligence PDF Output

### Current PDF Sections
- Executive Summary
- Key Insights
- Strengths & Weaknesses
- Market Opportunity
- Competitive Analysis
- Team Assessment
- Financial Projections
- SSO Score

### NEW Enhanced Sections

#### 2A: VC Context Integration
**Add section:** "Background & Context"
```
========================================
BACKGROUND & CONTEXT
========================================
Based on VC interactions and communications:

Executive Summary:
[From VC Context synthesis]

Key Discussion Points:
• Point 1 from meetings
• Point 2 from emails
• Point 3 from calls

Documents Reviewed:
• meeting_notes.pdf (Oct 20)
• email_thread.txt (Oct 21)
• call_transcript.mp3 (Oct 23)
```

#### 2B: Industry Vertical Benchmarking
**Add section:** "Industry Vertical Benchmarking"
```
========================================
INDUSTRY VERTICAL ANALYSIS
========================================

Industry: [Artificial Intelligence / SaaS / FinTech / etc.]

Key Metrics Comparison:
┌─────────────────────┬──────────┬──────────────┐
│ Metric              │ Company  │ Industry Avg │
├─────────────────────┼──────────┼──────────────┤
│ ARR Growth Rate     │ 240%     │ 150%         │
│ CAC Payback         │ 8 months │ 12 months    │
│ Gross Margin        │ 75%      │ 70%          │
│ NRR                 │ 115%     │ 105%         │
│ Burn Multiple       │ 1.2x     │ 2.0x         │
└─────────────────────┴──────────┴──────────────┘

Competitive Position:
[Analysis of how company compares to industry benchmarks]

Stage-Specific Insights:
Series A companies in [Industry] typically:
• ARR Range: $1M - $5M
• Team Size: 10-30 employees
• Customer Count: 50-200
• Funding Raised: $3M - $10M

Market Trends:
• [Trend 1 from web grounding]
• [Trend 2 from web grounding]
• [Trend 3 from web grounding]
```

#### 2C: Comprehensive Analysis

**Enhanced sections:**

1. **Market Opportunity** (with context)
   - TAM/SAM/SOM from deck
   - Market validation from VC meetings
   - Customer feedback from calls
   - Web-validated market data

2. **Competitive Analysis** (richer)
   - Competitors from deck
   - Competitors mentioned in VC context
   - Web-sourced competitors
   - Differentiation assessment

3. **Team Assessment** (multi-source)
   - Team info from deck
   - Impressions from VC meetings
   - LinkedIn validation
   - Domain expertise analysis

4. **Risk Analysis** (comprehensive)
   - Risks identified in deck analysis
   - Concerns from VC discussions
   - Market risks from web research
   - Mitigation strategies

### Implementation

**File:** `server/src/services/enhancedPdfGenerator.ts`

**Update `generateEnhancedPDF` function:**

```typescript
export async function generateEnhancedPDF(
  deck: PitchDeck,
  stage: string,
  industry: string,
  additionalContext?: any // NEW: VC Context
): Promise<Buffer> {
  
  // ... existing code ...
  
  // NEW SECTION: Background & Context
  if (additionalContext && additionalContext.summary) {
    doc.addPage();
    doc.fontSize(18).fillColor('#1e40af')
      .text('Background & Context', { underline: true });
    doc.moveDown();
    
    doc.fontSize(14).fillColor('black')
      .text('Based on VC Interactions:', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10).text(additionalContext.summary.executiveSummary);
    doc.moveDown();
    
    if (additionalContext.summary.keyInsights?.length > 0) {
      doc.fontSize(12).text('Key Discussion Points:', { underline: true });
      doc.moveDown(0.5);
      additionalContext.summary.keyInsights.forEach((insight: string) => {
        doc.fontSize(10).text(`• ${insight}`, { indent: 20 });
        doc.moveDown(0.3);
      });
    }
    
    doc.moveDown();
    doc.fontSize(12).text('Source Documents:', { underline: true });
    doc.moveDown(0.5);
    additionalContext.items.forEach((item: any, idx: number) => {
      const date = new Date(item.uploadDate).toLocaleDateString();
      doc.fontSize(9).text(
        `${idx + 1}. ${item.fileName} (${date})`,
        { indent: 20 }
      );
      doc.moveDown(0.2);
    });
  }
  
  // NEW SECTION: Industry Vertical Benchmarking
  doc.addPage();
  doc.fontSize(18).fillColor('#1e40af')
    .text('Industry Vertical Benchmarking', { underline: true });
  doc.moveDown();
  
  doc.fontSize(14).fillColor('black').text(`Industry: ${industry}`);
  doc.moveDown();
  
  // Fetch industry benchmarks
  const benchmarks = await getIndustryBenchmarks(industry, stage);
  
  doc.fontSize(12).text('Key Metrics Comparison:', { underline: true });
  doc.moveDown(0.5);
  
  // Draw comparison table
  const companyMetrics = extractMetricsFromAnalysis(deck.analysis);
  drawBenchmarkTable(doc, companyMetrics, benchmarks);
  
  doc.moveDown();
  doc.fontSize(12).text('Competitive Position:', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).text(generateCompetitivePositionText(
    companyMetrics,
    benchmarks,
    additionalContext
  ));
  
  // ... rest of existing code ...
}
```

**Add helper function:**
```typescript
async function getIndustryBenchmarks(
  industry: string,
  stage: string
): Promise<any> {
  // Could fetch from database, API, or hardcoded benchmarks
  const benchmarks = {
    'Artificial Intelligence': {
      'Series A': {
        arrGrowth: 150,
        cacPayback: 12,
        grossMargin: 70,
        nrr: 105,
        burnMultiple: 2.0
      }
    },
    'SaaS': {
      'Series A': {
        arrGrowth: 120,
        cacPayback: 14,
        grossMargin: 75,
        nrr: 110,
        burnMultiple: 1.8
      }
    }
    // ... more industries
  };
  
  return benchmarks[industry]?.[stage] || {};
}

function drawBenchmarkTable(
  doc: PDFKit.PDFDocument,
  companyMetrics: any,
  benchmarks: any
): void {
  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 250;
  const col3 = 400;
  
  // Header
  doc.fontSize(10).fillColor('#1e40af');
  doc.text('Metric', col1, tableTop);
  doc.text('Company', col2, tableTop);
  doc.text('Industry Avg', col3, tableTop);
  
  doc.moveDown();
  const lineY = doc.y;
  doc.moveTo(col1, lineY).lineTo(550, lineY).stroke();
  doc.moveDown(0.5);
  
  // Rows
  doc.fillColor('black').fontSize(9);
  
  const metrics = [
    { label: 'ARR Growth Rate', key: 'arrGrowth', suffix: '%' },
    { label: 'CAC Payback', key: 'cacPayback', suffix: ' months' },
    { label: 'Gross Margin', key: 'grossMargin', suffix: '%' },
    { label: 'NRR', key: 'nrr', suffix: '%' },
    { label: 'Burn Multiple', key: 'burnMultiple', suffix: 'x' }
  ];
  
  metrics.forEach(metric => {
    const y = doc.y;
    doc.text(metric.label, col1, y);
    
    const companyVal = companyMetrics[metric.key] || 'N/A';
    const benchmarkVal = benchmarks[metric.key] || 'N/A';
    
    // Color code: green if better, red if worse
    if (companyVal !== 'N/A' && benchmarkVal !== 'N/A') {
      const isBetter = companyVal > benchmarkVal;
      doc.fillColor(isBetter ? '#16a34a' : '#dc2626');
      doc.text(companyVal + metric.suffix, col2, y);
      doc.fillColor('black');
    } else {
      doc.text(companyVal, col2, y);
    }
    
    doc.text(benchmarkVal + metric.suffix, col3, y);
    doc.moveDown();
  });
}
```

---

## 🧪 Testing Plan

### Part 1: File Format Testing
- [ ] Upload .pptx → verify text extraction
- [ ] Upload .mp3 → verify transcription
- [ ] Upload .mp4 → verify audio extraction + transcription
- [ ] Upload .wav → verify transcription
- [ ] Test large files (50MB+)
- [ ] Test corrupted files
- [ ] Verify all formats in AI synthesis

### Part 2: Enhanced PDF Testing
- [ ] Upload deck + checklist + VC context
- [ ] Run analysis
- [ ] Download enhanced PDF
- [ ] Verify "Background & Context" section
- [ ] Verify "Industry Benchmarking" section
- [ ] Check table formatting
- [ ] Verify all metrics present
- [ ] Test with/without VC context

---

## ⏱️ Time Estimates

### Part 1: Expand File Support
- PowerPoint extraction: 45 min
- Audio transcription setup: 60 min
- Video processing: 30 min
- Integration & testing: 45 min
**Subtotal: 3 hours**

### Part 2: Enhanced PDF
- VC Context section: 30 min
- Industry benchmarking data: 45 min
- Table rendering: 45 min
- Integration & styling: 30 min
- Testing: 30 min
**Subtotal: 3 hours**

**Total: ~6 hours**

---

## 📦 New Dependencies

```json
{
  "@google-cloud/speech": "^6.7.0",
  "fluent-ffmpeg": "^2.1.3",
  "python-pptx": "via Python script"
}
```

Also need:
```bash
# FFmpeg (for audio/video processing)
choco install ffmpeg  # Windows
```

---

## 🚀 Implementation Order

**Recommended sequence:**

1. ✅ **Audio/Video transcription** (most valuable) - 2 hours
2. ✅ **PowerPoint extraction** - 1 hour
3. ✅ **Enhanced PDF with VC context** - 2 hours
4. ✅ **Industry benchmarking** - 1 hour

**Ready to start?** I recommend beginning with **audio/video transcription** since that's the most impactful! 🎤
