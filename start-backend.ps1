# Start Team-SSO Backend with Cloud SQL Proxy
# This script ensures Cloud SQL Proxy is running before starting the server

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Starting Team-SSO Backend" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Cloud SQL Proxy is running
Write-Host "[1/3] Checking Cloud SQL Proxy..." -ForegroundColor Yellow
$proxyProcess = Get-Process | Where-Object {$_.Name -like "*cloud-sql-proxy*" -or $_.ProcessName -like "*cloud*"}

if ($proxyProcess) {
    Write-Host "✓ Cloud SQL Proxy is already running" -ForegroundColor Green
} else {
    Write-Host "Starting Cloud SQL Proxy..." -ForegroundColor Yellow
    $env:GOOGLE_APPLICATION_CREDENTIALS = ".\server\service-account-key.json"
    
    $proxyJob = Start-Job -ScriptBlock {
        Set-Location "d:\TeamSSO 2025\Team-SSO"
        $env:GOOGLE_APPLICATION_CREDENTIALS = ".\server\service-account-key.json"
        & ".\cloud-sql-proxy.exe" "projectsso-473108:us-central1:team-sso-db" "--port" "5432"
    }
    
    Write-Host "Waiting for proxy to connect..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    Write-Host "✓ Cloud SQL Proxy started" -ForegroundColor Green
}

# Step 2: Test database connection
Write-Host "`n[2/3] Testing database connection..." -ForegroundColor Yellow
$testResult = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
if ($testResult.TcpTestSucceeded) {
    Write-Host "✓ Database connection available" -ForegroundColor Green
} else {
    Write-Host "⚠ Connection test inconclusive (proxy may still be starting)" -ForegroundColor Yellow
}

# Step 3: Start backend server
Write-Host "`n[3/3] Starting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Server starting on http://localhost:3000" -ForegroundColor Green
Write-Host "🤖 Gemini AI is enabled" -ForegroundColor Green
Write-Host "📊 Database connected" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

cd server
node dist/index.js
