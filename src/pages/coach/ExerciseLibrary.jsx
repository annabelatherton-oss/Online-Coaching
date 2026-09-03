import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const MUSCLE_GROUPS = ['Glutes', 'Quads', 'Hamstrings', 'Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Full Body', 'Adductors', 'Abductors', 'Hip Flexors']
const EQUIPMENT_LIST = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Smith Machine', 'EZ Bar', 'Straight Bar', 'Resistance Band', 'Bodyweight', 'Kettlebell', 'Pull-up Bar', 'Trap Bar', 'Landmine', 'Battle Ropes', 'Sled', 'TRX', 'Medicine Ball']
const EXERCISE_TYPES = ['Compound', 'Isolation']

// Standalone equipment-specific coaching cue, appended to the generic cue.
const EQUIPMENT_CUE_PHRASES = {
  'Barbell': 'Keep your grip and stance consistent every set so you can track progress properly.',
  'Dumbbell': "Move both sides evenly — don't let one side rush ahead of the other.",
  'Cable': "Keep tension on the muscle throughout the set — don't let the weight stack rest between reps.",
  'Machine': "Adjust the seat or pad so the joint lines up with the machine's pivot point before you start.",
  'Smith Machine': 'Use the fixed bar path to focus on the muscle rather than balancing the bar.',
  'EZ Bar': 'Grip the angled part of the bar for the most comfortable wrist position.',
  'Straight Bar': 'Keep your grip even on both sides of the bar.',
  'Resistance Band': "Keep tension on the band throughout — don't let it go slack at any point.",
  'Bodyweight': 'Control the tempo rather than rushing through reps.',
  'Kettlebell': 'Keep your core braced throughout to control the momentum of the bell.',
  'Pull-up Bar': 'Start each rep from a full, controlled hang.',
  'Trap Bar': 'Keep the bar close and your back flat throughout the lift.',
  'Landmine': "Keep the movement smooth through the bar's natural arc.",
  'Battle Ropes': 'Keep your core braced and maintain a steady rhythm throughout.',
  'Sled': 'Keep your steps short and drive through the whole foot.',
  'TRX': 'Keep your body rigid and control the instability rather than fighting it.',
  'Medicine Ball': 'Move with control on the set-up, then commit fully on the explosive part.',
  'Pec Deck': 'Keep your back flat against the pad throughout the set.',
}

