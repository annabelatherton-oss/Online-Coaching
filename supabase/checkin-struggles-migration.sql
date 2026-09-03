-- Adds the "what are you most struggling with?" multi-select + free text
-- fields to weekly check-ins.
ALTER TABLE client_checkins ADD COLUMN IF NOT EXISTS struggles text[] NOT NULL DEFAULT '{}';
ALTER TABLE client_checkins ADD COLUMN IF NOT EXISTS struggles_other text;
