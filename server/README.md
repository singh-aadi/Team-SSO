# Startup Scout & Optioneers - Backend API

## 🚀 MVP Backend Setup Guide

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Quick Start

#### 1. Install Dependencies
```bash
cd server
npm install
```

#### 2. Set Up PostgreSQL Database
```bash
# Create database
createdb startup_scout

# Or using psql
psql -U postgres
CREATE DATABASE startup_scout;
\q
```

#### 3. Run Database Schema
```bash
# From the server directory
psql -U postgres -d startup_scout -f schema.sql
```

#### 4. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your database credentials
```

#### 5. Seed Database (Optional but Recommended for MVP)
```bash
npm run db:seed
```

#### 6. Start Development Server
```bash
npm run dev
```

The API will be running at `http://localhost:5001`

---

## 📚 API Endpoints

### Health Check
```
GET /health
```

### Companies (Startup Radar)
```
GET    /api/companies              - Get all companies with filters
GET    /api/companies/:id          - Get single company
POST   /api/companies              - Create new company
GET    /api/companies/stats/overview - Get statistics
```

### Pitch Decks
```
GET    /api/decks                  - Get all decks
POST   /api/decks/upload           - Upload new deck
GET    /api/decks/:id              - Get deck with analysis
POST   /api/decks/:id/analyze      - Trigger analysis
```

### Industry Benchmarks
```
GET    /api/benchmarks             - Get benchmarks (filter by industry/stage)
GET    /api/benchmarks/industries  - Get list of industries
GET    /api/benchmarks/stages      - Get list of funding stages
```

### VC Features
```
GET    /api/vc/watchlist           - Get VC's watchlist
POST   /api/vc/watchlist           - Add company to watchlist
GET    /api/vc/portfolio           - Get VC's portfolio
GET    /api/vc/dashboard           - Get VC dashboard stats
```

---

## 🗄️ Database Schema

### Tables
- `users` - User accounts (VCs and Founders)
- `companies` - Startup/company information
- `pitch_decks` - Uploaded pitch decks
- `deck_analysis` - Analysis results for decks
- `industry_benchmarks` - Industry benchmark data
- `vc_watchlist` - Companies watched by VCs
- `vc_portfolio` - VC investments portfolio

---

## 🧪 Testing the API

### Using curl:
```bash
# Get all companies
curl http://localhost:5001/api/companies

# Get benchmarks for SaaS Seed stage
curl "http://localhost:5001/api/benchmarks?industry=SaaS&stage=Seed"

# Upload a deck
curl -X POST -F "deck=@pitch_deck.pdf" \
  -F "company_id=YOUR_COMPANY_ID" \
  -F "uploaded_by=YOUR_USER_ID" \
  http://localhost:5001/api/decks/upload
```

### Using Postman/Thunder Client:
Import the provided collection or use the endpoints above.

---

## 🔧 Development Scripts

```bash
npm run dev      # Start development server with auto-reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
npm run db:seed  # Seed database with sample data
```

---

## 📊 Sample Data

After seeding, you'll have:
- ✅ 5 sample companies across different industries
- ✅ 15+ benchmark metrics for SaaS, FinTech, E-commerce
- ✅ Multiple funding stages (Pre-Seed, Seed, Series A)

---

## 🔐 Environment Variables

```env
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=startup_scout
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3001
```

---

## 🚀 Next Steps

### Phase 1: Complete MVP (Current)
- [x] Database schema
- [x] API routes for companies
- [x] Benchmarks API
- [x] Deck upload functionality
- [ ] Connect frontend
- [ ] Add authentication middleware

### Phase 2: AI Integration
- [ ] PDF text extraction
- [ ] Deck analysis algorithm
- [ ] OpenAI integration for feedback
- [ ] Scoring system refinement

### Phase 3: Advanced Features
- [ ] Real-time notifications
- [ ] Webhooks for deck analysis
- [ ] Export to PDF reports
- [ ] Email notifications

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep startup_scout
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5002
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Notes

- The current implementation uses **mock data** for deck analysis
- File uploads are stored locally in `./uploads`
- For production, integrate cloud storage (AWS S3/Google Cloud Storage)
- Authentication is placeholder - integrate with your frontend OAuth

---

## 👥 Team Integration

### Backend Developer Tasks:
1. Set up local environment using this guide
2. Test all API endpoints
3. Review database schema
4. Implement actual deck analysis logic
5. Add authentication middleware

### Frontend Developer Tasks:
1. Update API base URL in frontend config
2. Integrate companies API with Startup Radar component
3. Connect benchmarks API to Dashboard
4. Implement deck upload with progress
5. Add error handling and loading states

---

For questions or issues, contact the team lead or create an issue in the repository.
