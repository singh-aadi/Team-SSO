# 🚀 Google Cloud Run Deployment Fix

## 🔥 Issues Identified & Fixed

### Issue 1: GitHub Repository is Private
**Problem**: Cloud Build can't access private GitHub repository  
**Status**: ⚠️ Needs manual fix in Google Cloud Console

### Issue 2: Docker Build Configuration
**Problem**: Dockerfile had inefficient build process  
**Status**: ✅ FIXED

### Issue 3: Cloud Build Configuration
**Problem**: No proper cloudbuild.yaml for server deployment  
**Status**: ✅ FIXED

---

## ✅ What Was Fixed

### 1. **Dockerfile Improvements** (`server/Dockerfile`)
- ✅ Install all dependencies (including dev) for build
- ✅ Build TypeScript properly
- ✅ Prune dev dependencies after build
- ✅ Simplified and optimized build process
- ✅ Removed problematic health check
- ✅ Uses Cloud Run's PORT environment variable

### 2. **Cloud Build Configuration** (`server/cloudbuild.yaml`)
- ✅ Proper build steps for Docker
- ✅ Correct file paths for server directory
- ✅ Push to Google Container Registry
- ✅ Deploy to Cloud Run with all required settings
- ✅ Environment variables and secrets configuration
- ✅ Cloud SQL connection setup

---

## 🔧 Step-by-Step Deployment Fix

### Step 1: Reconnect Private GitHub Repository

**You MUST do this in Google Cloud Console:**

1. Go to: https://console.cloud.google.com/cloud-build/triggers?project=projectsso-473108

2. Click on your trigger: `rmgpgab-team-sso-backend-us-central1-singh-aadi-Team-SSO--ausha`

3. Click **"EDIT"**

4. Under **"Source"** section:
   - You'll see it says: `singh-aadi/Team-SSO (GitHub App)`
   - Click **"CONNECT REPOSITORY"** or **"RECONNECT"**

5. Follow the OAuth flow:
   - Authenticate with GitHub
   - Grant access to **singh-aadi** organization
   - Select the **Team-SSO** repository
   - Grant read permissions for the private repo

6. Update the trigger configuration:
   - **Branch**: `^auth-restore$`
   - **Configuration**: Cloud Build configuration file (yaml or json)
   - **Location**: `server/cloudbuild.yaml`
   - **Service Account**: `520480129735-compute@developer.gserviceaccount.com`

7. Click **"SAVE"**

---

### Step 2: Ensure Secrets Exist in Secret Manager

Run these commands in your terminal or Cloud Shell:

```bash
# Set your project
gcloud config set project projectsso-473108

# Check if secrets exist
gcloud secrets list

# If secrets don't exist, create them:
echo -n "160Im4xAykflQasNpgPv" | gcloud secrets create DB_PASSWORD --data-file=-
echo -n "y5K8w2XdP9mQ3vR7nL6tU1hF4jG0zB2c" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "AIzaSyAnWSc9H2ug4CIFKq9I-btv97hHBXAViSA" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "520480129735-0jbk8o94o55lhlin7u5jp3ei9gtdpf4f.apps.googleusercontent.com" | gcloud secrets create GOOGLE_CLIENT_ID --data-file=-

# Grant access to Cloud Build service account
gcloud secrets add-iam-policy-binding DB_PASSWORD \
  --member="serviceAccount:520480129735-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET \
  --member="serviceAccount:520480129735-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:520480129735-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GOOGLE_CLIENT_ID \
  --member="serviceAccount:520480129735-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### Step 3: Grant Required IAM Permissions

```bash
# Cloud Build Builder role
gcloud projects add-iam-policy-binding projectsso-473108 \
  --member="serviceAccount:520480129735-compute@developer.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

# Cloud Run Admin role
gcloud projects add-iam-policy-binding projectsso-473108 \
  --member="serviceAccount:520480129735-compute@developer.gserviceaccount.com" \
  --role="roles/run.admin"

# Service Account User role
gcloud projects add-iam-policy-binding projectsso-473108 \
  --member="serviceAccount:520480129735-compute@developer.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Storage Admin role (for Container Registry)
gcloud projects add-iam-policy-binding projectsso-473108 \
  --member="serviceAccount:520480129735-compute@developer.gserviceaccount.com" \
  --role="roles/storage.admin"

