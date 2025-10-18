# Google Cloud Setup Script for Team-SSO
# Project ID: projectsso-473108
# Run this script in PowerShell after installing gcloud CLI

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Team-SSO Google Cloud Setup Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_ID = "projectsso-473108"
$REGION = "us-central1"
$BUCKET_NAME = "projectsso-pitch-decks"
$SERVICE_ACCOUNT_NAME = "team-SSO-backend-sa"
$SERVICE_ACCOUNT_EMAIL = "$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

# Step 1: Set the active project
Write-Host "Step 1: Setting active project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Step 2: Create Cloud Storage Bucket
Write-Host "`nStep 2: Creating Cloud Storage bucket for pitch decks..." -ForegroundColor Yellow
gcloud storage buckets create gs://$BUCKET_NAME `
    --location=$REGION `
    --uniform-bucket-level-access `
    --public-access-prevention

Write-Host "✓ Bucket created: gs://$BUCKET_NAME" -ForegroundColor Green

# Step 3: Set bucket lifecycle (auto-delete temporary files after 90 days)
Write-Host "`nStep 3: Configuring bucket lifecycle..." -ForegroundColor Yellow
@'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 90,
          "matchesPrefix": ["temp/"]
        }
      }
    ]
  }
}
'@ | Out-File -FilePath "bucket-lifecycle.json" -Encoding utf8
gcloud storage buckets update gs://$BUCKET_NAME --lifecycle-file=bucket-lifecycle.json
Remove-Item "bucket-lifecycle.json"
Write-Host "✓ Lifecycle policy configured" -ForegroundColor Green

# Step 4: Create Service Account for Backend
Write-Host "`nStep 4: Creating service account..." -ForegroundColor Yellow
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME `
    --display-name="Team-SSO Backend Service Account" `
    --description="Service account for Cloud Run backend to access Cloud Storage and Cloud SQL"

Write-Host "✓ Service account created: $SERVICE_ACCOUNT_EMAIL" -ForegroundColor Green

# Step 5: Grant necessary permissions to service account
Write-Host "`nStep 5: Granting permissions to service account..." -ForegroundColor Yellow

# Storage permissions
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME `
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" `
    --role="roles/storage.objectAdmin"

# Cloud SQL client permissions
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" `
    --role="roles/cloudsql.client"

# Secret Manager accessor (for environment variables)
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" `
    --role="roles/secretmanager.secretAccessor"

Write-Host "✓ Permissions granted" -ForegroundColor Green

# Step 6: Create Service Account Key (for local development)
Write-Host "`nStep 6: Creating service account key for local development..." -ForegroundColor Yellow
$keyPath = ".\server\service-account-key.json"
gcloud iam service-accounts keys create $keyPath `
    --iam-account=$SERVICE_ACCOUNT_EMAIL

Write-Host "✓ Service account key saved to: $keyPath" -ForegroundColor Green
Write-Host "  IMPORTANT: Add this file to .gitignore!" -ForegroundColor Red

# Step 7: Create Cloud SQL Instance
Write-Host "`nStep 7: Creating Cloud SQL PostgreSQL instance..." -ForegroundColor Yellow
Write-Host "  This will take 5-10 minutes..." -ForegroundColor Cyan

$DB_INSTANCE_NAME = "team-SSO-db"
$DB_PASSWORD = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 20 | ForEach-Object {[char]$_})

gcloud sql instances create $DB_INSTANCE_NAME `
    --database-version=POSTGRES_15 `
    --tier=db-f1-micro `
    --region=$REGION `
    --root-password=$DB_PASSWORD `
    --storage-type=SSD `
    --storage-size=10GB `
    --storage-auto-increase `
    --backup-start-time=03:00 `
    --maintenance-window-day=SUN `
    --maintenance-window-hour=4

Write-Host "✓ Cloud SQL instance created: $DB_INSTANCE_NAME" -ForegroundColor Green

