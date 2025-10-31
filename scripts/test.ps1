# Quick Test Script for Team-SSO Backend
Write-Host "🚀 Testing Team-SSO Backend Locally" -ForegroundColor Cyan
Write-Host ""

# Check Cloud SQL Proxy
Write-Host "[1/3] Checking Cloud SQL Proxy..." -ForegroundColor Yellow
$proxy = Get-Process -Name "cloud-sql-proxy" -ErrorAction SilentlyContinue
if ($proxy) {
    Write-Host "✓ Cloud SQL Proxy running (PID: $($proxy.Id))" -ForegroundColor Green
} else {
    Write-Host "✗ Cloud SQL Proxy NOT running!" -ForegroundColor Red
    Write-Host "Starting Cloud SQL Proxy..." -ForegroundColor Yellow
    $env:GOOGLE_APPLICATION_CREDENTIALS = ".\server\service-account-key.json"
    Start-Process -FilePath ".\cloud-sql-proxy.exe" -ArgumentList "projectsso-473108:us-central1:team-sso-db", "--port", "5432" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# Check port 3000
Write-Host "`n[2/3] Checking backend port 3000..." -ForegroundColor Yellow
$port3000 = netstat -ano | Select-String ":3000.*LISTENING"
if ($port3000) {
    Write-Host "✓ Port 3000 is in use" -ForegroundColor Green
} else {
    Write-Host "✗ Port 3000 is NOT listening" -ForegroundColor Red
    Write-Host "Backend server needs to be started" -ForegroundColor Yellow
}

# Test backend
Write-Host "`n[3/3] Testing backend endpoints..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET -ErrorAction Stop
    Write-Host "✓ Health endpoint working!" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor Gray
    
    $companies = Invoke-RestMethod -Uri "http://localhost:3000/api/companies" -Method GET -ErrorAction Stop
    Write-Host "✓ Companies endpoint working!" -ForegroundColor Green
    Write-Host "  Total companies: $($companies.total)" -ForegroundColor Gray
    
    Write-Host "`n✅ Backend is working perfectly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to commit and push!" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Backend not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "`n⚠️  Need to start backend server first!" -ForegroundColor Yellow
    Write-Host "Run: cd server; npm run dev" -ForegroundColor White
}
