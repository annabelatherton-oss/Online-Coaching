-- Updates the specific coaching cues that were revised in this pass for
-- uniformity: adding the "squeeze/pause at the top" engagement cue to
-- exercise variations whose sibling variations already had one (curls,
-- presses, rows, and the whole hip-hinge family — RDLs, deadlifts, good
-- mornings, stiff-leg variants), and tightening two oddly-placed endings
-- (Back Squat, Bench Press). Matched by exercise name + equipment rather
-- than hardcoded ids, so it's safe to run even if a row doesn't exist yet
-- (it just matches zero rows) or was recreated with a new id.
-- Run once in Supabase SQL Editor. Safe to re-run.

UPDATE exercise_variations ev SET coaching_cues = $$Set the bar in a rack at roughly chest height, step under it and rest it across your upper traps with your feet shoulder-width apart. Break at the hips and knees together, sitting back until your thighs are at least parallel, then drive hard through the whole foot to stand, squeezing your glutes at the top. Keep your chest up and your core braced throughout the lift — losing that brace is usually what causes the bar to drift forward.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Back Squat' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Lie on the bench with your eyes under the bar, feet flat on the floor, and grip just outside shoulder width. Unrack, lower the bar under control to touch your chest, then press back up in a straight line without flaring your elbows to 90°, squeezing your chest hard at the top. Keep your shoulder blades pinned together and drive your feet into the floor throughout the set.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Bench Press' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand tall holding the bar with an underhand, shoulder-width grip and your elbows pinned to your sides. Curl the bar up by bending only at the elbow, squeeze hard at the top, then lower it back down under control without swinging your torso. Keep your elbows locked in place the whole set — if they drift forward, drop the weight.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Bicep Curl' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand holding a dumbbell in each hand with a neutral, palms-facing-in grip, elbows pinned to your sides. Curl both (or alternate) up under control without rotating your wrists, squeeze at the top, then lower slowly. The neutral grip shifts more emphasis onto the forearm and the outer head of the bicep.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Hammer Curl' AND ev.equipment = 'Dumbbell';

UPDATE exercise_variations ev SET coaching_cues = $$Set the bench to a moderate incline and grip the bar just outside shoulder width, unracking over your upper chest. Lower the bar under control to your upper chest, then press back up in a straight line, squeezing your upper chest at the top. Keep the incline moderate — too steep turns this into a shoulder press.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Incline Chest Press' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Set the bench to a moderate incline and press a dumbbell in each hand up from shoulder height. Lower under control until you feel a stretch across your upper chest, then press back up, squeezing your chest together at the top without clanking the weights. The dumbbells let each side work independently, so keep both arms moving at the same pace.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Incline Chest Press' AND ev.equipment = 'Dumbbell';

UPDATE exercise_variations ev SET coaching_cues = $$Sit back against the pad and grip the handles at upper-chest height. Press forward and slightly up until your arms are extended, squeezing your chest at the top, then lower back under control. Keep your shoulder blades pinned back against the pad throughout.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Incline Chest Press' AND ev.equipment = 'Machine';

UPDATE exercise_variations ev SET coaching_cues = $$Set an incline bench under the Smith machine bar and unrack it over your upper chest. Lower under control to your upper chest, then press back up in a straight line, squeezing your chest at the top. The fixed bar path means you can focus purely on driving through your upper chest without balancing the bar.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Incline Chest Press' AND ev.equipment = 'Smith Machine';

UPDATE exercise_variations ev SET coaching_cues = $$Lie face-down on an incline bench holding a dumbbell in each hand, arms hanging straight down. Raise your arms out to the sides with a slight elbow bend until they're roughly in line with your torso, squeezing your shoulder blades together at the top, then lower under control. Keep the movement slow — this is a small muscle, so momentum takes over easily if you rush it.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Incline Rear Delt Raise' AND ev.equipment = 'Dumbbell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand with the kettlebell on the floor in front of you, feet shoulder-width apart. Hinge at the hips to grip it, then drive your hips forward explosively to swing it up to chest height, keeping your arms relaxed as it floats and swings back down between your legs to load the next rep. Let your hips do all the work — your arms are just along for the ride, not powering the swing.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Kettlebell Swing' AND ev.equipment = 'Kettlebell';

