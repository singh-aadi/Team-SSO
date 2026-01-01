-- Migration: Add vc_context_data column to deck_intelligence_context table
-- Date: 2025-01-XX
-- Description: Adds support for storing VC Context (meeting notes, transcripts) in Deck Intelligence

-- Add column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='deck_intelligence_context' 
        AND column_name='vc_context_data'
    ) THEN
        ALTER TABLE deck_intelligence_context 
        ADD COLUMN vc_context_data JSONB;
        
        RAISE NOTICE 'Column vc_context_data added successfully';
    ELSE
        RAISE NOTICE 'Column vc_context_data already exists';
    END IF;
END $$;
