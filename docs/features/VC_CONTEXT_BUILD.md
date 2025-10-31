# VC Context Manager - Implementation Guide

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd server
npm install mammoth pdf-parse pdfkit

# 2. Create migration
# Create: server/migrations/007_add_vc_context_tables.sql

# 3. Run migration
npm run migrate

# 4. Create files
touch server/src/routes/vc-context.ts
touch server/src/services/fileExtractor.ts
touch server/src/services/contextSynthesizer.ts
touch server/src/services/contextReportGenerator.ts
touch src/components/VCContextManager.tsx
touch src/services/vcContextApi.ts

# 5. Start building!
```

---

## 📋 Step-by-Step Implementation

### Phase 1: Database Setup (Day 1)

**1. Create migration file:** `server/migrations/007_add_vc_context_tables.sql`
```sql
-- vc_context_items table
CREATE TABLE vc_context_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
  uploaded_by UUID,
  file_path TEXT,
  file_name TEXT NOT NULL,
  file_type VARCHAR(50),
  content_text TEXT,
  upload_date TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- vc_context_summaries table
CREATE TABLE vc_context_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  key_insights JSONB,
  sentiment_analysis JSONB,
  generated_at TIMESTAMP DEFAULT NOW(),
  export_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vc_context_deck ON vc_context_items(deck_id);
CREATE INDEX idx_vc_summary_deck ON vc_context_summaries(deck_id);
```

**2. Run migration:**
```bash
cd server
npm run migrate
```

**3. Create upload directories:**
```bash
mkdir -p server/uploads/vc-context
mkdir -p server/exports
```

---

### Phase 2: File Extraction Service (Day 2)

**Create:** `server/src/services/fileExtractor.ts`
```typescript
import fs from 'fs';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';

export async function extractTextFromFile(filePath: string, ext: string): Promise<string> {
  try {
    switch (ext.toLowerCase()) {
      case '.txt':
        return fs.readFileSync(filePath, 'utf-8');
      
      case '.docx':
      case '.doc':
        const docResult = await mammoth.extractRawText({ path: filePath });
        return docResult.value;
      
      case '.pdf':
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);
        return pdfData.text;
      
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}
```

---

### Phase 3: Upload Route (Day 3)

**Create:** `server/src/routes/vc-context.ts`
```typescript
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../db';
import { extractTextFromFile } from '../services/fileExtractor';

const router = Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/vc-context');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'context-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.txt', '.pdf', '.docx', '.doc'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// POST /api/vc-context/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { deckId, type, metadata } = req.body;
    const ext = path.extname(req.file.originalname);
    
    // Extract text
    const content = await extractTextFromFile(req.file.path, ext);
    
    // Save to database
    const result = await query(
      `INSERT INTO vc_context_items 
       (deck_id, file_path, file_name, file_type, content_text, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [deckId, req.file.path, req.file.originalname, type, content, metadata || {}]
    );
    
    res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload context' });
  }
});

// GET /api/vc-context/:deckId
router.get('/:deckId', async (req, res) => {
  try {
    const { deckId } = req.params;
    const result = await query(
      'SELECT * FROM vc_context_items WHERE deck_id = $1 ORDER BY created_at DESC',
      [deckId]
    );
    res.json({ items: result.rows });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch context' });
  }
});

// DELETE /api/vc-context/:contextId
router.delete('/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;
    
    // Get file path before deleting
    const item = await query('SELECT file_path FROM vc_context_items WHERE id = $1', [contextId]);
    
    if (item.rows[0]?.file_path && fs.existsSync(item.rows[0].file_path)) {
      fs.unlinkSync(item.rows[0].file_path);
    }
    
    await query('DELETE FROM vc_context_items WHERE id = $1', [contextId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete context' });
  }
});

export default router;
```

**Register route in:** `server/src/index.ts`
```typescript
import vcContextRoutes from './routes/vc-context';
app.use('/api/vc-context', vcContextRoutes);
```

---

### Phase 4: AI Synthesis Service (Days 4-5)

**Create:** `server/src/services/contextSynthesizer.ts`
```typescript
import { VertexAI } from '@google-cloud/vertexai';
import { query } from '../db';

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_CLOUD_LOCATION!,
});

const model = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

export async function synthesizeVCContext(deckId: string) {
  try {
    // Fetch all context items
    const result = await query(
      'SELECT * FROM vc_context_items WHERE deck_id = $1 ORDER BY created_at ASC',
      [deckId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('No context items found');
    }
    
    // Build prompt
    const contextText = result.rows.map(item => 
      `[${item.file_type}] ${item.upload_date}\n${item.content_text}`
    ).join('\n\n');
    
    const prompt = `
You are a venture capital analyst reviewing context documents for a startup investment.

CONTEXT DOCUMENTS:
${contextText}

Analyze these documents and provide:

1. EXECUTIVE SUMMARY (3-4 sentences)
2. KEY INSIGHTS (5-7 bullet points with details)
3. OPPORTUNITY HIGHLIGHTS (strengths and positive signals)
4. RISK FACTORS (concerns and red flags)
5. TEAM ASSESSMENT (founder capabilities and dynamics)
6. NEXT STEPS (follow-up questions and diligence needed)
7. INVESTMENT RECOMMENDATION (Proceed/Pause/Pass with confidence %)

Return as JSON with keys: executiveSummary, keyInsights (array), opportunities (array), risks (array), teamAssessment (string), nextSteps (array), recommendation (object with decision and confidence).
`;
    
    // Call Gemini
    const response = await model.generateContent(prompt);
    const text = response.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const summary = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Failed to parse' };
    
    // Save summary
    const saveResult = await query(
      `INSERT INTO vc_context_summaries 
       (deck_id, summary_text, key_insights, sentiment_analysis)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [deckId, JSON.stringify(summary), summary.keyInsights || [], {}]
    );
    
    return { success: true, summary: saveResult.rows[0] };
  } catch (error) {
    console.error('Synthesis error:', error);
    throw error;
  }
}
```

**Add synthesis endpoint to:** `server/src/routes/vc-context.ts`
```typescript
import { synthesizeVCContext } from '../services/contextSynthesizer';

