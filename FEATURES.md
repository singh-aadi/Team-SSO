# 🚀 Team-SSO Features

## Overview
Team-SSO is an AI-powered pitch deck analysis platform that helps venture capitalists evaluate startup investment opportunities using Google's Gemini AI with grounding capabilities.

---

## ✅ Core Features

### 1. **PDF Pitch Deck Analysis**
**Status**: ✅ Production Ready

Upload pitch deck PDFs and receive comprehensive AI-powered analysis including:
- Problem & Solution evaluation (scored 0-100)
- Market Opportunity assessment
- Traction & Growth metrics
- Team & Execution capabilities
- Business Model & Unit Economics
- Financials & Use of Funds
- Overall SSO Score (0-100)

**Technologies**: 
- Google Gemini 1.5 Flash/Pro
- PDF.js for text extraction
- PostgreSQL for data storage

**API Endpoint**: `POST /api/decks/upload`

---

### 2. **Enhanced PDF Report Generation**
**Status**: ✅ Production Ready

Generate investor-grade PDF reports with:
- **Executive Summary** with AI-generated company introduction
- **Company Overview** with specific product details and metrics
- **Detailed Section Analysis** (6 key areas with scores, feedback, strengths, improvements)
- **Risk Analysis** with probability assessments
- **Key Insights & Recommendations**
- **VC Context Integration** (uploaded notes/emails)
- **Web Enrichment Data** (if grounding enabled)
- **Industry Benchmarking** (company vs peers)

**Features**:
- Company name extracted from filename (priority over database)
- AI-generated introduction with retry mechanism for generic text detection
- Visual charts and benchmarking tables
- Professional formatting with branding

**API Endpoint**: `GET /api/decks/:id/report/enhanced`

**Documentation**: See `docs/features/ENHANCED_PDF.md`

---

### 3. **Audio Transcription & Analysis**
**Status**: ✅ Production Ready

Upload audio recordings (.mp3, .wav, .m4a, .ogg) of:
- Investor meetings
- Founder pitches
- Due diligence calls

**Capabilities**:
- Automatic transcription using Google Gemini Audio API
- Combined analysis with pitch deck data
- Supports files up to 100MB
- Extracts key discussion points and commitments

**Technologies**: Google Gemini Audio Processing

**API Endpoint**: `POST /api/decks/upload` (multipart with audio files)

**Documentation**: See `docs/archive/AUDIO_TRANSCRIPTION_COMPLETE.md`

---

### 4. **PowerPoint Extraction**
**Status**: ✅ Production Ready

Upload .pptx presentations for analysis:
- Extracts text from all slides
- Processes embedded notes
- Handles files up to 100MB
- Combined analysis with PDF decks

**Technologies**: 
- Google Gemini Multimodal
- Native PPTX processing (no external libraries)

**API Endpoint**: `POST /api/decks/upload`

**Documentation**: See `docs/archive/POWERPOINT_100MB_COMPLETE.md`

---

### 5. **VC Context & Notes**
**Status**: ✅ Production Ready

Upload supporting documents for richer analysis:
- Investment committee notes
- Email exchanges with founders
- Due diligence reports
- Internal memos

**Features**:
- Stored per-company in database
- Referenced during AI analysis (grounding)
- Displayed in enhanced PDF reports
- Export functionality for sharing

**Database**: `vc_context` table with company_id FK

**API Endpoints**: 
- `POST /api/vc-context` (upload)
- `GET /api/vc-context/:companyId` (retrieve)
- `GET /api/vc-context/:companyId/export` (download as .txt)

**Documentation**: See `docs/features/VC_CONTEXT_BUILD.md`

---

### 6. **Dual PDF Comparison**
**Status**: ✅ Production Ready

Upload two versions of the same pitch deck:
- Compares original vs updated versions
- Identifies changes, improvements, gaps
- Side-by-side analysis
- Generates comparison report

**Use Cases**:
- Track founder iteration on feedback
- Validate improvements after due diligence
- Monitor deck evolution over funding rounds

**API Endpoint**: `POST /api/decks/upload` (with `isDualUpload=true`)

