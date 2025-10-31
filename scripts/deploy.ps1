# Complete Backend Deployment to Cloud Run
# Run this after the Docker image is built successfully

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Cloud Run Deployment Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ID = "projectsso-473108"
$REGION = "us-central1"
$SERVICE_NAME = "team-sso-backend"
$IMAGE = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Step 1: Build Docker image
Write-Host "[1/3] Building Docker image..." -ForegroundColor Yellow
Write-Host "  This will take 3-5 minutes. Please be patient..." -ForegroundColor Cyan
cd "d:\TeamSSO 2025\Team-SSO\server"

gcloud builds submit --tag $IMAGE --timeout=15m

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker image built successfully!" -ForegroundColor Green

# Step 2: Deploy to Cloud Run
Write-Host "`n[2/3] Deploying to Cloud Run..." -ForegroundColor Yellow

$CLOUD_SQL_INSTANCE = "${PROJECT_ID}:${REGION}:team-sso-db"
$CONNECTION_STRING = "NODE_ENV=production,GCS_BUCKET_NAME=projectsso-pitch-decks,JWT_SECRET=y5K8w2XdP9mQ3vR7nL6tU1hF4jG0zB2c,GOOGLE_CLIENT_ID=520480129735-0jbk8o94o55lhlin7u5jp3ei9gtdpf4f.apps.googleusercontent.com,DB_NAME=teamsso_db,DB_USER=postgres,DB_PASSWORD=160Im4xAykflQasNpgPv,GEMINI_API_KEY=AIzaSyAnWSc9H2ug4CIFKq9I-btv97hHBXAViSA,CLOUD_SQL_CONNECTION_NAME=${CLOUD_SQL_INSTANCE},PORT=8080"

gcloud run deploy $SERVICE_NAME `
    --image $IMAGE `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --service-account "team-sso-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com" `
    --add-cloudsql-instances $CLOUD_SQL_INSTANCE `
    --set-env-vars $CONNECTION_STRING `
    --memory=1Gi `
    --cpu=1 `
    --max-instances=10 `
    --min-instances=0 `
    --timeout=300 `
    --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Deployed to Cloud Run!" -ForegroundColor Green

# Step 3: Get service URL
Write-Host "`n[3/3] Getting service URL..." -ForegroundColor Yellow
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   Deployment Complete! 🎉" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL: $SERVICE_URL" -ForegroundColor Green
Write-Host ""
Write-Host "Test your deployment:" -ForegroundColor Yellow
Write-Host "  curl $SERVICE_URL/health" -ForegroundColor Cyan
Write-Host "  curl $SERVICE_URL/api/companies" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update frontend src/config.ts with this URL" -ForegroundColor White
Write-Host "  2. Deploy frontend to Vercel" -ForegroundColor White
Write-Host "  3. Update CORS in backend to allow your Vercel domain" -ForegroundColor White
Write-Host ""
