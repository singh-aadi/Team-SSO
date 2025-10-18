# Team-SSO Google Cloud Setup Script (Simplified)
# Project ID: projectsso-473108

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Team-SSO Google Cloud Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$PROJECT_ID = "projectsso-473108"
$REGION = "us-central1"
$BUCKET_NAME = "projectsso-pitch-decks"
$SERVICE_ACCOUNT_NAME = "team-sso-backend-sa"
$DB_INSTANCE_NAME = "team-sso-db"

# Set project
Write-Host "`n[1/9] Setting project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Create bucket
Write-Host "`n[2/9] Creating Cloud Storage bucket..." -ForegroundColor Yellow
gcloud storage buckets create gs://$BUCKET_NAME --location=$REGION --uniform-bucket-level-access --public-access-prevention
Write-Host "✓ Bucket created" -ForegroundColor Green

# Create service account
Write-Host "`n[3/9] Creating service account..." -ForegroundColor Yellow
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME --display-name="Team-SSO Backend Service Account"
$SERVICE_ACCOUNT_EMAIL = "$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
Write-Host "✓ Service account: $SERVICE_ACCOUNT_EMAIL" -ForegroundColor Green

# Grant storage permissions
Write-Host "`n[4/9] Granting storage permissions..." -ForegroundColor Yellow
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/storage.objectAdmin"
Write-Host "✓ Storage permissions granted" -ForegroundColor Green

# Grant Cloud SQL permissions
Write-Host "`n[5/9] Granting Cloud SQL permissions..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/cloudsql.client"
Write-Host "✓ Cloud SQL permissions granted" -ForegroundColor Green

# Grant Secret Manager permissions
Write-Host "`n[6/9] Granting Secret Manager permissions..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/secretmanager.secretAccessor"
Write-Host "✓ Secret Manager permissions granted" -ForegroundColor Green

# Create service account key
Write-Host "`n[7/9] Creating service account key..." -ForegroundColor Yellow
gcloud iam service-accounts keys create ".\server\service-account-key.json" --iam-account=$SERVICE_ACCOUNT_EMAIL
Write-Host "✓ Key saved to .\server\service-account-key.json" -ForegroundColor Green

# Generate secure password
Write-Host "`n[8/9] Creating Cloud SQL instance..." -ForegroundColor Yellow
Write-Host "  This will take 5-10 minutes. Please wait..." -ForegroundColor Cyan
$DB_PASSWORD = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 20 | ForEach-Object {[char]$_})

gcloud sql instances create $DB_INSTANCE_NAME `
    --database-version=POSTGRES_15 `
    --tier=db-f1-micro `
    --region=$REGION `
    --root-password=$DB_PASSWORD `
    --storage-type=SSD `
    --storage-size=10GB `
    --storage-auto-increase `
    --backup-start-time=03:00

Write-Host "✓ Cloud SQL instance created!" -ForegroundColor Green

# Create database
Write-Host "`n[9/9] Creating database..." -ForegroundColor Yellow
gcloud sql databases create teamsso_db --instance=$DB_INSTANCE_NAME
Write-Host "✓ Database created" -ForegroundColor Green

# Generate JWT secret
$JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Create .env file
Write-Host "`nCreating .env file..." -ForegroundColor Yellow
$DB_CONNECTION_NAME = "$PROJECT_ID`:$REGION`:$DB_INSTANCE_NAME"
$envContent = @"
# Team-SSO Backend Environment Variables
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Database Configuration (Local Development)
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@127.0.0.1:5432/teamsso_db
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD
DB_NAME=teamsso_db

# Cloud SQL Configuration (Production)
CLOUD_SQL_CONNECTION_NAME=$DB_CONNECTION_NAME

# Google Cloud Storage
GCS_BUCKET_NAME=$BUCKET_NAME
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Authentication
JWT_SECRET=$JWT_SECRET
GOOGLE_CLIENT_ID=520480129735-0jbk8o94o55lhlin7u5jp3ei9gtdpf4f.apps.googleusercontent.com

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
"@

$envContent | Out-File -FilePath ".\server\.env" -Encoding utf8
Write-Host "✓ Environment file created: .\server\.env" -ForegroundColor Green

# Store secrets
Write-Host "`nStoring secrets in Secret Manager..." -ForegroundColor Yellow
echo $DB_PASSWORD | gcloud secrets create DB_PASSWORD --data-file=-
echo $JWT_SECRET | gcloud secrets create JWT_SECRET --data-file=-
echo $BUCKET_NAME | gcloud secrets create STORAGE_BUCKET --data-file=-
Write-Host "✓ Secrets stored" -ForegroundColor Green

# Summary
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   Setup Complete! 🎉" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resources Created:" -ForegroundColor Yellow
Write-Host "  ✓ Storage Bucket: gs://$BUCKET_NAME" -ForegroundColor Green
Write-Host "  ✓ Service Account: $SERVICE_ACCOUNT_EMAIL" -ForegroundColor Green
Write-Host "  ✓ Cloud SQL Instance: $DB_INSTANCE_NAME" -ForegroundColor Green
Write-Host "  ✓ Database: teamsso_db" -ForegroundColor Green
Write-Host "  ✓ Secrets: DB_PASSWORD, JWT_SECRET, STORAGE_BUCKET" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Run database migrations (we will do this next)" -ForegroundColor White
Write-Host "  2. Install dependencies in server folder" -ForegroundColor White
Write-Host "  3. Start backend with npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Important Info:" -ForegroundColor Yellow
Write-Host "  Database Password: $DB_PASSWORD" -ForegroundColor Cyan
$connName = "$PROJECT_ID`:$REGION`:$DB_INSTANCE_NAME"
Write-Host "  Connection Name: $connName" -ForegroundColor Cyan
Write-Host ""
