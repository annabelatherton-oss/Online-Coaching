import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const MUSCLE_GROUPS = ['Glutes', 'Quads', 'Hamstrings', 'Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Full Body', 'Adductors', 'Abductors', 'Hip Flexors']
const EQUIPMENT_LIST = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Smith Machine', 'EZ Bar', 'Straight Bar', 'Resistance Band', 'Bodyweight', 'Kettlebell', 'Pull-up Bar', 'Trap Bar', 'Landmine', 'Battle Ropes', 'Sled', 'TRX', 'Medicine Ball']
const EXERCISE_TYPES = ['Compound', 'Isolation']
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

const SEED_EXERCISES = [
  // ── GLUTES ──────────────────────────────────────────────────────────────
  { name: 'Hip Thrust', primary_muscle: 'Glutes', exercise_type: 'Compound', difficulty: 'Intermediate', variations: [
    { equipment: 'Barbell', default_rest_seconds: 120, coaching_cues: 'Push through your heels and squeeze your glutes hard at the top. Keep your chin tucked and your back flat — don\'t arch your lower back.' },
    { equipment: 'Smith Machine', default_rest_seconds: 90, coaching_cues: 'Put the bar pad across your hips, keep your feet flat and rest your shoulders on the bench. Push through your heels and squeeze your glutes at the top.' },
    { equipment: 'Resistance Band', default_rest_seconds: 60, coaching_cues: 'Push your knees outward against the band throughout every rep. Squeeze your glutes hard at the top.' },
  ] },
  { name: 'Glute Bridge', primary_muscle: 'Glutes', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Feet flat and hip-width apart. Push through your heels, squeeze your glutes hard at the top, and hold for 1–2 seconds. Keep your stomach tight.' },
  { name: 'Romanian Deadlift', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Bend forward from the hips with a slight bend in your knees. Keep the bar close to your legs. You should feel a stretch in your hamstrings at the bottom — stand back up by pushing your hips forward.' },
  { name: 'Single Leg Romanian Deadlift', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 90, coaching_cues: 'Slight bend in the standing knee. Hinge forward keeping your hips level — don\'t let them rotate. Feel the stretch in the glute of your standing leg.' },
  { name: 'Stiff Leg Deadlift', primary_muscle: 'Hamstrings', secondary_muscles: ['Glutes'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Keep your legs almost straight and bend forward from the hips. Keep the bar close to your legs and feel a big stretch in your hamstrings at the bottom. Squeeze your glutes as you stand up.' },
  { name: 'Bulgarian Split Squat', primary_muscle: 'Glutes', secondary_muscles: ['Quads'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Your front foot should be far enough forward so your shin stays upright. Drive through the front heel. Don\'t let your front knee cave inward.' },
  { name: 'Hip Abduction Machine', primary_muscle: 'Glutes', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Sit up tall with feet flexed. Push through the outer part of your hips — not your knees. Keep it slow and controlled, don\'t swing from side to side.' },
  { name: 'Cable Kickback', primary_muscle: 'Glutes', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Lean slightly forward, keep your working leg straight, and kick back and up squeezing your glute at the top. Don\'t twist your hips or swing your leg.' },
  { name: 'Donkey Kick', primary_muscle: 'Glutes', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 45, coaching_cues: 'On all fours, kick your bent leg up toward the ceiling squeezing your glute at the top. Keep your hips level — don\'t tilt to one side.' },
  { name: 'Frog Pump', primary_muscle: 'Glutes', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 45, coaching_cues: 'Lie on your back and press the soles of your feet together with your knees dropped out to the sides. Push your hips up and squeeze your glutes. Great for waking up the glutes before training.' },
  { name: 'Sumo Squat', primary_muscle: 'Glutes', secondary_muscles: ['Quads', 'Adductors'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Wide stance with toes pointed outward. Push your knees out in line with your toes and keep your chest up throughout.' },
  { name: 'Step Up', primary_muscle: 'Glutes', secondary_muscles: ['Quads'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Put your full foot on the platform and drive through the heel of the raised leg. Don\'t push off the back foot — let the working leg do all the work.' },
  { name: 'Hyperextension', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings', 'Back'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Bend from the hips (not the lower back), lower until you feel a stretch in your hamstrings, then squeeze your glutes to come back up. Stop when your body is straight — don\'t arch back.' },
  { name: 'Cable Pull Through', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Stand facing away from the cable. Push your hips back toward the machine, then drive your hips forward using your glutes to stand up. Think of it as a hip movement, not a squat.' },
  { name: 'Sumo Deadlift', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings', 'Back', 'Adductors'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 180, coaching_cues: 'Wide stance with toes pointed out. Hands grip inside your legs. Keep your chest tall, push your knees out, and stand up tall at the top.' },
  { name: 'Lateral Band Walk', primary_muscle: 'Glutes', equipment: 'Resistance Band', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 45, coaching_cues: 'Band just above your knees, slight bend in the knees, step sideways keeping tension in the band. Your feet should never fully come together.' },
  { name: 'Monster Walk', primary_muscle: 'Glutes', equipment: 'Resistance Band', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 45, coaching_cues: 'Band around your ankles, half-squat position. Walk forward on a diagonal, driving each step through the outer hip. Stay low throughout.' },

  // ── QUADS ───────────────────────────────────────────────────────────────
  { name: 'Back Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 180, coaching_cues: 'Bar on your upper back, feet shoulder-width with toes slightly out. Tighten your core, keep your chest up, push your knees out as you go down to at least parallel.' },
  { name: 'Front Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes', 'Core'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 180, coaching_cues: 'Bar rests on the front of your shoulders with elbows high. Keep your torso very upright. This position naturally works the quads more than a back squat.' },
  { name: 'Leg Press', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: 'Feet hip-width in the middle of the platform. Lower until your knees reach 90°, push through your full foot. Don\'t lock your knees out at the top.' },
  { name: 'Hack Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Feet shoulder-width, push your knees out over your toes as you go down. Go as deep as the machine allows, push evenly through your whole foot on the way up.' },
  { name: 'Pendulum Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Upright torso, feet hip-width, knees track over toes. Full range of motion. Great for quad development with less strain on the lower back.' },
  { name: 'Leg Extension', primary_muscle: 'Quads', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Adjust the seat so your knee lines up with the pivot. Extend to full lockout and squeeze hard at the top. Lower slowly over 3 seconds — don\'t let the weight crash down.' },
  { name: 'Goblet Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 90, coaching_cues: 'Hold the dumbbell at your chest, feet shoulder-width. Elbows inside your knees at the bottom, keep your chest tall. Great for learning how to squat properly.' },
  { name: 'Walking Lunge', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Big step forward, front knee tracks over toes, back knee drops to just above the floor. Drive through your front heel to take the next step. Keep your chest up.' },
  { name: 'Reverse Lunge', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Step backward until your back knee nearly touches the floor. Front shin stays close to upright. Drive through the front heel to come back. Easier on the knees than a forward lunge.' },
  { name: 'Smith Machine Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Smith Machine', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: 'Walk your feet slightly in front of the bar (not directly underneath). Find a comfortable stance and use the fixed bar path to focus on depth and control.' },
  { name: 'Single Leg Press', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'One foot in the middle of the platform. Same technique as the regular leg press. Good for spotting and fixing strength differences between your legs.' },
  { name: 'Box Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 150, coaching_cues: 'Sit back to the box in a controlled way, pause briefly without going floppy, then drive up by pushing your knees out and pressing through your heels.' },
  { name: 'Sissy Squat', primary_muscle: 'Quads', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Advanced', default_rest_seconds: 90, coaching_cues: 'Hold something for balance. Your knees travel forward as you lean back. You\'ll feel a deep stretch in your quads at the bottom. Build up slowly as this is tough on the knees.' },

  // ── HAMSTRINGS ───────────────────────────────────────────────────────────
  { name: 'Lying Leg Curl', primary_muscle: 'Hamstrings', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Keep your hips flat on the pad. Curl your heels toward your glutes, squeeze the hamstrings, then lower slowly over 3 seconds. Don\'t lift your hips as you curl.' },
  { name: 'Seated Leg Curl', primary_muscle: 'Hamstrings', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Adjust the machine so your knees line up with the pivot point. Drive your heels down, squeeze hard at the end, then control the return slowly.' },
  { name: 'Single Leg Curl', primary_muscle: 'Hamstrings', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Same as the lying leg curl but one leg at a time. Good for spotting strength differences between your legs.' },
  { name: 'Nordic Curl', primary_muscle: 'Hamstrings', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 120, coaching_cues: 'Secure your ankles and lower yourself as slowly as you can, using your hamstrings to resist the fall. Push yourself up from the bottom with your hands if needed. One of the best hamstring exercises out there.' },
  { name: 'Good Morning', primary_muscle: 'Hamstrings', secondary_muscles: ['Back', 'Glutes'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Bar on your upper back, slight bend in the knees. Lean forward from the hips until your body is roughly parallel to the floor. Feel the stretch in your hamstrings, then squeeze your glutes to stand back up. Keep your back straight.' },
  { name: 'Glute Ham Raise', primary_muscle: 'Hamstrings', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 120, coaching_cues: 'Use your hamstrings to curl your body up, squeeze at the top, and lower with control. One of the most effective hamstring exercises available.' },
  { name: 'Kettlebell Swing', primary_muscle: 'Hamstrings', secondary_muscles: ['Glutes', 'Back'], equipment: 'Kettlebell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 60, coaching_cues: 'This is a hip movement, not a squat. Push your hips back on the downswing, then snap your hips forward to swing the bell up. Keep your core tight throughout.' },

  // ── BACK ────────────────────────────────────────────────────────────────
  { name: 'Pull Up', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Pull-up Bar', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Start from a full hang. Pull your shoulder blades down first, then drive your elbows down toward your hips. Get your chin over the bar, then lower all the way back to a full hang.' },
  { name: 'Chin Up', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Pull-up Bar', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Underhand grip (palms facing you), shoulder-width apart. Pull your chest up to the bar and lower all the way down. Your biceps work more than in a standard pull up.' },
  { name: 'Lat Pulldown', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 90, coaching_cues: 'Lean back slightly. Pull the bar down to your upper chest while driving your elbows toward your hips. Let your arms fully extend at the top — think "elbows toward your back pockets".' },
  { name: 'Close Grip Lat Pulldown', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 90, coaching_cues: 'Use the narrow attachment with palms facing each other. Pull to your chest driving your elbows straight down. Full stretch at the top. Works the lower part of your back more than a wide grip.' },
  { name: 'Straight Arm Pulldown', primary_muscle: 'Back', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Keep your arms straight the whole time. Hinge slightly forward and pull the rope or bar from overhead down to your hips. Works your back without using the biceps at all.' },
  { name: 'Seated Cable Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 90, coaching_cues: 'Sit tall with your chest up. Pull your elbows back past your body and squeeze your shoulder blades together. Control the return to a full stretch — don\'t round forward as the weight goes back.' },
  { name: 'Single Arm Cable Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'One arm at a time. Reach forward slightly as the cable pulls, then pull your elbow back. Great for getting a full range of motion through the back.' },
  { name: 'Bent Over Barbell Row', primary_muscle: 'Back', secondary_muscles: ['Biceps', 'Core'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Lean forward from the hips with your torso at roughly 45° or parallel to the floor. Pull the bar to your lower chest or belly button, drive your elbows behind you and squeeze. Lower with control.' },
  { name: 'Pendlay Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Body parallel to the floor. Pull the bar explosively off the floor to your lower chest, then set it back down each rep. More powerful than a bent over row. Great for upper back thickness.' },
  { name: 'Single Arm Dumbbell Row', primary_muscle: 'Back', equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Support yourself on a bench with a flat back. Pull your elbow straight up toward the ceiling and squeeze at the top. Think of your hand as just a hook — start the movement with your elbow, not your hand.' },
  { name: 'Chest Supported Row', primary_muscle: 'Back', equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 90, coaching_cues: 'Lie face down on the incline pad, arms hanging freely. Pull your elbows back and up, squeezing your shoulder blades together. The bench takes your lower back out of it completely.' },
  { name: 'Seal Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Lie face down on a raised bench with arms hanging below. Row the barbell up to touch your chest. Completely removes swinging and lower back involvement.' },
  { name: 'Meadows Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'One end of the bar is anchored in a landmine. Stagger your stance and row the sleeve up to your hip. Great for back width and thickness.' },
  { name: 'T-Bar Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Lean forward from the hips with a narrow grip. Pull to your chest and squeeze. You can go heavier on this than most row variations.' },
  { name: 'Face Pull', primary_muscle: 'Back', secondary_muscles: ['Shoulders'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Rope at face height. Pull to your face with your elbows high and wide, rotating your hands outward so they point up at the end. Great for posture and shoulder health.' },
  { name: 'Inverted Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Hang under a bar or rings with your body straight like a plank. Pull your chest up to the bar driving your elbows back. Raise the bar to make it easier, lower it to make it harder.' },
  { name: 'Dumbbell Pullover', primary_muscle: 'Back', secondary_muscles: ['Chest'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Lie across a bench with a slight bend in your elbows. Lower the dumbbell behind your head until you feel a stretch in your back, then pull it back in an arc to the start.' },
  { name: 'Deadlift', primary_muscle: 'Back', secondary_muscles: ['Glutes', 'Hamstrings', 'Core'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 180, coaching_cues: 'Bar over mid-foot. Keep your back flat before you pull. Create tension through your back and arms, drive the floor away with your legs, squeeze your hips and glutes at the top. The most complete exercise for the entire back of the body.' },
  { name: 'Rack Pull', primary_muscle: 'Back', secondary_muscles: ['Glutes', 'Hamstrings'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 180, coaching_cues: 'Same technique as a deadlift but starting from just below the knee. Lets you go heavier to build the upper back and traps.' },
  { name: 'Trap Bar Deadlift', primary_muscle: 'Back', secondary_muscles: ['Quads', 'Glutes', 'Hamstrings'], equipment: 'Trap Bar', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 180, coaching_cues: 'Stand in the centre of the bar, handles on the sides (palms facing each other). Sit into the lift like a squat, back flat, and drive through the floor. More forgiving on the lower back than a standard deadlift.' },

  // ── CHEST ────────────────────────────────────────────────────────────────
  { name: 'Barbell Bench Press', primary_muscle: 'Chest', secondary_muscles: ['Shoulders', 'Triceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 150, coaching_cues: 'Squeeze your shoulder blades together and down, slight arch in the back, feet flat on the floor. Lower the bar to your lower chest, elbows at about 45–75° from your body. Drive through the chest.' },
  { name: 'Incline Barbell Press', primary_muscle: 'Chest', secondary_muscles: ['Shoulders', 'Triceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 150, coaching_cues: '30–45° incline. Lower the bar to your upper chest. Squeeze your shoulder blades together and drive through the upper chest and triceps.' },
  { name: 'Dumbbell Bench Press', primary_muscle: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: 'Same shoulder blade position as the barbell. Wrists stacked over elbows. You can get a bigger stretch at the bottom than with a barbell.' },
  { name: 'Incline Dumbbell Press', primary_muscle: 'Chest', secondary_muscles: ['Shoulders'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: '30–45° incline. Lower the dumbbells to the sides of your upper chest. Press and bring them slightly together at the top to fully squeeze the upper chest.' },
  { name: 'Decline Dumbbell Press', primary_muscle: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: 'Slight decline bench. Same technique as a flat dumbbell press. Targets the lower part of the chest.' },
  { name: 'Smith Machine Bench Press', primary_muscle: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Smith Machine', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: 'Use the fixed bar path to focus on squeezing the chest. Squeeze your shoulder blades together, lower to your lower chest, and drive through. Good for drop sets and pressing to failure safely.' },
  { name: 'Cable Fly', primary_muscle: 'Chest', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Lean slightly forward with a small bend in your elbows — keep that same bend throughout. Bring your hands together in a hugging arc and squeeze your chest hard. Cables keep the tension on the whole time.' },
  { name: 'High to Low Cable Fly', primary_muscle: 'Chest', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Cables set high. Pull downward and inward in an arc, squeezing the lower chest at the bottom. Targets the bottom part of the chest.' },
  { name: 'Low to High Cable Fly', primary_muscle: 'Chest', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Cables set low. Pull upward and inward in an arc, squeezing the upper chest at the top. Targets the upper part of the chest.' },
  { name: 'Dumbbell Fly', primary_muscle: 'Chest', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Keep a slight bend in your elbows throughout. Lower in a wide arc feeling a deep stretch across the chest. Bring them together squeezing the chest at the top. Don\'t go too heavy — the shoulder is at risk.' },
  { name: 'Pec Deck', primary_muscle: 'Chest', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Elbows bent at 90°. Bring your arms together squeezing your chest hard in the middle. Feel a good stretch at the outside. Easy to load safely without a spotter.' },
  { name: 'Push Up', primary_muscle: 'Chest', secondary_muscles: ['Triceps', 'Core'], equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Body in a straight line from head to heels. Hands slightly wider than shoulders. Elbows at about 45° from your body. Chest to the floor. Squeeze the chest at the top.' },
  { name: 'Dips', primary_muscle: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'For chest: lean forward slightly, wider grip, feel the stretch across your chest at the bottom. For triceps: stay upright. Lower to a deep stretch and drive back up.' },

  // ── SHOULDERS ────────────────────────────────────────────────────────────
  { name: 'Shoulder Press', primary_muscle: 'Shoulders', secondary_muscles: ['Triceps'], exercise_type: 'Compound', difficulty: 'Beginner', variations: [
    { equipment: 'Barbell', default_rest_seconds: 150, coaching_cues: 'Grip slightly wider than shoulder-width. Bar rests on the front of your shoulders. Tighten your core and press straight up to full extension. Lower under control.' },
    { equipment: 'Dumbbell', default_rest_seconds: 120, coaching_cues: 'Dumbbells at ear height with elbows at 90°. Press up close to full extension. Control the return back to ear height.' },
    { equipment: 'Machine', default_rest_seconds: 90, coaching_cues: 'Adjust the seat so the handles are at shoulder height. Press to full extension and control the return. Great for pressing to failure safely without needing a spotter.' },
  ] },
  { name: 'Landmine Press', primary_muscle: 'Shoulders', secondary_muscles: ['Triceps', 'Core'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Hold the end of the bar with one hand, stagger your feet, and press upward in an arc. This angle is easier on the shoulder than pressing straight overhead.' },
  { name: 'Lateral Raise', primary_muscle: 'Shoulders', exercise_type: 'Isolation', difficulty: 'Beginner', variations: [
    { equipment: 'Dumbbell', default_rest_seconds: 60, coaching_cues: 'Slight lean forward. Lead with your pinky side and elbow (not your hand). Raise arms to shoulder height. Lower slowly over about 4 seconds. Don\'t swing or use momentum.' },
    { equipment: 'Cable', default_rest_seconds: 60, coaching_cues: 'Cable at hip height from the side. Pull your arm up to parallel with a slight lean forward. Control the return. Keeps tension on the shoulder better than dumbbells.' },
  ] },
  { name: 'Rear Delt Fly', primary_muscle: 'Shoulders', secondary_muscles: ['Back'], exercise_type: 'Isolation', difficulty: 'Beginner', variations: [
    { equipment: 'Dumbbell', default_rest_seconds: 60, coaching_cues: 'Bent over or lying down. Arms slightly bent. Drive your elbows up and out, squeezing the back of your shoulders at the top. Don\'t turn it into a row by bending the elbows too much.' },
    { equipment: 'Cable', default_rest_seconds: 60, coaching_cues: 'Cables crossed at face height. Pull your arms apart and back with a slight bend in the elbows. Squeeze the back of your shoulders at the end.' },
  ] },
  { name: 'Lying Rear Delt Raise', primary_muscle: 'Shoulders', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Lie face down on an incline bench, arms hanging below. Raise your arms out to the sides and up. The bench keeps you from swinging — pure rear shoulder work.' },
  { name: 'Front Raise', primary_muscle: 'Shoulders', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Raise the dumbbells to eye level, then lower slowly. Keep your core tight and don\'t swing. Note: the front of the shoulder is usually well worked from pressing exercises, so use this sparingly.' },
  { name: 'Band Pull Apart', primary_muscle: 'Shoulders', secondary_muscles: ['Back'], equipment: 'Resistance Band', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 45, coaching_cues: 'Hold the band at shoulder height. Pull it apart squeezing the back of your shoulders and upper back. Great for posture and shoulder health. Use as a warm-up or finisher.' },
  { name: 'Arnold Press', primary_muscle: 'Shoulders', equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Start with palms facing you at chin height. Rotate your wrists outward as you press overhead. Reverse on the way down. Works all three parts of the shoulder through the movement.' },
  { name: 'Upright Row', primary_muscle: 'Shoulders', secondary_muscles: ['Back', 'Biceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Grip shoulder-width or a little wider. Lead with your elbows up and out. Raise the bar to about lower chest height. Use a wider grip to reduce shoulder discomfort. Skip this if your shoulders are sensitive.' },

  // ── BICEPS ───────────────────────────────────────────────────────────────
  { name: 'Barbell Curl', primary_muscle: 'Biceps', exercise_type: 'Isolation', difficulty: 'Beginner', variations: [
    { equipment: 'Barbell', default_rest_seconds: 60, coaching_cues: 'Keep your elbows at your sides. Curl up to a full squeeze at the top and lower slowly over 3 seconds. Don\'t swing or use your back.' },
    { equipment: 'EZ Bar', default_rest_seconds: 60, coaching_cues: 'Same as a barbell curl but the angled grip is easier on the wrists. Elbows at your sides, full squeeze at the top, slow lowering.' },
  ] },
  { name: 'Dumbbell Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Rotate your palm to face upward as you curl (palm should face the ceiling at the top). Squeeze the bicep and lower with control. Good for working each arm independently.' },
  { name: 'Hammer Curl', primary_muscle: 'Biceps', secondary_muscles: ['Forearms'], equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Thumbs-up grip throughout. Curl to shoulder height and squeeze at the top. Works the muscles that add thickness to the upper arm, not just the bicep.' },
  { name: 'Cable Curl', primary_muscle: 'Biceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Elbows at your sides. Curl to a full squeeze and lower slowly. The cable keeps tension on the bicep the whole time, unlike a barbell which loses tension at the top.' },
  { name: 'Incline Dumbbell Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Lie back on a 45–60° incline with your arms hanging behind you. Curl up fully. The incline gives you a deeper stretch at the start for better muscle growth.' },
  { name: 'Bayesian Curl', primary_muscle: 'Biceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Cable set low behind you. Stand upright or lean slightly forward. Curl with your elbow behind your body. Like the incline curl, it creates a great stretch at the start.' },
  { name: 'Preacher Curl', primary_muscle: 'Biceps', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Upper arm rests on the pad. Lower to full extension on every rep and curl to a full squeeze at the top. The pad stops you swinging and keeps the tension on the bicep throughout.' },
  { name: 'Concentration Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Elbow braced against your inner thigh. Curl fully and squeeze hard at the top. Your elbow is completely fixed so only your bicep does the work. Great for feeling the muscle work.' },
  { name: 'Spider Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Lie face down on an incline bench, arms hanging straight down. Curl up to a full squeeze. Your elbows are fixed in front of your body — no way to cheat.' },
  { name: 'Zottman Curl', primary_muscle: 'Biceps', secondary_muscles: ['Forearms'], equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Intermediate', default_rest_seconds: 60, coaching_cues: 'Curl up with palms facing up. Rotate to palms facing down at the top. Lower slowly in that position. Works the bicep on the way up and the forearm muscles on the way down.' },

  // ── TRICEPS ───────────────────────────────────────────────────────────────
  { name: 'Tricep Pushdown', primary_muscle: 'Triceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Keep your elbows at your sides. Push down to full extension squeezing the tricep. Lower slowly and controlled. Don\'t let your elbows flare out.' },
  { name: 'Rope Pushdown', primary_muscle: 'Triceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Same as a pushdown but pull the rope apart at the bottom for a better squeeze at the end of each rep.' },
  { name: 'Skull Crusher', primary_muscle: 'Triceps', equipment: 'Barbell', exercise_type: 'Isolation', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Elbows pointing toward the ceiling. Lower the bar toward your forehead or behind your head, then extend back to full lockout. Only your elbows should move — keep your upper arms still.' },
  { name: 'Overhead Tricep Extension', primary_muscle: 'Triceps', exercise_type: 'Isolation', difficulty: 'Beginner', variations: [
    { equipment: 'Cable', default_rest_seconds: 60, coaching_cues: 'Face away from the cable or use a high pulley. Lean slightly forward and extend your arms from behind your head to full lockout. The overhead position gives a better stretch on the tricep.' },
    { equipment: 'Dumbbell', default_rest_seconds: 60, coaching_cues: 'Hold one dumbbell with both hands overhead. Elbow pointed at the ceiling. Lower behind your head then extend fully. The overhead position gives the tricep a good stretch.' },
  ] },
  { name: 'Close Grip Bench Press', primary_muscle: 'Triceps', secondary_muscles: ['Chest'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Grip shoulder-width (not too narrow). Elbows at about 45° from your body. Lower to your lower chest and drive through the triceps to full extension. You can go heavier than most isolation tricep exercises.' },
  { name: 'JM Press', primary_muscle: 'Triceps', equipment: 'Barbell', exercise_type: 'Isolation', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'A mix between a skull crusher and a close grip press. Lower toward your chin with elbows tucked, then press up and slightly away. Great for loading the triceps heavy.' },
  { name: 'Tricep Dips', primary_muscle: 'Triceps', secondary_muscles: ['Chest'], equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Stay upright to work the triceps more (lean forward for more chest). Elbows point straight behind you. Lower to a deep stretch and drive back up. Add weight when bodyweight becomes easy.' },
  { name: 'Cable Tricep Kickback', primary_muscle: 'Triceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Lean forward from the hip with your upper arm parallel to the floor. Extend your elbow until your arm is straight. Squeeze the tricep hard at the end.' },

  // ── CORE ─────────────────────────────────────────────────────────────────
  { name: 'Plank', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner', coaching_cues: 'Body in a straight line from head to heels. Squeeze your glutes and stomach. Breathe steadily. Don\'t let your hips sag down or push up.' },
  { name: 'Side Plank', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner', coaching_cues: 'Stack your feet or stagger them for balance. Push your hips up high and squeeze your side muscles and glute. Your body should form a straight line.' },
  { name: 'Dead Bug', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner', coaching_cues: 'Press your lower back flat to the floor throughout. Slowly extend the opposite arm and leg, breathing out as you do. Focus on staying completely still in the middle — not on speed.' },
  { name: 'Crunches', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner', coaching_cues: 'Hands behind your head (don\'t pull your neck). Curl your shoulders off the floor and squeeze your abs hard at the top. Lower slowly. It\'s a short movement — not a full sit up.' },
  { name: 'Bicycle Crunch', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner', coaching_cues: 'Rotate your shoulder toward the opposite knee (not just your elbow). Fully extend the other leg. Go slow and deliberate — quality matters more than speed.' },
  { name: 'Cable Crunch', primary_muscle: 'Core', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Kneel facing the cable and hold the rope at your forehead. Curl your spine forward toward your knees and squeeze your abs hard at the bottom. Focus on bending the spine, not just tipping at the hips.' },
  { name: 'Reverse Crunch', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner', coaching_cues: 'Lie flat. Curl your hips and knees toward your chest. Squeeze the lower abs at the top. Lower with control — don\'t swing your legs.' },
  { name: 'Hanging Leg Raise', primary_muscle: 'Core', equipment: 'Pull-up Bar', exercise_type: 'Compound', difficulty: 'Intermediate', coaching_cues: 'Hang from the bar. Raise your legs by curling your hips up (don\'t just lift the legs). Control the descent. Bend your knees to make it easier, straighten them to make it harder.' },
  { name: 'Toes to Bar', primary_muscle: 'Core', secondary_muscles: ['Back'], equipment: 'Pull-up Bar', exercise_type: 'Compound', difficulty: 'Advanced', coaching_cues: 'Hang from a pull up bar. Raise both feet up to touch the bar and control the descent. Build up from knee raises first — this requires a lot of core, grip, and back strength.' },
  { name: 'Ab Wheel Rollout', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Advanced', coaching_cues: 'Kneel with the wheel in front. Roll out until your arms are fully extended while keeping your hips level. Use your core to pull back in. Start with a short range and build up gradually.' },
  { name: 'Pallof Press', primary_muscle: 'Core', equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Intermediate', coaching_cues: 'Stand sideways to the cable. Hold the handle at chest height. Press straight out and resist the cable trying to twist you. Hold briefly then return. Trains your core to resist rotation.' },
  { name: 'Cable Woodchop', primary_muscle: 'Core', secondary_muscles: ['Shoulders'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Intermediate', coaching_cues: 'Cable set high. Pull diagonally downward across your body in a chopping motion. Resist as you return to the start. Trains rotational strength.' },
  { name: 'Hollow Hold', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Intermediate', coaching_cues: 'Press your lower back to the floor. Lift your shoulders and legs off at the same time with arms overhead. Hold the position. A gymnastics move that builds really solid core tension.' },
  { name: 'Russian Twist', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner', coaching_cues: 'Feet off the floor, lean back slightly. Rotate side to side touching the floor each side. Add weight to increase the challenge. Rotate your whole torso, don\'t just move your arms.' },
  { name: 'Back Extension', primary_muscle: 'Core', secondary_muscles: ['Glutes', 'Hamstrings'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Bend from the hips (not the lower back). Lower until you feel a stretch in your hamstrings. Squeeze your glutes to come back up to a straight position. Stop when your body is level — don\'t arch back.' },
  { name: 'Dragon Flag', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Advanced', coaching_cues: 'Grip a bench behind your head. Raise your body up and lower it as one rigid unit — only your upper back stays on the bench. Very advanced. Build up gradually and don\'t rush it.' },

  // ── ADDUCTORS ────────────────────────────────────────────────────────────
  { name: 'Adduction Machine', primary_muscle: 'Adductors', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Sit tall. Squeeze your legs together from wide to narrow. Hold briefly in the middle. Return slowly.' },
  { name: 'Copenhagen Plank', primary_muscle: 'Adductors', secondary_muscles: ['Core'], equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Advanced', coaching_cues: 'Rest your top leg on a bench and let the bottom leg hover. Hold the side plank position. One of the best exercises for inner thigh strength. Start with the easier short-lever version.' },
  { name: 'Cable Adduction', primary_muscle: 'Adductors', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Ankle cuff on the working leg. Pull your leg inward and across your body. Squeeze the inner thigh at the end. Hold something for balance.' },

  // ── CALVES ───────────────────────────────────────────────────────────────
  { name: 'Standing Calf Raise', primary_muscle: 'Calves', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Full range of motion — deep stretch at the bottom, rise up fully on your toes at the top. Pause at each end. Lower slowly. Calves grow best with full range and higher reps.' },
  { name: 'Seated Calf Raise', primary_muscle: 'Calves', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Pads just above your knees. Full range of motion, pause at the top and at the bottom. The seated position works the deeper calf muscle more than standing.' },
  { name: 'Leg Press Calf Raise', primary_muscle: 'Calves', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Feet at the bottom of the platform with just your toes on the edge. Push through the balls of your feet with full range of motion.' },
  { name: 'Single Leg Calf Raise', primary_muscle: 'Calves', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Intermediate', coaching_cues: 'Hold something for balance. Full range — deep stretch at the bottom, rise fully on your toes, then lower slowly. Twice as hard as doing both legs.' },
  { name: 'Donkey Calf Raise', primary_muscle: 'Calves', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Intermediate', coaching_cues: 'Bent forward at the hips with full range of motion. The forward lean gives an extra stretch at the bottom for more muscle stimulus.' },
]

const EMPTY_FORM = { name: '', primary_muscle: '', secondary_muscles: [], exercise_type: '', difficulty: '', tags: [], notes: '' }
const EMPTY_VARIATION = { equipment: '', video_url: '', instructions: '', coaching_cues: '', tempo: '', default_rest_seconds: '' }

function Badge({ label, colourClass }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colourClass || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{label}</span>
}

function ExerciseModal({ exercise, onSave, onClose }) {
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

  useEffect(() => {
    if (!exercise) return
    supabase.from('exercise_variations').select('*').eq('exercise_id', exercise.id).order('order_index').then(({ data }) => {
      setVariations(data && data.length > 0 ? data.map(v => ({ ...v, default_rest_seconds: v.default_rest_seconds ?? '' })) : [{ ...EMPTY_VARIATION }])
      setLoadingVariations(false)
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
    })))
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
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveTab(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeTab === i
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {v.equipment || `Variation ${i + 1}`}
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Equipment *</label>
                      <select className="input w-full" value={variations[activeTab]?.equipment || ''} onChange={e => setVariation(activeTab, 'equipment', e.target.value)}>
                        <option value="">Select…</option>
                        {EQUIPMENT_LIST.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    {variations.length > 1 && (
                      <button type="button" onClick={() => removeVariation(activeTab)}
                        className="text-xs text-gray-400 hover:text-red-500 mt-4 flex-shrink-0">Remove variation</button>
                    )}
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
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Coaching cues</label>
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
  const [seeding, setSeeding] = useState(false)
  const [importing, setImporting] = useState(false)
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

  async function handleSave(form, variations) {
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

    // Only workout_exercises has a real link (exercise_id) back to a specific library
    // card — session_exercises is plain text with no selection to check, and matching
    // by name alone flags coincidental same-named text that was never actually this
    // exercise, so that's intentionally not checked here.
    const { data: workoutRows } = await supabase
      .from('workout_exercises').select('id, name, workouts(name)').eq('exercise_id', ex.id)

    const workouts = (workoutRows || [])
      .filter(r => r.workouts)
      .map(r => ({ workout: r.workouts.name, name: r.name }))

    setDeleteCheck({ ex, workouts })
  }

  async function confirmDelete() {
    if (!deleteCheck) return
    await supabase.from('exercises').delete().eq('id', deleteCheck.ex.id)
    setDeleteCheck(null)
    load()
  }

  async function replaceAndDelete(replacement) {
    if (!deleteCheck || !replacement) return
    setDeleteCheck(dc => ({ ...dc, replacing: true }))
    await supabase.from('workout_exercises').update({ name: replacement.name, exercise_id: replacement.id }).eq('exercise_id', deleteCheck.ex.id)
    await supabase.from('exercises').delete().eq('id', deleteCheck.ex.id)
    setDeleteCheck(null)
    load()
  }

  // A seed entry either has `.variations` (multi-equipment) or flat equipment/video_url/
  // instructions/coaching_cues/tempo/default_rest_seconds fields (single implicit variation).
  function seedVariationRows(ex) {
    if (ex.variations) return ex.variations
    if (!ex.equipment && !ex.coaching_cues && !ex.tempo && !ex.default_rest_seconds && !ex.video_url && !ex.instructions) return []
    return [{
      equipment: ex.equipment || null,
      video_url: ex.video_url || null,
      instructions: ex.instructions || null,
      coaching_cues: ex.coaching_cues || null,
      tempo: ex.tempo || null,
      default_rest_seconds: ex.default_rest_seconds ?? null,
    }]
  }

  async function refreshSeedData() {
    setSeeding(true)
    const existingByName = {}
    exercises.forEach(e => { existingByName[e.name.toLowerCase()] = e })

    const toUpdate = SEED_EXERCISES
      .filter(ex => existingByName[ex.name.toLowerCase()])
      .map(ex => {
        const existing = existingByName[ex.name.toLowerCase()]
        return {
          id: existing.id,
          primary_muscle: ex.primary_muscle || existing.primary_muscle,
          secondary_muscles: ex.secondary_muscles || existing.secondary_muscles || [],
          exercise_type: ex.exercise_type || existing.exercise_type,
          difficulty: ex.difficulty || existing.difficulty,
        }
      })

    const toInsert = SEED_EXERCISES
      .filter(ex => !existingByName[ex.name.toLowerCase()])
      .map(ex => ({
        name: ex.name,
        primary_muscle: ex.primary_muscle || null,
        secondary_muscles: ex.secondary_muscles || [],
        exercise_type: ex.exercise_type || null,
        difficulty: ex.difficulty || null,
        coach_id: profile.id,
      }))

    if (toUpdate.length > 0) {
      await supabase.from('exercises').upsert(toUpdate, { onConflict: 'id' })
    }
    let inserted = []
    if (toInsert.length > 0) {
      const { data } = await supabase.from('exercises').insert(toInsert).select('id, name')
      inserted = data || []
    }

    // Only add variation rows where the exercise doesn't already have any —
    // never overwrite a coach's own edits to an existing exercise's variations.
    const variationInserts = []
    for (const ex of SEED_EXERCISES) {
      const existing = existingByName[ex.name.toLowerCase()]
      const existingId = existing?.id || inserted.find(i => i.name.toLowerCase() === ex.name.toLowerCase())?.id
      if (!existingId) continue
      if (existing && (variationsByExercise[existingId] || []).length > 0) continue
      seedVariationRows(ex).forEach((v, i) => variationInserts.push({ ...v, exercise_id: existingId, order_index: i }))
    }
    if (variationInserts.length > 0) {
      await supabase.from('exercise_variations').insert(variationInserts)
    }

    await load()
    setSeeding(false)
  }

  async function importFromProgrammes() {
    setImporting(true)
    const { data: sessData } = await supabase.from('training_sessions').select('session_exercises(name)')
    const allNames = [...new Set(
      (sessData || []).flatMap(s => (s.session_exercises || []).map(e => e.name).filter(Boolean))
    )]
    const existingLower = new Set(exercises.map(e => e.name.toLowerCase()))
    const toInsert = allNames.filter(n => n.trim() && !existingLower.has(n.trim().toLowerCase()))
    if (toInsert.length > 0) {
      await supabase.from('exercises').insert(toInsert.map(name => ({ coach_id: profile.id, name: name.trim() })))
      await load()
    }
    setImporting(false)
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
          <button onClick={importFromProgrammes} disabled={importing}
            className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
            {importing ? 'Importing…' : 'Import from programmes'}
          </button>
          <button onClick={refreshSeedData} disabled={seeding}
            className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
            {seeding ? 'Updating…' : exercises.length === 0 ? 'Initialize library' : 'Refresh library data'}
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
                </div>
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
            ) : deleteCheck.workouts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Not selected in any workout — safe to delete. (Training programme blocks are plain text, so they can't be checked this way — deleting this card never changes anything already typed into a block.)</p>
            ) : (
              <div className="mt-2 space-y-3">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  This exact card is selected in {deleteCheck.workouts.length} workout{deleteCheck.workouts.length !== 1 ? 's' : ''}:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 max-h-48 overflow-y-auto">
                  {deleteCheck.workouts.map((w, i) => (
                    <li key={`w${i}`} className="flex items-start gap-1.5">
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span>Workout: {w.workout} (shows as "{w.name}")</span>
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
