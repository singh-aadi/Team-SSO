# 🚀 Team SSO - Unified Start Script
# This script starts all required services: Cloud SQL Proxy, Backend, Frontend

param(
    [switch]$SkipProxy,    # Skip Cloud SQL Proxy (if already running)
    [switch]$BackendOnly,  # Start backend only
    [switch]$FrontendOnly  # Start frontend only
)

$ErrorActionPreference = "Stop"

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    🚀 TEAM SSO - SERVICE STARTUP" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Must run from project root (Team-SSO/)" -ForegroundColor Red
    exit 1
}

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $connection)
}

# ═══════════════════════════════════════════════════
# STEP 1: Cloud SQL Proxy
# ═══════════════════════════════════════════════════
if (-not $SkipProxy -and -not $FrontendOnly) {
    Write-Host "📡 STEP 1: Cloud SQL Proxy" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
    
    # Check if already running
    if (Test-Port -Port 5432) {
        Write-Host "✓ Cloud SQL Proxy already running on port 5432" -ForegroundColor Green
    } else {
        # Find proxy executable
        if (Test-Path "cloud-sql-proxy.exe") {
            $proxyExe = "cloud-sql-proxy.exe"
        } elseif (Test-Path "cloud_sql_proxy.exe") {
            $proxyExe = "cloud_sql_proxy.exe"
        } else {
            Write-Host "❌ Cloud SQL Proxy not found!" -ForegroundColor Red
            Write-Host "   Download from: https://cloud.google.com/sql/docs/mysql/sql-proxy" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "  Starting Cloud SQL Proxy..." -ForegroundColor White
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host ''; Write-Host '  ⚠️  CLOUD SQL PROXY - DO NOT CLOSE THIS WINDOW!' -ForegroundColor Red -BackgroundColor Yellow; Write-Host ''; cd '$PWD'; .\$proxyExe projectsso-473108:us-central1:team-sso-db --port=5432"
        
        Start-Sleep -Seconds 5
        
        if (Test-Port -Port 5432) {
            Write-Host "✓ Cloud SQL Proxy started successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start Cloud SQL Proxy" -ForegroundColor Red
            exit 1
        }
    }
    Write-Host ""
}

# ═══════════════════════════════════════════════════
# STEP 2: Backend Server
# ═══════════════════════════════════════════════════
if (-not $FrontendOnly) {
    Write-Host "🔧 STEP 2: Backend Server" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
    
    # Check if already running
    if (Test-Port -Port 3000) {
        Write-Host "⚠️  Backend already running on port 3000" -ForegroundColor Yellow
        $restart = Read-Host "  Restart? (y/n)"
        if ($restart -eq 'y') {
            # Find and kill process on port 3000
            $process = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
            if ($process) {
                Stop-Process -Id $process -Force
                Start-Sleep -Seconds 2
            }
        } else {
            Write-Host "✓ Using existing backend server" -ForegroundColor Green
        }
    }
    
    if (-not (Test-Port -Port 3000)) {
        Write-Host "  Building backend..." -ForegroundColor White
        cd server
        npm run build | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Backend build failed!" -ForegroundColor Red
            cd ..
            exit 1
        }
        
        Write-Host "  Starting backend server..." -ForegroundColor White
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host ''; Write-Host '  🔧 BACKEND SERVER - PORT 3000' -ForegroundColor Green; Write-Host ''; cd '$PWD\server'; npm run dev"
        
        cd ..
        Start-Sleep -Seconds 8
        
        if (Test-Port -Port 3000) {
            Write-Host "✓ Backend server started on http://localhost:3000" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start backend server" -ForegroundColor Red
            exit 1
        }
    }
    Write-Host ""
}

# ═══════════════════════════════════════════════════
# STEP 3: Frontend Dev Server
# ═══════════════════════════════════════════════════
if (-not $BackendOnly) {
    Write-Host "⚛️  STEP 3: Frontend Dev Server" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
    
    # Check if already running
    if (Test-Port -Port 5173) {
        Write-Host "⚠️  Frontend already running on port 5173" -ForegroundColor Yellow
        $restart = Read-Host "  Restart? (y/n)"
        if ($restart -eq 'y') {
            # Find and kill process on port 5173
            $process = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
            if ($process) {
                Stop-Process -Id $process -Force
                Start-Sleep -Seconds 2
            }
        } else {
            Write-Host "✓ Using existing frontend server" -ForegroundColor Green
        }
    }
    
    if (-not (Test-Port -Port 5173)) {
        Write-Host "  Starting frontend dev server..." -ForegroundColor White
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host ''; Write-Host '  ⚛️  FRONTEND DEV SERVER - PORT 5173' -ForegroundColor Cyan; Write-Host ''; cd '$PWD'; npm run dev"
        
        Start-Sleep -Seconds 10
        
        if (Test-Port -Port 5173) {
            Write-Host "✓ Frontend started on http://localhost:5173" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to start frontend server" -ForegroundColor Red
            exit 1
        }
    }
    Write-Host ""
}

# ═══════════════════════════════════════════════════
# SUCCESS SUMMARY
# ═══════════════════════════════════════════════════
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "    ✅ ALL SYSTEMS RUNNING!" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

if (-not $FrontendOnly) {
    Write-Host "  📡 Database:  Connected (Cloud SQL Proxy)" -ForegroundColor White
    Write-Host "  🔧 Backend:   http://localhost:3000" -ForegroundColor White
}
if (-not $BackendOnly) {
    Write-Host "  ⚛️  Frontend:  http://localhost:5173" -ForegroundColor White
}

Write-Host ""
Write-Host "  📊 Ready to analyze pitch decks!" -ForegroundColor Green
Write-Host ""

# Open browser
if (-not $BackendOnly) {
    Write-Host "  🌐 Opening browser..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:5173"
}

Write-Host ""
Write-Host "  Press Ctrl+C to stop all services (in each terminal)" -ForegroundColor DarkGray
Write-Host ""
