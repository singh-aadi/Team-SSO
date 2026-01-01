-- Create a special "Global VC Context" company and deck to store global context without deck association
-- This allows VC Mode to upload context globally without selecting a specific deck
-- Using specific UUIDs: 00000000-0000-0000-0000-000000000001 for company, 00000000-0000-0000-0000-000000000002 for deck

-- First, create the company
INSERT INTO companies (
  id,
  name,
  industry,
  stage,
  description,
  status,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Global VC Context',
  'System',
  'Pre-Seed',
  'Special company for storing global VC context that is not associated with any specific pitch deck',
  'active',
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- Then, create the deck with a recognizable ID that matches our frontend constant
INSERT INTO pitch_decks (
  id,
  company_id,
  filename,
  file_url,
  file_type,
  analysis_status,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'global_vc_context.pdf',
  'system://global-vc-context',
  'application/pdf',
  'completed',
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;
