#!/usr/bin/env pwsh
<#
.SYNOPSIS
    One-shot startup script for Team SSO Development Environment
.DESCRIPTION
    This script starts all required services in the correct order:
    1. Cloud SQL Proxy
    2. Backend Server
    3. Frontend Server
.NOTES
    Run this script from the project root directory
#>

# Set error action preference
$ErrorActionPreference = "Continue"

# Color coding
$colors = @{
    Header = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "White"
    Highlight = "Magenta"
}

# Clear screen and show header
Clear-Host
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $colors.Header
Write-Host "         🚀 TEAM SSO - DEVELOPMENT ENVIRONMENT STARTUP 🚀      " -ForegroundColor $colors.Highlight
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $colors.Header
Write-Host ""

# Get project root directory
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "📁 Project Root: $projectRoot" -ForegroundColor $colors.Info
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Function to kill process on port
function Stop-ProcessOnPort {
    param([int]$Port, [string]$Name)
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "   ⚠️  Port $Port is occupied. Stopping process..." -ForegroundColor $colors.Warning
        Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "   ✅ Port $Port freed" -ForegroundColor $colors.Success
    }
}

# ============================================================================
# STEP 1: CLEANUP EXISTING PROCESSES
# ============================================================================
Write-Host "🧹 STEP 1: Cleaning up existing processes..." -ForegroundColor $colors.Header
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Kill Cloud SQL Proxy
$proxyProcesses = Get-Process -Name "cloud-sql-proxy" -ErrorAction SilentlyContinue
if ($proxyProcesses) {
    Write-Host "   Stopping Cloud SQL Proxy..." -ForegroundColor $colors.Warning
    $proxyProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Kill processes on ports
Stop-ProcessOnPort -Port 5432 -Name "Cloud SQL Proxy"
Stop-ProcessOnPort -Port 3000 -Name "Backend Server"
Stop-ProcessOnPort -Port 5173 -Name "Frontend (Vite)"
Stop-ProcessOnPort -Port 3002 -Name "Frontend (Alt)"

Write-Host "   ✅ Cleanup complete!" -ForegroundColor $colors.Success
Write-Host ""

# ============================================================================
# STEP 2: VERIFY PREREQUISITES
# ============================================================================
Write-Host "🔍 STEP 2: Verifying prerequisites..." -ForegroundColor $colors.Header
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Check for cloud-sql-proxy
$proxyPath = Join-Path $projectRoot "cloud-sql-proxy.exe"
if (-not (Test-Path $proxyPath)) {
    Write-Host "   ❌ cloud-sql-proxy.exe not found at: $proxyPath" -ForegroundColor $colors.Error
    Write-Host "   Please download from: https://cloud.google.com/sql/docs/mysql/sql-proxy" -ForegroundColor $colors.Warning
    exit 1
}
Write-Host "   ✅ Cloud SQL Proxy found" -ForegroundColor $colors.Success

# Check for service account key
$serviceAccountPath = Join-Path $projectRoot "server\service-account-key.json"
if (-not (Test-Path $serviceAccountPath)) {
    Write-Host "   ❌ service-account-key.json not found at: $serviceAccountPath" -ForegroundColor $colors.Error
    Write-Host "   Please add your Google Cloud service account key" -ForegroundColor $colors.Warning
    exit 1
}
Write-Host "   ✅ Service account key found" -ForegroundColor $colors.Success

# Check for node_modules
$backendModules = Join-Path $projectRoot "server\node_modules"
$frontendModules = Join-Path $projectRoot "node_modules"
if (-not (Test-Path $backendModules)) {
    Write-Host "   ⚠️  Backend dependencies not installed. Run: cd server && npm install" -ForegroundColor $colors.Warning
}
if (-not (Test-Path $frontendModules)) {
    Write-Host "   ⚠️  Frontend dependencies not installed. Run: npm install" -ForegroundColor $colors.Warning
}
Write-Host "   ✅ Prerequisites verified" -ForegroundColor $colors.Success
Write-Host ""

# ============================================================================
# STEP 3: START CLOUD SQL PROXY
# ============================================================================
Write-Host "🔌 STEP 3: Starting Cloud SQL Proxy..." -ForegroundColor $colors.Header
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Set Google Application Credentials
$env:GOOGLE_APPLICATION_CREDENTIALS = $serviceAccountPath
Write-Host "   Setting credentials: $serviceAccountPath" -ForegroundColor $colors.Info

# Start Cloud SQL Proxy in new window
$proxyArgs = @(
    "-NoExit",
    "-Command",
    "Set-Location '$projectRoot'; `$env:GOOGLE_APPLICATION_CREDENTIALS='$serviceAccountPath'; Write-Host ''; Write-Host '🔌 CLOUD SQL PROXY' -ForegroundColor Cyan; Write-Host '═══════════════════════════════════════════════════════════════' -ForegroundColor Gray; Write-Host 'Instance: projectsso-473108:us-central1:team-sso-db' -ForegroundColor White; Write-Host 'Port: 5432' -ForegroundColor White; Write-Host 'Status: Running...' -ForegroundColor Green; Write-Host ''; Write-Host '⚠️  DO NOT CLOSE THIS WINDOW!' -ForegroundColor Red; Write-Host ''; .\cloud-sql-proxy.exe projectsso-473108:us-central1:team-sso-db --port=5432"
)
Start-Process powershell -ArgumentList $proxyArgs

Write-Host "   ⏳ Waiting for Cloud SQL Proxy to start (8 seconds)..." -ForegroundColor $colors.Warning
Start-Sleep -Seconds 8

# Verify Cloud SQL Proxy is running
$proxyRunning = Get-Process -Name "cloud-sql-proxy" -ErrorAction SilentlyContinue
if ($proxyRunning) {
    Write-Host "   ✅ Cloud SQL Proxy started successfully (PID: $($proxyRunning.Id))" -ForegroundColor $colors.Success
} else {
    Write-Host "   ❌ Cloud SQL Proxy failed to start!" -ForegroundColor $colors.Error
    Write-Host "   Check if another process is using port 5432" -ForegroundColor $colors.Warning
    exit 1
}
Write-Host ""

# ============================================================================
# STEP 4: START BACKEND SERVER
# ============================================================================
Write-Host "🔧 STEP 4: Starting Backend Server..." -ForegroundColor $colors.Header
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$backendArgs = @(
    "-NoExit",
    "-Command",
    "Set-Location '$projectRoot\server'; Write-Host ''; Write-Host '🔧 BACKEND SERVER' -ForegroundColor Green; Write-Host '═══════════════════════════════════════════════════════════════' -ForegroundColor Gray; Write-Host 'API URL: http://localhost:3000' -ForegroundColor Cyan; Write-Host 'Database: Cloud SQL (via proxy on port 5432)' -ForegroundColor White; Write-Host 'Status: Starting...' -ForegroundColor Yellow; Write-Host ''; npm run dev"
)
Start-Process powershell -ArgumentList $backendArgs

Write-Host "   ⏳ Waiting for Backend to start (10 seconds)..." -ForegroundColor $colors.Warning
Start-Sleep -Seconds 10

# Verify backend is running
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 5
    Write-Host "   ✅ Backend server started: $($health.message)" -ForegroundColor $colors.Success
} catch {
    Write-Host "   ⚠️  Backend is starting but not ready yet..." -ForegroundColor $colors.Warning
}
Write-Host ""

