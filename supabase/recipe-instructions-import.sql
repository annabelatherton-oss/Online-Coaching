-- ─────────────────────────────────────────────────────────────────────────────
-- Recipe Book Instructions Import  (exact names matched to database)
-- Run this in Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── BREAKFAST ────────────────────────────────────────────────────────────────

UPDATE meals SET instructions = $body$
1. Mix oats and protein powder in a small container.
2. Add Greek yogurt and milk and mix until fully combined.
3. Add frozen berries on top, or melt in the microwave and drizzle over.
4. Store in the fridge overnight.

Notes: Vanilla protein powder works well, but you can use any. Frozen berries works well for a cheaper option. Alternatively, substitute berries for 10g Biscoff Spread.
$body$ WHERE name = 'Overnight Oats';

UPDATE meals SET instructions = $body$
1. Crush the Weetabix in a container or jar and dampen with a splash of milk.
2. Pour the yogurt and protein on top.
3. Mix the Biscoff with a little milk to loosen it, then drizzle over the top.
4. Store in the fridge overnight.
$body$ WHERE name = 'Overnight Weetabix';

UPDATE meals SET instructions = $body$
1. Mix oats, yogurt, chia seeds and protein powder together in a container.
2. Add berries on top.
3. Store in the fridge overnight.
$body$ WHERE name = 'Chia Pudding';

UPDATE meals SET instructions = $body$
1. Mix oats with milk in a bowl.
2. Microwave for 2 minutes.
3. Remove, stir, then return and microwave in 30-second increments until your desired consistency is achieved.
4. Allow to cool for 1-2 minutes, then stir in honey.

Notes: You can stir in protein powder after cooling, or drink it as a shake on the side.
$body$ WHERE name = 'Porridge';

UPDATE meals SET instructions = $body$
1. Blend flour, protein powder, baking powder, egg and milk together until smooth.
2. Stir in chocolate chips.
3. Spray a pan with Fry-Light and pour in enough batter for one pancake.
4. Cook until bubbles appear on the surface, then flip.
5. Repeat to make 4 pancakes.
6. Stack and top with Greek yogurt and a drizzle of honey.
$body$ WHERE name = 'Protein Pancakes';

UPDATE meals SET instructions = $body$
1. Cook bacon and chicken sausages in the oven or air-fryer until cooked through.
2. Fry the egg in a pan with a lid on to set the yolk.
3. Lay out the wrap and add the fillings.
4. Drizzle over BBQ sauce.
5. Optionally melt cheese on top before folding and serving.
$body$ WHERE name = 'Breafkast Wrap';

UPDATE meals SET instructions = $body$
1. Cook chicken sausages and bacon in the oven or air-fryer until cooked through.
2. Toast the bagel thin.
3. Fry the egg in a pan until cooked to taste.
4. Assemble the fillings on the toasted bagel.
5. Drizzle over ketchup and serve.
$body$ WHERE name = 'Breakfast Bagel';

UPDATE meals SET instructions = $body$
1. Cook chicken sausages in the air-fryer for around 12 minutes.
2. Toast the bagel.
3. Fry the egg with a lid on the pan for around 5 minutes.
4. Assemble the sausages and egg on the toasted bagel and serve.
$body$ WHERE name = 'Chicken Sausage Bagel';

UPDATE meals SET instructions = $body$
1. Toast the bagel.
2. Scramble 3 eggs in a pan with a pinch of salt.
3. Place the scrambled eggs on the toasted bagel.
4. Serve with strawberries on the side.
$body$ WHERE name = 'Scrambled Egg Bagel';

UPDATE meals SET instructions = $body$
1. Toast the bagel.
2. Spread avocado generously over the toasted bagel.
3. Mix protein powder with water and drink as a shake on the side.
$body$ WHERE name = 'Avacado Bagel';

UPDATE meals SET instructions = $body$
1. Cut and toast the bagel.
2. Spread jam and peanut butter on the bagel — either one side jam and one side peanut butter, or mix together.
3. Mix protein powder with water and drink as a shake on the side.

Notes: Can remove or reduce the protein shake depending on desired macros.
$body$ WHERE name = 'PB&J Bagel';

