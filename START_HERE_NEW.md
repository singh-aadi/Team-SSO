# 🚀 Team SSO - One-Command Startup Guide

## The Easiest Way to Start Development

**TL;DR:** Just double-click `START.bat` and everything starts automatically! 🎉

---

## Quick Start (30 seconds)

### 🪟 Windows

**Method 1: Double-Click (Easiest)**
```
Double-click: START.bat
```

**Method 2: PowerShell**
```powershell
.\start-dev.ps1
```

**Method 3: Command Prompt**
```cmd
START.bat
```

### 🐧 Linux/Mac
```bash
pwsh ./start-dev.ps1
```

---

## What This Does

The startup script automatically:

1. ✅ Kills any old processes on ports 3000, 5432, 5173
2. ✅ Verifies all required files exist
3. ✅ Starts **Cloud SQL Proxy** on port 5432
4. ✅ Starts **Backend Server** on port 3000
5. ✅ Starts **Frontend Server** on port 5173/3002
6. ✅ Tests all connections
7. ✅ Shows you a status summary

**Total time: ~30 seconds** ⚡

---

## What You'll See

### Three PowerShell Windows Will Open:

**Window 1: 🔌 Cloud SQL Proxy**
```
🔌 CLOUD SQL PROXY
═══════════════════════════════════════
Instance: projectsso-473108:us-central1:team-sso-db
Port: 5432
Status: Running...

⚠️  DO NOT CLOSE THIS WINDOW!
```

**Window 2: 🔧 Backend Server**
```
🔧 BACKEND SERVER
═══════════════════════════════════════
API URL: http://localhost:3000
Database: Cloud SQL (via proxy on port 5432)
Status: Running...
```

**Window 3: 🎨 Frontend Server**
```
🎨 FRONTEND SERVER (VITE)
═══════════════════════════════════════
Development Server
Status: Running...

  ➜  Local:   http://localhost:5173/
```

### Status Summary Window:
```
═══════════════════════════════════════
     🎉 ALL SERVICES STARTED! 🎉
═══════════════════════════════════════

📊 SERVICE STATUS:

   ✅ Cloud SQL Proxy:  RUNNING (PID: 12345)
   ✅ Backend Server:   RUNNING at http://localhost:3000
   ✅ Database:         CONNECTED (5 companies)
   ✅ Frontend Server:  RUNNING at http://localhost:5173

🌐 NEXT STEPS:
   1. Open: http://localhost:5173
   2. Backend API: http://localhost:3000
```

---

## Prerequisites (One-Time Setup)

Before using the startup script, you need:

### 1. Install Dependencies
```powershell
# In project root
npm install

# In server folder
cd server
npm install
```

### 2. Get Cloud SQL Proxy
- Download: https://cloud.google.com/sql/docs/mysql/sql-proxy
- Place `cloud-sql-proxy.exe` in project root folder
- Same folder as `START.bat`

### 3. Get Service Account Key
- Ask team lead for `service-account-key.json`
- Place in `server/` directory
- **DO NOT commit to git!** (Already in .gitignore)

---

## 🌐 Accessing Your App

Once all services are running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Main application UI |
| **Backend API** | http://localhost:3000 | API endpoints |
| **Health Check** | http://localhost:3000/health | Server status |
| **Companies API** | http://localhost:3000/api/companies | Test database |

---

## ⚠️ Important Rules

### DO NOT Close the PowerShell Windows!
- Each window runs a critical service
- Closing any window stops that service
- **Keep all 3 windows open** while developing

### Stopping All Services
**Method 1:** Close all 3 PowerShell windows

**Method 2:** Press `Ctrl+C` in each window

**Method 3:** Kill processes manually:
```powershell
Get-Process -Name "cloud-sql-proxy" | Stop-Process -Force
Get-Process -Name "node" | Stop-Process -Force
```

### Restarting
1. Close all 3 PowerShell windows
2. Double-click `START.bat` again

---

## 🐛 Troubleshooting

### Script Won't Run
**Error:** "Execution of scripts is disabled"

**Fix:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use
**Error:** "Port 3000/5432/5173 is already in use"

**Fix:** The script automatically handles this! Just run it again.

