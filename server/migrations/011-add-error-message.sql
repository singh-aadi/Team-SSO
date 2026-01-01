-- Migration 011: Add error_message column to pitch_decks table
-- This stores concise user-friendly error descriptions (2-3 words) for failed analyses

ALTER TABLE pitch_decks 
ADD COLUMN IF NOT EXISTS error_message VARCHAR(100);

COMMENT ON COLUMN pitch_decks.error_message IS 'Concise user-friendly error description (e.g., "Unreadable PDF", "API Rate Limit")';
