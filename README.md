# 🚀 Team-SSO# 🚀 Team-SSO



> AI-Powered Pitch Deck Analysis Platform for Venture Capitalists> **AI-Powered Pitch Deck Analysis Platform for Venture Capitalists**



---[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)

## 🎯 What is This?[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)

Team-SSO analyzes startup pitch decks in **30 seconds** using Google Gemini AI. Upload a PDF, get comprehensive analysis with an SSO Score (0-100), and download investor-grade reports.[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)



**Full Feature List**: See [FEATURES.md](./FEATURES.md)---



---## 📖 Table of Contents



## ⚡ Quick Start- [Overview](#-overview)

- [Features](#-features)

### Prerequisites- [Tech Stack](#-tech-stack)

- Node.js 18+- [Prerequisites](#-prerequisites)

- PostgreSQL (Cloud SQL or local)- [Environment Setup](#-environment-setup)

- Google Cloud Project with Gemini API enabled- [Installation](#-installation)

- [Running Locally](#-running-locally)

### Setup (First Time Only)- [Deployment](#-deployment)

- [Project Structure](#-project-structure)

1. **Clone & Install**- [Documentation](#-documentation)

```bash- [API Reference](#-api-reference)

git clone https://github.com/singh-aadi/Team-SSO.git- [Contributing](#-contributing)

cd Team-SSO

npm install---

cd server && npm install && cd ..

```## 🎯 Overview



2. **Configure Environment****Team-SSO** is an AI-powered platform that helps venture capitalists analyze startup pitch decks in **30 seconds** instead of 2-4 hours. Using Google Gemini AI with grounding capabilities, it provides comprehensive investment analysis with data-backed insights.

```bash

# Copy environment templates### Core Value Proposition

cp .env.example .env

cp server/.env.example server/.env| Traditional VC Analysis | Team-SSO Analysis |

|------------------------|-------------------|

# Edit both .env files with your credentials| ⏰ **2-4 hours** per deck | ⚡ **30 seconds** |

# See .env.example for all required variables| 👤 Manual review | 🤖 AI + Human oversight |

```| 📊 Subjective scoring | 📈 Data-driven SSO Score (0-100) |

| 📄 Text-only | 🎨 Multimodal (PDF, Audio, PowerPoint) |

3. **Setup Database**| ❌ No benchmarking | ✅ Industry + Stage benchmarks |

```bash

cd server---

node migrate.js

```## ✨ Features



### 🚀 Start Everything (PowerShell)### Core Analysis

- **📊 SSO Score** - Comprehensive 0-100 score across 6 dimensions

**Option A: Automated Start (Recommended)**- **📑 Enhanced PDF Reports** - Investor-grade 10-15 page reports

```powershell- **🎨 Multimodal Analysis** - PDF, Audio (.mp3), PowerPoint (.pptx)

.\scripts\start.ps1- **📋 Dual PDF Comparison** - Track deck evolution across versions

```

This automatically starts:### Advanced Capabilities

- ✅ Cloud SQL Proxy (port 5432)- **🔍 Grounding & Web Search** - Real-time fact-checking with source attribution

- ✅ Backend Server (port 3000)- **📝 VC Context Integration** - Upload notes, emails, due diligence docs

- ✅ Frontend Dev Server (port 5173)- **📊 Industry Benchmarking** - Compare against 100+ companies

- ✅ Opens browser to http://localhost:5173- **🎯 Risk Analysis** - Probability-weighted risk assessment

- **🚀 Real-time Progress** - Compact progress indicator

**Option B: Manual Start (3 Terminals)**

**Full feature list**: See [FEATURES.md](./FEATURES.md)

**Terminal 1 - Cloud SQL Proxy:**

```powershell---

.\cloud-sql-proxy.exe YOUR_PROJECT:REGION:INSTANCE --port=5432

```## 🛠️ Tech Stack



**Terminal 2 - Backend:****Frontend**

```powershell- React 18 + TypeScript

cd server- Vite (build tool)

npm run dev- TailwindCSS

```- React Router



**Terminal 3 - Frontend:****Backend**

```powershell- Node.js + Express

npm run dev- TypeScript

```- PostgreSQL

- Google Gemini AI

### 🌐 Access- PDFKit (report generation)



- **Frontend**: http://localhost:5173**Infrastructure**

- **Backend**: http://localhost:3000- Google Cloud Run

- **Health Check**: http://localhost:3000/health- Google Cloud SQL

- Google Secret Manager

---- Vercel (frontend)



## 📚 Documentation---



- **[FEATURES.md](./FEATURES.md)** - Complete feature list## � Prerequisites

- **[docs/setup/GOOGLE_CLOUD_SETUP.md](./docs/setup/GOOGLE_CLOUD_SETUP.md)** - GCP setup guide

- **[docs/setup/AUTHENTICATION_SETUP.md](./docs/setup/AUTHENTICATION_SETUP.md)** - OAuth setupBefore you begin, ensure you have:

- **[docs/setup/DEPLOYMENT.md](./docs/setup/DEPLOYMENT.md)** - Deployment guide

- **[docs/api/POSTMAN_TESTING.md](./docs/api/POSTMAN_TESTING.md)** - API testing- **Node.js** 18+ and npm

- **PostgreSQL** 14+ (local or Cloud SQL)

---- **Google Cloud Account** with billing enabled

- **Google Cloud Project** created

## 🛠️ Tech Stack- **Git** for version control



**Frontend**: React 18 + TypeScript + Vite + TailwindCSS  ### Required Google Cloud APIs

**Backend**: Node.js + Express + TypeScript + PostgreSQL  

**AI**: Google Gemini 1.5 Flash/Pro  Enable these APIs in your Google Cloud project:

**Cloud**: Google Cloud Run + Cloud SQL + Secret Manager- Cloud SQL Admin API

- Secret Manager API

---- Vertex AI API (optional, for grounding)

- Generative Language API (Gemini)

## 📞 Support

---

- **Issues**: [GitHub Issues](https://github.com/singh-aadi/Team-SSO/issues)

- **Docs**: See [docs/](./docs/) folder## 🔐 Environment Setup



---### 1. Google Cloud Setup



**Built with ❤️ using Google Gemini AI****Create a Google Cloud Project**:

```bash
# Install gcloud CLI if not already installed
# https://cloud.google.com/sdk/docs/install

# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

**Enable required APIs**:
```bash
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable generativelanguage.googleapis.com
```

**Create Service Account**:
```bash
gcloud iam service-accounts create team-sso-sa \
  --display-name="Team-SSO Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:team-sso-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:team-sso-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Download service account key
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=team-sso-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

**Move service account key to server folder**:
```bash
mv service-account-key.json server/
```

**Setup instructions**: See [docs/setup/GOOGLE_CLOUD_SETUP.md](./docs/setup/GOOGLE_CLOUD_SETUP.md)

### 2. Cloud SQL Setup

**Create PostgreSQL instance**:
```bash
gcloud sql instances create team-sso-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1
```

**Create database**:
```bash
gcloud sql databases create startup_scout \
  --instance=team-sso-db
```

**Set root password**:
```bash
gcloud sql users set-password postgres \
  --instance=team-sso-db \
  --password=YOUR_SECURE_PASSWORD
```

**Store password in Secret Manager**:
```bash
echo -n "YOUR_SECURE_PASSWORD" | gcloud secrets create db-password --data-file=-
```

### 3. Gemini API Setup

**Get your Gemini API key**:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create API key
3. Copy the key

**Store in Secret Manager**:
```bash
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
```

### 4. OAuth 2.0 Setup

**Create OAuth credentials**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Set Application Type: **Web application**
5. Add Authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - Your production frontend URL
6. Add Authorized redirect URIs:
   - `http://localhost:5173` (development)
   - Your production frontend URL
7. Copy the **Client ID**

**Setup instructions**: See [docs/setup/AUTHENTICATION_SETUP.md](./docs/setup/AUTHENTICATION_SETUP.md)

### 5. Environment Variables

**Copy .env.example to .env**:
```bash
# Root folder (frontend)
cp .env.example .env

# Server folder (backend)
cp server/.env.example server/.env
```

**Edit .env files** with your values:
- See [.env.example](./.env.example) for detailed variable descriptions
- All required credentials are documented with setup instructions

---

## 📦 Installation

### 1. Clone Repository
```bash
git clone https://github.com/singh-aadi/Team-SSO.git
cd Team-SSO

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