UPDATE meals SET instructions = $body$
1. Put the yogurt into a bowl.
2. Sprinkle granola over the top.
3. Add berries.
4. Break up the dark chocolate into small pieces and place on top.
5. Drizzle honey over the contents of the bowl.
$body$ WHERE name = 'Yogurt';

-- ── LUNCH ────────────────────────────────────────────────────────────────────

UPDATE meals SET instructions = $body$
1. Toast the sourdough.
2. Cook eggs to taste using 1kcal spray oil.
3. Cut the avocado in half, spoon out one half and spread onto the sourdough.
4. Top with the eggs.
5. Sprinkle paprika over to taste.

Notes: Any sourdough can be used. Can add chopped spinach to the egg for extra health benefits.
$body$ WHERE name = 'Avacado and Egg on Sourdough';

UPDATE meals SET instructions = $body$
1. Cook chicken in the pan using any seasoning to taste.
2. Place the lettuce on the wrap.
3. Add the cooked chicken.
4. Drizzle over the sweet chilli sauce.

Notes: Use any veg desired. Blue Dragon do a good reduced sugar sweet chilli sauce (most supermarkets ~ £2.70). Can use any seasonings and change the sauce to any other reduced sugar sauce.
$body$ WHERE name = 'Sweet Chilli Chicken Wrap';

UPDATE meals SET instructions = $body$
1. Add some Fry-Light to a pan. Add in the chicken, pepper and onion. Add seasoning and leave on a medium heat to soften.
2. Add in BBQ sauce and light mayo and mix.
3. Add some boiling water and leave to simmer for a few minutes until it thickens up.
4. Add the lettuce to your wrap and then add the chicken mix on top.
5. Wrap it up and place on a hot pan to seal the wrap.
$body$ WHERE name = 'BBQ Chicken Wrap';

UPDATE meals SET instructions = $body$
1. Cut the chicken into wide but thin strips.
2. Season and cover in the Reggae Reggae sauce.
3. Put the chicken in the air-fryer for 12-15 minutes.
4. Put the lettuce into the bap and then place the chicken on top.
5. Place the cheese on top and let it melt. You may want to do this for a couple of minutes before you take it out of the air fryer.
$body$ WHERE name = 'Jerk Chicken Cheese Burger';

UPDATE meals SET instructions = $body$
1. Toast the bagel.
2. Mix the tuna, onion and light mayo in a bowl and add pink salt.
3. Place the tuna mixture on the toasted bagel.
4. Sprinkle cheese on top.
5. Place in the air fryer or microwave to melt the cheese.

Notes: Quick and easy for days you don't have time to cook. Add something on the side such as rice cakes or fruit to bulk the meal out a little more.
$body$ WHERE name = 'Tuna and Cheese Bagel';

UPDATE meals SET instructions = $body$
1. Fry the bacon in a pan using Fry-Light or the air-fryer.
2. Butter either side of the bread and drizzle the mayo over one side.
3. Place the lettuce onto one side.
4. Place the slices of bacon on top of the lettuce.
5. Chop the tomato and place on top of the bacon.
6. Shred the cooked chicken and place on top. You may choose to add some BBQ sauce at this stage for extra calories.
7. Place the other side of bread on top and serve.
$body$ WHERE name = 'Club Sandwich';

UPDATE meals SET instructions = $body$
1. Toast the bread in the toaster.
2. Cook the beans according to the directions on the tin.
3. Thinly butter the toast.
4. Grate the cheese over the toast.
5. Pour the beans on top, allowing the cheese to melt.

Notes: A quick and simple meal, great for days when you want something homey and warm!
$body$ WHERE name = 'Beans on Toast';

UPDATE meals SET instructions = $body$
1. Fry off the onion, chorizo and tomato puree, then add the cooked chicken to the pan and season.
2. In a bowl, combine the cheese and Philadelphia.
3. Add in the chicken and chorizo mix and combine.
4. Add the full mixture to the wrap and fold.
5. Spray with Fry-Light and air-fry for 5 minutes to make crispy.
6. Remove and serve.
$body$ WHERE name = 'Cheesy Chicken and Chorizo Wrap';

UPDATE meals SET instructions = $body$
1. Chop the onion and then fry off in a pan until soft.
2. Add the mince and seasonings and fry until brown all over.
3. Add in the tomato puree and fry for a couple of minutes.
4. Sprinkle the cheese onto the wrap and place the mince on top.
5. Drizzle over the ketchup and burger sauce and fold.
6. Place in the hot pan for one minute until browned and sealed, then serve.
$body$ WHERE name = 'Cheese Burger Wrap';

