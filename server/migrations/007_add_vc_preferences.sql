-- Migration: Add VC Preferences table for storing user-specific evaluation criteria weights

CREATE TABLE IF NOT EXISTS vc_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    preferences_name VARCHAR(255) DEFAULT 'Default',
    industry VARCHAR(100),
    criteria JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preferences_name)
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_vc_preferences_user_id ON vc_preferences(user_id);

-- Create Updated At Trigger for vc_preferences
CREATE TRIGGER update_vc_preferences_updated_at BEFORE UPDATE ON vc_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default preferences for demo users
INSERT INTO vc_preferences (user_id, preferences_name, industry, criteria)
VALUES 
  ('demo-001', 'Default', 'all', 
   '[
     {"id":"team","name":"Team","weight":30,"subcriteria":[{"id":"experience","name":"Experience","weight":40},{"id":"technical","name":"Technical Expertise","weight":30},{"id":"vision","name":"Vision & Leadership","weight":30}]},
     {"id":"market","name":"Market Opportunity","weight":25,"subcriteria":[{"id":"size","name":"Market Size","weight":35},{"id":"growth","name":"Growth Rate","weight":35},{"id":"timing","name":"Market Timing","weight":30}]},
     {"id":"product","name":"Product & Technology","weight":25,"subcriteria":[{"id":"innovation","name":"Innovation Level","weight":40},{"id":"scalability","name":"Scalability","weight":30},{"id":"moat","name":"Competitive Moat","weight":30}]},
     {"id":"traction","name":"Traction & Metrics","weight":20,"subcriteria":[{"id":"growth","name":"Growth Rate","weight":40},{"id":"retention","name":"Retention","weight":30},{"id":"efficiency","name":"Capital Efficiency","weight":30}]}
   ]'::jsonb
  )
ON CONFLICT (user_id, preferences_name) DO NOTHING;
