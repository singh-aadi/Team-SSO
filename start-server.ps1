# Simple Backend Starter
Write-Host "🚀 Starting Team-SSO Backend..." -ForegroundColor Cyan
Write-Host ""

# Check if proxy is running
$proxy = Get-Process -Name "cloud-sql-proxy" -ErrorAction SilentlyContinue
if (-not $proxy) {
    Write-Host "⚠ Cloud SQL Proxy not running. Start it in another terminal:" -ForegroundColor Yellow
    Write-Host '  $env:GOOGLE_APPLICATION_CREDENTIALS=".\server\service-account-key.json"' -ForegroundColor Cyan
    Write-Host "  .\cloud-sql-proxy.exe projectsso-473108:us-central1:team-sso-db --port 5432" -ForegroundColor Cyan
    Write-Host ""
}

cd server
Write-Host "✓ Starting server on http://localhost:3000" -ForegroundColor Green
Write-Host ""
node dist/index.js