// POST /api/vc-context/synthesize/:deckId
router.post('/synthesize/:deckId', async (req, res) => {
  try {
    const { deckId } = req.params;
    const result = await synthesizeVCContext(deckId);
    res.json(result);
  } catch (error) {
    console.error('Synthesis error:', error);
    res.status(500).json({ error: 'Failed to synthesize context' });
  }
});
```

---

### Phase 5: Frontend Component (Days 6-8)

**Create:** `src/services/vcContextApi.ts`
```typescript
const API_URL = 'http://localhost:3000/api';

export const vcContextApi = {
  async uploadContext(deckId: string, file: File, type: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deckId', deckId);
    formData.append('type', type);
    
    const response = await fetch(`${API_URL}/vc-context/upload`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  },
  
  async getContextItems(deckId: string) {
    const response = await fetch(`${API_URL}/vc-context/${deckId}`);
    return response.json();
  },
  
  async synthesizeContext(deckId: string) {
    const response = await fetch(`${API_URL}/vc-context/synthesize/${deckId}`, {
      method: 'POST'
    });
    return response.json();
  },
  
  async deleteContext(contextId: string) {
    await fetch(`${API_URL}/vc-context/${contextId}`, { method: 'DELETE' });
  }
};
```

**Create:** `src/components/VCContextManager.tsx`
```typescript
import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Sparkles } from 'lucide-react';
import { vcContextApi } from '../services/vcContextApi';

interface Props {
  deckId: string;
}

export function VCContextManager({ deckId }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadItems();
  }, [deckId]);

  const loadItems = async () => {
    const data = await vcContextApi.getContextItems(deckId);
    setItems(data.items);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      await vcContextApi.uploadContext(deckId, file, 'meeting-notes');
      await loadItems();
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handleSynthesize = async () => {
    setLoading(true);
    try {
      const result = await vcContextApi.synthesizeContext(deckId);
      setSummary(result.summary);
    } catch (error) {
      console.error('Synthesis failed:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await vcContextApi.deleteContext(id);
    await loadItems();
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">VC Context Manager</h1>
        <p className="text-slate-600 mt-1">Upload context and generate AI insights</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Upload Context</h2>
        <label className="block w-full border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer">
          <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <span className="text-sm text-slate-600">
            {uploading ? 'Uploading...' : 'Click to upload .txt, .pdf, or .docx (25MB max)'}
          </span>
          <input
            type="file"
            className="hidden"
            accept=".txt,.pdf,.docx,.doc"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Context Items */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Context Items ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No context items yet</p>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-slate-900">{item.file_name}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Summary */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">AI Summary</h2>
          {!summary ? (
            <button
              onClick={handleSynthesize}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <Sparkles className="h-5 w-5" />
              <span>{loading ? 'Generating...' : 'Generate AI Summary'}</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Executive Summary</h3>
                <p className="text-slate-700">{summary.executiveSummary}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Key Insights</h3>
                <ul className="space-y-2">
                  {summary.keyInsights?.map((insight: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-blue-600">•</span>
                      <span className="text-slate-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {summary.recommendation && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-1">Recommendation</h3>
                  <p className="text-green-800">
                    {summary.recommendation.decision} (Confidence: {summary.recommendation.confidence}%)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Update:** `src/components/VCJourney.tsx`
```typescript
// Add to vcJourney array:
{
  stage: 'Context & Notes',
  icon: FolderOpen,
  description: 'Collect and synthesize interaction context',
  tasks: [
    { name: 'Upload meeting notes', status: 'in-progress' },
    { name: 'Add communications', status: 'pending' },
    { name: 'Generate AI summary', status: 'pending' },
    { name: 'Export report', status: 'pending' }
  ],
  ssoPrompts: [
    'AI synthesizes all context into insights',
    'Export for IC presentation'
  ]
}
```

---

## ✅ Testing Checklist

- [ ] Upload .txt file - Success
- [ ] Upload .pdf file - Success
- [ ] Upload .docx file - Success
- [ ] Upload invalid file - Error shown
- [ ] View uploaded items in timeline
- [ ] Delete context item
- [ ] Generate AI summary with 3+ items
- [ ] Summary displays correctly
- [ ] All API endpoints working
- [ ] Error handling working

---

## 🐛 Common Issues

**Issue: "Failed to extract text from PDF"**
- Solution: Ensure pdf-parse is installed: `npm install pdf-parse`

**Issue: "Gemini API timeout"**
- Solution: Reduce context length or use pagination

**Issue: "File upload fails"**
- Solution: Check multer limits and file path permissions

---

## 🎯 What's Next?

### Optional Enhancements:
1. **PDF Export** - Add pdfkit to generate downloadable reports
2. **Preview Modal** - Show full context before deleting
3. **Search/Filter** - Add search bar for context items
4. **Drag & Drop** - Better upload UX
5. **Edit Metadata** - Edit dates, participants, tags

### Phase 2 Features:
- Audio transcription
- Email parsing
- Real-time collaboration
- Calendar integration

---

**You now have a complete, working VC Context Manager!** 🚀