Manual fix:
```powershell
Get-NetTCPConnection -LocalPort 3000 | Stop-Process -Force
Get-NetTCPConnection -LocalPort 5432 | Stop-Process -Force
Get-NetTCPConnection -LocalPort 5173 | Stop-Process -Force
```

### Cloud SQL Proxy Not Found
**Error:** "cloud-sql-proxy.exe not found"

**Fix:**
1. Download from https://cloud.google.com/sql/docs/mysql/sql-proxy
2. Rename to `cloud-sql-proxy.exe`
3. Move to project root (same folder as START.bat)

### Service Account Key Missing
**Error:** "service-account-key.json not found"

**Fix:**
1. Ask team lead for the file
2. Place in `server/` directory
3. Name exactly: `service-account-key.json`

### Backend Can't Connect to Database
**Symptoms:**
- Health check works: http://localhost:3000/health
- Companies API fails: http://localhost:3000/api/companies

**Fix:**
1. Check Cloud SQL Proxy window for errors
2. Verify service account key is valid
3. Ensure you have internet connection
4. Restart all services

### Frontend Shows Blank Page
**Fix:**
1. Check Frontend window for errors
2. Try different port: http://localhost:3002
3. Clear browser cache
4. Restart frontend only (close window 3, run script again)

---

## 📋 Manual Startup (Alternative)

If the automated script doesn't work, start services manually:

### Terminal 1: Cloud SQL Proxy
```powershell
cd "D:\TeamSSO 2025\Team-SSO"
$env:GOOGLE_APPLICATION_CREDENTIALS=".\server\service-account-key.json"
.\cloud-sql-proxy.exe projectsso-473108:us-central1:team-sso-db --port=5432
```

### Terminal 2: Backend
```powershell
cd "D:\TeamSSO 2025\Team-SSO\server"
npm run dev
```

### Terminal 3: Frontend
```powershell
cd "D:\TeamSSO 2025\Team-SSO"
npm run dev
```

---

## 🎯 Quick Commands Reference

```powershell
# Start everything
.\start-dev.ps1

# Check if services are running
Get-Process -Name "cloud-sql-proxy"
curl http://localhost:3000/health
curl http://localhost:5173

# Stop everything
Get-Process -Name "cloud-sql-proxy" | Stop-Process -Force
Get-Process -Name "node" | Stop-Process -Force

# Restart everything
# Close all windows, then run start-dev.ps1 again
```

---

## 👥 New Team Member Onboarding

### Day 1 Setup Checklist

1. **Install Node.js**
   - Download: https://nodejs.org/
   - Version: v18 or higher
   - Verify: `node --version`

2. **Clone Repository**
   ```bash
   git clone https://github.com/singh-aadi/Team-SSO.git
   cd Team-SSO
   ```

3. **Install Dependencies**
   ```powershell
   npm install           # Frontend
   cd server
   npm install           # Backend
   cd ..
   ```

4. **Get Credentials** (Ask Team Lead)
   - `cloud-sql-proxy.exe` → Place in project root
   - `service-account-key.json` → Place in `server/` folder

5. **Start Everything**
   ```
   Double-click: START.bat
   ```

6. **Open Browser**
   - Go to: http://localhost:5173
   - You should see the login page

**Total setup time: ~15 minutes** ⚡

---

## 🚀 Production Deployment

For deploying to Google Cloud Run, see: [`DEPLOYMENT_SUCCESS.md`](DEPLOYMENT_SUCCESS.md)

---

## 📞 Get Help

- **Startup Issues**: Check this guide first
- **Backend Issues**: See `server/README.md`
- **Frontend Issues**: See `README.md`
- **Deployment**: See `DEPLOYMENT_SUCCESS.md`
- **Team Lead**: For credentials and access

---

## ✨ Tips & Tricks

### Speed Up Startup
- Keep the 3 windows open between coding sessions
- Only restart when you change backend configuration

### Debugging
- Check each window for error messages
- Backend logs show database queries
- Frontend has hot reload (auto-refresh on save)

### Development Workflow
1. Start with `START.bat`
2. Code in your editor
3. Frontend auto-refreshes on save
4. Backend restarts automatically (nodemon)
5. Close windows when done for the day

---

## 🎉 You're All Set!

Just run `START.bat` and start coding! The script handles everything else.

**Happy coding!** 🚀
