-- Quick migration to create deck_comparisons table
CREATE TABLE IF NOT EXISTS deck_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck1_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
    deck2_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    comparison_type VARCHAR(20) DEFAULT 'upload' CHECK (comparison_type IN ('upload', 'analyzed', 'mixed')),
    deck1_filename VARCHAR(255),
    deck2_filename VARCHAR(255),
    deck1_file_path TEXT,
    deck2_file_path TEXT,
    analysis_status VARCHAR(20) DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
    comparison_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP,
    CONSTRAINT different_decks CHECK (deck1_id != deck2_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_comparisons_deck1 ON deck_comparisons(deck1_id);
CREATE INDEX IF NOT EXISTS idx_deck_comparisons_deck2 ON deck_comparisons(deck2_id);
CREATE INDEX IF NOT EXISTS idx_deck_comparisons_user ON deck_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_comparisons_status ON deck_comparisons(analysis_status);
CREATE INDEX IF NOT EXISTS idx_deck_comparisons_type ON deck_comparisons(comparison_type);
