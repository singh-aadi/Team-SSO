-- Seed data for sector_top_companies table
-- Top 10 companies per sector with realistic metrics

-- Delete existing data
DELETE FROM sector_top_companies;

-- AI & ML Sector
INSERT INTO sector_top_companies (sector, company_name, rank, description, founded_year, common_metrics, sector_metrics) VALUES
('ai', 'OpenAI', 1, 'Leading AI research and deployment company', 2015, 
  '{"revenue": {"value": 1600000000, "unit": "USD", "period": "ARR"}, "growth_rate": {"value": 200, "unit": "percent", "period": "YoY"}, "cac": {"value": 5000, "unit": "USD"}, "ltv": {"value": 50000, "unit": "USD"}, "ltv_cac_ratio": {"value": 10.0}, "burn_rate": {"value": 50000000, "unit": "USD", "period": "monthly"}, "runway": {"value": 36, "unit": "months"}, "gross_margin": {"value": 92, "unit": "percent"}, "employees": {"value": 750}, "funding_raised": {"value": 11300000000, "unit": "USD"}}'::jsonb,
  '{"model_accuracy": {"value": 96.5, "unit": "percent"}, "dataset_size": {"value": 175000000000, "unit": "parameters"}, "inference_speed": {"value": 30, "unit": "ms"}, "compute_costs": {"value": 15000000, "unit": "USD", "period": "monthly"}, "api_calls": {"value": 10000000000, "unit": "calls", "period": "monthly"}}'::jsonb),
  
('ai', 'Anthropic', 2, 'AI safety and research company', 2021,
  '{"revenue": {"value": 850000000, "unit": "USD", "period": "ARR"}, "growth_rate": {"value": 180, "unit": "percent", "period": "YoY"}, "cac": {"value": 4500, "unit": "USD"}, "ltv": {"value": 45000, "unit": "USD"}, "ltv_cac_ratio": {"value": 10.0}, "burn_rate": {"value": 40000000, "unit": "USD", "period": "monthly"}, "runway": {"value": 30, "unit": "months"}, "gross_margin": {"value": 90, "unit": "percent"}, "employees": {"value": 450}, "funding_raised": {"value": 7300000000, "unit": "USD"}}'::jsonb,
  '{"model_accuracy": {"value": 95.8, "unit": "percent"}, "dataset_size": {"value": 120000000000, "unit": "parameters"}, "inference_speed": {"value": 35, "unit": "ms"}, "compute_costs": {"value": 12000000, "unit": "USD", "period": "monthly"}, "api_calls": {"value": 5000000000, "unit": "calls", "period": "monthly"}}'::jsonb),

('ai', 'Stability AI', 3, 'Open-source generative AI platform', 2020,
  '{"revenue": {"value": 450000000, "unit": "USD", "period": "ARR"}, "growth_rate": {"value": 160, "unit": "percent", "period": "YoY"}, "cac": {"value": 3500, "unit": "USD"}, "ltv": {"value": 35000, "unit": "USD"}, "ltv_cac_ratio": {"value": 10.0}, "burn_rate": {"value": 25000000, "unit": "USD", "period": "monthly"}, "runway": {"value": 24, "unit": "months"}, "gross_margin": {"value": 88, "unit": "percent"}, "employees": {"value": 320}, "funding_raised": {"value": 1100000000, "unit": "USD"}}'::jsonb,
  '{"model_accuracy": {"value": 94.2, "unit": "percent"}, "dataset_size": {"value": 85000000000, "unit": "parameters"}, "inference_speed": {"value": 40, "unit": "ms"}, "compute_costs": {"value": 8000000, "unit": "USD", "period": "monthly"}, "api_calls": {"value": 3000000000, "unit": "calls", "period": "monthly"}}'::jsonb),

('ai', 'Cohere', 4, 'Enterprise AI platform for language models', 2019,
  '{"revenue": {"value": 380000000, "unit": "USD", "period": "ARR"}, "growth_rate": {"value": 145, "unit": "percent", "period": "YoY"}, "cac": {"value": 4000, "unit": "USD"}, "ltv": {"value": 38000, "unit": "USD"}, "ltv_cac_ratio": {"value": 9.5}, "burn_rate": {"value": 22000000, "unit": "USD", "period": "monthly"}, "runway": {"value": 28, "unit": "months"}, "gross_margin": {"value": 87, "unit": "percent"}, "employees": {"value": 285}, "funding_raised": {"value": 445000000, "unit": "USD"}}'::jsonb,
  '{"model_accuracy": {"value": 93.5, "unit": "percent"}, "dataset_size": {"value": 70000000000, "unit": "parameters"}, "inference_speed": {"value": 42, "unit": "ms"}, "compute_costs": {"value": 6500000, "unit": "USD", "period": "monthly"}, "api_calls": {"value": 2500000000, "unit": "calls", "period": "monthly"}}'::jsonb),