UPDATE meals SET instructions = $body$
1. Dice the onion.
2. Mix tuna, onion and light mayo in a bowl and add pink salt.
3. Place the mixture into the bap.
4. Serve with 2 rice cakes.

Notes: Very low cal meal, great on the go or for a quick lunch. You can swap the rice cakes for anything else with similar macros. You can swap the bap for a pita bread for slightly reduced calories.
$body$ WHERE name = 'Tuna Bun';

UPDATE meals SET instructions = $body$
1. Put dry pasta into a pan of boiling water and cook for 12 minutes.
2. Cook chicken in a frying pan with oil over a medium to high heat.
3. Add any seasonings.
4. Once cooked, add the salad, cooked pasta, chicken and cottage cheese to a bowl.
5. Drizzle over any low cal dressings or sauces.

Notes: Dressing options include 0 Fat Vinaigrette, reduced sweet chilli, reduced fat French dressing, etc.
$body$ WHERE name = 'Chicken Salad';

UPDATE meals SET instructions = $body$
1. Put dry pasta into a pan of boiling water and cook for 12 minutes.
2. Drain the tin of tuna and put into a bowl. Salt to taste.
3. Add the onion, sweetcorn and cucumber.
4. Add the cooked pasta and mayo, mix until combined.
5. Serve and enjoy.
$body$ WHERE name = 'Tuna Pasta';

UPDATE meals SET instructions = $body$
1. Put dry rice into a pan of boiling water and cook for 12 minutes.
2. Cook chicken in a frying pan with oil over a medium to high heat.
3. Add any seasonings.
4. Add broccoli to the pan and fry for around 5 minutes, or until the broccoli is soft.
5. Add all ingredients to a bowl and drizzle reduced sweet chilli or any other reduced sauce on top.

Notes: Use any veg desired. Blue Dragon do a good reduced sugar sweet chilli sauce (most supermarkets ~ £2.70).
$body$ WHERE name = 'Chicken and Rice';

UPDATE meals SET instructions = $body$
1. Boil the rice with a 2:1 water to rice ratio.
2. Chop the chicken and cook, coating in pink salt and desired seasonings.
3. Boil the peas using the cooking instructions provided.
4. Mix the cooked rice and chicken in the pan.
5. Scramble the egg at the side of the pan, then mix in.
6. Add in the soy sauce and peas on a low heat and serve.

Notes: You can swap the peas for any desired vegetable if preferred.
$body$ WHERE name = 'Chicken and Egg Fried Rice';

UPDATE meals SET instructions = $body$
1. Chop the veg and garlic. Add to a baking dish, season and mix. Bake at 180°C for 20 minutes.
2. Add tomato puree, covering all contents, and bake for another 20 minutes.
3. Add everything to a pan with 75ml chicken stock.
4. Add chickpeas and simmer for 10 minutes.
5. Add basil if desired.
6. Put everything into a blender, add cottage cheese and feta. Blend until combined.
7. Heat and serve with wholemeal bread.
$body$ WHERE name = 'Roasted Tomato Pepper and Feta Soup';

-- ── PRE-WORKOUT ───────────────────────────────────────────────────────────────

UPDATE meals SET instructions = $body$
1. Mix protein powder with water in a shaker bottle.
2. Shake until smooth.
3. Eat the rice cakes and banana alongside, or place banana slices on the rice cakes.
$body$ WHERE name = 'Rice Cakes';

UPDATE meals SET instructions = $body$
1. Mix protein powder with milk in a shaker bottle.
2. Shake until smooth.
3. Pour over the cereal.

Notes: You can either include the protein powder in the cereal or drink it with water on the side.
$body$ WHERE name = 'Cereal';

UPDATE meals SET instructions = $body$
1. Pour water into the oats until fully covered.
2. Microwave for 2 minutes.
3. Take out and stir for 1 minute.
4. Place back in the microwave for 30-second increments until your desired consistency is achieved.
5. Take out and let cool for 2 minutes.
6. Stir in protein powder.
7. Add berries on top.

Notes: You must allow the oats to cool before adding protein powder to prevent it from being denatured. Chocolate protein powder works well with this.
$body$ WHERE name = 'Oats';

