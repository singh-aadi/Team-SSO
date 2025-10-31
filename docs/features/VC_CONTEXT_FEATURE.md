# VC Context Manager - Feature Plan

## 🎯 What & Why

**Problem:** VCs have scattered context about startups (meeting notes, emails, call transcripts) that's hard to leverage during investment decisions.

**Solution:** Upload unstructured data → AI synthesizes insights → Export as PDF report alongside pitch deck analysis.

**Value:** 
- ⏱️ Save 5-10 hours per deal in IC prep
- 🎯 Better decisions from AI-powered insights
- 🤝 Easy sharing with team members
- 📈 Historical context for portfolio tracking

---

## 🏗️ Technical Architecture

### Stack
```
Frontend:  React + TypeScript + Tailwind CSS
Backend:   Node.js + Express + PostgreSQL
AI:        Google Vertex AI (Gemini 2.0 Flash)
Files:     Multer + mammoth + pdf-parse + PDFKit
```

### Database Schema
```sql
-- New Tables
CREATE TABLE vc_context_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  file_path TEXT,
  file_name TEXT NOT NULL,
  file_type VARCHAR(50), -- 'meeting-notes', 'email', 'call-transcript', 'memo'
  content_text TEXT,
  upload_date TIMESTAMP DEFAULT NOW(),
  metadata JSONB, -- { participants, date, topics, sentiment }
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vc_context_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  key_insights JSONB, -- Array of insights
  sentiment_analysis JSONB,
  generated_at TIMESTAMP DEFAULT NOW(),
  export_url TEXT, -- Path to PDF
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vc_context_deck ON vc_context_items(deck_id);
```

### API Endpoints
```typescript
POST   /api/vc-context/upload          // Upload context files
GET    /api/vc-context/:deckId         // Get all context for a deck
POST   /api/vc-context/synthesize/:deckId  // Generate AI summary
GET    /api/vc-context/export/:deckId  // Export as PDF
DELETE /api/vc-context/:contextId      // Delete context item
```

### System Flow
```
1. Upload Files
   VC uploads .txt/.pdf/.docx → Multer saves → Extract text → Store in DB

2. AI Synthesis
   Fetch all context → Build Gemini prompt → Call Vertex AI → Parse response → Save summary

3. Export PDF
   Fetch summary → Generate PDF with pdfkit → Return download
```

---

## 🎨 UI Design

### VCJourney Integration (Add new card)
```tsx
{
  stage: 'Context & Notes',
  icon: FolderOpen,
  description: 'Collect and synthesize interaction context',
  tasks: [
    { name: 'Upload meeting notes', status: 'in-progress' },
    { name: 'Add email communications', status: 'pending' },
    { name: 'Generate AI summary', status: 'pending' },
    { name: 'Export context report', status: 'pending' }
  ],
  ssoPrompts: [
    'AI synthesizes all context into actionable insights',
    'Export alongside pitch deck for IC presentation'
  ]
}
```

### Main Component: VCContextManager.tsx
```
┌─────────────────────────────────────────┐
│  VC Context Manager                      │
│  Company: Acme AI Corp                   │
├─────────────────────────────────────────┤
│  Upload Context:                         │
│  ┌─────────────────────────────────┐   │
│  │ 📎 Drop files or click           │   │
│  │  .txt, .docx, .pdf (25MB max)    │   │
│  └─────────────────────────────────┘   │
│                                          │
│  Context Timeline (3 items):             │
│  ┌────────────────────────────────────┐ │
│  │ 📧 Email - Sep 20, 2025            │ │
│  │ "Follow-up on Series A..."         │ │
│  │ [View] [Delete]                    │ │
│  ├────────────────────────────────────┤ │
│  │ 📞 Call Notes - Sep 18, 2025      │ │
│  │ "Technical deep dive..."           │ │
│  │ [View] [Delete]                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  AI Summary:                             │
│  ┌────────────────────────────────────┐ │
│  │ Executive Summary:                 │ │
│  │ Strong technical team...           │ │
│  │                                    │ │
│  │ Key Insights:                      │ │
│  │ • Impressive traction (3x YoY)    │ │
│  │ • Clear market opportunity         │ │
│  │ • Competitive risks                │ │
│  │                                    │ │
│  │ Recommendation: PROCEED (85%)      │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [🤖 Generate Summary] [📄 Export PDF]  │
└─────────────────────────────────────────┘
```

### Color Scheme
- Primary: Blue-600 (#2563eb)
- Success: Green-600 (#16a34a)
- Warning: Orange-600 (#ea580c)
- Text: Slate-900 (#0f172a)
- Background: Slate-50 (#f8fafc)

---

## 📦 Dependencies

```bash
# Backend
cd server
npm install mammoth pdf-parse pdfkit mailparser

# No new frontend dependencies needed
```

---

## 🤖 AI Prompt Template

```typescript
const prompt = `
You are a venture capital analyst reviewing context documents for a startup.

CONTEXT DOCUMENTS:
${contextItems.map(item => `[${item.type}] ${item.date}\n${item.content}`).join('\n\n')}

Analyze and provide:

1. EXECUTIVE SUMMARY (3-4 sentences)
2. KEY INSIGHTS (5-7 bullet points)
3. OPPORTUNITY HIGHLIGHTS
4. RISK FACTORS & RED FLAGS
5. TEAM ASSESSMENT
6. NEXT STEPS RECOMMENDED
7. INVESTMENT RECOMMENDATION (Proceed/Pause/Pass + confidence %)

Format as JSON.
`;
```

---

## 🔐 Security

- File type validation (.txt, .pdf, .docx only)
- Size limit: 25MB per file
- Private storage (not publicly accessible)
- User authentication required
- 90-day retention policy
- Rate limiting on uploads

---

## 📈 Success Metrics

**Track:**
- Context items uploaded per week
- AI synthesis requests
- PDF exports downloaded
- Time saved (user survey)
- Feature satisfaction score

**Target:** 80% of active VCs using within 3 months

---

## ⚠️ MVP Scope (Keep it Simple!)

### ✅ Include
- Upload .txt, .pdf, .docx files
- Extract and store text
- Generate AI summary (Gemini)
- Display summary in UI
- Export summary as PDF
- Delete context items

### ❌ Exclude (Phase 2)
- Audio transcription
- Email parsing (.eml)
- Real-time collaboration
- Advanced search/filter
- Calendar integration

---

## 🗓️ Timeline

**MVP: 6 weeks**
- Week 1-2: Backend (DB, upload, text extraction)
- Week 3-4: AI synthesis (Gemini integration)
- Week 5-6: Frontend UI + PDF export

**Polish: 2 weeks**
- Week 7: Testing & bug fixes
- Week 8: Deploy & user onboarding

**Total: 8 weeks**

---

## 💡 Simplified Alternative (4 weeks)

If you want faster:
1. Support only .txt files (skip pdf-parse, mammoth)
2. Show summary in UI only (skip PDF export)
3. Basic timeline view (no fancy filters)

This gets core value live faster, then iterate based on feedback!

---

## 🚀 Ready to Build?

**Next Steps:**
1. Review this plan
2. Create database migration
3. Install dependencies
4. Follow implementation guide (see next file)

---

See **VC_CONTEXT_IMPLEMENTATION.md** for step-by-step build guide! 🎯
