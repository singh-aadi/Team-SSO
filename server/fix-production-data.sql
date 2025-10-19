-- Fix Production Database - Add Funding Stages to Existing Companies
-- Run this against production Cloud SQL database

-- Update existing companies with proper funding stages
UPDATE companies SET stage = 'Series A' WHERE name = 'TechFlow AI';
UPDATE companies SET stage = 'Seed' WHERE name = 'GreenEats';
UPDATE companies SET stage = 'Series B' WHERE name = 'HealthTrack Pro';
UPDATE companies SET stage = 'Seed' WHERE name = 'FinanceHub';
UPDATE companies SET stage = 'Series A' WHERE name = 'EduStream';

-- Verify the updates
SELECT id, name, industry, stage, founded_year, location 
FROM companies 
ORDER BY name;
