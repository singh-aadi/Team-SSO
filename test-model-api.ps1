# Test script for Gemini model selection API

Write-Host "🧪 Testing Gemini Model Selection API" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/settings"

# Test 1: Get current model
Write-Host "1️⃣ Getting current model..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/gemini-model" -Method Get
    Write-Host "   Current model: $($response.model)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to get current model" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: Update to Gemini 3 Pro
Write-Host "2️⃣ Updating to Gemini 3 Pro..." -ForegroundColor Yellow
try {
    $body = @{ model = "gemini-3-pro" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/gemini-model" -Method Post -Body $body -ContentType "application/json"
    Write-Host "   ✅ Success: $($response.message)" -ForegroundColor Green
    Write-Host "   New model: $($response.model)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to update model" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Verify the update
Write-Host "3️⃣ Verifying model update..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/gemini-model" -Method Get
    if ($response.model -eq "gemini-3-pro") {
        Write-Host "   ✅ Model successfully updated to: $($response.model)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Model not updated correctly. Current: $($response.model)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed to verify update" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "✨ Test complete!" -ForegroundColor Cyan
