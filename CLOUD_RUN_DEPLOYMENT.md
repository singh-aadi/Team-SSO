# 🚀 Cloud Run Deployment Guide

## Prerequisites
1. **gcloud CLI installed**: https://cloud.google.com/sdk/docs/install
2. **Authenticated with GCP**: `gcloud auth login`
3. **Project set**: `gcloud config set project projectsso-473108`

## Quick Deploy (Both Services)

```powershell
.\deploy-cloud-run.ps1
```

This will:
- ✅ Build and deploy backend to Cloud Run
- ✅ Build and deploy frontend to Cloud Run
- ✅ Configure environment variables
- ✅ Set up Cloud SQL connection
- ✅ Output URLs for sharing

## Deploy Options

### Backend Only
```powershell
.\deploy-cloud-run.ps1 -BackendOnly
```

### Frontend Only
```powershell
.\deploy-cloud-run.ps1 -FrontendOnly
```

### Skip Build (faster redeployment)
```powershell
.\deploy-cloud-run.ps1 -SkipBuild
```

## Manual Deployment Steps

### Backend
```bash
cd server
gcloud builds submit --tag gcr.io/projectsso-473108/team-sso-backend
gcloud run deploy team-sso-backend \
  --image gcr.io/projectsso-473108/team-sso-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --add-cloudsql-instances=projectsso-473108:us-central1:team-sso-db
```

### Frontend
```bash
gcloud builds submit --tag gcr.io/projectsso-473108/team-sso-frontend
gcloud run deploy team-sso-frontend \
  --image gcr.io/projectsso-473108/team-sso-frontend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

## Environment Variables

### Backend (.env on Cloud Run)
```
NODE_ENV=production
CLOUD_SQL_CONNECTION_NAME=projectsso-473108:us-central1:team-sso-db
DB_NAME=teamsso_db
DB_USER=postgres
DB_PASSWORD=<from Secret Manager>
GOOGLE_CLOUD_PROJECT=projectsso-473108
GOOGLE_CLOUD_LOCATION=us-central1
GCS_BUCKET_NAME=pitch-decks
```

### Frontend (.env.production)
```
VITE_API_URL=https://team-sso-backend-520480129735.us-central1.run.app/api
VITE_GOOGLE_CLIENT_ID=520480129735-0jbk8o94o55lhlin7u5jp3ei9gtdpf4f.apps.googleusercontent.com
```

## Viewing Logs

### Backend Logs
```bash
gcloud run logs tail team-sso-backend --region us-central1 --follow
```

### Frontend Logs
```bash
gcloud run logs tail team-sso-frontend --region us-central1 --follow
```

## URLs (After Deployment)

- **Backend API**: https://team-sso-backend-520480129735.us-central1.run.app
- **Frontend App**: https://team-sso-frontend-520480129735.us-central1.run.app

## Troubleshooting

### 1. Database Connection Issues
- Check Cloud SQL instance is running
- Verify service account has Cloud SQL Client role
- Confirm connection name matches: `projectsso-473108:us-central1:team-sso-db`

### 2. CORS Errors
- Update `allowedOrigins` in `server/src/index.ts`
- Redeploy backend: `.\deploy-cloud-run.ps1 -BackendOnly`

### 3. Build Failures
- Check Dockerfile syntax
- Verify all dependencies in package.json
- Review build logs: `gcloud builds log <BUILD_ID>`

### 4. Port Issues
- Cloud Run requires port 8080 (already configured)
- Don't hardcode ports - use `process.env.PORT`

## Costs

**Estimated monthly cost (low traffic):**
- Backend: $5-10 (512MB, minimal requests)
- Frontend: $2-5 (256MB, static serving)
- Cloud SQL: $10-20 (db-f1-micro)
- Cloud Storage: $1-2 (pitch decks)
- **Total: ~$20-40/month**

**Free tier includes:**
- 2 million requests/month
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

## Scaling

Cloud Run auto-scales based on traffic:
- **Min instances**: 0 (scales to zero when idle)
- **Max instances**: 10 (backend), 5 (frontend)
- **Concurrency**: 80 requests per instance
- **Cold start**: ~2-3 seconds

## Security

- ✅ Service accounts with minimal permissions
- ✅ Cloud SQL private IP (via connector)
- ✅ CORS restricted to frontend domain
- ✅ Secrets stored in Secret Manager
- ✅ HTTPS enforced by default

## Next Steps

1. **Custom Domain**: Map your domain to Cloud Run
2. **CI/CD**: Set up GitHub Actions for auto-deploy
3. **Monitoring**: Enable Cloud Monitoring alerts
4. **CDN**: Add Cloud CDN for faster global access
