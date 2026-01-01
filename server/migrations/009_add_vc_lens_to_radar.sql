-- Migration 009: Add vc_lens column to radar_data table
-- This allows tracking which radar companies should appear in VC Lens

ALTER TABLE radar_data 
ADD COLUMN vc_lens BOOLEAN DEFAULT FALSE;

-- Add index for efficient querying
CREATE INDEX idx_radar_data_vc_lens ON radar_data(vc_lens) WHERE vc_lens = TRUE;

-- Add comment
COMMENT ON COLUMN radar_data.vc_lens IS 'Flag to track this company in VC Lens (Pitch Deck Needed)';