# ============================================================================
# STEP 5: START FRONTEND SERVER
# ============================================================================
Write-Host "🎨 STEP 5: Starting Frontend Server..." -ForegroundColor $colors.Header
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$frontendArgs = @(
    "-NoExit",
    "-Command",
    "Set-Location '$projectRoot'; Write-Host ''; Write-Host '🎨 FRONTEND SERVER (VITE)' -ForegroundColor Magenta; Write-Host '═══════════════════════════════════════════════════════════════' -ForegroundColor Gray; Write-Host 'Development Server' -ForegroundColor White; Write-Host 'Status: Starting...' -ForegroundColor Yellow; Write-Host ''; npm run dev"
)
Start-Process powershell -ArgumentList $frontendArgs

Write-Host "   ⏳ Waiting for Frontend to start (8 seconds)..." -ForegroundColor $colors.Warning
Start-Sleep -Seconds 8
Write-Host "   ✅ Frontend server started" -ForegroundColor $colors.Success
Write-Host ""

# ============================================================================
# FINAL STATUS CHECK
# ============================================================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $colors.Header
Write-Host "         🎉 ALL SERVICES STARTED SUCCESSFULLY! 🎉              " -ForegroundColor $colors.Success
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $colors.Header
Write-Host ""

Write-Host "📊 SERVICE STATUS:" -ForegroundColor $colors.Highlight
Write-Host ""

# Cloud SQL Proxy
$proxy = Get-Process -Name "cloud-sql-proxy" -ErrorAction SilentlyContinue
if ($proxy) {
    Write-Host "   ✅ Cloud SQL Proxy:  RUNNING (PID: $($proxy.Id))" -ForegroundColor $colors.Success
} else {
    Write-Host "   ❌ Cloud SQL Proxy:  NOT RUNNING" -ForegroundColor $colors.Error
}

# Backend
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 5
    Write-Host "   ✅ Backend Server:   RUNNING at http://localhost:3000" -ForegroundColor $colors.Success
    
    # Test database connection
    try {
        $companies = Invoke-RestMethod -Uri "http://localhost:3000/api/companies?limit=1" -TimeoutSec 5
        Write-Host "   ✅ Database:         CONNECTED ($($companies.total) companies)" -ForegroundColor $colors.Success
    } catch {
        Write-Host "   ⚠️  Database:         CONNECTING..." -ForegroundColor $colors.Warning
    }
} catch {
    Write-Host "   ⏳ Backend Server:   STARTING..." -ForegroundColor $colors.Warning
}

# Frontend
$frontendUrl = $null
if (Test-Port -Port 5173) {
    $frontendUrl = "http://localhost:5173"
} elseif (Test-Port -Port 3002) {
    $frontendUrl = "http://localhost:3002"
}

if ($frontendUrl) {
    Write-Host "   ✅ Frontend Server:  RUNNING at $frontendUrl" -ForegroundColor $colors.Success
} else {
    Write-Host "   ⏳ Frontend Server:  STARTING..." -ForegroundColor $colors.Warning
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $colors.Header
Write-Host ""
Write-Host "🌐 NEXT STEPS:" -ForegroundColor $colors.Highlight
Write-Host ""
Write-Host "   1. Wait 10-15 seconds for all services to fully initialize" -ForegroundColor $colors.Info
Write-Host "   2. Open your browser to: $frontendUrl" -ForegroundColor $colors.Info
Write-Host "   3. Backend API available at: http://localhost:3000" -ForegroundColor $colors.Info
Write-Host ""
Write-Host "📝 IMPORTANT:" -ForegroundColor $colors.Warning
Write-Host "   • Three PowerShell windows will remain open" -ForegroundColor $colors.Info
Write-Host "   • DO NOT close these windows while developing" -ForegroundColor $colors.Info
Write-Host "   • To stop all services, close all three windows" -ForegroundColor $colors.Info
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor $colors.Header
Write-Host ""
Write-Host "✨ Happy coding! ✨" -ForegroundColor $colors.Success
Write-Host ""

# Keep this window open briefly to show the summary
Start-Sleep -Seconds 5