// Hand-written, exercise-specific cues (setup → how to perform it → a
// notable tip) for every (exercise, equipment) combination already in the
// library, keyed by `${name}|${equipment || ''}`. Generate() below uses one
// of these verbatim whenever the name + equipment match exactly, since a
// generic template can't know real setup details for a named movement.
const HAND_WRITTEN_CUES = {
  "Ab Wheel Rollout|Bodyweight": `Kneel on a pad with the wheel under your shoulders and roll forward slowly, keeping your arms straight and hips tucked under. Stop before your lower back arches, then pull back to the start. Go only as far as you can control the return — depth isn't the goal, staying braced is.`,
  "Back Squat|Barbell": `Set the bar in a rack at roughly chest height, step under it and rest it across your upper traps with your feet shoulder-width apart. Break at the hips and knees together, sitting back until your thighs are at least parallel, then drive through the whole foot to stand. Keep your chest up and brace your core hard before you unrack.`,
  "Bench Press|Barbell": `Lie on the bench with your eyes under the bar, feet flat on the floor, and grip just outside shoulder width. Unrack, lower the bar under control to touch your chest, then press back up in a straight line without flaring your elbows to 90°. Keep your shoulder blades pinned together throughout the set.`,
  "Bent Over Row|Barbell": `Hinge at the hips with a slight knee bend until your torso is close to parallel to the floor, gripping the bar just outside your legs. Row the bar into your lower ribs, driving your elbows back and squeezing your shoulder blades together, then lower under control. Keep your back flat — if you're rounding, the weight's too heavy.`,
  "Bicep Curl|Barbell": `Stand tall holding the bar with an underhand, shoulder-width grip and your elbows pinned to your sides. Curl the bar up by bending only at the elbow, then lower it back down under control without swinging your torso. Keep your elbows locked in place the whole set — if they drift forward, drop the weight.`,
  "Bicep Curl|Cable": `Stand facing the low pulley with an underhand grip on the handle and your elbows tucked to your sides. Curl the handle up under control, squeeze at the top, then let the cable pull your arm back down slowly. The constant tension means there's no easy point in the rep — resist the urge to rush the bottom half.`,
  "Bicep Curl|Dumbbell": `Stand with a dumbbell in each hand, palms facing forward, elbows pinned to your sides. Curl both (or alternate) up under control, squeeze at the top, then lower slowly all the way down. Keep your wrists straight and avoid swinging the weight up with your hips.`,
  "Bicep Curl|EZ Bar": `Grip the angled part of the EZ bar with an underhand grip and your elbows tucked to your sides. Curl the bar up under control without letting your elbows drift forward, then lower it slowly back down. The angled grip is easier on the wrists — use it to focus purely on squeezing the biceps.`,
  "Bicep Curl|Machine": `Sit down and adjust the seat so your elbows line up with the machine's pivot point, then take a full grip on the handles. Curl through a full range of motion, squeeze at the top, then control the weight back down. Let the machine guide the path so you can focus entirely on the squeeze.`,
  "Box Squat|Barbell": `Set a box or bench at a height just below parallel behind you, and unrack the bar across your upper traps as you would for a normal squat. Sit back onto the box under control, pause briefly without relaxing your brace, then drive back up through your heels. Keep tension throughout the pause — this isn't a rest, it's a dead-stop start for the next rep.`,
  "Bulgarian Split Squat (Glutes)|Dumbbell": `Rest the top of your rear foot on a bench behind you, holding a dumbbell in each hand, with your front foot far enough forward that your knee stays over your ankle. Lower straight down until your rear knee nearly touches the floor, then drive up through your front heel. Push your hips forward at the top and squeeze the glute of your working leg.`,
  "Bulgarian Split Squat (Glutes)|Smith Machine": `Set the bar on your upper back in the Smith machine, rear foot up on a bench behind you and your front foot out far enough that your knee tracks over your ankle. Lower under control until your rear knee nearly touches the floor, then drive up through your front heel. The fixed bar path lets you lean slightly forward to load the glute harder.`,
  "Bulgarian Split Squat (Quads)|Dumbbell": `Rest the top of your rear foot on a bench behind you holding a dumbbell in each hand, with your front foot positioned closer under your hips than the glute-focused version. Lower straight down keeping your torso upright, then drive up through your front foot. Staying more upright shifts the emphasis onto the quad rather than the hip.`,
  "Bulgarian Split Squat (Quads)|Smith Machine": `Set the bar on your upper back in the Smith machine, rear foot up on a bench, front foot positioned under your hips with your torso upright. Lower under control until your rear knee nearly touches the floor, then drive up through your front foot. Keep your torso vertical throughout — leaning forward shifts the work onto the glute instead.`,
  "Cable Crunch|Cable": `Kneel below a high pulley holding the rope behind your head, hips stacked over your knees. Curl your torso down by rounding your spine and bringing your elbows toward your thighs, then return under control without letting the weight stack rest. Move from your abs, not your hips — your hips should barely shift.`,
  "Cable Curl|Cable": `Stand facing the low pulley with an underhand grip on the handle and your elbows tucked to your sides. Curl the handle up under control, squeeze hard at the top, then let the cable pull your arm back down slowly. Keep constant tension on the bicep — don't let the weight stack touch down between reps.`,
  "Cable Kickback|Cable": `Attach an ankle cuff to a low pulley and hinge slightly forward, holding the frame for balance. Kick your leg straight back and up, squeezing your glute hard at the top, then return under control without letting momentum swing the leg back. Keep your standing leg soft and avoid arching your lower back to gain extra range.`,
  "Cable Pull Through|Cable": `Face away from a low pulley with the rope between your legs, feet shoulder-width apart. Hinge at the hips, pushing them back until you feel a stretch in your hamstrings and glutes, then drive your hips forward to standing, squeezing your glutes hard at the top. Keep the movement in your hips — this isn't a squat, so keep your knees only softly bent.`,
  "Chest Fly|Cable": `Set both pulleys to chest height and stand in the middle with a slight forward lean and soft elbow bend. Bring your hands together in front of your chest in a wide arc, squeeze, then let your arms open back out under control. Keep the same slight elbow bend throughout — don't let it turn into a press.`,
  "Chest Fly|Dumbbell": `Lie on a flat bench holding a dumbbell in each hand above your chest, palms facing in, with a slight bend in your elbows. Lower the weights out to the sides in a wide arc until you feel a stretch across your chest, then bring them back together over your chest. Keep that same elbow bend locked in the whole set — bending more turns it into a press.`,
  "Chest Fly|Machine": `Sit tall with your back against the pad and grip the handles with your elbows at chest height. Bring your arms together in front of you, squeeze your chest hard, then let the weight stretch you back out under control. Focus on squeezing your chest together rather than just moving the handles.`,
  "Chest Supported Row|Barbell": `Lie face-down on an incline bench with a barbell underneath you, gripping just outside shoulder width. Row the bar up into your lower chest, driving your elbows back and squeezing your shoulder blades together, then lower under control. The bench removes any momentum from your legs or back — if you're straining to move the weight, it's too heavy.`,
  "Chest Supported Row|Dumbbell": `Lie face-down on an incline bench holding a dumbbell in each hand, arms hanging straight down. Row both dumbbells up toward your hips, squeezing your shoulder blades together at the top, then lower under control. Keep your chest pinned to the bench throughout — don't let it lift off to cheat the weight up.`,
  "Chest Supported Row|Machine": `Adjust the chest pad so it sits firmly against your chest and grip the handles with your arms extended. Row the handles back, driving your elbows behind you and squeezing your shoulder blades together, then extend back out under control. Keep your chest pressed into the pad the entire set.`,
  "Close Grip Bench Press|Barbell": `Lie on the bench and grip the bar just inside shoulder width, closer than a normal bench press. Lower the bar to your lower chest keeping your elbows tucked close to your body, then press back up focusing on straightening your arms. Keeping the elbows tucked (not flared) is what shifts the work onto the triceps.`,
  "Concentration Curl|Dumbbell": `Sit on a bench with your legs spread, brace the back of your working arm against the inside of your thigh, and let the dumbbell hang straight down. Curl it up under control, squeeze hard at the top, then lower it fully back down. Bracing your elbow against your leg stops any momentum, so the bicep does all the work.`,
  "Crunches|Bodyweight": `Lie on your back with your knees bent and feet flat, hands lightly touching your ears. Curl your shoulder blades up off the floor by contracting your abs, then lower back down under control. Keep the movement small and controlled — don't pull on your neck to generate the crunch.`,
  "Crunches|Cable": `Kneel below a high pulley holding the rope behind your head, hips stacked over your knees. Curl your torso down by rounding your spine and bringing your elbows toward your thighs, then return under control without letting the weight stack rest between reps. Move from your abs, not your hips.`,
  "Crunches|Machine": `Sit in the machine with the pads positioned across your chest or shoulders as set up by the machine, and grip the handles. Curl your torso forward by contracting your abs, squeeze at the bottom of the movement, then return under control. Resist the urge to yank the handles — let your abs do the work, not your arms.`,
  "Crunches|": `Lie on your back with your knees bent and feet flat, hands lightly touching your ears. Curl your shoulder blades up off the floor by contracting your abs, then lower back down under control. Keep the movement small and controlled — don't pull on your neck to generate the crunch.`,
  "Dead Bug|Bodyweight": `Lie on your back with your arms reaching straight up and knees bent to 90° above your hips. Slowly lower one arm overhead and the opposite leg out straight while keeping your lower back pressed into the floor, then return and switch sides. The moment your back arches off the floor, you've gone too far — that's the range that counts.`,
  "Deadlift|Barbell": `Stand with the bar over your mid-foot, grip just outside your legs, and set your hips down until your shins touch the bar with your back flat. Drive through the floor, keeping the bar close to your legs the whole way up, and finish by standing tall with your hips through. Keep your back flat throughout — if it rounds, reset and brace again before pulling.`,
  "Deep Goblet Squats|Dumbbell": `Hold a dumbbell vertically against your chest with both hands and stand with your feet slightly wider than shoulder width, toes turned out. Squat down as deep as your mobility allows, letting your knees track out over your toes, then drive back up. Sitting deep and wide is what shifts the emphasis onto the glutes.`,
  "Deep Goblet Squats|Machine": `Load the machine and hold the handles at chest height, feet set wide with toes turned out. Squat down as deep as comfortable, letting your knees track over your toes, then drive back up through your heels. Keep your chest tall throughout — the wide, deep stance is what makes this a glute-focused squat.`,
  "Dips|Bodyweight": `Support yourself on parallel bars with your arms straight, then lean your torso forward slightly. Lower yourself under control until your shoulders dip below your elbows, then press back up to full lockout. Leaning forward and letting your elbows flare naturally shifts more of the work onto your chest.`,
  "Dips|Machine": `Set the machine to a suitable assistance or resistance level, then grip the handles and lean your torso forward slightly. Lower under control until your shoulders dip below your elbows, then press back up. Keep the forward lean throughout to keep the emphasis on your chest rather than your triceps.`,
  "Face Pull|Cable": `Set the rope at face height and pull the handles toward your forehead while keeping your elbows high and flared out. Squeeze your back and control the eccentric. Finish each rep with your hands wide and thumbs pointing back, like you're pulling the rope apart.`,
  "Front Squat|Barbell": `Rack the bar across the front of your shoulders with your elbows lifted high, either crossing your arms over the bar or using a clean grip. Squat down keeping your torso upright and elbows up, then drive back through your heels to stand. The moment your elbows drop, the bar wants to roll forward — keep them high the whole set.`,
  "Goblet Squat|Dumbbell": `Hold a dumbbell vertically against your chest with both hands, feet about shoulder-width apart. Squat down keeping your torso upright and elbows brushing the inside of your knees at the bottom, then drive back up. Keep the weight close to your chest throughout to stay balanced.`,
  "Good Mornings|Barbell": `Set the bar across your upper back as you would for a squat, feet shoulder-width apart and a soft bend in your knees. Hinge forward at the hips, pushing them back until your torso is close to parallel with the floor, then drive your hips forward to stand tall. Keep your back flat and the bar's path close to your body throughout.`,
  "Good Mornings|Smith Machine": `Set the bar across your upper back in the Smith machine, feet shoulder-width apart with a soft knee bend. Hinge at the hips, pushing them back until your torso nears parallel with the floor, then drive your hips forward to stand tall. The fixed bar path lets you focus purely on the hip hinge without worrying about balance.`,
  "Hack Squat|Machine": `Set your shoulders and back firmly against the pads with your feet shoulder-width apart on the platform, positioned slightly in front of your hips. Lower under control until your thighs are at least parallel, then drive back up through your whole foot. Keep your lower back pressed into the pad the whole set — don't let it round at the bottom.`,
  "Hammer Curl|Dumbbell": `Stand holding a dumbbell in each hand with a neutral, palms-facing-in grip, elbows pinned to your sides. Curl both (or alternate) up under control without rotating your wrists, then lower slowly. The neutral grip shifts more emphasis onto the forearm and the outer head of the bicep.`,
  "Hanging Leg Raise|Pull-up Bar": `Hang from the bar with a full grip and your legs straight (or knees bent for an easier version). Raise your legs up in front of you by curling your pelvis under, then lower back down under control without swinging. Control the descent — swinging the weight up using momentum takes the tension off your abs.`,
  "High to Low Cable Fly|Cable": `Set both pulleys above shoulder height and stand in the middle with a slight forward lean. Pull your hands down and together in front of your hips in a wide arc, squeezing your lower chest, then let them return under control. Keep a slight bend in your elbows throughout — locking them out turns it into a pull instead of a fly.`,
  "Hip Abduction|Machine": `Sit in the machine with the pads against the outside of your knees/thighs and your back flat against the seat. Push your legs apart against the resistance, squeezing your outer glutes at the widest point, then return under control. Avoid rocking your torso to help move the weight — let your legs do all the work.`,
  "Hip Adductors|Machine": `Sit in the machine with the pads against the inside of your knees/thighs and your back flat against the seat. Squeeze your legs together against the resistance, pause briefly at the middle, then return under control. Move through a full range rather than using short, fast reps.`,
  "Hip Thrust|Barbell": `Set your upper back against a bench with the bar sitting across your hip crease (pad it if needed), feet flat and shins vertical. Drive your hips up until your body forms a straight line from shoulders to knees, squeezing your glutes hard at the top, then lower under control. Keep your chin tucked and don't let your lower back arch to gain extra height.`,
  "Hip Thrust|Machine": `Sit into the machine with the pad across your hip crease and your feet set on the platform, shins vertical. Drive your hips up into the pad, squeezing your glutes hard at the top, then return under control. Push through your heels rather than your toes to keep the tension on your glutes.`,
  "Hip Thrust|": `Set your upper back against a bench with your hips under the bar or machine pad, feet flat and shins vertical. Drive your hips up until your body forms a straight line from shoulders to knees, squeezing your glutes hard at the top, then lower under control. Keep your chin tucked and avoid arching your lower back to gain extra height.`,
  "Hip Thrust - Hold|Barbell": `Set up the same as a barbell hip thrust, driving your hips up until your body forms a straight line from shoulders to knees. Instead of coming straight back down, hold at the top for the full count, squeezing your glutes as hard as you can. Keep breathing through the hold — don't just brace and hope the time passes.`,
  "Hip Thrust - Hold|Machine": `Set up the same as the machine hip thrust, driving your hips up into the pad until fully extended. Hold at the top for the full count, keeping your glutes squeezed hard throughout rather than relaxing into the pad. Keep your ribs down and avoid arching your lower back to hold the position.`,
  "Hyperextensions|Machine": `Set your hips on the pad with your feet secured and your body forming a straight line, arms crossed over your chest (or holding a weight). Lower your torso down under control until you feel a stretch in your hamstrings/glutes, then raise back up until your body is straight — no further. Squeeze your glutes at the top rather than hyperextending your lower back.`,
  "Incline Chest Press|Barbell": `Set the bench to a moderate incline and grip the bar just outside shoulder width, unracking over your upper chest. Lower the bar under control to your upper chest, then press back up in a straight line. Keep the incline moderate — too steep turns this into a shoulder press.`,
  "Incline Chest Press|Dumbbell": `Set the bench to a moderate incline and press a dumbbell in each hand up from shoulder height. Lower under control until you feel a stretch across your upper chest, then press back up without clanking the weights together at the top. The dumbbells let each side work independently, so keep both arms moving at the same pace.`,
  "Incline Chest Press|Machine": `Sit back against the pad and grip the handles at upper-chest height. Press forward and slightly up until your arms are extended, then lower back under control. Keep your shoulder blades pinned back against the pad throughout.`,
  "Incline Chest Press|Smith Machine": `Set an incline bench under the Smith machine bar and unrack it over your upper chest. Lower under control to your upper chest, then press back up in a straight line. The fixed bar path means you can focus purely on driving through your upper chest without balancing the bar.`,
  "Incline Rear Delt Raise|Dumbbell": `Lie face-down on an incline bench holding a dumbbell in each hand, arms hanging straight down. Raise your arms out to the sides with a slight elbow bend until they're roughly in line with your torso, then lower under control. Keep the movement slow — this is a small muscle, so momentum takes over easily if you rush it.`,
  "Kettlebell Swing|Kettlebell": `Stand with the kettlebell on the floor in front of you, feet shoulder-width apart. Hinge at the hips to grip it, then drive your hips forward explosively to swing it up to chest height, keeping your arms relaxed. Let your hips do all the work — your arms are just along for the ride.`,
  "Lat Pulldown|Cable": `Sit under the bar with your knees secured under the pad and take a wide overhand grip. Pull the bar down to your upper chest, driving your elbows down and back, then let it rise back up under control without leaning back excessively. Lead with your elbows, not your hands, to keep the lats doing the work.`,
  "Lat Pullover|Machine": `Adjust the seat so the pivot lines up with your shoulders, then grip the handles or bar with your arms extended overhead. Pull down in an arc until your hands reach your thighs, keeping your arms mostly straight throughout, then let them rise back up under control. Keep a soft bend in your elbows — don't turn it into a tricep pushdown.`,
  "Lateral Raise|Cable": `Stand side-on to a low pulley and grip the handle with the arm furthest from the machine. Raise your arm out to the side up to shoulder height, leading with your elbow, then lower under control. The constant cable tension means the bottom of the rep stays loaded — don't let the weight stack rest between reps.`,
  "Lateral Raise|Dumbbell": `Stand holding a dumbbell in each hand by your sides, with a very slight bend in your elbows. Raise both arms out to the sides up to shoulder height, leading with your elbows, then lower under control. Keep the weight light enough that you're not swinging your torso to help lift it.`,
  "Lateral Raise|Machine": `Sit with your back against the pad and position your elbows against the machine's arm pads. Raise your arms out to the sides through the machine's set path, squeezing at the top, then lower under control. Let the machine guide the path so you can focus purely on the squeeze.`,
  "Lateral Raise|Straight Bar": `Stand holding a straight bar with a shoulder-width overhand grip in front of your thighs. Raise the bar up in front of you leading with your elbows, then lower under control. Keep your wrists neutral throughout — don't let them bend under the bar's weight.`,
  "Leg Extensions|Machine": `Sit in the machine with the pad resting just above your ankles and your back flat against the seat. Extend your legs until they're straight, squeezing your quads hard at the top, then lower under control. Avoid using momentum to kick the weight up — control both directions evenly.`,
  "Leg Press (Glute Focussed)|Machine": `Set your feet high and wide on the platform, toes turned slightly out, with your back and hips flat against the seat. Lower the platform until your knees are near your chest, then drive through your heels to extend, without locking your knees out hard. The higher, wider foot position shifts the emphasis onto your glutes.`,
  "Leg Press (Quad Focus)|Machine": `Set your feet lower and closer together on the platform, with your back and hips flat against the seat. Lower the platform under control until your knees approach your chest, then drive back up through your whole foot. The lower, narrower foot position keeps the emphasis on your quads.`,
  "Low Row|Machine": `Sit with your chest against the pad (or braced upright) and grip the low handles with your arms extended. Row the handles back into your torso, driving your elbows back and squeezing your shoulder blades together, then extend back out under control. Keep your torso still throughout — the pull should come from your back, not your body rocking.`,
  "Low to High Cable Fly|Cable": `Set both pulleys low and stand in the middle with a slight forward lean. Pull your hands up and together in front of your upper chest in a wide arc, squeezing your chest at the top, then let them return under control. Keep a slight bend in your elbows the whole set to keep the tension on your chest.`,
  "Lying Hamstring Curl|Machine": `Lie face-down on the machine with the pad resting just above your heels and your hips pressed into the bench. Curl your heels up toward your glutes, squeezing your hamstrings hard at the top, then lower under control. Keep your hips pinned to the bench — lifting them up is a sign the weight's too heavy.`,
  "Military Press|Barbell": `Stand with the bar racked at your collarbone, grip just outside shoulder width. Press the bar straight overhead, moving your head back slightly to let it pass, then lower back to your collarbone under control. Keep your core braced hard throughout — this is a standing press, so there's no bench to steady you.`,
  "Pendulum Squat|Machine": `Set your shoulders against the pad with your feet centred on the platform, roughly shoulder-width apart. Lower under control along the machine's arcing path until your thighs are at least parallel, then drive back up through your whole foot. The arc does some of the balancing for you — focus on depth and control rather than fighting the path.`,
  "Plank|Bodyweight": `Prop yourself up on your forearms and toes with your body forming a straight line from head to heels. Brace your core and squeeze your glutes to hold the position without letting your hips sag or pike up. Breathe steadily throughout — holding your breath won't help you hold the position any longer.`,
  "Plate Raise|Dumbbell": `Hold a weight plate (or dumbbell) with both hands in front of your thighs, arms straight. Raise it up in front of you to around shoulder height, leading with your hands, then lower under control. Keep a slight bend in your elbows and avoid leaning back to gain momentum.`,
  "Preacher Curl|EZ Bar": `Set your upper arms against the preacher pad and grip the EZ bar with an underhand grip on the angled part. Curl the bar up under control, squeeze at the top, then lower it slowly until your arms are almost straight. The pad locks out any swinging, so keep the movement slow and deliberate.`,
  "Preacher Curl|Machine": `Sit down with your upper arms against the preacher pad and grip the handles. Curl through a full range of motion, squeezing hard at the top, then lower under control until your arms are almost fully extended. Keep your shoulders relaxed down away from your ears throughout.`,
  "Pull Up|Pull-up Bar": `Hang from the bar with a wide overhand grip, arms fully extended. Pull yourself up by driving your elbows down and back until your chin clears the bar, then lower back down under control to a full hang. Lead with your chest, not your chin, to keep the tension on your back.`,
  "Push Up|Bodyweight": `Set your hands slightly wider than shoulder width on the floor, body in a straight line from head to heels. Lower your chest to just above the floor keeping your elbows at roughly 45° from your body, then press back up to full extension. Keep your core and glutes braced throughout so your hips don't sag.`,
  "RDLs (Glutes)|Barbell": `Stand holding the bar at hip height with a shoulder-width grip. Push your hips back, keeping a soft bend in your knees and the bar close to your legs, until you feel a deep stretch in your hamstrings, then drive your hips forward to stand tall. Keep your back flat throughout — this is a hip hinge, not a squat.`,
  "RDLs (Glutes)|Dumbbell": `Stand holding a dumbbell in each hand in front of your thighs. Push your hips back, keeping a soft bend in your knees, and lower the weights close to your legs until you feel a stretch in your hamstrings, then drive your hips forward to stand tall. Keep the dumbbells close to your legs the whole way down and up.`,
  "RDLs (Glutes)|Machine": `Set up in the machine with the pad positioned against your hips/thighs as designed for a hip hinge pattern. Push your hips back against the resistance until you feel a stretch through your hamstrings, then drive your hips forward to extend, squeezing your glutes at the top. Keep your back flat throughout the hinge.`,
  "RDLs (Glutes)|": `Stand holding the weight at hip height. Push your hips back, keeping a soft bend in your knees, until you feel a deep stretch in your hamstrings, then drive your hips forward to stand tall, squeezing your glutes at the top. Keep your back flat throughout — this is a hip hinge, not a squat.`,
  "Rear Dealt Flys|Cable": `Set both pulleys at chest height and cross the cables (or use a single handle each), gripping the opposite handle with each hand. Pull your arms out and back in a wide arc, squeezing your shoulder blades together, then return under control. Keep a soft bend in your elbows throughout the set.`,
  "Rear Dealt Flys|Dumbbell": `Hinge forward at the hips holding a dumbbell in each hand, arms hanging straight down. Raise your arms out to the sides with a slight elbow bend, squeezing your shoulder blades together at the top, then lower under control. Keep your torso still — the movement should come entirely from your shoulders.`,
  "Rear Dealt Flys|Machine": `Sit facing into the machine, chest against the pad, and grip the handles in front of you with a slight elbow bend. Pull your arms out and back in a wide arc, squeezing your shoulder blades together, then return under control. Keep your chest pressed into the pad throughout to stop your torso from rocking.`,
  "Rear Delt Face Pulls|Cable": `Set the rope at face height and pull the handles toward your forehead, keeping your elbows high and flared out. Squeeze your rear delts and upper back at the peak, then control the return. Finish with your hands wide and thumbs pointing back.`,
  "Reverse Lunges (Glutes)|Dumbbell": `Stand holding a dumbbell in each hand and step one foot backward into a lunge, lowering until your rear knee nearly touches the floor. Drive back up through your front heel to return to standing, then repeat on the other side. Push your hips forward as you drive up to keep the emphasis on your glutes.`,
  "Reverse Lunges (Glutes)|Smith Machine": `Set the bar across your upper back in the Smith machine and step one foot back into a lunge, lowering under control until your rear knee nearly touches the floor. Drive back up through your front heel to return to standing. The fixed bar path lets you focus on pushing your hips forward through each rep.`,
  "Russian Twist|Bodyweight": `Sit with your knees bent and feet either flat or lifted off the floor, leaning back slightly with a straight spine. Rotate your torso to touch the floor on one side, then rotate through to the other side under control. Move slowly and with control — speed here usually means you're using momentum instead of your obliques.`,
  "Seated Calf Raise|Machine": `Sit in the machine with the pad resting across your lower thighs and the balls of your feet on the platform. Lower your heels down as far as your ankle mobility allows, then press up onto your toes, pausing briefly at the top. Move through a full range of motion — partial reps shortchange the stretch at the bottom.`,
  "Seated Hamstring Curl|Machine": `Sit in the machine with the pad resting against the back of your lower legs and your back flat against the seat. Curl your legs down and back, squeezing your hamstrings hard at the bottom of the movement, then return under control. Keep your hips pressed into the seat throughout.`,
  "Seated Lateral Raise|Dumbbell": `Sit on the end of a bench holding a dumbbell in each hand by your sides. Raise both arms out to the sides up to shoulder height, leading with your elbows, then lower under control. Sitting removes any leg drive, so keep the weight light enough to move with strict form.`,
  "Seated Row (Lats)|Cable": `Sit at the cable row station with your knees slightly bent and grip the handle with your arms extended. Row the handle into your stomach, driving your elbows back and squeezing your shoulder blades together, then extend back out under control. Keep your torso upright throughout — don't rock back and forth to move the weight.`,
  "Seated Row (Lats)|Machine": `Sit with your chest against the pad (or braced upright) and grip the handles with your arms extended. Row the handles back into your torso, squeezing your shoulder blades together, then extend back out under control. Keep your shoulders down away from your ears throughout the set.`,
  "Shoulder Press|Dumbbell": `Sit or stand holding a dumbbell in each hand at shoulder height, palms facing forward. Press both dumbbells straight overhead until your arms are extended, then lower back down under control to shoulder height. Keep your core braced so your lower back doesn't arch as you press up.`,
  "Shoulder Press|Machine": `Sit with your back against the pad and grip the handles at shoulder height. Press up until your arms are extended (without locking out hard), then lower back down under control. Keep your shoulders down and back against the pad throughout the set.`,
  "Shoulder Press|Smith Machine": `Sit on a bench positioned under the Smith machine bar, unracking it at shoulder height. Press the bar straight overhead, then lower back down under control to shoulder height. The fixed bar path means you can focus purely on driving up rather than balancing the weight.`,
  "Sissy Squat|Bodyweight": `Hold onto something sturdy for balance and rise up onto the balls of your feet. Lean back from your knees, letting them travel forward, lowering your torso toward the floor while keeping a straight line from your knees to your shoulders, then drive back up. Keep your hips extended throughout — if your hips bend, you're turning it into a squat.`,
  "Skull Crusher|Barbell": `Lie on a bench holding the bar above your chest with a shoulder-width grip, arms extended. Bend only at the elbows to lower the bar toward your forehead (or just behind your head), then extend back up. Keep your upper arms still and vertical throughout — only your forearms should move.`,
  "Skull Crusher|Cable": `Lie on a bench positioned under a low pulley, holding the attachment above your chest with your arms extended. Bend only at the elbows to lower it toward your forehead, then extend back up. The cable keeps constant tension, so control the lowering phase rather than letting it drop.`,
  "Skull Crusher|Dumbbell": `Lie on a bench holding a dumbbell in each hand above your chest, palms facing each other, arms extended. Bend only at the elbows to lower the weights toward your temples, then extend back up. Keep your upper arms still and vertical — only your forearms should be moving.`,
  "Spider Curl|Dumbbell": `Lie face-down on an incline bench with your arms hanging straight down, holding a dumbbell in each hand. Curl the weights up under control, squeezing hard at the top, then lower back down fully. The incline removes any ability to swing the weight, so keep the tempo slow and controlled.`,
  "Squat (Glutes)|Barbell": `Set the bar across your upper back, feet wider than shoulder-width with toes turned out more than a standard squat. Squat down keeping your chest up and knees tracking over your toes, sitting back further than usual, then drive up through your heels. Sitting back and wide is what shifts the emphasis onto your glutes rather than your quads.`,
  "Squat (Glutes)|Bodyweight": `Stand with your feet wider than shoulder-width, toes turned out, hands clasped in front of you for balance. Squat down sitting back further than usual, keeping your chest up, then drive up through your heels. Focus on pushing your hips back rather than just bending your knees.`,
  "Squat (Glutes)|Kettlebell": `Hold a kettlebell by the horns or handle against your chest, feet wider than shoulder-width with toes turned out. Squat down sitting back, keeping your chest tall, then drive up through your heels. Keep the kettlebell close to your body throughout to stay balanced.`,
  "Squat (Glutes)|Smith Machine": `Set the bar across your upper back in the Smith machine, feet set wider than shoulder-width and slightly forward of your hips, toes turned out. Squat down sitting back into the fixed path, then drive up through your heels. The fixed bar path lets you sit back further without worrying about balance.`,
  "Squat (Glutes)|Straight Bar": `Rest the bar across your upper back with a wide, stable grip, feet wider than shoulder-width and toes turned out. Squat down sitting back further than a standard squat, keeping your chest tall, then drive up through your heels. Push your hips back first before your knees bend, to keep the emphasis on your glutes.`,
  "Squat (Quads)|Barbell": `Set the bar across your upper back, feet roughly shoulder-width apart. Squat down keeping your torso more upright than the glute-focused version, letting your knees travel forward over your toes, then drive back up. A more upright torso and narrower stance shifts the work onto your quads.`,
  "Squat (Quads)|Bodyweight": `Stand with your feet shoulder-width apart, arms out in front for balance. Squat down keeping your torso upright and knees tracking over your toes, going as deep as comfortable, then drive back up through your heels. Keep your heels flat on the floor throughout.`,
  "Squat (Quads)|Kettlebell": `Hold a kettlebell by the horns or handle against your chest, feet shoulder-width apart. Squat down keeping your torso upright, letting your knees travel forward over your toes, then drive back up. Keep your elbows tucked in close to your ribs so the weight doesn't pull you forward.`,
  "Squat (Quads)|Smith Machine": `Set the bar across your upper back in the Smith machine, feet shoulder-width apart and slightly forward of your hips. Squat down along the fixed path keeping your torso upright, then drive back up through your heels. The fixed path lets you focus purely on depth and knee tracking.`,
  "Squat (Quads)|Straight Bar": `Rest the bar across your upper back with a stable grip, feet shoulder-width apart. Squat down keeping your torso upright and knees tracking over your toes, then drive back up through your whole foot. Keep the bar path vertical over your mid-foot throughout.`,
  "Standing Calf Raise|Machine": `Set your shoulders under the pads and the balls of your feet on the platform, heels hanging off the edge. Lower your heels down as far as comfortable, then press up onto your toes, pausing briefly at the top. Move slowly through the full range — bouncing at the bottom takes the tension off your calves.`,
  "Step-Ups|Dumbbell": `Hold a dumbbell in each hand and place one foot fully on a box or bench in front of you. Drive through that foot to step up, avoiding pushing off your trailing leg, then step back down under control. Keep your weight through the heel of your working leg to keep the emphasis on your glutes.`,
  "Step-Ups|Smith Machine": `Set the bar across your upper back in the Smith machine, with a box or bench positioned in front of you. Place one foot fully on the box and drive up through it without pushing off your trailing leg, then step back down under control. Keep your torso upright and your weight through your front heel.`,
  "Stiff Leg Deadlift|Barbell": `Stand holding the bar at hip height, knees almost straight (a very slight bend only). Lower the bar down your legs by pushing your hips back, keeping your knees mostly locked, until you feel a strong stretch in your hamstrings, then drive your hips forward to stand. Keep the bar brushing your legs the whole way down and up.`,
  "Straight Arm Pulldown|Cable": `Stand facing a high pulley with a wide grip on the bar and your arms straight. Pull the bar down in an arc to your thighs, keeping your arms straight throughout, then let it rise back up under control. Keep your arms locked at a slight bend — this is a lat isolation move, not a tricep exercise.`,
  "Straight Leg RDL|Barbell": `Stand holding the bar at hip height with your legs almost fully straight. Push your hips back, keeping your knees locked in that slight bend, until you feel a deep stretch through your hamstrings, then drive your hips forward to stand tall. This is a bigger stretch than a standard RDL — go only as far as your hamstring flexibility allows without rounding your back.`,
  "Straight Leg RDL|Dumbbell": `Stand holding a dumbbell in each hand in front of your thighs, legs almost straight. Push your hips back, keeping your knees in that same slight bend, lowering the weights until you feel a deep hamstring stretch, then drive your hips forward to stand. Keep the dumbbells close to your legs throughout.`,
  "Straight Leg RDL|Machine": `Set up in the machine with the pad positioned for a hip hinge, keeping your knees almost straight throughout. Push your hips back against the resistance until you feel a deep stretch through your hamstrings, then drive your hips forward to extend. Keep your back flat and knees locked in that slight bend the whole set.`,
  "Sumo Deadlift|Barbell": `Stand with your feet wide, toes turned out, and grip the bar inside your legs. Push your hips down and back to set your shins vertical, then drive through the floor, keeping your chest up and the bar close to your body, to stand tall. Keep your knees tracking out over your toes throughout the pull.`,
  "Sumo Squat|Barbell": `Set the bar across your upper back, feet wide and toes turned out significantly more than a standard squat. Squat straight down keeping your torso upright, knees tracking out over your toes, then drive back up. Keep your chest tall throughout — the wide stance means there's less forward lean than a regular squat.`,
  "T-Bar Row|Machine": `Straddle the machine and grip the handles with your chest resting against the pad (or hinged forward if unsupported). Row the handles into your torso, driving your elbows back and squeezing your shoulder blades together, then lower under control. Keep your torso still throughout the set.`,
  "Toes to Bar|Pull-up Bar": `Hang from the bar with a full grip and your legs straight. Raise your legs up to touch the bar by curling your pelvis under and keeping your legs straight (or knees bent for an easier version), then lower back down under control. Control the lowering phase — swinging the legs down fast just sets you up to swing them back up with momentum instead of your abs.`,
  "Trap Bar Deadlift|Trap Bar": `Step inside the trap bar with your feet hip-width apart, gripping the handles at your sides. Push your hips down and back until your shins are vertical, keeping your chest up, then drive through the floor to stand tall. The neutral grip and centred weight make this an easier position to keep your back flat in than a standard barbell pull.`,
  "Tricep Dips|Bodyweight": `Support yourself on parallel bars (or a bench behind you) with your arms straight, torso upright rather than leaning forward. Lower yourself under control until your elbows reach about 90°, then press back up to full lockout. Keeping your torso upright (rather than leaning forward) is what shifts the emphasis onto your triceps.`,
  "Tricep Dips|Machine": `Grip the handles with your torso upright and your elbows tucked close to your body. Lower under control until your elbows reach about 90°, then press back up to full lockout. Keep your torso upright throughout to keep the focus on your triceps rather than your chest.`,
  "Tricep Extensions|Cable": `Stand facing a high pulley holding the attachment with both hands overhead, elbows pointing forward and close to your head. Extend your arms by straightening at the elbow, then bend to lower the weight back behind your head under control. Keep your elbows pinned in place — only your forearms should move.`,
  "Tricep Extensions|Dumbbell": `Stand or sit holding one dumbbell with both hands overhead, elbows pointing forward and close to your head. Lower the weight behind your head by bending only at the elbows, then extend back up. Keep your upper arms still throughout — flaring your elbows out turns this into a different movement.`,
  "Tricep Extensions|EZ Bar": `Lie on a bench or stand holding the EZ bar overhead with a grip on the angled part, elbows pointing forward. Lower the bar behind your head by bending only at the elbows, then extend back up. The angled grip is easier on the wrists, so use it to focus purely on the tricep stretch and squeeze.`,
  "Tricep Pushdown|Cable": `Stand facing a high pulley holding the attachment with an overhand grip, elbows pinned to your sides. Push the attachment down until your arms are fully extended, squeezing your triceps hard, then let it rise back up under control without letting your elbows drift forward. Keep your elbows locked at your sides the entire set.`,
  "Viking Press|Machine": `Grip the handles at shoulder height with your palms facing each other (neutral grip), standing tall with your core braced. Press straight up until your arms are extended, then lower back down under control to shoulder height. The neutral grip is easier on the shoulders than a barbell press — keep your core tight so you don't lean back as you press.`,
  "Viking Press|": `Grip the handles at shoulder height with a neutral grip, standing tall with your core braced. Press straight up until your arms are extended, then lower back down under control to shoulder height. Keep your core tight throughout so you don't lean back as you press.`,
  "Walking Lunge|Dumbbell": `Hold a dumbbell in each hand and step forward into a lunge, lowering until your rear knee nearly touches the floor. Drive through your front heel to stand and step through into the next lunge on the other leg. Keep your torso upright throughout — leaning forward shifts the work off your quads.`,
}

