-- Independent "meal prep friendly" flag for breakfasts, separate from the sweet/savoury
-- classification in template_subtype — a batch-cooked breakfast can be either sweet or savoury.
ALTER TABLE meals ADD COLUMN IF NOT EXISTS meal_prep_friendly boolean DEFAULT NULL;
