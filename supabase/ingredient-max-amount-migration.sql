-- max_amount: largest amount to use in a meal (null = no maximum)
--   e.g. 30 = never use more than 30g of nut butter per meal
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS max_amount numeric(8,2) DEFAULT NULL;