// Generates a coaching cue in setup → how to perform it → notable tip
// style. Uses a hand-written cue verbatim when this exact exercise +
// equipment combination is already known; otherwise falls back to a
// generic but still instructional cue built from the equipment and
// muscles involved, since a formula can't know a new movement's real
// setup details.
function generateCoachingCues(name, equipment, primaryMuscle, secondaryMuscles, exerciseType) {
  const known = HAND_WRITTEN_CUES[`${name}|${equipment || ''}`]
  if (known) return known

  const muscles = [primaryMuscle, ...(secondaryMuscles || [])].filter(Boolean)
  const muscleText = muscles.length > 1
    ? `your ${muscles.slice(0, -1).map(m => m.toLowerCase()).join(', ')} and ${muscles[muscles.length - 1].toLowerCase()}`
    : muscles.length === 1
      ? `your ${muscles[0].toLowerCase()}`
      : 'the target muscle'

  const setupByEquipment = {
    'Barbell': 'Load the bar and set up with a stable, even grip before you start.',
    'Dumbbell': 'Grip a dumbbell in each hand and get into the starting position.',
    'Cable': 'Set the pulley to the right height for the movement and take a firm grip on the handle.',
    'Machine': "Adjust the seat or pads so the machine's pivot lines up with your joint before you start.",
    'Smith Machine': 'Set the bar to the right height and get into position under the fixed bar path.',
    'EZ Bar': 'Grip the angled part of the EZ bar for a comfortable wrist position.',
    'Straight Bar': 'Take a firm, even grip on the bar.',
    'Resistance Band': 'Anchor the band securely and take up the slack before you start.',
    'Bodyweight': 'Get into the starting position with good posture and your core braced.',
    'Kettlebell': 'Grip the kettlebell securely and brace your core before you start.',
    'Pull-up Bar': 'Take a secure grip on the bar and hang with your arms fully extended.',
    'Trap Bar': 'Step inside the trap bar and grip the handles at your sides.',
    'Landmine': 'Set the bar in the landmine attachment and grip the loaded end.',
    'Battle Ropes': 'Take a rope in each hand and set your stance.',
    'Sled': 'Load the sled and get into a stable, athletic position.',
    'TRX': 'Adjust the straps to the right length and take a secure grip.',
    'Medicine Ball': 'Hold the medicine ball securely and set your stance.',
  }
  const setup = (equipment && setupByEquipment[equipment]) || 'Get into the starting position with good posture and your core braced.'

  const execution = exerciseType === 'Isolation'
    ? `Move through a full range of motion, focusing the effort on ${muscleText}, then control the weight back to the start.`
    : `Perform the movement through a full range of motion, driving through ${muscleText}, then return under control to the start.`

  const tip = (equipment && EQUIPMENT_CUE_PHRASES[equipment]) || 'Keep the tempo controlled on both the lift and the lower.'

  return `${setup} ${execution} ${tip}`
}
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

