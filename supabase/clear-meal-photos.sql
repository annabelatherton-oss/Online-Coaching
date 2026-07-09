-- Clear all meal photos except the specified ones to keep
UPDATE meals
SET photo_url = NULL
WHERE coach_id = '21e12464-ea80-4126-855d-baf848e0b717'
  AND name NOT IN (
    'Raspberry Overnight Weetabix',
    'Avacado and Egg on Sourdough',
    'Avacado Bagel',
    'BBQ Chicken Wrap',
    'Avacado on Toast',
    'Cheesy BBQ Chicken Loaded Fries',
    'Beef Tacos'
  );

-- Copy the breakfast Avacado and Egg on Sourdough photo to the lunch version
UPDATE meals AS lunch_v
SET photo_url = (
  SELECT photo_url
  FROM meals
  WHERE coach_id = '21e12464-ea80-4126-855d-baf848e0b717'
    AND name = 'Avacado and Egg on Sourdough'
    AND category = 'breakfast'
    AND photo_url IS NOT NULL
  LIMIT 1
)
WHERE lunch_v.coach_id = '21e12464-ea80-4126-855d-baf848e0b717'
  AND lunch_v.name = 'Avacado and Egg on Sourdough'
  AND lunch_v.category = 'lunch';