# Step 8: Create Database
Write-Host "`nStep 8: Creating database..." -ForegroundColor Yellow
gcloud sql databases create team_SSO_db `
    --instance=$DB_INSTANCE_NAME

Write-Host "✓ Database created: team_SSO_db" -ForegroundColor Green

# Step 9: Save credentials to Secret Manager
Write-Host "`nStep 9: Storing secrets in Secret Manager..." -ForegroundColor Yellow

# Database URL
$DB_CONNECTION_NAME = "${PROJECT_ID}:${REGION}:${DB_INSTANCE_NAME}"
$DATABASE_URL = "postgresql://postgres:${DB_PASSWORD}@localhost/team_SSO_db?host=/cloudsql/${DB_CONNECTION_NAME}"
echo $DATABASE_URL | gcloud secrets create DATABASE_URL --data-file=-

# JWT Secret
$JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
echo $JWT_SECRET | gcloud secrets create JWT_SECRET --data-file=-

# Storage bucket name
echo $BUCKET_NAME | gcloud secrets create STORAGE_BUCKET --data-file=-

Write-Host "✓ Secrets stored in Secret Manager" -ForegroundColor Green

# Step 10: Create .env file for local development
Write-Host "`nStep 10: Creating local .env file..." -ForegroundColor Yellow
$envContent = @"
# Local Development Environment Variables
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Database Configuration
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@127.0.0.1:5432/team_SSO_db
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD
DB_NAME=team_SSO_db

# Cloud SQL Configuration (for production)
CLOUD_SQL_CONNECTION_NAME=$DB_CONNECTION_NAME
INSTANCE_UNIX_SOCKET=/cloudsql/$DB_CONNECTION_NAME

# Google Cloud Storage
GCS_BUCKET_NAME=$BUCKET_NAME
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Authentication
JWT_SECRET=$JWT_SECRET
GOOGLE_CLIENT_ID=520480129735-0jbk8o94o55lhlin7u5jp3ei9gtdpf4f.apps.googleusercontent.com

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS (update with your frontend URL)
FRONTEND_URL=http://localhost:5173
"@

$envContent | Out-File -FilePath ".\server\.env" -Encoding utf8
Write-Host "✓ Environment file created: .\server\.env" -ForegroundColor Green

# Summary
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   Setup Complete! 🎉" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resources Created:" -ForegroundColor Yellow
Write-Host "  ✓ Cloud Storage Bucket: gs://$BUCKET_NAME" -ForegroundColor Green
Write-Host "  ✓ Service Account: $SERVICE_ACCOUNT_EMAIL" -ForegroundColor Green
Write-Host "  ✓ Cloud SQL Instance: $DB_INSTANCE_NAME" -ForegroundColor Green
Write-Host "  ✓ Database: team_SSO_db" -ForegroundColor Green
Write-Host "  ✓ Secrets in Secret Manager: DATABASE_URL, JWT_SECRET, STORAGE_BUCKET" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Run database migrations:" -ForegroundColor White
Write-Host "     cd server" -ForegroundColor Cyan
Write-Host "     gcloud sql connect $DB_INSTANCE_NAME --user=postgres < schema.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Install Cloud SQL Proxy for local development:" -ForegroundColor White
Write-Host "     https://cloud.google.com/sql/docs/postgres/connect-instance-auth-proxy" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Start the backend server:" -ForegroundColor White
Write-Host "     npm install" -ForegroundColor Cyan
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Important Files:" -ForegroundColor Yellow
Write-Host "  📁 server/.env - Local environment variables" -ForegroundColor White
Write-Host "  🔑 server/service-account-key.json - Service account credentials (DON'T COMMIT!)" -ForegroundColor Red
Write-Host ""
Write-Host "Estimated Monthly Cost: ~$25-30" -ForegroundColor Cyan
Write-Host "Your $500 credits will last: ~16-20 months" -ForegroundColor Green
Write-Host ""