const MUSCLE_COLOURS = {
  Glutes: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Quads: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Hamstrings: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Back: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Chest: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Shoulders: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  Biceps: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Triceps: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Core: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Calves: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
}

const EMPTY_FORM = { name: '', primary_muscle: '', secondary_muscles: [], exercise_type: '', difficulty: '', tags: [], notes: '', allow_swap: true }
const EMPTY_VARIATION = { equipment: '', video_url: '', instructions: '', coaching_cues: '', tempo: '', default_rest_seconds: '' }

function Badge({ label, colourClass }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colourClass || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{label}</span>
}

function ExerciseModal({ exercise, allExercises, onSave, onClose }) {
  const [form, setForm] = useState(exercise ? {
    ...exercise,
    secondary_muscles: exercise.secondary_muscles || [],
    tags: exercise.tags || [],
  } : { ...EMPTY_FORM })
  const [variations, setVariations] = useState([{ ...EMPTY_VARIATION }])
  const [activeTab, setActiveTab] = useState(0)
  const [loadingVariations, setLoadingVariations] = useState(!!exercise)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [secInput, setSecInput] = useState('')
  const [alternativeIds, setAlternativeIds] = useState([])
  const [altInput, setAltInput] = useState('')

  useEffect(() => {
    if (!exercise) return
    supabase.from('exercise_variations').select('*').eq('exercise_id', exercise.id).order('order_index').then(({ data }) => {
      setVariations(data && data.length > 0 ? data.map(v => ({ ...v, default_rest_seconds: v.default_rest_seconds ?? '' })) : [{ ...EMPTY_VARIATION }])
      setLoadingVariations(false)
    })
    supabase.from('exercise_alternatives').select('alternative_exercise_id').eq('exercise_id', exercise.id).order('order_index').then(({ data }) => {
      setAlternativeIds((data || []).map(r => r.alternative_exercise_id))
    })
  }, [exercise])

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }
  function setVariation(idx, field, value) {
    setVariations(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v))
  }
  function addVariation() {
    setVariations(prev => [...prev, { ...EMPTY_VARIATION }])
    setActiveTab(variations.length)
  }
  function removeVariation(idx) {
    if (variations.length <= 1) return
    setVariations(prev => prev.filter((_, i) => i !== idx))
    setActiveTab(t => Math.max(0, t >= idx ? t - 1 : t))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({
      ...form,
      name: form.name.trim(),
    }, variations.map((v, i) => ({
      equipment: v.equipment || null,
      video_url: v.video_url || null,
      instructions: v.instructions || null,
      coaching_cues: v.coaching_cues || null,
      tempo: v.tempo || null,
      default_rest_seconds: v.default_rest_seconds !== '' && v.default_rest_seconds != null ? parseInt(v.default_rest_seconds) : null,
      order_index: i,
    })), alternativeIds)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{exercise ? 'Edit exercise' : 'Add exercise'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Exercise name *</label>
            <input className="input w-full" placeholder="e.g. Hip Thrust" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Primary muscle</label>
              <select className="input w-full" value={form.primary_muscle} onChange={e => set('primary_muscle', e.target.value)}>
                <option value="">Select…</option>
                {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Exercise type</label>
              <select className="input w-full" value={form.exercise_type} onChange={e => set('exercise_type', e.target.value)}>
                <option value="">Select…</option>
                {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Difficulty</label>
              <select className="input w-full" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                <option value="">Select…</option>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Secondary muscles</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.secondary_muscles || []).map(m => (
                <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {m}
                  <button onClick={() => set('secondary_muscles', form.secondary_muscles.filter(x => x !== m))} className="text-gray-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <select className="input flex-1 text-sm py-1.5" value={secInput} onChange={e => setSecInput(e.target.value)}>
                <option value="">Add secondary muscle…</option>
                {MUSCLE_GROUPS.filter(m => !form.secondary_muscles.includes(m)).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button onClick={() => { if (secInput) { set('secondary_muscles', [...form.secondary_muscles, secInput]); setSecInput('') } }}
                className="btn-primary py-1.5 px-3 text-sm flex-shrink-0">Add</button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Variations</label>
              <button type="button" onClick={addVariation} className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">+ Add variation</button>
            </div>

            {loadingVariations ? (
              <div className="text-sm text-gray-400 py-4">Loading variations…</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {variations.map((v, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === i
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <button type="button" onClick={() => setActiveTab(i)}>
                        {v.equipment || `Variation ${i + 1}`}
                      </button>
                      {variations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariation(i)}
                          title="Delete this variation"
                          className={`leading-none px-0.5 ${activeTab === i ? 'text-brand-100 hover:text-white' : 'text-gray-400 hover:text-red-500'}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Equipment *</label>
                    <select className="input w-full" value={variations[activeTab]?.equipment || ''} onChange={e => setVariation(activeTab, 'equipment', e.target.value)}>
                      <option value="">Select…</option>
                      {EQUIPMENT_LIST.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Default rest (seconds)</label>
                      <input type="number" min={0} className="input w-full" placeholder="e.g. 90" value={variations[activeTab]?.default_rest_seconds ?? ''} onChange={e => setVariation(activeTab, 'default_rest_seconds', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Tempo</label>
                      <input className="input w-full" placeholder="e.g. 3010" value={variations[activeTab]?.tempo || ''} onChange={e => setVariation(activeTab, 'tempo', e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Video URL (optional)</label>
                    <input type="url" className="input w-full" placeholder="https://…" value={variations[activeTab]?.video_url || ''} onChange={e => setVariation(activeTab, 'video_url', e.target.value)} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Coaching cues</label>
                      <button
                        type="button"
                        onClick={() => setVariation(activeTab, 'coaching_cues', generateCoachingCues(
                          form.name, variations[activeTab]?.equipment, form.primary_muscle, form.secondary_muscles, form.exercise_type
                        ))}
                        className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium"
                      >
                        Generate
                      </button>
                    </div>
                    <textarea rows={2} className="input w-full resize-none" placeholder="Key cues for the client…" value={variations[activeTab]?.coaching_cues || ''} onChange={e => setVariation(activeTab, 'coaching_cues', e.target.value)} />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Instructions</label>
                    <textarea rows={3} className="input w-full resize-none" placeholder="Step-by-step instructions…" value={variations[activeTab]?.instructions || ''} onChange={e => setVariation(activeTab, 'instructions', e.target.value)} />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
            <input
              type="checkbox"
              id="allow_swap"
              checked={form.allow_swap !== false}
              onChange={e => set('allow_swap', e.target.checked)}
              className="mt-0.5"
            />
            <label htmlFor="allow_swap" className="text-sm text-gray-600 dark:text-gray-300">
              Allow clients to swap this exercise
              <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Turn off for lifts you always want tested as programmed, like Back Squat, Bench Press or Deadlift — clients won't see a swap option for it at all.
              </span>
            </label>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Alternative exercises</label>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Shown to clients as a swap option if this exercise's equipment isn't free — for a different movement, not just a different variation.</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {alternativeIds.map(id => {
                const alt = allExercises?.find(e => e.id === id)
                return (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {alt?.name || 'Unknown'}
                    <button onClick={() => setAlternativeIds(prev => prev.filter(x => x !== id))} className="text-gray-400 hover:text-red-500">×</button>
                  </span>
                )
              })}
            </div>
            <div className="flex gap-2">
              <select className="input flex-1 text-sm py-1.5" value={altInput} onChange={e => setAltInput(e.target.value)}>
                <option value="">Add alternative…</option>
                {(allExercises || [])
                  .filter(e => e.id !== exercise?.id && !alternativeIds.includes(e.id))
                  .map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <button onClick={() => { if (altInput) { setAlternativeIds(prev => [...prev, altInput]); setAltInput('') } }}
                className="btn-primary py-1.5 px-3 text-sm flex-shrink-0">Add</button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Notes</label>
            <textarea rows={2} className="input w-full resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.tags || []).map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                  {t} <button onClick={() => set('tags', form.tags.filter(x => x !== t))} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1 text-sm py-1.5" placeholder="Add tag…" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { set('tags', [...form.tags, tagInput.trim()]); setTagInput('') } }} />
              <button onClick={() => { if (tagInput.trim()) { set('tags', [...form.tags, tagInput.trim()]); setTagInput('') } }}
                className="btn-primary py-1.5 px-3 text-sm flex-shrink-0">Add</button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900">
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary py-2 px-5 text-sm">
            {saving ? 'Saving…' : exercise ? 'Save changes' : 'Add exercise'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ExerciseLibrary() {
  const { profile } = useAuth()
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMuscle, setFilterMuscle] = useState('')
  const [filterEquipment, setFilterEquipment] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modal, setModal] = useState(null) // null | 'new' | exercise object
  const [filling, setFilling] = useState(false)
  const [variationsByExercise, setVariationsByExercise] = useState({})
  const [deleteCheck, setDeleteCheck] = useState(null) // null | { ex, loading } | { ex, sessions, workouts }
  const [replacementId, setReplacementId] = useState('')

  async function load() {
    const { data } = await supabase.from('exercises').select('*').eq('coach_id', profile.id).eq('is_archived', false).order('name')
    setExercises(data || [])
    const ids = (data || []).map(e => e.id)
    if (ids.length > 0) {
      const { data: vars } = await supabase.from('exercise_variations').select('*').in('exercise_id', ids).order('order_index')
      const grouped = {}
      ;(vars || []).forEach(v => { (grouped[v.exercise_id] ||= []).push(v) })
      setVariationsByExercise(grouped)
    } else {
      setVariationsByExercise({})
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = exercises.filter(ex => {
    if (filterMuscle && ex.primary_muscle !== filterMuscle) return false
    if (filterEquipment && !(variationsByExercise[ex.id] || []).some(v => v.equipment === filterEquipment)) return false
    if (filterType && ex.exercise_type !== filterType) return false
    if (search) {
      const q = search.toLowerCase()
      return ex.name.toLowerCase().includes(q) || (ex.primary_muscle || '').toLowerCase().includes(q)
    }
    return true
  })

  async function handleSave(form, variations, alternativeIds) {
    let exerciseId = modal === 'new' ? null : modal.id
    if (modal === 'new') {
      const { data } = await supabase.from('exercises').insert({ ...form, coach_id: profile.id }).select('id').single()
      exerciseId = data?.id
    } else {
      await supabase.from('exercises').update(form).eq('id', modal.id)
    }
    if (exerciseId) {
      await supabase.from('exercise_variations').delete().eq('exercise_id', exerciseId)
      await supabase.from('exercise_variations').insert(variations.map(v => ({ ...v, exercise_id: exerciseId })))
      await supabase.from('exercise_alternatives').delete().eq('exercise_id', exerciseId)
      if (alternativeIds?.length > 0) {
        await supabase.from('exercise_alternatives').insert(
          alternativeIds.map((id, i) => ({ exercise_id: exerciseId, alternative_exercise_id: id, order_index: i }))
        )
      }
    }
    setModal(null)
    load()
  }

  async function handleArchive(ex) {
    if (!confirm(`Archive "${ex.name}"?`)) return
    await supabase.from('exercises').update({ is_archived: true }).eq('id', ex.id)
    load()
  }

  async function handleDelete(ex) {
    setReplacementId('')
    setDeleteCheck({ ex, loading: true })

    // Only check the real exercise_id link back to this card — matching by name
    // alone would flag coincidental same-named text that was never actually this
    // exercise.
    const [{ data: workoutRows }, { data: sessionRows }] = await Promise.all([
      supabase.from('workout_exercises').select('id, name, workouts(name)').eq('exercise_id', ex.id),
      supabase.from('session_exercises').select('id, name, training_sessions(name, training_programs(name))').eq('exercise_id', ex.id),
    ])

    const workouts = (workoutRows || [])
      .filter(r => r.workouts)
      .map(r => ({ workout: r.workouts.name, name: r.name }))

    const sessions = (sessionRows || [])
      .filter(r => r.training_sessions)
      .map(r => ({ programme: r.training_sessions.training_programs?.name || 'Untitled programme', session: r.training_sessions.name, name: r.name }))

    setDeleteCheck({ ex, workouts, sessions })
  }

  async function confirmDelete() {
    if (!deleteCheck) return
    await supabase.from('exercises').delete().eq('id', deleteCheck.ex.id)
    setDeleteCheck(null)
    load()
  }

  // One-off action: fills in default coaching cues for every variation that
  // doesn't have any yet, so nothing needs hand-writing for the whole library.
  // Never touches a variation that already has coaching cues (coach edits stay).
  async function fillMissingCoachingCues() {
    setFilling(true)
    const updates = []
    for (const ex of exercises) {
      for (const v of variationsByExercise[ex.id] || []) {
        if (v.coaching_cues) continue
        updates.push({ id: v.id, coaching_cues: generateCoachingCues(ex.name, v.equipment, ex.primary_muscle, ex.secondary_muscles, ex.exercise_type) })
      }
    }
    await Promise.all(updates.map(u => supabase.from('exercise_variations').update({ coaching_cues: u.coaching_cues }).eq('id', u.id)))
    await load()
    setFilling(false)
  }

  async function replaceAndDelete(replacement) {
    if (!deleteCheck || !replacement) return
    setDeleteCheck(dc => ({ ...dc, replacing: true }))
    await supabase.from('workout_exercises').update({ name: replacement.name, exercise_id: replacement.id }).eq('exercise_id', deleteCheck.ex.id)
    await supabase.from('session_exercises').update({ name: replacement.name, exercise_id: replacement.id }).eq('exercise_id', deleteCheck.ex.id)
    await supabase.from('exercises').delete().eq('id', deleteCheck.ex.id)
    setDeleteCheck(null)
    load()
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exercise Library</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fillMissingCoachingCues} disabled={filling}
            className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
            {filling ? 'Filling…' : 'Fill missing coaching cues'}
          </button>
          <button onClick={() => setModal('new')} className="btn-primary py-1.5 px-4 text-sm">
            + Add exercise
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          className="input text-sm py-1.5 w-52"
          placeholder="Search exercises…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input text-sm py-1.5" value={filterMuscle} onChange={e => setFilterMuscle(e.target.value)}>
          <option value="">All muscles</option>
          {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="input text-sm py-1.5" value={filterEquipment} onChange={e => setFilterEquipment(e.target.value)}>
          <option value="">All equipment</option>
          {EQUIPMENT_LIST.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="input text-sm py-1.5" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All types</option>
          {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(search || filterMuscle || filterEquipment || filterType) && (
          <button onClick={() => { setSearch(''); setFilterMuscle(''); setFilterEquipment(''); setFilterType('') }}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Clear</button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-16">
          {exercises.length === 0 ? (
            <>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Library is empty</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Initialize with common exercises" to pre-populate with 80+ exercises, or add your own.</p>
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No exercises match your filters.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(ex => (
          <div key={ex.id} className="card hover:border-brand-300 dark:hover:border-brand-700 transition-colors group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{ex.name}</p>
                {(variationsByExercise[ex.id] || []).some(v => v.equipment) && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {(variationsByExercise[ex.id] || []).map(v => v.equipment).filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {ex.primary_muscle && (
                    <Badge label={ex.primary_muscle} colourClass={MUSCLE_COLOURS[ex.primary_muscle]} />
                  )}
                  {ex.exercise_type && (
                    <Badge label={ex.exercise_type} colourClass="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" />
                  )}
                  {ex.difficulty && (
                    <Badge label={ex.difficulty} colourClass={
                      ex.difficulty === 'Advanced' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      ex.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    } />
                  )}
                  {ex.allow_swap === false && (
                    <Badge label="No swaps" colourClass="bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400" />
                  )}
                </div>
                {(variationsByExercise[ex.id] || []).find(v => v.coaching_cues)?.coaching_cues && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {(variationsByExercise[ex.id] || []).find(v => v.coaching_cues).coaching_cues}
                  </p>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => setModal(ex)} className="text-xs text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 px-1.5 py-1">Edit</button>
                <button onClick={() => handleArchive(ex)} className="text-xs text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 px-1.5 py-1">Archive</button>
                <button onClick={() => handleDelete(ex)} className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-1">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <ExerciseModal
          exercise={modal === 'new' ? null : modal}
          allExercises={exercises}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {deleteCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteCheck(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Delete "{deleteCheck.ex.name}"?</h2>
            {deleteCheck.loading ? (
              <p className="text-sm text-gray-400 py-4">Checking where it's used…</p>
            ) : (deleteCheck.workouts.length === 0 && deleteCheck.sessions.length === 0) ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Not selected in any workout or training block — safe to delete.</p>
            ) : (
              <div className="mt-2 space-y-3">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  This exact card is selected in {deleteCheck.workouts.length + deleteCheck.sessions.length} place{deleteCheck.workouts.length + deleteCheck.sessions.length !== 1 ? 's' : ''}:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 max-h-48 overflow-y-auto">
                  {deleteCheck.workouts.map((w, i) => (
                    <li key={`w${i}`} className="flex items-start gap-1.5">
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span>Workout: {w.workout} (shows as "{w.name}")</span>
                    </li>
                  ))}
                  {deleteCheck.sessions.map((s, i) => (
                    <li key={`s${i}`} className="flex items-start gap-1.5">
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span>{s.programme} — {s.session} (shows as "{s.name}")</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 pt-1">
                  <select
                    className="input flex-1 text-sm py-1.5"
                    value={replacementId}
                    onChange={e => setReplacementId(e.target.value)}
                  >
                    <option value="">Replace with…</option>
                    {exercises.filter(e => e.id !== deleteCheck.ex.id).map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => replaceAndDelete(exercises.find(e => e.id === replacementId))}
                    disabled={!replacementId || deleteCheck.replacing}
                    className="btn-primary py-1.5 px-3 text-sm flex-shrink-0 disabled:opacity-50"
                  >
                    {deleteCheck.replacing ? 'Replacing…' : 'Replace & delete'}
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setDeleteCheck(null)} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteCheck.loading || deleteCheck.replacing} className="bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 px-4 text-sm font-medium disabled:opacity-50">
                Delete anyway
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
