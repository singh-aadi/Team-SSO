# Team SSO - Cloud Run Deployment Script
param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$PROJECT_ID = "projectsso-473108"
$REGION = "us-central1"
$BACKEND_SERVICE = "team-sso-backend"
$FRONTEND_SERVICE = "team-sso-frontend"

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "Team SSO - Cloud Run Deployment"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

# Set project
Write-Host "Setting GCP project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Enable APIs
Write-Host "Enabling APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

#==========================================
# BACKEND DEPLOYMENT
#==========================================
if (-not $FrontendOnly) {
    Write-Host "`n### DEPLOYING BACKEND ###`n" -ForegroundColor Cyan
    
    Push-Location server
    
    Write-Host "Building TypeScript..." -ForegroundColor Yellow
    npm run build
    
    Write-Host "Building Docker image..." -ForegroundColor Yellow
    gcloud builds submit --tag "gcr.io/$PROJECT_ID/$BACKEND_SERVICE"
    
    Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
    gcloud run deploy $BACKEND_SERVICE `
        --image "gcr.io/$PROJECT_ID/$BACKEND_SERVICE" `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 8080 `
        --memory 512Mi `
        --cpu 1 `
        --min-instances 0 `
        --max-instances 10 `
        --timeout 300 `
        --add-cloudsql-instances "projectsso-473108:us-central1:team-sso-db" `
        --set-env-vars "NODE_ENV=production,CLOUD_SQL_CONNECTION_NAME=projectsso-473108:us-central1:team-sso-db,DB_NAME=teamsso_db,DB_USER=postgres,GOOGLE_CLOUD_PROJECT=projectsso-473108,GOOGLE_CLOUD_LOCATION=us-central1,GCS_BUCKET_NAME=pitch-decks" `
        --service-account "team-SSO-backend-sa@projectsso-473108.iam.gserviceaccount.com"
    
    $BACKEND_URL = gcloud run services describe $BACKEND_SERVICE --region $REGION --format="value(status.url)"
    Write-Host "`nBackend deployed: $BACKEND_URL" -ForegroundColor Green
    
    Pop-Location
}

#==========================================
# FRONTEND DEPLOYMENT
#==========================================
if (-not $BackendOnly) {
    Write-Host "`n### DEPLOYING FRONTEND ###`n" -ForegroundColor Cyan
    
    Write-Host "Building frontend..." -ForegroundColor Yellow
    npm run build
    
    Write-Host "Building Docker image..." -ForegroundColor Yellow
    gcloud builds submit --tag "gcr.io/$PROJECT_ID/$FRONTEND_SERVICE"
    
    Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
    gcloud run deploy $FRONTEND_SERVICE `
        --image "gcr.io/$PROJECT_ID/$FRONTEND_SERVICE" `
        --region $REGION `
        --platform managed `
        --allow-unauthenticated `
        --port 8080 `
        --memory 256Mi `
        --cpu 1 `
        --min-instances 0 `
        --max-instances 5 `
        --timeout 60
    
    $FRONTEND_URL = gcloud run services describe $FRONTEND_SERVICE --region $REGION --format="value(status.url)"
    Write-Host "`nFrontend deployed: $FRONTEND_URL" -ForegroundColor Green
}

#==========================================
# SUMMARY
#==========================================
Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE!"  -ForegroundColor Green
Write-Host "========================================`n"  -ForegroundColor Cyan

if (-not $FrontendOnly) {
    $BACKEND_URL = gcloud run services describe $BACKEND_SERVICE --region $REGION --format="value(status.url)"
    Write-Host "Backend:  $BACKEND_URL" -ForegroundColor Cyan
}

if (-not $BackendOnly) {
    $FRONTEND_URL = gcloud run services describe $FRONTEND_SERVICE --region $REGION --format="value(status.url)"
    Write-Host "Frontend: $FRONTEND_URL" -ForegroundColor Cyan
    Write-Host "`nShare this URL with your friends! 🚀`n" -ForegroundColor Green
}
