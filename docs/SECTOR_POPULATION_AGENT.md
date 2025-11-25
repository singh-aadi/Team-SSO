# Sector Benchmarking - Database Population

## Overview
AI-powered agent that populates the `sector_top_companies` table with realistic data for all 13 sectors.

## Architecture

### Service: `sectorDataPopulator.ts`
- Uses **Gemini 2.5 Flash** to research and generate top 10 companies per sector
- Generates realistic metrics based on industry standards
- Supports all 13 sectors with sector-specific metrics

### Sectors Supported
1. **AI & ML** - Model accuracy, dataset size, inference speed, compute costs, API calls
2. **HealthTech & Biotech** - Patient metrics, clinical outcomes, regulatory approvals
3. **FinTech & Payments** - Transaction volume, ARPU, default rate, AUM, fraud rate
4. **CleanTech & Sustainability** - Carbon abatement, energy efficiency, emissions
5. **EdTech & Learning** - Students enrolled, completion rate, engagement
6. **Food Tech & AgTech** - GMV, order frequency, food waste reduction
7. **SaaS & Enterprise B2B** - MRR, ARR, churn rate, NPS, expansion revenue
8. **E-commerce & Retail** - GMV, AOV, conversion rate, repeat purchase rate
9. **Mobility & Transportation** - Rides per day, driver utilization, fleet size
10. **PropTech & Real Estate** - Properties listed, transaction value, occupancy
11. **Cybersecurity** - Threats detected, false positive rate, response time
12. **Web3 & Blockchain** - Active wallets, transaction volume, TVL
13. **Other / General Tech** - Custom metrics

## Usage

### CLI Script
```bash
cd server

# Populate single sector
npm run populate-sectors ai
npm run populate-sectors fintech
npm run populate-sectors saas

# Populate all sectors (takes ~30 seconds with 2s delay between sectors)
npm run populate-sectors all
```

### API Endpoints

#### Populate Single Sector
```bash
POST /api/sector-benchmarks/sectors/:sectorId/refresh
```

Example:
```bash
curl -X POST http://localhost:3000/api/sector-benchmarks/sectors/ai/refresh
```

#### Populate All Sectors
```bash
POST /api/sector-benchmarks/populate-all
```

Example:
```bash
curl -X POST http://localhost:3000/api/sector-benchmarks/populate-all
```

## How It Works

1. **AI Prompt Engineering**
   - Service sends detailed prompt to Gemini 2.5 Flash
   - Includes sector description, required metrics, output format
   - Requests top 10 companies ranked by performance

2. **Response Processing**
   - Parses JSON response from AI
   - Validates structure (must have 10 companies)
   - Cleans markdown code blocks if present

3. **Database Storage**
   - Deletes existing data for sector (if refresh)
   - Inserts new companies with metrics as JSONB
   - Transactional (rollback on error)

4. **Rate Limiting**
   - 2-second delay between sectors when populating all
   - Prevents API rate limiting

## Data Structure

Each company record contains:

### Common Metrics (all sectors)
- `revenue` - Annual/ARR/MRR revenue
- `growth_rate` - YoY/MoM growth percentage
- `cac` - Customer Acquisition Cost
- `ltv` - Lifetime Value
- `ltv_cac_ratio` - LTV:CAC ratio
- `burn_rate` - Monthly burn rate
- `runway` - Months of runway
- `gross_margin` - Gross margin percentage
- `employees` - Employee count
- `funding_raised` - Total funding raised

### Sector Metrics (varies by sector)
See `SECTOR_DEFINITIONS` in `sectorDataPopulator.ts` for complete list.

## Example Output

```json
{
  "rank": 1,
  "company_name": "OpenAI",
  "description": "Leading AI research and deployment company",
  "founded_year": 2015,
  "website": "https://openai.com",
  "common_metrics": {
    "revenue": { "value": 1600000000, "unit": "USD", "period": "ARR" },
    "growth_rate": { "value": 200, "unit": "percent", "period": "YoY" },
    "cac": { "value": 5000, "unit": "USD" },
    "ltv": { "value": 50000, "unit": "USD" }
  },
  "sector_metrics": {
    "model_accuracy": { "value": 96.5, "unit": "percent" },
    "dataset_size": { "value": 175000000000, "unit": "parameters" },
    "api_calls": { "value": 10000000000, "unit": "calls", "period": "monthly" }
  }
}
```

## Error Handling

- **Invalid JSON**: Catches parse errors and returns error message
- **Missing Companies**: Validates array has exactly 10 companies
- **Database Errors**: Rolls back transaction on failure
- **Rate Limiting**: Adds delays to prevent API throttling

## Testing

1. **Test Single Sector**
```bash
npm run populate-sectors ai
```

2. **Verify in Database**
```bash
psql -U postgres -d teamsso_db -c "SELECT company_name, rank FROM sector_top_companies WHERE sector = 'ai' ORDER BY rank;"
```

3. **Check via API**
```bash
curl http://localhost:3000/api/sector-benchmarks/sectors/ai/companies
```

## Notes

- First run may be slower as AI generates data
- Subsequent refreshes replace existing data
- Metrics are realistic estimates based on public data
- Founded years are actual years when known
- All monetary values in USD

## Future Enhancements

- [ ] Add caching layer (Redis)
- [ ] Implement incremental updates instead of full replace
- [ ] Add data validation rules per metric
- [ ] Support custom date ranges for historical data
- [ ] Add company logo fetching from Clearbit/Brandfetch
- [ ] Implement data quality scoring
