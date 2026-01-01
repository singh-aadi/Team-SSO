-- Add vc_preferences column to deck_intelligence_context table
-- This allows Wizard preferences to be exported to Deck Intelligence

ALTER TABLE deck_intelligence_context
ADD COLUMN IF NOT EXISTS vc_preferences JSONB;

-- Add comment
COMMENT ON COLUMN deck_intelligence_context.vc_preferences IS 'Exported VC preferences from Wizard or Advanced VC Evaluation';
