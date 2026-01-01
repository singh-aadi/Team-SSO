-- Migration 005: Add web_enrichment column for Vertex AI Grounding data
-- This stores web-validated metrics, fact-checks, and grounding metadata

ALTER TABLE pitch_decks ADD COLUMN IF NOT EXISTS web_enrichment JSONB;

COMMENT ON COLUMN pitch_decks.web_enrichment IS 'Web enrichment data from Vertex AI Grounding: validated metrics, competitors, benchmarks, fact-checks, data sources, confidence scores';

-- Add index for querying web enrichment data
CREATE INDEX IF NOT EXISTS idx_pitch_decks_web_enrichment ON pitch_decks USING GIN (web_enrichment);
