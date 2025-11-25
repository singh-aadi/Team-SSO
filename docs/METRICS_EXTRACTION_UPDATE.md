# Metrics Extraction Update

## Overview
Updated the AI pitch deck analysis agent to automatically extract quantitative metrics during analysis, making them available for sector benchmarking comparisons.

## Changes Made

### 1. AI Prompt Enhancement (`server/src/services/ai-enhanced.ts`)

**Added metrics extraction requirements to the analysis prompt:**
- Extract all numeric metrics (revenue, growth, CAC, LTV, burn rate, runway, etc.)
- Convert monetary values to raw numbers (e.g., "$2.5M" → 2500000)
- Mark unavailable metrics as null (no fabrication)
- Identify sector-specific KPIs based on company industry

**New JSON Response Structure:**
```json
{
  "overallAnalysis": {
    // ... existing fields ...
    "extractedMetrics": {
      "common": {
        "revenue": { "value": 2500000, "unit": "USD", "period": "ARR" },
        "growth_rate": { "value": 180, "unit": "percent", "period": "YoY" },
        "cac": { "value": 250, "unit": "USD" },
        "ltv": { "value": 2500, "unit": "USD" },
        "ltv_cac_ratio": { "value": 10, "unit": "ratio" },
        "burn_rate": { "value": 50000, "unit": "USD", "period": "monthly" },
        "runway": { "value": 18, "unit": "months" },
        "gross_margin": { "value": 75, "unit": "percent" },
        "employees": { "value": 12, "unit": "count" },
        "funding_raised": { "value": 1500000, "unit": "USD" }
      },
      "sector_specific": {
        // Dynamic based on industry
        // AI: model_accuracy, dataset_size, api_calls
        // SaaS: churn_rate, net_revenue_retention, mrr_growth
      }
    }
  }
}
```

### 2. TypeScript Interface Updates

**New Interfaces:**
```typescript
interface MetricValue {
  value: number | null;
  unit: string;
  period?: string;
}

interface ExtractedMetrics {
  common: {
    revenue?: MetricValue | null;
    growth_rate?: MetricValue | null;
    cac?: MetricValue | null;
    ltv?: MetricValue | null;
    ltv_cac_ratio?: MetricValue | null;
    burn_rate?: MetricValue | null;
    runway?: MetricValue | null;
    gross_margin?: MetricValue | null;
    employees?: MetricValue | null;
    funding_raised?: MetricValue | null;
  };
  sector_specific: {
    [key: string]: MetricValue | null;
  };
}
```

**Updated AnalysisResult:**
- Added `extractedMetrics?: ExtractedMetrics` field

### 3. Database Storage (`server/src/routes/decks.ts`)

**Updated both analysis UPDATE queries to save metrics:**

```sql
UPDATE pitch_decks 
SET analysis_status = 'completed', 
    sso_score = $1, 
    dual_pdf_analysis = $2,
    extracted_metrics = $3,  -- NEW: Store metrics for benchmarking
    vc_preferences_used = $4,
    analyzed_at = CURRENT_TIMESTAMP
WHERE id = $5
```

**Added logging:**
```javascript
if (analysis.extractedMetrics) {
  const commonMetricsCount = Object.keys(analysis.extractedMetrics.common || {})
    .filter(k => analysis.extractedMetrics.common[k] !== null).length;
  console.log(`   📊 Extracted Metrics: ${commonMetricsCount} common metrics found`);
}
```

## Benefits

1. **Automatic Extraction** - No manual metric input required
2. **Benchmarking Ready** - Metrics stored in same format as sector benchmark data
3. **Structured Data** - Consistent format across all decks for comparison
4. **Null Handling** - Missing metrics explicitly marked, not fabricated
5. **Sector-Aware** - Dynamically extracts industry-relevant KPIs

## Integration with Benchmarking

The extracted metrics are stored in the `extracted_metrics` JSONB column and are automatically used by the sector benchmarking feature:

```sql
SELECT extracted_metrics FROM pitch_decks WHERE id = 'deck_id';
```

The `/api/sector-benchmarks/decks/:deckId/benchmark` endpoint prioritizes `extracted_metrics` over regex-based extraction from analysis text:

```javascript
const deckMetrics = deck.extracted_metrics || extractMetricsFromAnalysis(deck.dual_pdf_analysis);
```

## Testing

**To test the feature:**

1. Upload a new pitch deck with checklist (triggers analysis)
2. Wait for analysis to complete (`analysis_status = 'completed'`)
3. Check database: 
   ```sql
   SELECT extracted_metrics FROM pitch_decks WHERE id = '<deck_id>';
   ```
4. Navigate to `/sector-benchmarks` → "Benchmark Your Deck" tab
5. Select the analyzed deck
6. Click "Show Benchmark Comparison"
7. Verify metrics are populated (not all N/A)

## Common Metrics Extracted

| Metric | Unit | Description |
|--------|------|-------------|
| revenue | USD | Annual Recurring Revenue (ARR) or Monthly (MRR) |
| growth_rate | percent | Year-over-Year or Month-over-Month growth |
| cac | USD | Customer Acquisition Cost |
| ltv | USD | Customer Lifetime Value |
| ltv_cac_ratio | ratio | LTV to CAC ratio |
| burn_rate | USD | Monthly cash burn |
| runway | months | Months of cash remaining |
| gross_margin | percent | Gross profit margin |
| employees | count | Team size |
| funding_raised | USD | Total funding to date |

## Sector-Specific Examples

**AI/ML Companies:**
- model_accuracy (percent)
- dataset_size (count)
- inference_speed (ms)
- compute_costs (USD/month)
- api_calls (count/day)

**SaaS Companies:**
- churn_rate (percent)
- net_revenue_retention (percent)
- mrr_growth (percent)
- active_users (count)
- expansion_revenue (USD)

**FinTech:**
- transaction_volume (USD)
- processing_fee (percent)
- fraud_rate (percent)
- payment_success_rate (percent)
- regulatory_licenses (count)

## Future Enhancements

- [ ] Add confidence scores for extracted metrics
- [ ] Validate metrics against industry norms
- [ ] Historical tracking of metric changes
- [ ] Automatic metric suggestions based on industry
- [ ] Multi-currency support with conversion
- [ ] Metric anomaly detection
