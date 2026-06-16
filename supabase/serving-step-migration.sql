-- serving_step: amounts must be a multiple of this (null = any amount)
--   e.g. 1 = whole units only, 0.5 = halves allowed
-- min_amount: smallest amount to use in a meal (null = no minimum)
--   e.g. 40 = never use less than 40g of oats

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS serving_step numeric(8,2) DEFAULT NULL;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS min_amount numeric(8,2) DEFAULT NULL;

-- Auto-set sensible increments based on unit type
UPDATE ingredients SET serving_step = 1
WHERE serving_unit IN ('unit','piece','square','slice','large','date','clove','small','bar','Roll','roll','packet','bag');

UPDATE ingredients SET serving_step = 0.5
WHERE serving_unit IN ('tin','pot');

UPDATE ingredients SET serving_step = 5
WHERE serving_unit IN ('g', 'ml');
