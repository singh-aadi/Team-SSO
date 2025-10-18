# Team SSO - Start All Services
Write-Host "🚀 Starting Team SSO Application..." -ForegroundColor Cyan
Write-Host ""

# Check if Cloud SQL Proxy is running
$proxyRunning = Get-Process | Where-Object { $_.ProcessName -eq "cloud-sql-proxy" }
if (-not $proxyRunning) {
    Write-Host "⚠️  Cloud SQL Proxy not running. Starting..." -ForegroundColor Yellow
    Write-Host "   Run this in a separate terminal:" -ForegroundColor Gray
    Write-Host "   .\cloud-sql-proxy.exe projectsso-473108:us-central1:team-sso-db --port 5432 --credentials-file=server\service-account-key.json" -ForegroundColor White
    Write-Host ""
    Write-Host "   Press Enter when proxy is running..." -ForegroundColor Yellow
    Read-Host
}

# Start Backend Server
Write-Host "📦 Starting Backend Server (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'server'; npm run dev"

Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "🎨 Starting Frontend Server (Port 5173)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "✅ All services starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "🎨 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "🤖 Gemini AI is ready for pitch deck analysis!" -ForegroundColor Magenta
Write-Host "   Upload a PDF through the Deck Intelligence page" -ForegroundColor Gray
Write-Host ""