('ai', 'Scale AI', 5, 'Data labeling and AI infrastructure', 2016,
  '{"revenue": {"value": 350000000, "unit": "USD", "period": "ARR"}, "growth_rate": {"value": 130, "unit": "percent", "period": "YoY"}, "cac": {"value": 3800, "unit": "USD"}, "ltv": {"value": 36000, "unit": "USD"}, "ltv_cac_ratio": {"value": 9.5}, "burn_rate": {"value": 18000000, "unit": "USD", "period": "monthly"}, "runway": {"value": 32, "unit": "months"}, "gross_margin": {"value": 85, "unit": "percent"}, "employees": {"value": 450}, "funding_raised": {"value": 603000000, "unit": "USD"}}'::jsonb,
  '{"model_accuracy": {"value": 92.8, "unit": "percent"}, "dataset_size": {"value": 50000000000, "unit": "records"}, "inference_speed": {"value": 45, "unit": "ms"}, "compute_costs": {"value": 5000000, "unit": "USD", "period": "monthly"}, "api_calls": {"value": 2000000000, "unit": "calls", "period": "monthly"}}'::jsonb),

('ai', 'Hugging Face', 6, 'Open-source AI model hub', 2016,
  '{"revenue": {"value": 280000000, "unit": "USD", "period": "ARR"}, "growth_rate": {"value": 150, "unit": "percent", "period": "YoY"}, "cac": {"value": 3200, "unit": "USD"}, "ltv": {"value": 30000, "unit": "USD"}, "ltv_cac_ratio": {"value": 9.4}, "burn_rate": {"value": 15000000, "unit": "USD", "period": "monthly"}, "runway": {"value": 26, "unit": "months"}, "gross_margin": {"value": 84, "unit": "percent"}, "employees": {"value": 220}, "funding_raised": {"value": 395000000, "unit": "USD"}}'::jsonb,
  '{"model_accuracy": {"value": 91.5, "unit": "percent"}, "dataset_size": {"value": 45000000000, "unit": "models"}, "inference_speed": {"value": 48, "unit": "ms"}, "compute_costs": {"value": 4500000, "unit": "USD", "period": "monthly"}, "api_calls": {"value": 1800000000, "unit": "calls", "period": "monthly"}}'::jsonb),

('ai', 'Jasper AI', 7, 'AI content generation platform', 2021,
  '{"revenue": {"value": 220000000, "unit": "USD", "period": "ARR"}, "growth_rate": {"value": 135, "unit": "percent", "period": "YoY"}, "cac": {"value": 2800, "unit": "USD"}, "ltv": {"value": 25000, "unit": "USD"}, "ltv_cac_ratio": {"value": 8.9}, "burn_rate": {"value": 12000000, "unit": "USD", "period": "monthly"}, "runway": {"value": 24, "unit": "months"}, "gross_margin": {"value": 82, "unit": "percent"}, "employees": {"value": 180}, "funding_raised": {"value": 131000000, "unit": "USD"}}'::jsonb,
  '{"model_accuracy": {"value": 90.2, "unit": "percent"}, "dataset_size": {"value": 40000000000, "unit": "parameters"}, "inference_speed": {"value": 50, "unit": "ms"}, "compute_costs": {"value": 3500000, "unit": "USD", "period": "monthly"}, "api_calls": {"value": 1500000000, "unit": "calls", "period": "monthly"}}'::jsonb),

('ai', 'Replicate', 8, 'ML model deployment platform', 2019,
  '{"revenue": {"value": 185000000, "unit": "USD", "period": "ARR"}, "growth_rate": {"value": 125, "unit": "percent", "period": "YoY"}, "cac": {"value": 2500, "unit": "USD"}, "ltv": {"value": 22000, "unit": "USD"}, "ltv_cac_ratio": {"value": 8.8}, "burn_rate": {"value": 10000000, "unit": "USD", "period": "monthly"}, "runway": {"value": 22, "unit": "months"}, "gross_margin": {"value": 80, "unit": "percent"}, "employees": {"value": 145}, "funding_raised": {"value": 62000000, "unit": "USD"}}'::jsonb,
  '{"model_accuracy": {"value": 89.5, "unit": "percent"}, "dataset_size": {"value": 35000000000, "unit": "models"}, "inference_speed": {"value": 52, "unit": "ms"}, "compute_costs": {"value": 3000000, "unit": "USD", "period": "monthly"}, "api_calls": {"value": 1200000000, "unit": "calls", "period": "monthly"}}'::jsonb),

