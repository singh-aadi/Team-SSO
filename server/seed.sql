-- Seed Data for Team-SSO Database

-- Insert sample users (remove duplicates first if needed)
INSERT INTO users (email, name, picture_url, user_type, created_at)
SELECT * FROM (VALUES
  ('vc@example.com', 'Sample VC User', 'https://i.pravatar.cc/150?img=1', 'vc', NOW()),
  ('founder@example.com', 'Sample Founder', 'https://i.pravatar.cc/150?img=2', 'founder', NOW())
) AS v(email, name, picture_url, user_type, created_at)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.email = v.email);

-- Insert sample companies
INSERT INTO companies (name, description, website_url, industry, stage, founded_year, employee_count, location, created_at)
SELECT * FROM (VALUES
  ('TechFlow AI', 'AI-powered workflow automation platform', 'https://techflow.ai', 'Artificial Intelligence', 'Series A', 2022, 25, 'San Francisco, CA', NOW()),
  ('GreenEats', 'Sustainable food delivery marketplace', 'https://greeneats.com', 'Food Tech', 'Seed', 2023, 12, 'Austin, TX', NOW()),
  ('HealthTrack Pro', 'Healthcare data analytics SaaS', 'https://healthtrack.pro', 'HealthTech', 'Series B', 2021, 45, 'Boston, MA', NOW()),
  ('FinanceHub', 'SMB financial management platform', 'https://financehub.io', 'FinTech', 'Seed', 2023, 8, 'New York, NY', NOW()),
  ('EduStream', 'Live streaming platform for education', 'https://edustream.com', 'EdTech', 'Series A', 2022, 30, 'Seattle, WA', NOW())
) AS v(name, description, website_url, industry, stage, founded_year, employee_count, location, created_at)
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE companies.name = v.name);

-- Insert industry benchmarks  
INSERT INTO industry_benchmarks (industry, stage, metric_name, metric_value, percentile_25, percentile_50, percentile_75, unit, year, created_at)
SELECT * FROM (VALUES
-- AI/ML Industry
('Artificial Intelligence', 'Seed', 'Revenue Growth Rate', 150.0, 100.0, 150.0, 200.0, '%', 2024, NOW()),
('Artificial Intelligence', 'Series A', 'Revenue Growth Rate', 250.0, 180.0, 250.0, 320.0, '%', 2024, NOW()),
('Artificial Intelligence', 'Series B', 'Revenue Growth Rate', 180.0, 120.0, 180.0, 240.0, '%', 2024, NOW()),
('Artificial Intelligence', 'Seed', 'CAC Payback', 18.0, 12.0, 18.0, 24.0, 'months', 2024, NOW()),
('Artificial Intelligence', 'Series A', 'CAC Payback', 14.0, 10.0, 14.0, 18.0, 'months', 2024, NOW()),
('Artificial Intelligence', 'Seed', 'Net Revenue Retention', 95.0, 85.0, 95.0, 110.0, '%', 2024, NOW()),
('Artificial Intelligence', 'Series A', 'Net Revenue Retention', 115.0, 105.0, 115.0, 125.0, '%', 2024, NOW()),

-- FinTech Industry
('FinTech', 'Seed', 'Revenue Growth Rate', 180.0, 120.0, 180.0, 240.0, '%', 2024, NOW()),
('FinTech', 'Series A', 'Revenue Growth Rate', 200.0, 150.0, 200.0, 250.0, '%', 2024, NOW()),
('FinTech', 'Series B', 'Revenue Growth Rate', 150.0, 100.0, 150.0, 200.0, '%', 2024, NOW()),
('FinTech', 'Seed', 'CAC Payback', 15.0, 10.0, 15.0, 20.0, 'months', 2024, NOW()),
('FinTech', 'Series A', 'CAC Payback', 12.0, 8.0, 12.0, 16.0, 'months', 2024, NOW()),
('FinTech', 'Seed', 'Gross Margin', 72.0, 65.0, 72.0, 80.0, '%', 2024, NOW()),
('FinTech', 'Series A', 'Gross Margin', 78.0, 70.0, 78.0, 85.0, '%', 2024, NOW()),

-- HealthTech Industry
('HealthTech', 'Seed', 'Revenue Growth Rate', 120.0, 80.0, 120.0, 160.0, '%', 2024, NOW()),
('HealthTech', 'Series A', 'Revenue Growth Rate', 160.0, 120.0, 160.0, 200.0, '%', 2024, NOW()),
('HealthTech', 'Series B', 'Revenue Growth Rate', 140.0, 100.0, 140.0, 180.0, '%', 2024, NOW()),
('HealthTech', 'Seed', 'CAC Payback', 20.0, 15.0, 20.0, 25.0, 'months', 2024, NOW()),
('HealthTech', 'Series A', 'CAC Payback', 16.0, 12.0, 16.0, 20.0, 'months', 2024, NOW())
) AS v(industry, stage, metric_name, metric_value, percentile_25, percentile_50, percentile_75, unit, year, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM industry_benchmarks 
  WHERE industry_benchmarks.industry = v.industry 
    AND industry_benchmarks.stage = v.stage 
    AND industry_benchmarks.metric_name = v.metric_name 
    AND industry_benchmarks.year = v.year
);

