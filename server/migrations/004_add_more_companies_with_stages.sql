-- Migration: Add More Companies with Proper Funding Stages
-- This will be run during deployment to ensure we have diverse companies

-- First, let's add funding stages to existing companies if they're missing
UPDATE companies SET stage = 'Series A' WHERE name = 'TechFlow AI' AND (stage IS NULL OR stage = '');
UPDATE companies SET stage = 'Seed' WHERE name = 'GreenEats' AND (stage IS NULL OR stage = '');
UPDATE companies SET stage = 'Series B' WHERE name = 'HealthTrack Pro' AND (stage IS NULL OR stage = '');
UPDATE companies SET stage = 'Seed' WHERE name = 'FinanceHub' AND (stage IS NULL OR stage = '');
UPDATE companies SET stage = 'Series A' WHERE name = 'EduStream' AND (stage IS NULL OR stage = '');

-- Now add more companies to cover all stages and industries
INSERT INTO companies (name, description, website_url, industry, stage, founded_year, employee_count, location, created_at)
SELECT * FROM (VALUES
  -- Pre-Seed Companies
  ('NanoBot Labs', 'Microscopic robotics for medical procedures', 'https://nanobotlabs.io', 'HealthTech', 'Pre-Seed', 2024, 3, 'Cambridge, MA', NOW()),
  ('CryptoGuard', 'Blockchain security and auditing', 'https://cryptoguard.tech', 'Cybersecurity', 'Pre-Seed', 2024, 4, 'Remote', NOW()),
  
  -- More Seed Stage
  ('CleanAir Tech', 'Carbon capture technology for cities', 'https://cleanairtech.com', 'CleanTech', 'Seed', 2023, 10, 'Portland, OR', NOW()),
  ('PropVision', 'AI-powered property valuation', 'https://propvision.ai', 'PropTech', 'Seed', 2023, 8, 'Miami, FL', NOW()),
  
  -- More Series A
  ('SecureNet AI', 'Enterprise cybersecurity platform', 'https://securenet.ai', 'Cybersecurity', 'Series A', 2022, 35, 'Austin, TX', NOW()),
  ('LearnFast', 'Personalized learning management system', 'https://learnfast.edu', 'EdTech', 'Series A', 2022, 28, 'Chicago, IL', NOW()),
  
  -- Series B
  ('PayFlow Global', 'International payment processing', 'https://payflow.global', 'FinTech', 'Series B', 2021, 50, 'New York, NY', NOW()),
  ('FreshFarm Direct', 'Farm-to-table food delivery', 'https://freshfarmdirect.com', 'Food Tech', 'Series B', 2021, 42, 'Denver, CO', NOW()),
  
  -- Series C
  ('RideShare Pro', 'B2B ride-sharing platform', 'https://ridesharepro.com', 'Mobility', 'Series C', 2020, 120, 'San Francisco, CA', NOW()),
  ('ShopAI', 'AI-powered e-commerce platform', 'https://shopai.com', 'E-commerce', 'Series C', 2020, 85, 'Seattle, WA', NOW()),
  
  -- Series D+
  ('DataCore Enterprise', 'Enterprise SaaS data platform', 'https://datacore.io', 'SaaS', 'Growth', 2019, 200, 'Palo Alto, CA', NOW()),
  ('ChainLink Finance', 'DeFi infrastructure provider', 'https://chainlinkfi.com', 'Web3', 'Growth', 2019, 150, 'Singapore', NOW())
) AS v(name, description, website_url, industry, stage, founded_year, employee_count, location, created_at)
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE companies.name = v.name);

-- Verify we now have companies in all stages
SELECT 
  stage,
  COUNT(*) as company_count,
  STRING_AGG(DISTINCT industry, ', ') as industries
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
