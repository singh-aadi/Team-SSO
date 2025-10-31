-- VC Context Manager Tables
-- Migration: 007_add_vc_context_tables.sql

-- Table for storing uploaded context items
CREATE TABLE vc_context_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
  uploaded_by UUID,
  file_path TEXT,
  file_name TEXT NOT NULL,
  file_type VARCHAR(50), -- 'meeting-notes', 'email', 'call-transcript', 'memo', 'other'
  content_text TEXT,
  upload_date TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- { participants: [], date: '', topics: [], sentiment: '' }
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table for storing AI-generated summaries
CREATE TABLE vc_context_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  key_insights JSONB DEFAULT '[]', -- Array of insights
  sentiment_analysis JSONB DEFAULT '{}',
  generated_at TIMESTAMP DEFAULT NOW(),
  export_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_vc_context_deck ON vc_context_items(deck_id);
CREATE INDEX idx_vc_summary_deck ON vc_context_summaries(deck_id);
CREATE INDEX idx_vc_context_created ON vc_context_items(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE vc_context_items IS 'Stores uploaded context files (meeting notes, emails, etc.) for VC analysis';
COMMENT ON TABLE vc_context_summaries IS 'Stores AI-generated summaries of context items for each pitch deck';
COMMENT ON COLUMN vc_context_items.metadata IS 'JSON object containing participants, date, topics, and sentiment';
COMMENT ON COLUMN vc_context_summaries.key_insights IS 'JSON array of key insights extracted by AI';