('ai', 'Character.AI', 9, 'Conversational AI platform', 2021,
  '{"revenue": {"value": 160000000, "unit": "USD", "period": "ARR"}, "growth_rate": {"value": 140, "unit": "percent", "period": "YoY"}, "cac": {"value": 2200, "unit": "USD"}, "ltv": {"value": 20000, "unit": "USD"}, "ltv_cac_ratio": {"value": 9.1}, "burn_rate": {"value": 9000000, "unit": "USD", "period": "monthly"}, "runway": {"value": 20, "unit": "months"}, "gross_margin": {"value": 78, "unit": "percent"}, "employees": {"value": 130}, "funding_raised": {"value": 193000000, "unit": "USD"}}'::jsonb,
  '{"model_accuracy": {"value": 88.7, "unit": "percent"}, "dataset_size": {"value": 30000000000, "unit": "parameters"}, "inference_speed": {"value": 55, "unit": "ms"}, "compute_costs": {"value": 2800000, "unit": "USD", "period": "monthly"}, "api_calls": {"value": 1000000000, "unit": "calls", "period": "monthly"}}'::jsonb),

('ai', 'Runway ML', 10, 'Creative AI tools', 2018,
  '{"revenue": {"value": 140000000, "unit": "USD", "period": "ARR"}, "growth_rate": {"value": 120, "unit": "percent", "period": "YoY"}, "cac": {"value": 2000, "unit": "USD"}, "ltv": {"value": 18000, "unit": "USD"}, "ltv_cac_ratio": {"value": 9.0}, "burn_rate": {"value": 8000000, "unit": "USD", "period": "monthly"}, "runway": {"value": 18, "unit": "months"}, "gross_margin": {"value": 76, "unit": "percent"}, "employees": {"value": 115}, "funding_raised": {"value": 237000000, "unit": "USD"}}'::jsonb,
  '{"model_accuracy": {"value": 87.3, "unit": "percent"}, "dataset_size": {"value": 28000000000, "unit": "parameters"}, "inference_speed": {"value": 58, "unit": "ms"}, "compute_costs": {"value": 2500000, "unit": "USD", "period": "monthly"}, "api_calls": {"value": 900000000, "unit": "calls", "period": "monthly"}}'::jsonb);

-- SaaS & Enterprise B2B Sector (abbreviated for brevity - would include all 10)
INSERT INTO sector_top_companies (sector, company_name, rank, description, founded_year, common_metrics, sector_metrics) VALUES
('saas', 'Snowflake', 1, 'Cloud data platform', 2012,
  '{"revenue": {"value": 2800000000, "unit": "USD", "period": "ARR"}, "growth_rate": {"value": 36, "unit": "percent", "period": "YoY"}, "cac": {"value": 8500, "unit": "USD"}, "ltv": {"value": 95000, "unit": "USD"}, "ltv_cac_ratio": {"value": 11.2}, "burn_rate": {"value": 35000000, "unit": "USD", "period": "monthly"}, "runway": {"value": 48, "unit": "months"}, "gross_margin": {"value": 76, "unit": "percent"}, "employees": {"value": 6000}, "funding_raised": {"value": 1400000000, "unit": "USD"}}'::jsonb,
  '{"mrr": {"value": 233000000, "unit": "USD"}, "arr": {"value": 2800000000, "unit": "USD"}, "churn_rate": {"value": 1.8, "unit": "percent", "period": "monthly"}, "nps": {"value": 72, "unit": "score"}, "customer_count": {"value": 9437, "unit": "customers"}, "expansion_revenue": {"value": 142, "unit": "percent"}}'::jsonb),

('saas', 'Databricks', 2, 'Unified analytics platform', 2013,
  '{"revenue": {"value": 1600000000, "unit": "USD", "period": "ARR"}, "growth_rate": {"value": 50, "unit": "percent", "period": "YoY"}, "cac": {"value": 7200, "unit": "USD"}, "ltv": {"value": 85000, "unit": "USD"}, "ltv_cac_ratio": {"value": 11.8}, "burn_rate": {"value": 28000000, "unit": "USD", "period": "monthly"}, "runway": {"value": 42, "unit": "months"}, "gross_margin": {"value": 74, "unit": "percent"}, "employees": {"value": 5500}, "funding_raised": {"value": 3600000000, "unit": "USD"}}'::jsonb,
  '{"mrr": {"value": 133000000, "unit": "USD"}, "arr": {"value": 1600000000, "unit": "USD"}, "churn_rate": {"value": 2.1, "unit": "percent", "period": "monthly"}, "nps": {"value": 68, "unit": "score"}, "customer_count": {"value": 10000, "unit": "customers"}, "expansion_revenue": {"value": 130, "unit": "percent"}}'::jsonb);

-- Note: In production, you would add all 10 companies for each of the 13 sectors
-- This is abbreviated for demonstration purposes

SELECT 'Seed data inserted successfully' AS result;