-- ── DINNER ───────────────────────────────────────────────────────────────────

UPDATE meals SET instructions = $body$
1. Boil the rice with a ratio of 2:1 water to rice.
2. Cook the chicken mince with the seasonings listed.
3. Chop and add veggies to the pan once the mince is partially cooked.
4. Once the chicken is fully cooked and the vegetables have softened, add in the sauces and garlic.
5. Then add the cooked rice into the same pan.
6. Crack and scramble the egg at one side of the pan. Once scrambled, mix in with the rest of the dish.
7. Once plated, top with chopped spring onion.
$body$ WHERE name = 'Sweet Chilli Chicken Egg Fried Rice';

UPDATE meals SET instructions = $body$
1. Boil the rice with a ratio of 2:1 water to rice.
2. Season the chicken with salt and pepper, paprika and garlic paste, then coat in the corn flour.
3. Cook the chicken in a pan until almost fully cooked.
4. Add the broccoli into the pan.
5. Once the chicken is fully cooked and the veg is softened, take out of the pan.
6. Add the honey, soy sauce, sweet chilli sauce and garlic into the pan and cook on a high heat until thick and sticky.
7. Add the chicken and rice to the pan and mix together.
$body$ WHERE name = 'Sticky Honey Chicken and Rice';

UPDATE meals SET instructions = $body$
1. Dice onions and chop chorizo into small pieces. Fry off in a pan using Fry-Light for a few minutes, then add the garlic.
2. Chop your chicken, season and add to the pan.
3. When your chicken is brown all over, add the tomato puree.
4. Add in the uncooked rice, followed by the chicken stock (water should be double the amount of rice — easiest to measure using a cup).
5. Bring to a boil then place a lid on top and leave to simmer for around 15-20 minutes, stirring occasionally.
6. Sprinkle over the cheese and serve.
$body$ WHERE name = 'Chicken and Chorizo Rice';

UPDATE meals SET instructions = $body$
1. Boil the noodles in boiling, salted water for around 12 minutes.
2. Chop the pepper, onion and broccoli and place into a Fry-Light-sprayed pan. Fry until soft.
3. Chop the chicken into small pieces and add to the pan, spraying some more Fry-Light.
4. Once almost fully cooked, add the stir-fry sauce packet and leave to cook for a few more minutes.
5. Once cooked, drain and add the noodles to the pan, combine and serve.
$body$ WHERE name = 'Stir Fry';

UPDATE meals SET instructions = $body$
1. Boil the pasta.
2. Chop garlic and onion finely and fry in a pan.
3. Add in the mince with 1kcal spray oil and fry until browned.
4. Add in the seasonings and the carrot and pepper and fry until soft.
5. Add in all of the sauce ingredients and leave to simmer until thick.
6. Add the pasta to the pan.
7. Sprinkle the cheese on top and mix until melted.
$body$ WHERE name = 'Cheesy Beef Pasta';

UPDATE meals SET instructions = $body$
1. Boil the pasta.
2. Chop the chicken, coat in seasonings and cook in a pan with 1kcal spray until almost fully cooked.
3. Add in sun-dried tomatoes, tomato puree and chicken stock. Leave to simmer for a few minutes.
4. Add in crème fraîche and leave for a few minutes to thicken.
5. Add in the spring onion and serve.
$body$ WHERE name = 'Creamy Chicken Pasta';

UPDATE meals SET instructions = $body$
1. Boil the pasta.
2. Chop the chicken, coat in seasonings and cook in a pan with 1kcal spray until almost fully cooked.
3. Add in chorizo and halloumi and fry until cooked.
4. Add in pasta and red pesto and leave on the heat for a few minutes until fully combined and heated through.
5. Top with parmesan.
$body$ WHERE name = 'Chicken, Hallouimi and Chorizo Pasta';

UPDATE meals SET instructions = $body$
1. Boil the pasta.
2. Chop the chicken into chunks and season.
3. Add 1kcal spray oil to a pan and fry the chicken until golden brown.
4. Dice the pepper and onion and fry until soft, then add the garlic to the pan.
5. Pour in the tinned tomatoes and simmer for around 10 minutes.
6. Add the light cream cheese and some pasta water and leave to simmer for a few minutes.
7. Add in the pasta and mix.
8. Add to bowls and sprinkle the parmesan over the top.
$body$ WHERE name = 'Creamy Cajun Chicken Pasta';

