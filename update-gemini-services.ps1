# Script to update all Gemini AI service files to use dynamic model selection
# This script adds the import and replaces hardcoded model strings

Write-Host "🔧 Updating Gemini AI Service Files..." -ForegroundColor Cyan
Write-Host ""

$files = @(
    ".\server\src\services\contextSynthesizer.ts",
    ".\server\src\services\fileExtractor.ts",
    ".\server\src\services\growthForecastAgent.ts",
    ".\server\src\services\pdfOrchestrator.ts",
    ".\server\src\services\promptAgent.ts",
    ".\server\src\services\radarScraper.ts",
    ".\server\src\services\speechToText.ts",
    ".\server\src\services\vertex-ai.ts",
    ".\server\src\services\vertex-ai-orchestrator.ts"
)

$importStatement = "import { getActiveGeminiModel } from '../utils/gemini-model';"

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "📝 Processing: $file" -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        # Check if import already exists
        if (-not ($content -match 'getActiveGeminiModel')) {
            # Find the last import statement and add our import after it
            $content = $content -replace '(import .* from .*;)(\r?\n)', "`$1`n$importStatement`$2"
            Write-Host "  ✅ Added import statement" -ForegroundColor Green
        } else {
            Write-Host "  ⏭️  Import already exists" -ForegroundColor Gray
        }
        
        # Replace hardcoded model strings
        $replacementCount = 0
        
        # Replace model property in objects
        if ($content -match "model: 'gemini-") {
            $content = $content -replace "model: 'gemini-[^']+'" , 'model: getActiveGeminiModel()'
            $replacementCount++
            Write-Host "  ✅ Replaced model properties" -ForegroundColor Green
        }
        
        # Replace const MODEL declarations
        if ($content -match "const MODEL = 'gemini-") {
            $content = $content -replace "const MODEL = 'gemini-[^']+';", 'const MODEL = getActiveGeminiModel();'
            $replacementCount++
            Write-Host "  ✅ Replaced MODEL constants" -ForegroundColor Green
        }
        
        if ($replacementCount -eq 0) {
            Write-Host "  ⏭️  No hardcoded models found" -ForegroundColor Gray
        }
        
        # Save the updated content
        Set-Content -Path $file -Value $content -NoNewline
        Write-Host ""
    } else {
        Write-Host "❌ File not found: $file" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "✨ Update complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: cd server; npm run build" -ForegroundColor White
Write-Host "2. Restart your server" -ForegroundColor White
Write-Host "3. Test model selection in the UI" -ForegroundColor White
