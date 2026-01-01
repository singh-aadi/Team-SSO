-- Migration: Add user role selection support
-- Allow user_type to be NULL for first-time users who haven't selected a role yet

-- First, set a default role for existing users (assuming they're VCs if they exist)
UPDATE users SET user_type = 'vc' WHERE user_type IS NULL;

-- Alter the column to allow NULL values
ALTER TABLE users ALTER COLUMN user_type DROP NOT NULL;

-- Add index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
