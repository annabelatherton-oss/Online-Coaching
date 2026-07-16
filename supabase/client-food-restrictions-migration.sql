-- Add food restriction columns to clients.
-- allergies: predefined allergen keys (e.g. 'dairy', 'gluten', 'eggs')
-- dislikes:  free-text ingredient names the client wants avoided
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS allergies text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dislikes  text[] NOT NULL DEFAULT '{}';
