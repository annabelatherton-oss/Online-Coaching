-- Lets a coach fork a plan group's 20-week meal selections per calorie tier (1500-2000 kcal, in
-- steps of 100) so a meal swap only has to be made once for everyone on that calorie level, instead
-- of editing every client's week individually. Null = the plan's standard/master template.
ALTER TABLE weekly_templates ADD COLUMN IF NOT EXISTS calorie_tier integer DEFAULT NULL;