**Documentation**: See `docs/features/DUAL_PDF_ANALYSIS.md`

---

### 7. **Company Benchmarking**
**Status**: ✅ Production Ready

Compare company metrics against industry peers:
- **Stage-based comparisons** (Seed, Series A, Series B)
- **Industry-specific benchmarks** (SaaS, FinTech, HealthTech, etc.)
- **Key metrics**: Revenue, Growth Rate, Burn Rate, Customer Acquisition Cost, Gross Margin
- Visual charts and tables in enhanced PDF

**Data Source**: 
- Curated database of 100+ companies across industries and stages
- Real market data from successful startups

**Database**: `companies` table with stage and industry categorization

---

### 8. **Real-Time Progress Indicator**
**Status**: ✅ Production Ready

Compact progress display during analysis:
- Shows current processing step
- Estimated time remaining
- File processing status
- Smooth animations

**Implementation**: 
- Frontend: Compact circular progress (top-right)
- Backend: Event-driven status updates
- WebSocket-ready architecture

**Documentation**: See `docs/archive/COMPACT_PROGRESS_COMPLETE.md`

---

### 9. **Google Grounding with Web Search**
**Status**: ✅ Production Ready (Optional)

Enhance AI analysis with real-time web data:
- Fact-checks claims against live sources
- Provides source attribution with URLs
- Validates market size and traction claims
- Shows confidence levels for grounded facts

**Configuration**: 
```typescript
// Enable in server/src/services/aiAnalyzer.ts
grounding: {
  googleSearchRetrieval: {
    dynamicRetrievalConfig: {
      mode: 'MODE_DYNAMIC',
      dynamicThreshold: 0.7
    }
  }
}
```

**Note**: Requires Vertex AI (not standard Gemini API)

**Documentation**: See `docs/archive/VERTEX_AI_COMPLETE.md`

---

## 🏗️ Architecture

### Tech Stack
**Frontend**:
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- React Router (navigation)

**Backend**:
- Node.js + Express
- TypeScript
- PostgreSQL (database)
- Google Gemini AI (analysis)
- PDFKit (report generation)

**Infrastructure**:
- Google Cloud Run (deployment)
- Google Secret Manager (credentials)
- Cloud SQL (PostgreSQL)
- Vercel (frontend hosting)

---

## 📊 Database Schema

### Core Tables
1. **companies** - Company master data (name, industry, stage, benchmarks)
2. **pitch_decks** - Uploaded decks (file_path, analysis_status, sso_score, dual_pdf_analysis)
3. **deck_analysis** - Section-wise scores (section_name, section_score, feedback, strengths, improvements)
4. **vc_context** - Supporting documents (company_id, content_type, text_content, file_path)
5. **comparison_reports** - Dual PDF comparison results

### Key Relationships
- `pitch_decks.company_id` → `companies.id`
- `deck_analysis.deck_id` → `pitch_decks.id`
- `vc_context.company_id` → `companies.id`

---

## 🎯 AI Analysis Sections

All pitch decks are evaluated across **6 critical dimensions**:

1. **Problem & Solution** (Score: 0-100)
   - Problem clarity and market pain
   - Solution uniqueness and feasibility
   - Product-market fit indicators

2. **Market Opportunity** (Score: 0-100)
   - Total Addressable Market (TAM)
   - Serviceable Obtainable Market (SOM)
   - Market growth trends
   - Competitive landscape

3. **Traction & Growth** (Score: 0-100)
   - User/customer metrics
   - Revenue growth
   - Key milestones achieved
   - Retention and engagement

4. **Team & Execution** (Score: 0-100)
   - Founder backgrounds
   - Relevant experience
   - Team completeness
   - Advisory support

5. **Business Model & Unit Economics** (Score: 0-100)
   - Revenue model clarity
   - CAC (Customer Acquisition Cost)
   - LTV (Lifetime Value)
   - Gross margin
   - Path to profitability

6. **Financials & Use of Funds** (Score: 0-100)
   - Financial projections quality
   - Burn rate and runway
   - Funding ask justification
   - Allocation strategy

