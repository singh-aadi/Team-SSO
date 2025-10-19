# Start All Services Script for Team-SSO
# Run this script to start Cloud SQL Proxy, Backend, and Frontend

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEAM-SSO - Starting All Services" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Set Google credentials
$env:GOOGLE_APPLICATION_CREDENTIALS = "$PSScriptRoot\server\service-account-key.json"
Write-Host "✅ Google credentials set" -ForegroundColor Green

# Start Cloud SQL Proxy in a new window
Write-Host "`n1️⃣ Starting Cloud SQL Proxy..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$env:GOOGLE_APPLICATION_CREDENTIALS = '$PSScriptRoot\server\service-account-key.json'
Write-Host ''
Write-Host '🔌 CLOUD SQL PROXY' -ForegroundColor Cyan
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Gray
Write-Host 'Instance: projectsso-473108:us-central1:team-sso-db' -ForegroundColor White
Write-Host 'Port: 5432' -ForegroundColor White
Write-Host 'DO NOT CLOSE THIS WINDOW!' -ForegroundColor Red
Write-Host ''
cd '$PSScriptRoot'
.\cloud-sql-proxy.exe projectsso-473108:us-central1:team-sso-db --port=5432
"@
Write-Host "   ✅ Cloud SQL Proxy window opened" -ForegroundColor Green

# Wait for Cloud SQL Proxy to be ready
Write-Host "`n⏳ Waiting 8 seconds for Cloud SQL Proxy..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Start Backend Server in a new window
Write-Host "`n2️⃣ Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Write-Host ''
Write-Host '🔧 BACKEND SERVER' -ForegroundColor Green
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Gray
Write-Host 'API URL: http://localhost:3000' -ForegroundColor Cyan
Write-Host 'Database: Cloud SQL (via proxy on port 5432)' -ForegroundColor White
Write-Host ''
cd '$PSScriptRoot\server'
npm run dev
"@
Write-Host "   ✅ Backend server window opened" -ForegroundColor Green

# Wait for Backend to connect to database
Write-Host "`n⏳ Waiting 8 seconds for Backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Start Frontend Server in a new window
Write-Host "`n3️⃣ Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
Write-Host ''
Write-Host '🎨 FRONTEND SERVER' -ForegroundColor Magenta
Write-Host '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' -ForegroundColor Gray
Write-Host 'Vite Dev Server' -ForegroundColor White
Write-Host ''
cd '$PSScriptRoot'
npm run dev
"@
Write-Host "   ✅ Frontend server window opened" -ForegroundColor Green

# Wait for all services to initialize
Write-Host "`n⏳ Waiting 10 seconds for all services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test all services
Write-Host "`n`n🧪 TESTING ALL SERVICES" -ForegroundColor Cyan -BackgroundColor DarkBlue
Write-Host "======================================`n" -ForegroundColor Gray

Write-Host "1️⃣ Cloud SQL Proxy:" -ForegroundColor Yellow
$proxy = Get-Process -Name "cloud-sql-proxy" -ErrorAction SilentlyContinue
if ($proxy) {
    Write-Host "   ✅ RUNNING (PID: $($proxy.Id))" -ForegroundColor Green
} else {
    Write-Host "   ❌ NOT RUNNING" -ForegroundColor Red
}

Write-Host "`n2️⃣ Backend Health:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 5
    Write-Host "   ✅ $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Not responding" -ForegroundColor Red
}

Write-Host "`n3️⃣ Backend + Database (Companies API):" -ForegroundColor Yellow
try {
    $companies = Invoke-RestMethod -Uri "http://localhost:3000/api/companies?limit=5" -TimeoutSec 15
    Write-Host "   ✅✅✅ DATABASE CONNECTED! ✅✅✅" -ForegroundColor Green
    Write-Host "`n   📊 Total Companies: $($companies.total)" -ForegroundColor Cyan
    Write-Host "   📝 Retrieved: $($companies.companies.Count) companies`n" -ForegroundColor White
    $companies.companies | ForEach-Object {
        Write-Host "      • $($_.name)" -ForegroundColor Cyan -NoNewline
        Write-Host " - $($_.industry) ($($_.stage))" -ForegroundColor White
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4️⃣ Frontend:" -ForegroundColor Yellow
try {
    $fe = Invoke-WebRequest -Uri "http://localhost:3002" -TimeoutSec 3 -UseBasicParsing
    Write-Host "   ✅ Running at http://localhost:3002" -ForegroundColor Green
} catch {
    try {
        $fe = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 3 -UseBasicParsing
        Write-Host "   ✅ Running at http://localhost:5173" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Not running" -ForegroundColor Red
    }
}

Write-Host "`n======================================" -ForegroundColor Gray
Write-Host "`n✨ ALL SERVICES READY! ✨`n" -ForegroundColor Green
Write-Host "📱 Frontend: " -ForegroundColor White -NoNewline
Write-Host "http://localhost:3002" -ForegroundColor Cyan
Write-Host "🔧 Backend:  " -ForegroundColor White -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "`n💡 Press any key to close this window (services will keep running in other windows)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