-- Sample pitch deck (for the first company)
DO $$
DECLARE
  company_id UUID;
  user_id UUID;
  deck_id UUID;
BEGIN
  SELECT id INTO company_id FROM companies WHERE name = 'TechFlow AI' LIMIT 1;
  SELECT id INTO user_id FROM users WHERE email = 'founder@example.com' LIMIT 1;
  
  IF company_id IS NOT NULL AND user_id IS NOT NULL THEN
    INSERT INTO pitch_decks (company_id, uploaded_by, filename, file_url, file_size, file_type, analysis_status, sso_score, created_at)
    VALUES (company_id, user_id, 'techflow_pitch_deck.pdf', 'gs://projectsso-pitch-decks/samples/techflow_pitch_deck.pdf', 2500000, 'application/pdf', 'completed', 0.83, NOW())
    RETURNING id INTO deck_id;
    
    -- Insert analysis sections for the deck
    IF deck_id IS NOT NULL THEN
      INSERT INTO deck_analysis (deck_id, section_name, section_score, feedback, strengths, improvements, created_at) VALUES
      (deck_id, 'Problem', 0.85, 'Strong problem identification with clear market pain points.', 
        ARRAY['Clear articulation of workflow inefficiencies', 'Quantified impact on businesses'], 
        ARRAY['Could expand on secondary problems'], NOW()),
      (deck_id, 'Solution', 0.90, 'Innovative AI-powered solution with strong differentiation.', 
        ARRAY['Unique ML approach', 'Clear value proposition'], 
        ARRAY['More technical details on implementation'], NOW()),
      (deck_id, 'Market', 0.78, 'Large TAM with good market analysis.', 
        ARRAY['$12B TAM well researched', 'Clear target segments'], 
        ARRAY['Competitive analysis needs depth'], NOW()),
      (deck_id, 'Traction', 0.82, 'Impressive early traction with enterprise customers.', 
        ARRAY['Fortune 500 customers', '3x YoY growth'], 
        ARRAY['More details on retention metrics'], NOW()),
      (deck_id, 'Team', 0.88, 'Exceptional team with relevant ML expertise.', 
        ARRAY['Previous exits', 'Deep technical expertise'], 
        ARRAY['Could highlight advisory board'], NOW()),
      (deck_id, 'Financials', 0.75, 'Solid financial projections but needs more detail.', 
        ARRAY['Clear revenue model', 'Path to profitability'], 
        ARRAY['Unit economics breakdown', 'Detailed burn rate'], NOW());
    END IF;
  END IF;
END $$;

-- Sample VC watchlist
DO $$
DECLARE
  vc_user_id UUID;
  target_company_id UUID;
BEGIN
  SELECT id INTO vc_user_id FROM users WHERE email = 'vc@example.com' LIMIT 1;
  SELECT id INTO target_company_id FROM companies WHERE name = 'TechFlow AI' LIMIT 1;
  
  IF vc_user_id IS NOT NULL AND target_company_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM vc_watchlist WHERE vc_id = vc_user_id AND company_id = target_company_id) THEN
      INSERT INTO vc_watchlist (vc_id, company_id, notes, priority, status, created_at)
      VALUES (vc_user_id, target_company_id, 'Promising AI automation platform. Schedule meeting for next week.', 'high', 'watching', NOW());
    END IF;
  END IF;
END $$;

SELECT 'Seed data inserted successfully!' AS result;
