-- Add 12 more companies to cover all funding stages and industries
-- This will give us 17 total companies

BEGIN;

-- Add Pre-Seed companies (2)
INSERT INTO companies (name, description, website_url, industry, stage, founded_year, employee_count, location, created_at)
VALUES
  ('NanoBot Labs', 'Microscopic robotics for medical procedures', 'https://nanobotlabs.io', 'HealthTech', 'Pre-Seed', 2024, 3, 'Cambridge, MA', NOW()),
  ('CryptoGuard', 'Blockchain security and auditing platform', 'https://cryptoguard.tech', 'Cybersecurity', 'Pre-Seed', 2024, 4, 'Remote', NOW())
ON CONFLICT (name) DO NOTHING;

-- Add more Seed companies (2)
INSERT INTO companies (name, description, website_url, industry, stage, founded_year, employee_count, location, created_at)
VALUES
  ('CleanAir Tech', 'Carbon capture technology for urban areas', 'https://cleanairtech.com', 'CleanTech', 'Seed', 2023, 10, 'Portland, OR', NOW()),
  ('PropVision', 'AI-powered property valuation platform', 'https://propvision.ai', 'PropTech', 'Seed', 2023, 8, 'Miami, FL', NOW())
ON CONFLICT (name) DO NOTHING;

-- Add more Series A companies (2)
INSERT INTO companies (name, description, website_url, industry, stage, founded_year, employee_count, location, created_at)
VALUES
  ('SecureNet AI', 'Enterprise cybersecurity with AI threat detection', 'https://securenet.ai', 'Cybersecurity', 'Series A', 2022, 35, 'Austin, TX', NOW()),
  ('LearnFast', 'Personalized learning management system', 'https://learnfast.edu', 'EdTech', 'Series A', 2022, 28, 'Chicago, IL', NOW())
ON CONFLICT (name) DO NOTHING;

-- Add Series B companies (2)
INSERT INTO companies (name, description, website_url, industry, stage, founded_year, employee_count, location, created_at)
VALUES
  ('PayFlow Global', 'International payment processing infrastructure', 'https://payflow.global', 'FinTech', 'Series B', 2021, 50, 'New York, NY', NOW()),
  ('FreshFarm Direct', 'Farm-to-table food delivery marketplace', 'https://freshfarmdirect.com', 'Food Tech', 'Series B', 2021, 42, 'Denver, CO', NOW())
ON CONFLICT (name) DO NOTHING;

-- Add Series C companies (2)
INSERT INTO companies (name, description, website_url, industry, stage, founded_year, employee_count, location, created_at)
VALUES
  ('RideShare Pro', 'B2B ride-sharing and logistics platform', 'https://ridesharepro.com', 'Mobility', 'Series C', 2020, 120, 'San Francisco, CA', NOW()),
  ('ShopAI', 'AI-powered e-commerce personalization', 'https://shopai.com', 'E-commerce', 'Series C', 2020, 85, 'Seattle, WA', NOW())
ON CONFLICT (name) DO NOTHING;

-- Add Growth/Series D+ companies (2)
INSERT INTO companies (name, description, website_url, industry, stage, founded_year, employee_count, location, created_at)
VALUES
  ('DataCore Enterprise', 'Enterprise SaaS data analytics platform', 'https://datacore.io', 'SaaS', 'Growth', 2019, 200, 'Palo Alto, CA', NOW()),
  ('ChainLink Finance', 'DeFi infrastructure and blockchain solutions', 'https://chainlinkfi.com', 'Web3', 'Growth', 2019, 150, 'Singapore', NOW())
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Verify results
SELECT 
  stage,
  COUNT(*) as count,
  STRING_AGG(name, ', ' ORDER BY name) as companies
FROM companies 
WHERE stage IS NOT NULL AND stage != ''
GROUP BY stage
ORDER BY 
  CASE stage
    WHEN 'Pre-Seed' THEN 1
    WHEN 'Seed' THEN 2
    WHEN 'Series A' THEN 3
    WHEN 'Series B' THEN 4
    WHEN 'Series C' THEN 5
    WHEN 'Series C+' THEN 6
    WHEN 'Growth' THEN 7
    ELSE 99
  END;

-- Show all companies
SELECT name, industry, stage, founded_year, location 
FROM companies 
ORDER BY 
  CASE stage
    WHEN 'Pre-Seed' THEN 1
    WHEN 'Seed' THEN 2
    WHEN 'Series A' THEN 3
    WHEN 'Series B' THEN 4
    WHEN 'Series C' THEN 5
    WHEN 'Series C+' THEN 6
    WHEN 'Growth' THEN 7
    ELSE 99
  END,
  name;
