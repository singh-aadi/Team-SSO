-- Migration 006: Add support for multi-deck comparison reports
-- Allows comparing multiple pitch decks side-by-side

CREATE TABLE IF NOT EXISTS comparison_reports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  comparison_data JSONB, -- Stores comparison analysis results
  report_file_path VARCHAR(500) -- Path to generated comparison PDF
);

CREATE TABLE IF NOT EXISTS comparison_report_decks (
  id SERIAL PRIMARY KEY,
  comparison_report_id INTEGER REFERENCES comparison_reports(id) ON DELETE CASCADE,
  deck_id INTEGER REFERENCES pitch_decks(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comparison_report_id, deck_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comparison_reports_created_by ON comparison_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_comparison_reports_status ON comparison_reports(status);
CREATE INDEX IF NOT EXISTS idx_comparison_report_decks_report_id ON comparison_report_decks(comparison_report_id);
CREATE INDEX IF NOT EXISTS idx_comparison_report_decks_deck_id ON comparison_report_decks(deck_id);

-- Comments
COMMENT ON TABLE comparison_reports IS 'Stores multi-deck comparison reports for side-by-side analysis';
COMMENT ON TABLE comparison_report_decks IS 'Junction table linking comparison reports to pitch decks';
COMMENT ON COLUMN comparison_reports.comparison_data IS 'JSONB containing comparison analysis: score rankings, strengths/weaknesses matrix, recommendation priorities';
