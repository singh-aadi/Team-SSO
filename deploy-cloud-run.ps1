# Complete Deployment Script for Team SSO to Google Cloud Run
param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$PROJECT_ID = "projectsso-473108"
$REGION = "us-central1"
$BACKEND_SERVICE = "team-sso-backend"
$FRONTEND_SERVICE = "team-sso-frontend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Team SSO - Cloud Run Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
$gcloudPath = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloudPath) {
    Write-Host "✗ gcloud CLI not found. Please install: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}
Write-Host "✓ gcloud CLI detected" -ForegroundColor Green

# Set project
Write-Host "`nSetting GCP project to: $PROJECT_ID" -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host "`nEnabling required APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

#===========================================
# BACKEND DEPLOYMENT
#===========================================
if (-not $FrontendOnly) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "DEPLOYING BACKEND" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Push-Location server
    
    if (-not $SkipBuild) {
        Write-Host "`n1. Building TypeScript..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ Backend build failed!" -ForegroundColor Red
            Pop-Location
            exit 1
        }
        Write-Host "✓ Backend built successfully" -ForegroundColor Green
    }
    
    Write-Host "`n2. Building Docker image..." -ForegroundColor Yellow
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Backend Docker build failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "✓ Backend Docker image built" -ForegroundColor Green
    
    Write-Host "`n3. Deploying to Cloud Run..." -ForegroundColor Yellow
    
    # Get DB password from Secret Manager
    $DB_PASSWORD = ""
    try {
        $DB_PASSWORD = gcloud secrets versions access latest --secret="db-password" 2>$null
    } catch {
        Write-Host "⚠ Warning: DB password not found in Secret Manager" -ForegroundColor Yellow
    }
    if ([string]::IsNullOrEmpty($DB_PASSWORD)) {
        $DB_PASSWORD = "your_db_password_here"
    }
    
    gcloud run deploy $BACKEND_SERVICE `
        --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 8080 `
        --memory 512Mi `
        --cpu 1 `
        --min-instances 0 `
        --max-instances 10 `
        --timeout 300 `
        --add-cloudsql-instances="projectsso-473108:us-central1:team-sso-db" `
        --set-env-vars="NODE_ENV=production,CLOUD_SQL_CONNECTION_NAME=projectsso-473108:us-central1:team-sso-db,DB_NAME=teamsso_db,DB_USER=postgres,DB_PASSWORD=$DB_PASSWORD,GOOGLE_CLOUD_PROJECT=projectsso-473108,GOOGLE_CLOUD_LOCATION=us-central1,GCS_BUCKET_NAME=pitch-decks" `
        --service-account="team-SSO-backend-sa@projectsso-473108.iam.gserviceaccount.com"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Backend deployment failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Get backend URL
    $BACKEND_URL = gcloud run services describe $BACKEND_SERVICE --region $REGION --format="value(status.url)"
    Write-Host "✓ Backend deployed successfully!" -ForegroundColor Green
    Write-Host "  URL: $BACKEND_URL" -ForegroundColor Cyan
    
    Pop-Location
}

#===========================================
# FRONTEND DEPLOYMENT
#===========================================
if (-not $BackendOnly) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "DEPLOYING FRONTEND" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    if (-not $SkipBuild) {
        Write-Host "`n1. Building frontend with production config..." -ForegroundColor Yellow
        
        # Create .env.production if it does not exist
        if (-not (Test-Path .env.production)) {
            $BACKEND_URL = ""
            try {
                $BACKEND_URL = gcloud run services describe $BACKEND_SERVICE --region $REGION --format="value(status.url)" 2>$null
            } catch {}
            if ([string]::IsNullOrEmpty($BACKEND_URL)) {
                $BACKEND_URL = "https://team-sso-backend-520480129735.us-central1.run.app"
            }
            
            $envContent = "VITE_API_URL=$BACKEND_URL/api`nVITE_GOOGLE_CLIENT_ID=520480129735-0jbk8o94o55lhlin7u5jp3ei9gtdpf4f.apps.googleusercontent.com"
            $envContent | Out-File -FilePath .env.production -Encoding utf8
            Write-Host "Created .env.production with backend URL: $BACKEND_URL" -ForegroundColor Green
        }
        
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ Frontend build failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Frontend built successfully" -ForegroundColor Green
    }
    
    Write-Host "`n2. Building Docker image..." -ForegroundColor Yellow
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Frontend Docker build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Frontend Docker image built" -ForegroundColor Green
    
    Write-Host "`n3. Deploying to Cloud Run..." -ForegroundColor Yellow
    gcloud run deploy $FRONTEND_SERVICE `
        --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 8080 `
        --memory 256Mi `
        --cpu 1 `
        --min-instances 0 `
        --max-instances 5 `
        --timeout 60
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Frontend deployment failed!" -ForegroundColor Red
        exit 1
    }
    
    # Get frontend URL
    $FRONTEND_URL = gcloud run services describe $FRONTEND_SERVICE --region $REGION --format="value(status.url)"
    Write-Host "✓ Frontend deployed successfully!" -ForegroundColor Green
    Write-Host "  URL: $FRONTEND_URL" -ForegroundColor Cyan
}

#===========================================
# SUMMARY
#===========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE! 🚀" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

if (-not $FrontendOnly) {
    $BACKEND_URL = gcloud run services describe $BACKEND_SERVICE --region $REGION --format="value(status.url)"
    Write-Host "`nBackend API: $BACKEND_URL" -ForegroundColor Cyan
}

if (-not $BackendOnly) {
    $FRONTEND_URL = gcloud run services describe $FRONTEND_SERVICE --region $REGION --format="value(status.url)"
    Write-Host "Frontend App: $FRONTEND_URL" -ForegroundColor Cyan
}

Write-Host "`n✓ Share this URL with your friends!" -ForegroundColor Green
Write-Host "`nUseful commands:" -ForegroundColor Yellow
Write-Host "  View logs (backend):  gcloud run logs tail $BACKEND_SERVICE --region $REGION" -ForegroundColor Gray
Write-Host "  View logs (frontend): gcloud run logs tail $FRONTEND_SERVICE --region $REGION" -ForegroundColor Gray
Write-Host "  Redeploy backend:     .\deploy-cloud-run.ps1 -BackendOnly" -ForegroundColor Gray
Write-Host "  Redeploy frontend:    .\deploy-cloud-run.ps1 -FrontendOnly" -ForegroundColor Gray
Write-Host ""
