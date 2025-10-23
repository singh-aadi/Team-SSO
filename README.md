# 🚀 Team SSO - AI-Powered VC Deal Flow Platform# Team-SSO



> **Transform pitch deck analysis from 2-4 hours to 30 seconds with AI-driven insights**## Build Locally



[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)```bash

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)$ cd frontend/

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)$ npm install --save-build vite

[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)$ npm run build     # or directly run: vite build

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)```



---This generates `dist/` folder in `frontend/` folder.



## 📖 **Table of Contents**To actually launch site on localhost from `dist/` folder, run:



- [Overview](#overview)```bash

- [Key Features](#key-features)$ vite preview

- [Tech Stack](#tech-stack)```

- [Quick Start](#quick-start)

- [Project Structure](#project-structure)## Development only

- [Documentation](#documentation)

- [Scripts](#scripts)Run `npm run dev` (or equivalently `vite` command) to directly launch site without needing to build during development.

- [Contributing](#contributing)However build step is required for production.



---


## 🎯 **Overview**

**Team SSO** is an AI-powered investment analysis platform that helps venture capitalists evaluate startup pitch decks in **30 seconds** instead of 2-4 hours.

### **Core Value Proposition**

| Traditional VC Analysis | Team SSO Analysis |
|------------------------|-------------------|
| ⏰ **2-4 hours** per deck | ⚡ **30 seconds** |
| 👤 Manual review | 🤖 AI-powered + Human oversight |
| 📊 Subjective scoring | 📈 Data-driven SSO Score™ |
| 📄 Text-only analysis | 🎨 Vision AI (charts, graphs) |
| ❌ No benchmarking | ✅ Industry-specific benchmarks |

---

## ✨ **Key Features**

- 📊 **SSO Readiness Score™** (0-100) - Proprietary scoring calibrated for 13+ industries
- 📋 **Dual PDF Analysis** - Cross-reference pitch decks with founder checklists
- 📑 **Enhanced PDF Reports** - 10-12 page investor-grade reports
- 🎨 **Vision AI** - Analyze charts, graphs, financial projections
- 🏢 **Multi-Company Management** - Track multiple portfolio companies
- 🔐 **Secure Authentication** - Google OAuth 2.0 + JWT

---

## 🛠️ **Tech Stack**

**Frontend:** React 18, TypeScript, Vite, TailwindCSS  
**Backend:** Node.js, Express, TypeScript, PostgreSQL  
**AI/ML:** Google Gemini 2.0 Flash, Vision AI  
**Cloud:** Google Cloud Run, Cloud SQL, Cloud Storage  

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- PostgreSQL 14+ (or Google Cloud SQL)
- Google Cloud account (for Gemini API & Cloud SQL)
- Cloud SQL Proxy executable ([Download here](https://cloud.google.com/sql/docs/mysql/sql-proxy))

### **1. Clone & Install Dependencies**
```bash
git clone https://github.com/singh-aadi/Team-SSO.git
cd Team-SSO

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### **2. Setup Environment Variables**
```bash
# Copy example files
cp .env.example .env
cp server/.env.example server/.env

# Edit server/.env with your credentials:
# - GEMINI_API_KEY=your_gemini_api_key
# - DATABASE_URL=postgresql://user:password@localhost:5432/team_sso
# - GOOGLE_CLIENT_ID=your_oauth_client_id
# - GOOGLE_CLIENT_SECRET=your_oauth_client_secret
# - GCS_BUCKET_NAME=your_bucket_name
# - JWT_SECRET=your_random_secret
```

### **3. Setup Database**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE team_sso;"

# Run migrations
cd server
npm run migrate

# Seed companies (optional)
psql -U postgres -d team_sso -f ../sql/seed-companies.sql
```

### **4. Start All Services** ⭐

**Option A: Unified Start Script (Recommended)**
```powershell
# Starts Cloud SQL Proxy + Backend + Frontend automatically
.\scripts\start.ps1

# This will:
# 1. Start Cloud SQL Proxy on port 5432
# 2. Start Backend server on port 3000
# 3. Start Frontend dev server on port 5173
# 4. Open browser to http://localhost:5173
```

**Option B: Manual Start (3 separate terminals)**

**Terminal 1 - Cloud SQL Proxy:**
```powershell
cd Team-SSO
.\cloud-sql-proxy.exe projectsso-473108:us-central1:team-sso-db --port=5432
# Keep this terminal running
```

**Terminal 2 - Backend Server:**
```powershell
cd Team-SSO/server
npm run dev
# Backend will start on http://localhost:3000
```

**Terminal 3 - Frontend Dev Server:**
```powershell
cd Team-SSO
npm run dev
# Frontend will start on http://localhost:5173
```

### **5. Access the Application**
- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### **6. Test the System**
1. Open http://localhost:5173
2. Sign in with Google OAuth
3. Select a company or create new one
4. Upload a pitch deck PDF (with optional checklist)
5. Wait ~30 seconds for AI analysis
6. View SSO Score™ and detailed feedback
7. Download Enhanced PDF Report

---

## � **Troubleshooting**

### **Cloud SQL Proxy Issues**
```powershell
# If proxy fails to start, check credentials:
$env:GOOGLE_APPLICATION_CREDENTIALS = "d:\TeamSSO 2025\Team-SSO\server\service-account-key.json"

# Then start proxy:
.\cloud-sql-proxy.exe projectsso-473108:us-central1:team-sso-db --port=5432
```

### **Port Already in Use**
```powershell
# Check what's using the port:
Get-NetTCPConnection -LocalPort 3000  # Backend
Get-NetTCPConnection -LocalPort 5173  # Frontend
Get-NetTCPConnection -LocalPort 5432  # Database

# Kill process if needed:
Stop-Process -Id <PID> -Force
```

### **Database Connection Failed**
1. Ensure Cloud SQL Proxy is running (check terminal window)
2. Verify `DATABASE_URL` in `server/.env`
3. Check if database exists: `psql -U postgres -l`
4. Run migrations: `cd server && npm run migrate`

### **Gemini API Errors**
1. Check `GEMINI_API_KEY` in `server/.env`
2. Verify API key is active in [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Check rate limits (free tier: 60 requests/minute)

### **Build Errors**
```powershell
# Clear cache and rebuild
cd server
Remove-Item -Recurse -Force node_modules, dist
npm install
npm run build

# Same for frontend
cd ..
Remove-Item -Recurse -Force node_modules, dist
npm install
npm run build
```

---

## �📁 **Project Structure**

```
Team-SSO/
├── 📁 docs/              # All documentation
│   ├── features/        # Feature guides
│   ├── api/             # API documentation
│   └── archive/         # Historical docs
├── 📁 scripts/           # Automation scripts
├── 📁 sql/               # Database scripts
├── 📁 server/            # Backend (Node.js)
├── 📁 src/               # Frontend (React)
└── 📄 README.md
```

---

## 📚 **Documentation**

**Setup & Deployment:**
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Google Cloud Setup](docs/GOOGLE_CLOUD_SETUP.md)
- [Authentication Setup](docs/AUTHENTICATION_SETUP.md)

**Features:**
- [Dual PDF Analysis](docs/features/DUAL_PDF_ANALYSIS.md)
- [Enhanced PDF Reports](docs/features/ENHANCED_PDF.md)
- [Gemini Prompts](docs/features/GEMINI_PROMPTS.md)
- [Deep Analysis](docs/features/DEEP_ANALYSIS.md)

**Testing:**
- [AI Testing Guide](docs/AI_TESTING_GUIDE.md)
- [API Testing](docs/api/POSTMAN_TESTING.md)

---

## 🔧 **Scripts**

```powershell
.\scripts\start.ps1   # Start all services
.\scripts\setup.ps1   # Initial project setup
.\scripts\deploy.ps1  # Deploy to production
.\scripts\test.ps1    # Run tests
```

---

## 🤝 **Contributing**

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test
3. Commit: `git commit -m "feat: Add new feature"`
4. Push: `git push origin feature/my-feature`
5. Create Pull Request

---

## 📊 **Status**

✅ **Live Features:** Dual PDF Analysis, SSO Score™, Enhanced Reports, Vision AI  
🚧 **In Progress:** Industry Verticals, Vertex AI Migration  
📋 **Roadmap:** Grounding, Multi-Agent System, Benchmarks  

---

## 🚀 **Quick Reference - Common Commands**

### **Development**
```powershell
# Start everything (recommended)
.\scripts\start.ps1

# Start backend only
.\scripts\start.ps1 -BackendOnly

# Start frontend only
.\scripts\start.ps1 -FrontendOnly

# Skip Cloud SQL Proxy (if already running)
.\scripts\start.ps1 -SkipProxy
```

### **Database**
```powershell
# Run migrations
cd server
npm run migrate

# Seed data
psql -U postgres -d team_sso -f ../sql/seed-companies.sql

# Connect to database
psql -U postgres -d team_sso
```

### **Build**
```powershell
# Build backend
cd server
npm run build

# Build frontend
npm run build
```

### **Testing**
```powershell
# Run backend tests
cd server
npm test

# Test API health
curl http://localhost:3000/health
```

### **Deployment**
```powershell
# Deploy to Google Cloud Run
.\scripts\deploy.ps1
```

---

**Built with ❤️ by Team SSO** | *Transforming VC deal flow, one deck at a time* 🚀
