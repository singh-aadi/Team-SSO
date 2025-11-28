-- Migration: Add support for additional documents upload
-- Date: 2025-11-28
-- Purpose: Allow users to upload supporting documents (audits, research, memos, etc.)
--          alongside pitch deck and checklist

-- Add new column to pitch_decks table
ALTER TABLE pitch_decks 
ADD COLUMN IF NOT EXISTS additional_doc_paths JSONB;

-- Add comment for documentation
COMMENT ON COLUMN pitch_decks.additional_doc_paths IS 'Array of additional supporting documents: [{ filename, path, type, size }]. Examples: financial audits, market research, memos, technical documentation. Maximum 5 files.';

-- Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_pitch_decks_additional_docs ON pitch_decks USING GIN (additional_doc_paths);
