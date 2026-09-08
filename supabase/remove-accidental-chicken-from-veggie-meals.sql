-- Finds (then removes) any real-chicken ingredient someone added by hand to a meal that's
-- supposed to be vegetarian/vegan — "Quorn Chicken Pieces" is deliberately excluded since that's
-- the meat-free substitute, not real chicken. Scoped to exactly the vegetarian/vegan meals added
-- this session, so it can never touch any other meal.

-- STEP 1 — run this first and check the list looks right (each row is one ingredient to be removed):
select m.name as meal_name, mi.name as ingredient_name, mi.quantity_g, mi.unit
from meal_ingredients mi
join meals m on m.id = mi.meal_id
where m.coach_id = (select id from profiles where email = 'annabelatherton@gmail.com')
  and m.name in (
    'Apple & Almonds',
    'Apple & Peanut Butter (Vegan)',
    'Baked Beans & Sweet Potato Jacket',
    'Baked Beans on Sourdough',
    'Banana & Peanut Butter Rice Cakes',
    'Banana & Peanut Butter Rice Cakes (Vegan)',
    'Bean & Veg Stir Fry',
    'Chickpea & Avocado Salad',
    'Chickpea & Avocado Wrap',
    'Chickpea & Feta Salad',
    'Chickpea Curry & Rice',
    'Chickpea Tomato Curry & Rice',
    'Cottage Cheese & Berries',
    'Cottage Cheese & Fruit Bowl',
    'Cottage Cheese Baked Potato',
    'Dark Chocolate & Walnuts',
    'Dates & Almonds (Vegan)',
    'Greek Yogurt & Dark Chocolate',
    'Greek Yogurt Protein Pot',
    'Green Lentil Dahl & Rice',
    'Halloumi & Veg Traybake',
    'Halloumi & Veg Wrap',
    'Hummus & Carrot Sticks',
    'Hummus & Chickpea Wrap',
    'Hummus & Rice Cakes',
    'Kidney Bean & Rice Bowl',
    'Kidney Bean Chilli & Rice',
    'Kidney Bean Rice Bowl',
    'Peanut Butter Banana Oats',
    'Protein Mousse Pot',
    'Protein Yogurt & Granola',
    'Quorn Chicken Caesar Salad',
    'Quorn Mince Bolognese',
    'Quorn Sausage & Mash',
    'Quorn Sausage Breakfast Wrap',
    'Red Lentil Dahl & Rice',
    'Rice Cakes & Peanut Butter',
    'Rice Cakes & Peanut Butter (Vegan)',
    'Sourdough Toast & Honey',
    'Soy Milk Protein Oats',
    'Steamed Edamame',
    'Sweet Potato & Chickpea Traybake',
    'Tempeh & Rice Bowl',
    'Tempeh & Sweet Potato Traybake',
    'Tofu & Edamame Salad',
    'Tofu Scramble on Sourdough',
    'Tofu Stir Fry',
    'Vegan Cheese & Rice Cakes',
    'Vegan Mince Bolognese',
    'Vegan Oat Porridge with Berries',
    'Vegan Protein Shake',
    'Veggie Chilli',
    'Veggie Scrambled Eggs & Sourdough'
  )
  and mi.name ilike '%chicken%'
  and mi.name not ilike 'quorn%';

-- STEP 2 — once the list above looks right, run this to delete exactly those rows:
delete from meal_ingredients mi
using meals m
where m.id = mi.meal_id
  and m.coach_id = (select id from profiles where email = 'annabelatherton@gmail.com')
  and m.name in (
    'Apple & Almonds',
    'Apple & Peanut Butter (Vegan)',
    'Baked Beans & Sweet Potato Jacket',
    'Baked Beans on Sourdough',
    'Banana & Peanut Butter Rice Cakes',
    'Banana & Peanut Butter Rice Cakes (Vegan)',
    'Bean & Veg Stir Fry',
    'Chickpea & Avocado Salad',
    'Chickpea & Avocado Wrap',
    'Chickpea & Feta Salad',
    'Chickpea Curry & Rice',
    'Chickpea Tomato Curry & Rice',
    'Cottage Cheese & Berries',
    'Cottage Cheese & Fruit Bowl',
    'Cottage Cheese Baked Potato',
    'Dark Chocolate & Walnuts',
    'Dates & Almonds (Vegan)',
    'Greek Yogurt & Dark Chocolate',
    'Greek Yogurt Protein Pot',
    'Green Lentil Dahl & Rice',
    'Halloumi & Veg Traybake',
    'Halloumi & Veg Wrap',
    'Hummus & Carrot Sticks',
    'Hummus & Chickpea Wrap',
    'Hummus & Rice Cakes',
    'Kidney Bean & Rice Bowl',
    'Kidney Bean Chilli & Rice',
    'Kidney Bean Rice Bowl',
    'Peanut Butter Banana Oats',
    'Protein Mousse Pot',
    'Protein Yogurt & Granola',
    'Quorn Chicken Caesar Salad',
    'Quorn Mince Bolognese',
    'Quorn Sausage & Mash',
    'Quorn Sausage Breakfast Wrap',
    'Red Lentil Dahl & Rice',
    'Rice Cakes & Peanut Butter',
    'Rice Cakes & Peanut Butter (Vegan)',
    'Sourdough Toast & Honey',
    'Soy Milk Protein Oats',
    'Steamed Edamame',
    'Sweet Potato & Chickpea Traybake',
    'Tempeh & Rice Bowl',
    'Tempeh & Sweet Potato Traybake',
    'Tofu & Edamame Salad',
    'Tofu Scramble on Sourdough',
    'Tofu Stir Fry',
    'Vegan Cheese & Rice Cakes',
    'Vegan Mince Bolognese',
    'Vegan Oat Porridge with Berries',
    'Vegan Protein Shake',
    'Veggie Chilli',
    'Veggie Scrambled Eggs & Sourdough'
  )
  and mi.name ilike '%chicken%'
  and mi.name not ilike 'quorn%';
