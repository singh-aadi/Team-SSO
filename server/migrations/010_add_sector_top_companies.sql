-- Migration 010: Add sector_top_companies table for benchmarking
-- This table stores top 10 performing companies per sector with their metrics

CREATE TABLE IF NOT EXISTS sector_top_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector VARCHAR(50) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 10),
  logo_url TEXT,
  description TEXT,
  website VARCHAR(255),
  founded_year INTEGER,
  
  -- Common Metrics (applicable to all sectors)
  common_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure: {
  --   "revenue": { "value": 5000000, "unit": "USD", "period": "ARR" },
  --   "growth_rate": { "value": 150, "unit": "percent", "period": "YoY" },
  --   "cac": { "value": 1200, "unit": "USD" },
  --   "ltv": { "value": 8400, "unit": "USD" },
  --   "ltv_cac_ratio": { "value": 7.0 },
  --   "burn_rate": { "value": 50000, "unit": "USD", "period": "monthly" },
  --   "runway": { "value": 18, "unit": "months" },
  --   "gross_margin": { "value": 85, "unit": "percent" },
  --   "employees": { "value": 45 },
  --   "funding_raised": { "value": 15000000, "unit": "USD" }
  -- }
  
  -- Sector-Specific Metrics (varies by sector)
  sector_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure varies by sector (see examples below)
  
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(sector, rank)
);

-- Create index for faster sector queries
CREATE INDEX idx_sector_top_companies_sector ON sector_top_companies(sector);
CREATE INDEX idx_sector_top_companies_rank ON sector_top_companies(rank);

-- Sector-specific metrics mapping (for documentation):
-- 
-- AI & ML (ai):
--   - model_accuracy: { value: 94.5, unit: "percent" }
--   - dataset_size: { value: 10000000, unit: "records" }
--   - inference_speed: { value: 50, unit: "ms" }
--   - compute_costs: { value: 5000, unit: "USD", period: "monthly" }
--   - api_calls: { value: 1000000, unit: "calls", period: "monthly" }
--
-- HealthTech & Biotech (healthtech):
--   - patient_acquisition_cost: { value: 150, unit: "USD" }
--   - patient_retention_rate: { value: 85, unit: "percent" }
--   - avg_revenue_per_patient: { value: 450, unit: "USD", period: "annual" }
--   - clinical_outcomes_index: { value: 92, unit: "score" }
--   - regulatory_approvals: { value: ["FDA", "CE"], unit: "list" }
--
-- FinTech & Payments (fintech):
--   - transaction_volume: { value: 50000000, unit: "USD", period: "monthly" }
--   - arpu: { value: 45, unit: "USD", period: "monthly" }
--   - default_rate: { value: 1.2, unit: "percent" }
--   - compliance_score: { value: 98, unit: "score" }
--   - aum: { value: 500000000, unit: "USD" }
--   - fraud_rate: { value: 0.05, unit: "percent" }
--
-- CleanTech & Sustainability (cleantech):
--   - carbon_abatement_cost: { value: 45, unit: "USD", per: "ton_co2" }
--   - energy_efficiency_ratio: { value: 3.5, unit: "ratio" }
--   - renewable_adoption_rate: { value: 65, unit: "percent" }
--   - compliance_score: { value: 95, unit: "score" }
--   - emissions_reduced: { value: 10000, unit: "tons_co2", period: "annual" }
--
-- EdTech & Learning (edtech):
--   - students_enrolled: { value: 50000, unit: "students" }
--   - completion_rate: { value: 75, unit: "percent" }
--   - engagement_rate: { value: 82, unit: "percent" }
--   - avg_revenue_per_student: { value: 120, unit: "USD", period: "annual" }
--   - nps: { value: 65, unit: "score" }
--
-- Food Tech & AgTech (foodtech):
--   - gmv: { value: 5000000, unit: "USD", period: "monthly" }
--   - order_frequency: { value: 3.5, unit: "orders", period: "monthly" }
--   - avg_order_value: { value: 45, unit: "USD" }
--   - food_waste_reduction: { value: 30, unit: "percent" }
--   - supply_chain_efficiency: { value: 88, unit: "score" }
--
-- SaaS & Enterprise B2B (saas):
--   - mrr: { value: 250000, unit: "USD" }
--   - arr: { value: 3000000, unit: "USD" }
--   - churn_rate: { value: 2.5, unit: "percent", period: "monthly" }
--   - nps: { value: 55, unit: "score" }
--   - customer_count: { value: 450, unit: "customers" }
--   - expansion_revenue: { value: 25, unit: "percent" }
--
-- E-commerce & Retail (ecommerce):
--   - gmv: { value: 10000000, unit: "USD", period: "monthly" }
--   - avg_order_value: { value: 75, unit: "USD" }
--   - conversion_rate: { value: 3.2, unit: "percent" }
--   - repeat_purchase_rate: { value: 45, unit: "percent" }
--   - cart_abandonment_rate: { value: 68, unit: "percent" }
--
-- Mobility & Transportation (mobility):
--   - rides_per_day: { value: 50000, unit: "rides" }
--   - avg_ride_value: { value: 18, unit: "USD" }
--   - driver_utilization: { value: 75, unit: "percent" }
--   - fleet_size: { value: 5000, unit: "vehicles" }
--   - customer_wait_time: { value: 5, unit: "minutes" }
--
-- PropTech & Real Estate (proptech):
--   - properties_listed: { value: 10000, unit: "properties" }
--   - avg_transaction_value: { value: 350000, unit: "USD" }
--   - time_to_close: { value: 45, unit: "days" }
--   - occupancy_rate: { value: 92, unit: "percent" }
--   - commission_rate: { value: 2.5, unit: "percent" }
--
-- Cybersecurity (cybersecurity):
--   - threats_detected: { value: 1000000, unit: "threats", period: "monthly" }
--   - false_positive_rate: { value: 0.5, unit: "percent" }
--   - response_time: { value: 2, unit: "minutes" }
--   - compliance_certifications: { value: ["SOC2", "ISO27001"], unit: "list" }
--   - security_score: { value: 98, unit: "score" }
--
-- Web3 & Blockchain (web3):
--   - active_wallets: { value: 100000, unit: "wallets", period: "monthly" }
--   - transaction_volume: { value: 50000000, unit: "USD", period: "monthly" }
--   - gas_optimization: { value: 85, unit: "percent" }
--   - tvl: { value: 100000000, unit: "USD" }
--   - network_uptime: { value: 99.9, unit: "percent" }
--
-- Other / General Tech (other):
--   - custom_metric_1: { value: 0, unit: "unit" }
--   - custom_metric_2: { value: 0, unit: "unit" }
--   - custom_metric_3: { value: 0, unit: "unit" }

COMMENT ON TABLE sector_top_companies IS 'Stores top 10 performing companies per sector with common and sector-specific metrics for benchmarking';
COMMENT ON COLUMN sector_top_companies.common_metrics IS 'Common metrics applicable to all sectors (revenue, growth, CAC, LTV, etc.)';
COMMENT ON COLUMN sector_top_companies.sector_metrics IS 'Sector-specific metrics that vary by industry vertical';
