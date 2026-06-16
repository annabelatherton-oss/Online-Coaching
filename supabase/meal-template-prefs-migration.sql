-- Persists per-meal generator preferences so the coach doesn't have to re-classify every time
ALTER TABLE meals ADD COLUMN IF NOT EXISTS template_subtype text DEFAULT NULL;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS excluded_from_templates boolean DEFAULT false;