UPDATE meals SET instructions = $body$
1. Boil the pasta.
2. Chop the chicken into chunks and season.
3. Dice the pepper and onion, add some 1kcal oil spray to a pan and fry until soft, then add the garlic to the pan.
4. Add in the chicken and fry until golden brown.
5. Pour in the tinned tomatoes and simmer for around 10 minutes.
6. Add the light cream cheese, Peri-Peri Sauce and some pasta water and leave to simmer for a few minutes.
7. Add in the pasta and mix.
8. Add to bowls and sprinkle the cheese over the top.
$body$ WHERE name = 'Creamy Nandos Chicken Pasta';

UPDATE meals SET instructions = $body$
1. Boil the pasta until half cooked.
2. Dice the pepper and onion, add some 1kcal oil spray to a pan and fry until soft, then add the garlic to the pan.
3. Chop the chicken sausages into chunks.
4. Add in the chicken and fry until golden brown.
5. Add in seasonings and fry for 2 minutes.
6. Pour in the tinned tomatoes, tomato puree and chicken stock (mixed into 200ml water) and simmer for around 12-15 minutes.
7. Add the pasta and leave to simmer until almost fully cooked.
8. Stir in the mascarpone and basil and leave on the heat for 2 minutes.
9. Top with cheese, serve and enjoy!
$body$ WHERE name = 'Chicken Sausage and Mascarpone';

UPDATE meals SET instructions = $body$
1. Chop the onion and carrot. Spray some Fry-Light in a pan and fry until soft.
2. Add the mince and cook until browned.
3. Add the chopped tomatoes and tomato puree and leave to simmer.
4. In another bowl, mix the cream cheese, milk and cornflour until combined.
5. Begin to layer up your lasagne, adding a little cheese on each layer.
6. Bake in the oven for 20-30 minutes at 180°C.
7. Once golden brown, remove and serve.
$body$ WHERE name = 'Reduced Lasange';

UPDATE meals SET instructions = $body$
1. Boil the spaghetti.
2. Fry the mince in a pan using Fry-Light. Once brown all over, add in the onion, celery and carrot.
3. Add in the chopped tomatoes, tomato puree, red wine stock pot and beef stock. Leave to simmer for around 15 minutes.
4. Once thickened, add the spaghetti to a bowl and place the bolognese mixture on top.
5. Sprinkle with cheese and serve.
$body$ WHERE name = 'Spaghetti Bolognase';

UPDATE meals SET instructions = $body$
1. Chop the chicken and fry in a pan with seasoning using Fry-Light.
2. Remove the chicken and fry the onion and pepper.
3. Add the orzo, tomatoes and chicken stock.
4. Leave to boil with the lid on the pan for a few minutes, then add the tomato puree.
5. Leave for another few minutes and add the Peri Peri sauce and cream cheese.
6. Add the chicken back in and leave for around another 5 minutes until the orzo is fully cooked.
7. Remove, top with sliced halloumi and serve.
$body$ WHERE name = 'Nandos Orzo';

UPDATE meals SET instructions = $body$
1. Leave the raw steak at room temperature for 20-25 minutes.
2. Meanwhile, chop your potato into blocks, coat in your chosen seasonings, spray with Fry-Light and place in the oven or air fryer for around 20-30 minutes until golden brown.
3. Coat the steak in your chosen seasonings.
4. Place a pan on the hob on a high heat and spray with Fry-Light.
5. Place the steak into the pan and cook on both sides to taste.
6. Serve with potatoes and side salad.
$body$ WHERE name = 'Steak and Poatoes';

UPDATE meals SET instructions = $body$
1. Place the potatoes in cold, salted water, bring to a boil and boil for around 12-15 minutes.
2. Place the salmon skin side-down onto a baking tray with foil on. Rub the oil all over it, along with any desired seasonings.
3. Place in the oven for 12-15 minutes until the skin is flaky.
4. Place the broccoli in boiling water and boil for 3-4 minutes until slightly softened. Season if desired.
5. Remove the salmon from the oven and serve with the potatoes and broccoli.
$body$ WHERE name = 'Salmon and Potatoes';