UPDATE exercise_variations ev SET coaching_cues = $$Sit under the bar with your knees secured under the pad and take a wide overhand grip. Pull the bar down to your upper chest, driving your elbows down and back and squeezing your lats at the bottom, then let it rise back up under control without leaning back excessively. Lead with your elbows, not your hands, to keep the lats doing the work.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Lat Pulldown' AND ev.equipment = 'Cable';

UPDATE exercise_variations ev SET coaching_cues = $$Adjust the seat so the pivot lines up with your shoulders, then grip the handles or bar with your arms extended overhead. Pull down in an arc until your hands reach your thighs, squeezing your lats as you keep your arms mostly straight throughout, then let them rise back up under control. Keep a soft bend in your elbows — don't turn it into a tricep pushdown.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Lat Pullover' AND ev.equipment = 'Machine';

UPDATE exercise_variations ev SET coaching_cues = $$Stand side-on to a low pulley and grip the handle with the arm furthest from the machine. Raise your arm out to the side up to shoulder height, leading with your elbow, pause briefly at the top, then lower under control. The constant cable tension means the bottom of the rep stays loaded — don't let the weight stack rest between reps.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Lateral Raise' AND ev.equipment = 'Cable';

UPDATE exercise_variations ev SET coaching_cues = $$Stand holding a dumbbell in each hand by your sides, with a very slight bend in your elbows. Raise both arms out to the sides up to shoulder height, leading with your elbows, pause briefly at the top, then lower under control. Keep the weight light enough that you're not swinging your torso to help lift it.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Lateral Raise' AND ev.equipment = 'Dumbbell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand holding a straight bar with a shoulder-width overhand grip in front of your thighs. Raise the bar up in front of you leading with your elbows, pause briefly at the top, then lower under control. Keep your wrists neutral throughout — don't let them bend under the bar's weight.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Lateral Raise' AND ev.equipment = 'Straight Bar';

UPDATE exercise_variations ev SET coaching_cues = $$Sit on the end of a bench holding a dumbbell in each hand by your sides. Raise both arms out to the sides up to shoulder height, leading with your elbows, pause briefly at the top, then lower under control. Sitting removes any leg drive, so keep the weight light enough to move with strict form.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Seated Lateral Raise' AND ev.equipment = 'Dumbbell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand holding the bar at hip height with a shoulder-width grip. Push your hips back, keeping a soft bend in your knees and the bar close to your legs, until you feel a deep stretch in your hamstrings, then drive your hips forward to stand tall, squeezing your glutes at the top. Keep your back flat throughout — this is a hip hinge, not a squat.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'RDLs (Glutes)' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand holding a dumbbell in each hand in front of your thighs. Push your hips back, keeping a soft bend in your knees, and lower the weights close to your legs until you feel a stretch in your hamstrings, then drive your hips forward to stand tall, squeezing your glutes at the top. Keep the dumbbells close to your legs the whole way down and up.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'RDLs (Glutes)' AND ev.equipment = 'Dumbbell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand with the bar over your mid-foot, grip just outside your legs, and set your hips down until your shins touch the bar with your back flat. Drive through the floor, keeping the bar close to your legs the whole way up, and finish by standing tall with your hips through and glutes squeezed. Keep your back flat throughout — if it rounds, reset and brace again before pulling.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Deadlift' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Step inside the trap bar with your feet hip-width apart, gripping the handles at your sides. Push your hips down and back until your shins are vertical, keeping your chest up, then drive through the floor to stand tall, squeezing your glutes at the top. The neutral grip and centred weight make this an easier position to keep your back flat in than a standard barbell pull.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Trap Bar Deadlift' AND ev.equipment = 'Trap Bar';

