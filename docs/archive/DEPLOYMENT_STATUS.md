# Google Cloud Deployment Status

## ✅ Completed Setup (As of 2025-10-18)

### 1. Google Cloud Project Configuration
- **Project ID**: `projectsso-473108`
- **Region**: `us-central1`
- **APIs Enabled**:
  - ✅ Cloud Storage API
  - ✅ Cloud SQL Admin API
  - ✅ Cloud Run API
  - ✅ Cloud Build API
  - ✅ Secret Manager API

### 2. Cloud Storage
- **Bucket Created**: `gs://projectsso-pitch-decks`
- **Location**: us-central1
- **Access**: Uniform bucket-level access
- **Public Access**: Prevented
- **IAM Permissions**:
  - Backend service account: `roles/storage.objectAdmin`
  - Cloud SQL service account: `roles/storage.objectViewer`

### 3. Service Account
- **Name**: `team-sso-backend-sa`
- **Email**: `team-sso-backend-sa@projectsso-473108.iam.gserviceaccount.com`
- **Key Location**: `./server/service-account-key.json` ⚠️ (NOT COMMITTED)
- **Permissions**:
  - Cloud Storage Object Admin
  - Cloud SQL Client
  - Secret Manager Secret Accessor

### 4. Cloud SQL Database
- **Instance Name**: `team-sso-db`
- **Database Version**: PostgreSQL 15
- **Tier**: db-f1-micro (budget-friendly)
- **Location**: us-central1-c
- **IP Address**: 162.222.179.30
- **Connection Name**: `projectsso-473108:us-central1:team-sso-db`
- **Database**: `teamsso_db`
- **Status**: ✅ RUNNABLE

#### Database Schema
✅ **Schema Applied** (7 tables):
- `users` - User accounts (VC and founders)
- `companies` - Startup company profiles
- `pitch_decks` - Uploaded pitch deck files
- `deck_analysis` - AI analysis sections and scores
- `industry_benchmarks` - Market benchmark data
- `vc_watchlist` - VC tracking list
- `vc_portfolio` - VC portfolio companies

#### Sample Data Seeded
✅ **Data Imported Successfully**:
- 2 sample users (VC and founder)
- 5 sample companies (TechFlow AI, GreenEats, HealthTrack Pro, FinanceHub, EduStream)
- 19 industry benchmarks (AI/ML, FinTech, HealthTech)
- 1 sample pitch deck with analysis
- 1 VC watchlist entry

### 5. Environment Configuration
✅ **Local Development** (`server/.env`):
```
DATABASE_URL=postgresql://postgres:160Im4xAykflQasNpgPv@127.0.0.1:5432/teamsso_db
DB_PASSWORD=160Im4xAykflQasNpgPv
CLOUD_SQL_CONNECTION_NAME=projectsso-473108:us-central1:team-sso-db
GCS_BUCKET_NAME=projectsso-pitch-decks
JWT_SECRET=y5K8w2XdP9mQ3vR7nL6tU1hF4jG0zB2c
```

## ⏳ Next Steps (To Complete MVP)

### Step 1: Complete Backend Deployment
Build and deploy the backend to Cloud Run (was interrupted):

```powershell
cd "d:\TeamSSO 2025\Team-SSO\server"

# Build Docker image (takes 3-5 minutes)
gcloud builds submit --tag gcr.io/projectsso-473108/team-sso-backend --timeout=15m

# Deploy to Cloud Run
gcloud run deploy team-sso-backend `
  --image gcr.io/projectsso-473108/team-sso-backend `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --service-account team-sso-backend-sa@projectsso-473108.iam.gserviceaccount.com `
  --add-cloudsql-instances projectsso-473108:us-central1:team-sso-db `
  --set-env-vars "NODE_ENV=production,GCS_BUCKET_NAME=projectsso-pitch-decks,JWT_SECRET=y5K8w2XdP9mQ3vR7nL6tU1hF4jG0zB2c,GOOGLE_CLIENT_ID=520480129735-0jbk8o94o55lhlin7u5jp3ei9gtdpf4f.apps.googleusercontent.com,DB_NAME=teamsso_db,DB_USER=postgres,DB_PASSWORD=160Im4xAykflQasNpgPv,CLOUD_SQL_CONNECTION_NAME=projectsso-473108:us-central1:team-sso-db"
```

### Step 2: Get Cloud Run URL
After deployment completes:
```powershell
gcloud run services describe team-sso-backend --region us-central1 --format="value(status.url)"
```

You'll get a URL like: `https://team-sso-backend-xxxx-uc.a.run.app`

