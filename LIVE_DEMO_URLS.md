# 🚀 Team SSO - Live Demo

## Your Live URLs

### 🎯 **Share This With Your Friends!**
**Frontend App:**
https://team-sso-frontend-520480129735.us-central1.run.app

**Backend API:**
https://team-sso-backend-520480129735.us-central1.run.app

---

## ✅ What's Deployed

Your complete Team SSO platform is now running on Google Cloud Run:

### Frontend
- ✅ React + TypeScript + Vite app
- ✅ Google OAuth login
- ✅ Role-based dashboards (VC vs Founder)
- ✅ All 7 VC tabs (Dashboard, Deck Intelligence, VC Mode, Startup Radar, Glossary, Journey, Benchmarks)
- ✅ All 5 Founder tabs
- ✅ Responsive design with Tailwind CSS

### Backend
- ✅ Express + TypeScript API
- ✅ Connected to Cloud SQL PostgreSQL
- ✅ Vertex AI Gemini 2.0 Flash integration
- ✅ Cloud Storage for pitch decks
- ✅ All API endpoints working

---

## 📱 Test It Out

1. **Visit:** https://team-sso-frontend-520480129735.us-central1.run.app
2. **Click "Sign in with Google"**
3. **Select Role:** VC or Founder
4. **Try Features:**
   - Upload a pitch deck
   - Run AI analysis
   - Customize evaluation criteria
   - Download enhanced PDF reports
   - Track startups in radar

---

## 🔐 Demo Accounts

If you want to create demo accounts without Google OAuth:

```sql
-- Run this in your Cloud SQL database
INSERT INTO users (email, name, user_type) VALUES
('demo.vc@teamsso.com', 'Demo VC', 'vc'),
('demo.founder@teamsso.com', 'Demo Founder', 'founder');
```

---

## 📊 Features Your Friends Can Try

### For VCs:
- **Guided Evaluation Wizard**: Upload deck + checklist with context
- **Agentic VC Mode**: Customize evaluation criteria, AI generates custom prompts
- **Growth Forecasting**: AI-powered 3/5/10 year projections
- **Context Intelligence**: Upload meeting notes, transcripts
- **Enhanced PDF Reports**: Professional multi-page reports with benchmarks
- **Startup Radar**: Track companies and news

### For Founders:
- **Deck Analysis**: Upload pitch deck, get SSO Score + feedback
- **Industry Benchmarks**: Compare against similar startups
- **SSO Glossary**: 200+ startup metrics explained
- **Founder Journey**: Track milestones (WIP)

---

## 💡 What Makes This Special

1. **Agentic AI**: The system adapts prompts based on your investment thesis
2. **Dual Document Analysis**: Analyzes pitch deck + internal checklist together
3. **Context-Aware**: Uses meeting notes and transcripts for deeper insights
4. **7 Dimensions**: Team, Market, Product, Traction, Business Model, Financials, Risk
5. **100% Consistent**: Same criteria applied to every deal

---

## 🔧 Monitoring & Logs

### View Real-Time Logs
```bash
# Backend logs
gcloud run logs tail team-sso-backend --region us-central1 --follow

# Frontend logs
gcloud run logs tail team-sso-frontend --region us-central1 --follow
```

### Check Service Status
```bash
gcloud run services list --region us-central1
```

---

## 💰 Costs

**Current Setup (Auto-scales to zero):**
- Backend: ~$5-10/month (512MB RAM, minimal traffic)
- Frontend: ~$2-5/month (256MB RAM)
- Cloud SQL: ~$10-20/month (db-f1-micro)
- **Total: ~$20-40/month**

**Free tier covers 2M requests/month** - plenty for demos and testing!

---

## 🚀 Redeployment

### Update Backend
```powershell
cd server
npm run build
gcloud builds submit --tag gcr.io/projectsso-473108/team-sso-backend
gcloud run deploy team-sso-backend --image gcr.io/projectsso-473108/team-sso-backend --region us-central1
```

### Update Frontend
```powershell
npm run build
gcloud builds submit --tag gcr.io/projectsso-473108/team-sso-frontend
gcloud run deploy team-sso-frontend --image gcr.io/projectsso-473108/team-sso-frontend --region us-central1
```

### Or Use Script
```powershell
.\deploy.ps1              # Deploy both
.\deploy.ps1 -BackendOnly # Backend only
.\deploy.ps1 -FrontendOnly# Frontend only
```

---

## 📞 Share These URLs

**Main App:**
🔗 https://team-sso-frontend-520480129735.us-central1.run.app

**API Docs:**
🔗 https://team-sso-backend-520480129735.us-central1.run.app/health

**GitHub Repo:**
🔗 https://github.com/singh-aadi/Team-SSO

---

## 🎉 Next Steps

1. **Share the URL** with your friends
2. **Gather feedback** on features they love
3. **Track usage** in Cloud Console
4. **Add custom domain** (optional): teamsso.ai or similar
5. **Enable Cloud CDN** for faster global access
6. **Set up monitoring alerts** for downtime

---

*Built with ❤️ by Team SSO - Smart Pitch Deck Analysis Platform*
*Powered by Google Cloud Run + Vertex AI Gemini 2.0 Flash*
