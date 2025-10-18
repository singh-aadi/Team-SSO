-- Startup Scout & Optioneers Database Schema
-- MVP Version for VC Features

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) CHECK (user_type IN ('vc', 'founder')) NOT NULL,
    picture_url TEXT,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies/Startups Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    stage VARCHAR(50) CHECK (stage IN ('Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth')),
    founded_year INTEGER,
    location VARCHAR(255),
    website_url TEXT,
    description TEXT,
    funding_amount DECIMAL(15, 2),
    valuation DECIMAL(15, 2),
    employee_count INTEGER,
    logo_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pitch Decks Table
CREATE TABLE IF NOT EXISTS pitch_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),
    analysis_status VARCHAR(20) DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
    sso_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP
);

-- Deck Analysis Results Table
CREATE TABLE IF NOT EXISTS deck_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
    section_name VARCHAR(100) NOT NULL,
    section_score DECIMAL(3, 2),
    feedback TEXT,
    strengths TEXT[],
    improvements TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Industry Benchmarks Table
CREATE TABLE IF NOT EXISTS industry_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry VARCHAR(100) NOT NULL,
    stage VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15, 2),
    percentile_25 DECIMAL(15, 2),
    percentile_50 DECIMAL(15, 2),
    percentile_75 DECIMAL(15, 2),
    unit VARCHAR(50),
    year INTEGER,
    data_source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(industry, stage, metric_name, year)
);

-- VC Watchlist Table
CREATE TABLE IF NOT EXISTS vc_watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vc_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'watching',
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vc_id, company_id)
);

-- VC Portfolio Table
CREATE TABLE IF NOT EXISTS vc_portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vc_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    investment_date DATE,
    investment_amount DECIMAL(15, 2),
    stake_percentage DECIMAL(5, 2),
    valuation_at_investment DECIMAL(15, 2),
    current_valuation DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_stage ON companies(stage);
CREATE INDEX idx_pitch_decks_company ON pitch_decks(company_id);
CREATE INDEX idx_pitch_decks_status ON pitch_decks(analysis_status);
CREATE INDEX idx_deck_analysis_deck ON deck_analysis(deck_id);
CREATE INDEX idx_benchmarks_industry_stage ON industry_benchmarks(industry, stage);
CREATE INDEX idx_watchlist_vc ON vc_watchlist(vc_id);
CREATE INDEX idx_portfolio_vc ON vc_portfolio(vc_id);

-- Create Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply Trigger to Tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlist_updated_at BEFORE UPDATE ON vc_watchlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_updated_at BEFORE UPDATE ON vc_portfolio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
