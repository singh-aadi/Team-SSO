-- Migration: Add support for dual PDF uploads (Pitch Deck + Checklist)
-- Date: 2025-10-18

-- Add new columns to pitch_decks table
ALTER TABLE pitch_decks 
ADD COLUMN IF NOT EXISTS deck_file_path TEXT,
ADD COLUMN IF NOT EXISTS checklist_file_path TEXT,
ADD COLUMN IF NOT EXISTS deck_text_content TEXT,
ADD COLUMN IF NOT EXISTS checklist_text_content TEXT,
ADD COLUMN IF NOT EXISTS visual_analysis TEXT,
ADD COLUMN IF NOT EXISTS checklist_items JSONB;

-- Update existing data: migrate file_url to deck_file_path
UPDATE pitch_decks 
SET deck_file_path = file_url 
WHERE deck_file_path IS NULL AND file_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN pitch_decks.deck_file_path IS 'GCS path to the main pitch deck PDF (contains images, graphs, charts)';
COMMENT ON COLUMN pitch_decks.checklist_file_path IS 'GCS path to the founder checklist PDF (unit economics, growth, payment info)';
COMMENT ON COLUMN pitch_decks.deck_text_content IS 'Extracted text content from pitch deck';
COMMENT ON COLUMN pitch_decks.checklist_text_content IS 'Extracted text content from checklist';
COMMENT ON COLUMN pitch_decks.visual_analysis IS 'AI analysis of images, graphs, and charts from pitch deck';
COMMENT ON COLUMN pitch_decks.checklist_items IS 'Parsed checklist items with verification status';
