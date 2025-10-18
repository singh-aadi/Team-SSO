# Google Cloud Setup Script for Team-SSO
# Project ID: projectsso-473108

$ErrorActionPreference = "Stop"

$PROJECT_ID = "projectsso-473108"
$REGION = "us-central1"
$BUCKET_NAME = "projectsso-pitch-decks"
$SERVICE_ACCOUNT_NAME = "team-sso-backend-sa"
$DB_INSTANCE_NAME = "team-sso-db"
$DB_NAME = "team_sso_db"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Team-SSO Google Cloud Setup Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set project
Write-Host "Step 1: Setting active project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID
Write-Host "Done!" -ForegroundColor Green

# Step 2: Create Storage Bucket  
Write-Host "`nStep 2: Creating Cloud Storage bucket..." -ForegroundColor Yellow
try {
    gcloud storage buckets create "gs://$BUCKET_NAME" --location=$REGION --uniform-bucket-level-access --public-access-prevention 2>$null
    Write-Host "Bucket created: gs://$BUCKET_NAME" -ForegroundColor Green
} catch {
    Write-Host "Bucket already exists or error occurred" -ForegroundColor Yellow
}

# Step 3: Create Service Account
Write-Host "`nStep 3: Creating service account..." -ForegroundColor Yellow
$SERVICE_ACCOUNT_EMAIL = "$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
try {
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME --display-name="Team-SSO Backend Service Account" 2>$null
    Write-Host "Service account created: $SERVICE_ACCOUNT_EMAIL" -ForegroundColor Green
} catch {
    Write-Host "Service account already exists" -ForegroundColor Yellow
}

# Step 4: Grant permissions
Write-Host "`nStep 4: Granting permissions..." -ForegroundColor Yellow
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET_NAME" --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/storage.objectAdmin" | Out-Null
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/cloudsql.client" | Out-Null
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/secretmanager.secretAccessor" | Out-Null
Write-Host "Permissions granted" -ForegroundColor Green

# Step 5: Create service account key
Write-Host "`nStep 5: Creating service account key..." -ForegroundColor Yellow
$KEY_PATH = ".\server\service-account-key.json"
if (Test-Path $KEY_PATH) {
    Remove-Item $KEY_PATH
}
gcloud iam service-accounts keys create $KEY_PATH --iam-account=$SERVICE_ACCOUNT_EMAIL
Write-Host "Service account key saved: $KEY_PATH" -ForegroundColor Green
Write-Host "IMPORTANT: This file is in .gitignore - do not commit it!" -ForegroundColor Red

# Step 6: Create Cloud SQL Instance
Write-Host "`nStep 6: Creating Cloud SQL PostgreSQL instance..." -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes. Please wait..." -ForegroundColor Cyan

# Generate secure password
$DB_PASSWORD = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})

try {
    gcloud sql instances create $DB_INSTANCE_NAME `
        --database-version=POSTGRES_15 `
        --tier=db-f1-micro `
        --region=$REGION `
        --root-password="$DB_PASSWORD" `
        --storage-type=SSD `
        --storage-size=10GB `
        --storage-auto-increase `
        --backup-start-time=03:00 `
        --maintenance-window-day=SUN `
        --maintenance-window-hour=4
    Write-Host "Cloud SQL instance created: $DB_INSTANCE_NAME" -ForegroundColor Green
} catch {
    Write-Host "Instance creation failed or already exists" -ForegroundColor Yellow
}

# Step 7: Create Database
Write-Host "`nStep 7: Creating database..." -ForegroundColor Yellow
try {
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME
    Write-Host "Database created: $DB_NAME" -ForegroundColor Green
} catch {
    Write-Host "Database already exists" -ForegroundColor Yellow
}

# Step 8: Create secrets in Secret Manager
Write-Host "`nStep 8: Storing secrets..." -ForegroundColor Yellow

$DB_CONNECTION_NAME = "$PROJECT_ID`:$REGION`:$DB_INSTANCE_NAME"
$DATABASE_URL = "postgresql://postgres:$DB_PASSWORD@localhost/$DB_NAME`?host=/cloudsql/$DB_CONNECTION_NAME"

# Create secrets
try {
    echo $DATABASE_URL | gcloud secrets create DATABASE_URL --data-file=- 2>$null
    Write-Host "Created secret: DATABASE_URL" -ForegroundColor Green
} catch {
    Write-Host "Secret DATABASE_URL already exists" -ForegroundColor Yellow
}

$JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
try {
    echo $JWT_SECRET | gcloud secrets create JWT_SECRET --data-file=- 2>$null
    Write-Host "Created secret: JWT_SECRET" -ForegroundColor Green
} catch {
    Write-Host "Secret JWT_SECRET already exists" -ForegroundColor Yellow
}

try {
    echo $BUCKET_NAME | gcloud secrets create STORAGE_BUCKET --data-file=- 2>$null
    Write-Host "Created secret: STORAGE_BUCKET" -ForegroundColor Green
} catch {
    Write-Host "Secret STORAGE_BUCKET already exists" -ForegroundColor Yellow
}

# Step 9: Create .env file
Write-Host "`nStep 9: Creating local .env file..." -ForegroundColor Yellow
$envContent = @"
# Local Development Environment Variables
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Database Configuration
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

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
Write-Host "Environment file created: .\server\.env" -ForegroundColor Green

# Summary
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   Setup Complete! " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resources Created:" -ForegroundColor Yellow
Write-Host "  Cloud Storage Bucket: gs://$BUCKET_NAME" -ForegroundColor White
Write-Host "  Service Account: $SERVICE_ACCOUNT_EMAIL" -ForegroundColor White
Write-Host "  Cloud SQL Instance: $DB_INSTANCE_NAME" -ForegroundColor White
Write-Host "  Database: $DB_NAME" -ForegroundColor White
Write-Host "  Secrets: DATABASE_URL, JWT_SECRET, STORAGE_BUCKET" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Run database migrations:" -ForegroundColor White
Write-Host "     cd server" -ForegroundColor Cyan
Write-Host "     gcloud sql connect $DB_INSTANCE_NAME --user=postgres --database=$DB_NAME < schema.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Install backend dependencies:" -ForegroundColor White
Write-Host "     cd server" -ForegroundColor Cyan
Write-Host "     npm install" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Start development server:" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Estimated Monthly Cost: $25-30" -ForegroundColor Cyan
Write-Host "Your 500 credits will last: ~16-20 months" -ForegroundColor Green
Write-Host ""