UPDATE exercise_variations ev SET coaching_cues = $$Stand holding the bar at hip height, knees almost straight (a very slight bend only). Lower the bar down your legs by pushing your hips back, keeping your knees mostly locked, until you feel a strong stretch in your hamstrings, then drive your hips forward to stand, squeezing your glutes at the top. Keep the bar brushing your legs the whole way down and up.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Stiff Leg Deadlift' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand holding the bar at hip height with your legs almost fully straight. Push your hips back, keeping your knees locked in that slight bend, until you feel a deep stretch through your hamstrings, then drive your hips forward to stand tall, squeezing your glutes at the top. This is a bigger stretch than a standard RDL — go only as far as your hamstring flexibility allows without rounding your back.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Straight Leg RDL' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand holding a dumbbell in each hand in front of your thighs, legs almost straight. Push your hips back, keeping your knees in that same slight bend, lowering the weights until you feel a deep hamstring stretch, then drive your hips forward to stand, squeezing your glutes at the top. Keep the dumbbells close to your legs throughout.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Straight Leg RDL' AND ev.equipment = 'Dumbbell';

UPDATE exercise_variations ev SET coaching_cues = $$Set up in the machine with the pad positioned for a hip hinge, keeping your knees almost straight throughout. Push your hips back against the resistance until you feel a deep stretch through your hamstrings, then drive your hips forward to extend, squeezing your glutes at the top. Keep your back flat and knees locked in that slight bend the whole set.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Straight Leg RDL' AND ev.equipment = 'Machine';

UPDATE exercise_variations ev SET coaching_cues = $$Stand with your feet wide, toes turned out, and grip the bar inside your legs. Push your hips down and back to set your shins vertical, then drive through the floor, keeping your chest up and the bar close to your body, to stand tall with your glutes squeezed. Keep your knees tracking out over your toes throughout the pull.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Sumo Deadlift' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Set the bar across your upper back, feet wide and toes turned out significantly more than a standard squat. Squat straight down keeping your torso upright, knees tracking out over your toes, then drive back up, squeezing your glutes at the top. Keep your chest tall throughout — the wide stance means there's less forward lean than a regular squat.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Sumo Squat' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Set the bar across your upper back as you would for a squat, feet shoulder-width apart and a soft bend in your knees. Hinge forward at the hips, pushing them back until your torso is close to parallel with the floor, then drive your hips forward to stand tall, squeezing your glutes at the top. Keep your back flat and the bar's path close to your body throughout.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Good Mornings' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Set the bar across your upper back in the Smith machine, feet shoulder-width apart with a soft knee bend. Hinge at the hips, pushing them back until your torso nears parallel with the floor, then drive your hips forward to stand tall, squeezing your glutes at the top. The fixed bar path lets you focus purely on the hip hinge without worrying about balance.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Good Mornings' AND ev.equipment = 'Smith Machine';

UPDATE exercise_variations ev SET coaching_cues = $$Hold a dumbbell in each hand (or one in the hand opposite your standing leg) and balance on one foot with a soft bend in that knee. Hinge forward at the hip, letting your free leg extend straight back behind you as your torso lowers, until you feel a stretch in your standing leg's hamstring, then drive back up to standing, squeezing your glute at the top. Keep your hips square to the floor throughout — don't let them rotate open.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Single Leg Romanian Deadlift' AND ev.equipment = 'Dumbbell';

