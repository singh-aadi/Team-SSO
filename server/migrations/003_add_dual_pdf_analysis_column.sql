-- Migration: Add column to store complete dual PDF analysis
-- Date: 2025-10-18

-- Add JSONB column to store the full overallAnalysis object from Gemini
ALTER TABLE pitch_decks 
ADD COLUMN IF NOT EXISTS dual_pdf_analysis JSONB;

-- Add comment
COMMENT ON COLUMN pitch_decks.dual_pdf_analysis IS 'Complete AI analysis from Gemini including overallAnalysis with scores, strengths, weaknesses, checklistVerification, and visualInsights';
