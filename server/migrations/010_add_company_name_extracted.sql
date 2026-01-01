-- Migration 010: Add company_name_extracted column for VC Lens feature
-- This enables tracking pitch deck versions across time for the same company
-- Uses hybrid approach: company_id (primary) + extracted name (fallback)

ALTER TABLE pitch_decks 
ADD COLUMN IF NOT EXISTS company_name_extracted VARCHAR(255);

-- Create index for efficient company name searches
CREATE INDEX IF NOT EXISTS idx_pitch_decks_company_name 
ON pitch_decks(company_name_extracted);

-- Add comment for documentation
COMMENT ON COLUMN pitch_decks.company_name_extracted IS 
'AI-extracted company name from pitch deck content. Used as fallback when company_id is null for VC Lens feature.';
