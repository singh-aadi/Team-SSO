-- Migration: Add Agentic System Tables
-- Creates tables for Dynamic Prompt Agent and Growth Forecast Agent

-- Table: vc_custom_prompts
-- Stores dynamically generated evaluation prompts per user
CREATE TABLE IF NOT EXISTS vc_custom_prompts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  prompt_version VARCHAR(100) NOT NULL,
  criteria_config JSONB NOT NULL, -- Stores the custom criteria configuration
  generated_prompt TEXT NOT NULL, -- The AI-generated evaluation prompt
  metadata JSONB, -- Generation metadata (timestamp, customizations count, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_version UNIQUE (user_id, prompt_version)
);

CREATE INDEX idx_vc_prompts_user ON vc_custom_prompts(user_id);
CREATE INDEX idx_vc_prompts_created ON vc_custom_prompts(created_at DESC);

-- Table: growth_forecasts
-- Stores AI-generated growth forecasts for startups
CREATE TABLE IF NOT EXISTS growth_forecasts (
  id SERIAL PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES pitch_decks(id) ON DELETE CASCADE,
  forecast_horizon VARCHAR(20) NOT NULL, -- '3-year', '5-year', '10-year'
  scenarios JSONB NOT NULL, -- Array of year-by-year projections with scenarios
  key_drivers JSONB NOT NULL, -- Array of growth driver strings
  risk_factors JSONB NOT NULL, -- Array of risk factor strings
  capital_requirements JSONB, -- Array of funding round projections
  assumptions JSONB, -- Array of forecast assumptions
  methodology TEXT, -- Explanation of forecasting approach
  generated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_deck_horizon UNIQUE (deck_id, forecast_horizon)
);

CREATE INDEX idx_forecasts_deck ON growth_forecasts(deck_id);
CREATE INDEX idx_forecasts_generated ON growth_forecasts(generated_at DESC);

-- Table: vc_evaluation_preferences
-- Stores user's custom evaluation criteria and weights
CREATE TABLE IF NOT EXISTS vc_evaluation_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  industry VARCHAR(100) DEFAULT 'all',
  criteria JSONB NOT NULL, -- Array of custom criteria objects
  last_updated TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_prefs UNIQUE (user_id)
);

CREATE INDEX idx_eval_prefs_user ON vc_evaluation_preferences(user_id);

-- Add comments for documentation
COMMENT ON TABLE vc_custom_prompts IS 'Stores AI-generated evaluation prompts customized per user';
COMMENT ON TABLE growth_forecasts IS 'Stores multi-year growth forecasts with scenario analysis';
COMMENT ON TABLE vc_evaluation_preferences IS 'Stores user-defined evaluation criteria and weights';

COMMENT ON COLUMN vc_custom_prompts.criteria_config IS 'JSON array of custom criteria with weights and subcriteria';
COMMENT ON COLUMN vc_custom_prompts.generated_prompt IS 'AI-generated prompt incorporating custom criteria';
COMMENT ON COLUMN growth_forecasts.scenarios IS 'Year-by-year projections with pessimistic/base/optimistic scenarios';
COMMENT ON COLUMN growth_forecasts.capital_requirements IS 'Estimated funding rounds, valuations, and dilution';
