-- Independent "carb type" classification for dinners (rice/potato/pasta/noodle/bread/other),
-- separate from the protein-based template_subtype — used to avoid pairing two dinners with
-- the same carb in the same week.
ALTER TABLE meals ADD COLUMN IF NOT EXISTS template_carb text DEFAULT NULL;
