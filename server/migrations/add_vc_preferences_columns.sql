-- Migration: Add structured columns to vc_preferences table
-- Date: 2025-11-25
-- Purpose: Add dealbreakers, positive_patterns, investment_thesis, context_weights columns
--          to support Premium PDF agentic analysis

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add dealbreakers column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vc_preferences' AND column_name = 'dealbreakers'
    ) THEN
        ALTER TABLE vc_preferences ADD COLUMN dealbreakers JSONB;
        RAISE NOTICE 'Added dealbreakers column to vc_preferences';
    END IF;

    -- Add positive_patterns column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vc_preferences' AND column_name = 'positive_patterns'
    ) THEN
        ALTER TABLE vc_preferences ADD COLUMN positive_patterns JSONB;
        RAISE NOTICE 'Added positive_patterns column to vc_preferences';
    END IF;

    -- Add investment_thesis column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vc_preferences' AND column_name = 'investment_thesis'
    ) THEN
        ALTER TABLE vc_preferences ADD COLUMN investment_thesis TEXT;
        RAISE NOTICE 'Added investment_thesis column to vc_preferences';
    END IF;

    -- Add context_weights column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vc_preferences' AND column_name = 'context_weights'
    ) THEN
        ALTER TABLE vc_preferences ADD COLUMN context_weights JSONB;
        RAISE NOTICE 'Added context_weights column to vc_preferences';
    END IF;
END $$;

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'vc_preferences'
ORDER BY ordinal_position;
