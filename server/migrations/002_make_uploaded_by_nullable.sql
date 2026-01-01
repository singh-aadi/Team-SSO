-- Migration: Make uploaded_by optional (nullable) for pitch_decks
-- This allows uploads without requiring a user account
-- Date: 2025-10-18

-- Make uploaded_by nullable (remove NOT NULL if exists, allow NULL values)
ALTER TABLE pitch_decks 
ALTER COLUMN uploaded_by DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN pitch_decks.uploaded_by IS 'UUID of user who uploaded (optional for demo/testing)';
