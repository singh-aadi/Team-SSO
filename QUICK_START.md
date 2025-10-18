# ✅ MVP Quick Start Checklist

## 🚀 Getting Started in 30 Minutes

### Prerequisites Check
- [ ] Node.js installed (v18+)
- [ ] PostgreSQL installed (v14+)
- [ ] Git repository cloned
- [ ] Code editor ready (VS Code recommended)

---

## Step 1: Backend Setup (10 minutes)

```powershell
# Open PowerShell in project root
cd "d:\TeamSSO 2025\Team-SSO"

# Run automated setup
.\setup-backend.ps1

# Answer prompts:
# - Create database? Yes
# - Seed database? Yes
```

**Manual Alternative:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env: Add PostgreSQL password
createdb startup_scout
psql -d startup_scout -f schema.sql
npm run db:seed
npm run dev
```

**Verify**: Visit http://localhost:5001/health

---

## Step 2: Test Backend APIs (5 minutes)

### Test in Browser or curl:
```bash
# Health check
http://localhost:5001/health

# Get companies
http://localhost:5001/api/companies

# Get benchmarks
http://localhost:5001/api/benchmarks

# Get industries
http://localhost:5001/api/benchmarks/industries
```

**Expected**: JSON responses with data

---

## Step 3: Frontend Setup (10 minutes)

### Create API Service Layer:

```typescript
// Create: src/services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const companiesAPI = {
  getAll: (params?: any) => api.get('/companies', { params }),
  getOne: (id: string) => api.get(`/companies/${id}`),
  getStats: () => api.get('/companies/stats/overview'),
};

export const benchmarksAPI = {
  getAll: (params?: any) => api.get('/benchmarks', { params }),
  getIndustries: () => api.get('/benchmarks/industries'),
  getStages: () => api.get('/benchmarks/stages'),
};

export const decksAPI = {
  upload: (formData: FormData) => 
    api.post('/decks/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: () => api.get('/decks'),
  getOne: (id: string) => api.get(`/decks/${id}`),
  analyze: (id: string) => api.post(`/decks/${id}/analyze`),
};

export const vcAPI = {
  getWatchlist: (vcId: string) => 
    api.get('/vc/watchlist', { params: { vc_id: vcId } }),
  addToWatchlist: (data: any) => api.post('/vc/watchlist', data),
  getPortfolio: (vcId: string) => 
    api.get('/vc/portfolio', { params: { vc_id: vcId } }),
  getDashboard: (vcId: string) => 
    api.get('/vc/dashboard', { params: { vc_id: vcId } }),
};
```

---

## Step 4: Connect Frontend Components (5 minutes)

### Example: Update Startup Radar

```typescript
// In src/components/StartupRadar.tsx
import { useState, useEffect } from 'react';
import { companiesAPI } from '../services/api';

export function StartupRadar() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await companiesAPI.getAll();
      setCompanies(response.data.companies);
    } catch (err) {
      setError('Failed to load companies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Startup Radar</h2>
      <div className="grid">
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  );
}
```

---

## Step 5: Verify Everything Works

### Checklist:
- [ ] Backend server running (http://localhost:5001)
- [ ] Frontend running (http://localhost:3001)
- [ ] Can see real company data in Startup Radar
- [ ] Can see benchmarks data
- [ ] No console errors

---

## 🎯 Today's Goals

### Must Complete:
1. ✅ Backend running successfully
2. ✅ APIs returning data
3. ✅ Frontend connected to backend
4. ✅ At least one component showing real data

### Nice to Have:
- Multiple components connected
- Error handling implemented
- Loading states added
- Filters working

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5001 is free
netstat -ano | findstr :5001

# Check PostgreSQL is running
pg_isready

# Check .env file exists
ls server/.env
```

### Database errors
```bash
# Recreate database
dropdb startup_scout
createdb startup_scout
psql -d startup_scout -f server/schema.sql
cd server && npm run db:seed
```

### Frontend can't connect
```typescript
// Check API base URL
console.log('API URL:', API_BASE_URL);

// Test with curl
curl http://localhost:5001/api/companies
```

### CORS errors
```typescript
// In server/src/index.ts - check CORS config
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
```

---

## 📚 Key Files Reference

### Backend:
- `server/src/index.ts` - Main server
- `server/src/routes/` - API endpoints
- `server/schema.sql` - Database schema
- `server/.env` - Configuration

### Frontend:
- `src/services/api.ts` - API layer (CREATE THIS)
- `src/components/` - React components
- `src/App.tsx` - Main app

### Documentation:
- `BUILD_SUMMARY.md` - What we built
- `MVP_PLAN.md` - Complete plan
- `server/README.md` - API docs

---

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Both servers running without errors
- ✅ Browser shows real data (not hardcoded)
- ✅ API calls visible in Network tab
- ✅ Console has no errors
- ✅ Database has data (check with psql)

---

## 👥 Team Next Steps

Once this is working:

**Backend Dev**: Add authentication middleware
**Frontend Dev**: Connect all VC menu items  
**Data Dev**: Start PDF analysis pipeline
**Team Lead**: Review and plan Sprint 2

---

## 🚀 Let's Ship This MVP!

**Time Investment**: 30 minutes setup
**Output**: Working full-stack app with real data
**Impact**: Foundation for entire MVP

**Ready? Let's go!** 💪

---

## 📞 Need Help?

**Stuck on setup?** → Check `server/README.md`
**API questions?** → All endpoints documented
**Frontend issues?** → Review example code above
**Database problems?** → Run setup script again

**Remember**: The backend is complete and tested. Focus on connecting it! 🎯