# Cloud SQL Client role
gcloud projects add-iam-policy-binding projectsso-473108 \
  --member="serviceAccount:520480129735-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

---

### Step 4: Test Docker Build Locally (Optional)

Before pushing, test the Docker build locally:

```powershell
# Navigate to server directory
cd server

# Build the Docker image
docker build -t team-sso-backend:test .

# If build succeeds, test run it
docker run -p 8080:8080 `
  -e NODE_ENV=production `
  -e PORT=8080 `
  -e DB_HOST=127.0.0.1 `
  -e DB_PORT=5432 `
  -e DB_NAME=teamsso_db `
  -e DB_USER=postgres `
  -e DB_PASSWORD=your_password `
  team-sso-backend:test
```

---

### Step 5: Commit and Push Changes

```bash
# Add the changes
git add server/Dockerfile server/cloudbuild.yaml

# Commit
git commit -m "fix: update Dockerfile and Cloud Build config for deployment"

# Push to trigger build
git push origin auth-restore
```

---

### Step 6: Monitor the Build

1. Go to: https://console.cloud.google.com/cloud-build/builds?project=projectsso-473108

2. You should see a new build triggered

3. Click on it to view logs

4. Look for:
   - ✅ Docker build succeeds
   - ✅ Image pushed to GCR
   - ✅ Cloud Run deployment succeeds

---

### Step 7: Verify Deployment

Once deployed, test your Cloud Run service:

```powershell
# Test the deployed service
Invoke-RestMethod -Uri "https://team-sso-backend-520480129735.us-central1.run.app/health"

# Test companies endpoint
Invoke-RestMethod -Uri "https://team-sso-backend-520480129735.us-central1.run.app/api/companies"
```

---

## 🔍 Troubleshooting

### If Build Fails with "Permission Denied"
- **Solution**: Check IAM roles (Step 3)
- **Check**: Service account has all required roles

### If Build Fails with "Cannot access repository"
- **Solution**: Reconnect GitHub repository (Step 1)
- **Check**: Repository is connected with proper OAuth

### If Build Fails with "Secrets not found"
- **Solution**: Create secrets (Step 2)
- **Check**: All 4 secrets exist and have proper access

### If Cloud Run Service Fails to Start
- **Check Cloud Run Logs**: 
  ```bash
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=team-sso-backend" --limit 50 --format json
  ```
- **Common issues**:
  - Database connection (check Cloud SQL connection)
  - Missing environment variables
  - Port configuration

### If Database Connection Fails
- **Check**: Cloud SQL instance is running
- **Check**: Service account has Cloud SQL Client role
- **Check**: Cloud Run service has `--add-cloudsql-instances` flag
- **Verify**: Environment variables are set correctly

---

## 📋 Deployment Checklist

Before pushing:
- [ ] GitHub repository reconnected to Cloud Build
- [ ] All secrets created in Secret Manager
- [ ] IAM permissions granted to service account
- [ ] `server/Dockerfile` updated
- [ ] `server/cloudbuild.yaml` created
- [ ] Changes committed

After pushing:
- [ ] Build triggered in Cloud Build
- [ ] Build completes successfully
- [ ] Image pushed to Container Registry
- [ ] Cloud Run service deployed
- [ ] Health check returns 200
- [ ] API endpoints work
- [ ] Database queries succeed

---

## 🎯 Expected Result

After following all steps:

1. ✅ Cloud Build triggers on push to `auth-restore` branch
2. ✅ Docker image builds successfully
3. ✅ Image pushed to `gcr.io/projectsso-473108/team-sso-backend`
4. ✅ Cloud Run service deploys at: `https://team-sso-backend-520480129735.us-central1.run.app`
5. ✅ Service connects to Cloud SQL database
6. ✅ API endpoints return data (not 500 errors)
7. ✅ Frontend can call production API successfully

---

## 📞 Quick Links

- **Cloud Build Triggers**: https://console.cloud.google.com/cloud-build/triggers?project=projectsso-473108
- **Cloud Build History**: https://console.cloud.google.com/cloud-build/builds?project=projectsso-473108
- **Cloud Run Services**: https://console.cloud.google.com/run?project=projectsso-473108
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager?project=projectsso-473108
- **IAM Permissions**: https://console.cloud.google.com/iam-admin/iam?project=projectsso-473108
- **Cloud SQL Instances**: https://console.cloud.google.com/sql/instances?project=projectsso-473108

---

Last Updated: October 19, 2025
