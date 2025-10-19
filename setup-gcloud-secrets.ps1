# Google Cloud Setup Script for Team-SSO Backend
# Run this in Google Cloud Shell or with gcloud CLI installed

Write-Host "Setting up Google Cloud for Team-SSO Backend..." -ForegroundColor Cyan
Write-Host ""

# Set project
Write-Host "[1/4] Setting project..." -ForegroundColor Yellow
gcloud config set project projectsso-473108

# Create secrets
Write-Host "`n[2/4] Creating secrets..." -ForegroundColor Yellow
$secrets = @{
    "DB_PASSWORD" = "160Im4xAykflQasNpgPv"
    "JWT_SECRET" = "y5K8w2XdP9mQ3vR7nL6tU1hF4jG0zB2c"
    "GEMINI_API_KEY" = "AIzaSyAnWSc9H2ug4CIFKq9I-btv97hHBXAViSA"
    "GOOGLE_CLIENT_ID" = "520480129735-0jbk8o94o55lhlin7u5jp3ei9gtdpf4f.apps.googleusercontent.com"
}

foreach ($secretName in $secrets.Keys) {
    $secretValue = $secrets[$secretName]
    Write-Host "Creating secret: $secretName" -ForegroundColor Gray
    
    # Create secret (will skip if exists)
    echo $secretValue | gcloud secrets create $secretName --data-file=- 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Created: $secretName" -ForegroundColor Green
    } else {
        Write-Host "  Already exists: $secretName" -ForegroundColor Yellow
    }
}

# Grant secret access
Write-Host "`n[3/4] Granting secret access..." -ForegroundColor Yellow
$serviceAccount = "520480129735-compute@developer.gserviceaccount.com"

foreach ($secretName in $secrets.Keys) {
    Write-Host "Granting access to: $secretName" -ForegroundColor Gray
    gcloud secrets add-iam-policy-binding $secretName `
        --member="serviceAccount:$serviceAccount" `
        --role="roles/secretmanager.secretAccessor" `
        --quiet 2>$null
}

# Grant IAM roles
Write-Host "`n[4/4] Granting IAM roles..." -ForegroundColor Yellow
$roles = @(
    "roles/cloudbuild.builds.builder",
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/storage.admin",
    "roles/cloudsql.client"
)

foreach ($role in $roles) {
    Write-Host "Granting role: $role" -ForegroundColor Gray
    gcloud projects add-iam-policy-binding projectsso-473108 `
        --member="serviceAccount:$serviceAccount" `
        --role="$role" `
        --quiet 2>$null
}

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to Cloud Build Triggers and reconnect your GitHub repository" -ForegroundColor White
Write-Host "2. Update trigger to use: server/cloudbuild.yaml" -ForegroundColor White
Write-Host "3. Push your code to trigger the build" -ForegroundColor White
Write-Host ""
Write-Host "Cloud Build Triggers: https://console.cloud.google.com/cloud-build/triggers?project=projectsso-473108" -ForegroundColor Blue