### Overall SSO Score
Weighted average of all sections (0-100) with investment recommendation:
- **80-100**: STRONG_YES - High confidence investment
- **60-79**: YES - Promising with due diligence
- **40-59**: NEEDS_MORE_INFO - Requires clarification
- **0-39**: NO - Significant concerns

---

## 🔐 Security & Privacy

- **Authentication**: Google OAuth 2.0 (SSO)
- **Authorization**: Role-based access control
- **Data Storage**: Encrypted at rest (Cloud SQL)
- **API Security**: Rate limiting, CORS protection
- **Secrets**: Google Secret Manager (no hardcoded credentials)
- **File Storage**: Temporary local storage with cleanup after processing

---

## 📚 Documentation Structure

```
docs/
├── api/                    # API documentation
│   └── POSTMAN_TESTING.md
├── gemini/                 # AI/Gemini specific docs
├── setup/                  # Setup & deployment guides
│   ├── AUTHENTICATION_SETUP.md
│   ├── DEPLOYMENT.md
│   └── GOOGLE_CLOUD_SETUP.md
├── features/               # Feature-specific docs
│   ├── DEEP_ANALYSIS.md
│   ├── DUAL_PDF_ANALYSIS.md
│   ├── ENHANCED_PDF.md
│   ├── GEMINI_PROMPTS.md
│   └── VC_CONTEXT_BUILD.md
└── archive/                # Historical docs & completed features
    └── ... (20+ files)
```

---

## 🚀 Quick Start

See **README.md** for:
- Prerequisites
- Environment setup
- Installation steps
- Running locally
- Deployment instructions

---

## 🎨 UI/UX Highlights

- **Dashboard**: Overview of all uploaded decks with scores
- **Upload Interface**: Drag-and-drop with multi-file support
- **Analysis View**: Real-time progress with detailed results
- **Report Downloads**: One-click PDF generation
- **Responsive Design**: Desktop and mobile optimized
- **Dark Mode**: (Future enhancement)

---

## 📈 Performance

- **Analysis Time**: ~30-60 seconds per deck (Gemini 1.5 Flash)
- **PDF Generation**: ~5-10 seconds for enhanced reports
- **File Size Limits**: 100MB (PDFs, audio, PowerPoint)
- **Concurrent Users**: Scales with Cloud Run (0-100+ instances)

---

## 🛠️ Development

### Local Development
```bash
# Frontend
npm run dev          # Port 5173

# Backend
cd server
npm run dev          # Port 3000
```

### Build & Deploy
```bash
# Frontend
npm run build        # Outputs to dist/

# Backend
cd server
npm run build        # Compiles TypeScript to dist/
gcloud run deploy    # Deploy to Cloud Run
```

---

## 🐛 Known Issues

1. **Company Name Database Mismatch**: 
   - Fixed by extracting from filename (priority over database)
   - See `docs/archive/CHAINLINK_FINANCE_FIX.md`

2. **Generic AI Introductions**: 
   - Implemented retry mechanism with generic phrase detection
   - See `docs/archive/AGGRESSIVE_AI_PROMPT.md`

3. **Gemini Model Version**: 
   - Standard API uses `gemini-1.5-flash`
   - Vertex AI uses `models/gemini-1.5-flash-002`
   - Configure based on deployment method

---

## 🔮 Future Enhancements

- [ ] Real-time collaboration (multiple VCs reviewing same deck)
- [ ] Custom scoring weights (adjust importance of each section)
- [ ] Export to Excel with detailed data
- [ ] Integration with CRM systems
- [ ] Email notifications for analysis completion
- [ ] Deck versioning with change tracking
- [ ] Mobile app (iOS/Android)

---

## 📞 Support

For technical issues or feature requests:
- GitHub Issues: [singh-aadi/Team-SSO](https://github.com/singh-aadi/Team-SSO)
- Documentation: See `docs/` folder
- API Testing: Import `docs/api/POSTMAN_TESTING.md` collection

---

**Last Updated**: October 25, 2025  
**Version**: 2.0.0  
**License**: MIT