### Step 3: Update Frontend Configuration
Create `src/config.ts`:
```typescript
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://team-sso-backend-xxxx-uc.a.run.app' // Replace with your Cloud Run URL
  : 'http://localhost:3000';
```

### Step 4: Create Frontend API Service
Create `src/services/api.ts`:
```typescript
import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Step 5: Test the Deployment
```powershell
# Test health check
curl https://team-sso-backend-xxxx-uc.a.run.app/health

# Test companies endpoint
curl https://team-sso-backend-xxxx-uc.a.run.app/api/companies
```

### Step 6: Update CORS in Backend
In `server/src/index.ts`, update the CORS origin to your Vercel frontend URL:
```typescript
app.use(cors({
  origin: 'https://your-app.vercel.app',
  credentials: true
}));
```

### Step 7: Deploy Frontend to Vercel
```powershell
cd "d:\TeamSSO 2025\Team-SSO"
vercel --prod
```

## 📊 Cost Estimate

Current monthly costs with your setup:
- **Cloud SQL** (db-f1-micro): ~$7-10/month
- **Cloud Storage**: ~$1-2/month
- **Cloud Run**: ~$5-10/month (MVP traffic)
- **Total**: ~$15-25/month

**Your $500 credits will last**: 20-33 months! 🎉

## 🔐 Security Checklist

- ✅ Service account key is gitignored
- ✅ Database password is secure (20 characters)
- ✅ JWT secret is set
- ✅ Cloud Storage bucket has public access prevention
- ✅ Cloud SQL only accepts connections from Cloud Run
- ⚠️ **TODO**: Update CORS to only allow your frontend domain
- ⚠️ **TODO**: Set up SSL/HTTPS for production
- ⚠️ **TODO**: Enable Cloud SQL backup retention (currently 7 days)

## 🛠️ Local Development

To run the backend locally with Cloud SQL:

1. **Start Cloud SQL Proxy**:
```powershell
.\cloud-sql-proxy.exe projectsso-473108:us-central1:team-sso-db
```

2. **In another terminal, start backend**:
```powershell
cd server
npm run dev
```

3. **Test locally**:
```powershell
curl http://localhost:3000/health
curl http://localhost:3000/api/companies
```

## 📝 Database Management

### Connect to Database
```powershell
# Option 1: Via gcloud
gcloud sql connect team-sso-db --user=postgres --database=teamsso_db

# Option 2: Via Cloud SQL Proxy (if running)
psql -h 127.0.0.1 -U postgres -d teamsso_db
```

### Run Migrations
```powershell
gcloud storage cp server/schema.sql gs://projectsso-pitch-decks/schema.sql
gcloud sql import sql team-sso-db gs://projectsso-pitch-decks/schema.sql --database=teamsso_db --quiet
```

### Backup Database
```powershell
gcloud sql export sql team-sso-db gs://projectsso-pitch-decks/backups/backup-$(Get-Date -Format 'yyyy-MM-dd').sql --database=teamsso_db
```

## 🎯 Next Features to Implement

1. **PDF Processing** (Cloud Functions)
   - Extract text from uploaded PDFs
   - Parse deck sections
   - Send to AI for analysis

2. **Real AI Integration**
   - Replace mock analysis with actual AI (OpenAI/Anthropic)
   - Implement scoring algorithms
   - Generate actionable feedback

3. **Advanced VC Features**
   - Deal flow pipeline
   - Portfolio analytics
   - Investment tracking
   - Email notifications

4. **Authentication Enhancement**
   - Email verification
   - Password reset
   - Multi-factor authentication
   - Session management

## 📚 Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Proxy Setup](https://cloud.google.com/sql/docs/postgres/connect-instance-auth-proxy)
- [Cloud Storage Best Practices](https://cloud.google.com/storage/docs/best-practices)
- [Vercel Deployment Guide](https://vercel.com/docs)

## 🆘 Troubleshooting

### Build Fails
```powershell
# Check build logs
gcloud builds list --limit=5

# View specific build
gcloud builds log <BUILD_ID>
```

### Database Connection Issues
```powershell
# Check instance status
gcloud sql instances describe team-sso-db

# Check operations
gcloud sql operations list --instance=team-sso-db --limit=5
```

### Storage Upload Fails
```powershell
# Check IAM permissions
gcloud storage buckets get-iam-policy gs://projectsso-pitch-decks
```

---

**Last Updated**: October 18, 2025
**Status**: ✅ Infrastructure Complete | ⏳ Deployment In Progress
