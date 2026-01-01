# Team-SSO

> AI-Powered Pitch Deck Analysis Platform for Venture Capitalists

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=flat-square&logo=google-cloud&logoColor=white)](https://cloud.google.com/)

**Top 10 Finalist - Google AI Analyst Hackathon 2025**

---

## Overview

Team-SSO transforms how venture capitalists evaluate startups by analyzing pitch decks in **30 seconds** instead of hours. Using Google Gemini AI, it provides comprehensive investment analysis with data-backed insights and generates investor-grade reports.

### Key Value Proposition

| Traditional Analysis | Team-SSO |
|---------------------|----------|
| 2-4 hours per deck | 30 seconds |
| Manual review | AI + Human oversight |
| Subjective scoring | Data-driven SSO Score (0-100) |
| Limited format support | PDF, Audio, PowerPoint |
| No benchmarking | Industry + Stage comparisons |

---

## Core Features

### Investment Analysis
- **SSO Score System** - Comprehensive 0-100 scoring across 6 dimensions
- **Enhanced PDF Reports** - Professional 10-15 page investor reports
- **Multimodal Support** - PDF, Audio (.mp3), PowerPoint (.pptx)
- **VC Context Integration** - Upload meeting notes, emails, due diligence docs
- **Risk Assessment** - Probability-weighted risk analysis

### Advanced Capabilities
- **Grounding & Web Search** - Real-time fact-checking with source attribution
- **Industry Benchmarking** - Compare against 100+ companies by stage and sector
- **Dual PDF Comparison** - Track deck evolution across versions
- **Real-time Progress** - Live analysis updates

**Complete feature list**: [FEATURES.md](./FEATURES.md)

---

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS + Shadcn/UI
- React Router v6

**Backend**
- Node.js + Express + TypeScript
- PostgreSQL (Cloud SQL)
- Google Gemini AI (1.5 Flash/Pro)
- PDFKit (report generation)

**Infrastructure**
- Google Cloud Run
- Google Cloud SQL
- Google Secret Manager
- Vercel (frontend)

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Google Cloud account with billing enabled
- Git

### Installation

1. **Clone and Install**
```bash
git clone https://github.com/singh-aadi/Team-SSO.git
cd Team-SSO
npm install
cd server && npm install && cd ..
```

2. **Configure Environment**
```bash
# Copy environment templates
cp .env.example .env
cp server/.env.example server/.env

# Edit both files with your credentials
# See setup guide for detailed configuration
```

3. **Setup Database**
```bash
cd server
node migrate.js
```

4. **Start Development**
```powershell
# Option A: Automated (Recommended)
.\scripts\start.ps1

# Option B: Manual (3 terminals)
# Terminal 1: Cloud SQL Proxy
.\cloud-sql-proxy.exe YOUR_PROJECT:REGION:INSTANCE --port=5432

# Terminal 2: Backend
cd server
npm run dev

# Terminal 3: Frontend
npm run dev
```

5. **Access Application**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health Check: http://localhost:3000/health

### Google Cloud Setup

**Enable Required APIs**
```bash
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable generativelanguage.googleapis.com
```

**Get Gemini API Key**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create API key
3. Add to `server/.env` as `GEMINI_API_KEY`

**Detailed setup guide**: [docs/GOOGLE_CLOUD_SETUP.md](./docs/GOOGLE_CLOUD_SETUP.md)

---

## Project Structure

```
Team-SSO/
├── docs/              # Documentation
│   ├── api/          # API reference
│   ├── features/     # Feature guides
│   └── setup/        # Setup instructions
├── scripts/          # Automation scripts
├── server/           # Backend (Node.js + Express)
│   ├── src/         # TypeScript source
│   └── migrations/  # Database migrations
├── src/              # Frontend (React + TypeScript)
│   ├── components/  # UI components
│   ├── pages/       # Route pages
│   └── services/    # API clients
└── sql/              # Database scripts
```

---

## Documentation

### Setup & Configuration
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Google Cloud Setup](docs/GOOGLE_CLOUD_SETUP.md)
- [Authentication Setup](docs/AUTHENTICATION_SETUP.md)
- [Notion Integration](docs/NOTION_INTEGRATION_SETUP.md)

### Features
- [Complete Feature List](FEATURES.md)
- [Evaluation Wizard Guide](docs/EVALUATION_WIZARD_GUIDE.md)
- [Quick Login Guide](QUICK_LOGIN_GUIDE.md)

### Testing & Development
- [AI Testing Guide](docs/AI_TESTING_GUIDE.md)

---

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your-client-id
```

### Backend (server/.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DB_HOST=127.0.0.1
DB_PORT=5432

# Google Cloud
GOOGLE_CLOUD_PROJECT=your-project-id
GEMINI_API_KEY=your-gemini-api-key

# Authentication
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

See `.env.example` files for complete reference.

---

## Common Commands

### Development
```powershell
.\scripts\start.ps1                    # Start all services
npm run dev                            # Frontend dev server
cd server && npm run dev               # Backend dev server
```

### Database
```powershell
cd server
npm run migrate                        # Run migrations
psql -U postgres -d team_sso           # Connect to DB
```

### Build & Deploy
```powershell
npm run build                          # Build frontend
cd server && npm run build             # Build backend
.\scripts\deploy.ps1                   # Deploy to Cloud Run
```

---

## Troubleshooting

### Database Connection Issues
1. Verify Cloud SQL Proxy is running
2. Check `DATABASE_URL` in `server/.env`
3. Run migrations: `cd server && npm run migrate`

### API Key Errors
- Verify `GEMINI_API_KEY` in `server/.env`
- Check key is active in [Google AI Studio](https://aistudio.google.com/app/apikey)
- Review rate limits (free tier: 60 requests/minute)

### Port Conflicts
```powershell
# Check ports
Get-NetTCPConnection -LocalPort 3000   # Backend
Get-NetTCPConnection -LocalPort 5173   # Frontend
```

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "feat: Add new feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open Pull Request

---

## License

This project is proprietary software developed for the Google AI Analyst Hackathon.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/singh-aadi/Team-SSO/issues)
- **Documentation**: [docs/](./docs/)

---

**Built with Google Gemini AI** | Top 10 Finalist - Google AI Analyst Hackathon 2025