UPDATE exercise_variations ev SET coaching_cues = $$Hold the bar with both hands and balance on one foot with a soft bend in that knee. Hinge forward at the hip, letting your free leg extend straight back as your torso lowers and the bar travels down close to your leg, until you feel a hamstring stretch, then drive back up to standing, squeezing your glute at the top. Keep your hips square throughout — this is a balance and hip-hinge exercise, not a fast one.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Single Leg Romanian Deadlift' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Hold the kettlebell in the hand opposite your standing leg and balance on that foot with a soft knee bend. Hinge forward at the hip, letting your free leg extend straight back as your torso lowers and the bell travels down close to your leg, until you feel a hamstring stretch, then drive back up to standing, squeezing your glute at the top. Keep your hips square to the floor the whole way through.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Single Leg Romanian Deadlift' AND ev.equipment = 'Kettlebell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand facing a high pulley with a wide grip on the bar and your arms straight. Pull the bar down in an arc to your thighs, squeezing your lats as your hands reach your legs, then let it rise back up under control. Keep your arms locked at a slight bend — this is a lat isolation move, not a tricep exercise.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Straight Arm Pulldown' AND ev.equipment = 'Cable';

UPDATE exercise_variations ev SET coaching_cues = $$Lie on a bench holding the bar above your chest with a shoulder-width grip, arms extended. Bend only at the elbows to lower the bar toward your forehead (or just behind your head), then extend back up, squeezing your triceps hard at lockout. Keep your upper arms still and vertical throughout — only your forearms should move.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Skull Crusher' AND ev.equipment = 'Barbell';

UPDATE exercise_variations ev SET coaching_cues = $$Lie on a bench positioned under a low pulley, holding the attachment above your chest with your arms extended. Bend only at the elbows to lower it toward your forehead, then extend back up, squeezing your triceps hard at lockout. The cable keeps constant tension, so control the lowering phase rather than letting it drop.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Skull Crusher' AND ev.equipment = 'Cable';

UPDATE exercise_variations ev SET coaching_cues = $$Lie on a bench holding a dumbbell in each hand above your chest, palms facing each other, arms extended. Bend only at the elbows to lower the weights toward your temples, then extend back up, squeezing your triceps hard at lockout. Keep your upper arms still and vertical — only your forearms should be moving.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Skull Crusher' AND ev.equipment = 'Dumbbell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand facing a high pulley holding the attachment with both hands overhead, elbows pointing forward and close to your head. Extend your arms by straightening at the elbow and squeezing your triceps hard, then bend to lower the weight back behind your head under control. Keep your elbows pinned in place — only your forearms should move.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Tricep Extensions' AND ev.equipment = 'Cable';

UPDATE exercise_variations ev SET coaching_cues = $$Stand or sit holding one dumbbell with both hands overhead, elbows pointing forward and close to your head. Lower the weight behind your head by bending only at the elbows, then extend back up, squeezing your triceps hard at lockout. Keep your upper arms still throughout — flaring your elbows out turns this into a different movement.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Tricep Extensions' AND ev.equipment = 'Dumbbell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand or sit holding one dumbbell with both hands wrapped around the top of the handle, arms extended overhead. Lower the weight behind your head by bending only at the elbows, keeping your upper arms close to your ears, then extend back up to full lockout, squeezing your triceps hard. Keep your elbows pointing forward throughout — letting them flare out turns this into a different movement.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Overhead Tricep Extension' AND ev.equipment = 'Dumbbell';

UPDATE exercise_variations ev SET coaching_cues = $$Stand facing away from a low pulley, holding the rope or single handle with both hands overhead, elbows pointing forward and close to your head. Lower the attachment behind your head by bending only at the elbows, then extend back up to full lockout, squeezing your triceps hard. Keep constant tension on the triceps by not letting the weight stack rest at the top.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Overhead Tricep Extension' AND ev.equipment = 'Cable';

UPDATE exercise_variations ev SET coaching_cues = $$Sit or stand holding the bar overhead with a narrow, shoulder-width grip, elbows pointing forward and close to your head. Lower the bar behind your head by bending only at the elbows, then extend back up to full lockout, squeezing your triceps hard. Keep your upper arms still throughout — only your forearms should move.$$
FROM exercises e WHERE ev.exercise_id = e.id AND e.name = 'Overhead Tricep Extension' AND ev.equipment = 'Barbell';
