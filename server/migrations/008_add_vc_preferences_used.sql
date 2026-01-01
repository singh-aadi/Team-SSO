-- Migration 008: Add vc_preferences_used column to pitch_decks table
-- This stores the VC preferences that were used during analysis

ALTER TABLE pitch_decks 
ADD COLUMN IF NOT EXISTS vc_preferences_used JSONB;

COMMENT ON COLUMN pitch_decks.vc_preferences_used IS 'Stores the VC evaluation preferences that were used during the analysis (if any)';
