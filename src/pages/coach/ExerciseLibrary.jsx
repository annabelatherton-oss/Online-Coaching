import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const MUSCLE_GROUPS = ['Glutes', 'Quads', 'Hamstrings', 'Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves', 'Full Body', 'Adductors', 'Abductors', 'Hip Flexors']
const EQUIPMENT_LIST = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Smith Machine', 'Resistance Band', 'Bodyweight', 'Kettlebell', 'Pull-up Bar', 'Trap Bar', 'Landmine', 'Battle Ropes', 'Sled', 'TRX', 'Medicine Ball']
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
  { name: 'Hip Thrust', primary_muscle: 'Glutes', equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Drive through heels, squeeze glutes hard at the top, chin tucked, ribcage down, neutral spine — avoid hyperextending the lower back' },
  { name: 'Smith Machine Hip Thrust', primary_muscle: 'Glutes', equipment: 'Smith Machine', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 90, coaching_cues: 'Bar pad across hips, feet flat and hip-width, shoulders on the bench, drive through heels and squeeze at the top — easier to set up than barbell' },
  { name: 'Banded Hip Thrust', primary_muscle: 'Glutes', equipment: 'Resistance Band', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Band just above knees, drive knees out against the band throughout the rep, squeeze glutes hard at the top' },
  { name: 'Glute Bridge', primary_muscle: 'Glutes', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Feet flat and hip-width, press through heels, squeeze hard at the top and hold 1–2 seconds, keep core braced' },
  { name: 'Romanian Deadlift', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Hinge at the hips with a soft knee bend, bar stays close to the legs throughout, feel a deep hamstring stretch at the bottom, drive hips forward to stand — not a lower-back exercise' },
  { name: 'Single Leg Romanian Deadlift', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 90, coaching_cues: 'Soft bend in the standing knee, hinge and reach forward, keep hips square — avoid rotating, feel the stretch in the glute of the standing leg' },
  { name: 'Stiff Leg Deadlift', primary_muscle: 'Hamstrings', secondary_muscles: ['Glutes'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Near-straight legs, hinge deep at the hips, bar close to the legs, feel a big hamstring stretch at the bottom, squeeze glutes at the top' },
  { name: 'Bulgarian Split Squat', primary_muscle: 'Glutes', secondary_muscles: ['Quads'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Front foot far enough forward so shin stays vertical, torso upright or slight forward lean for glute focus, drive through the front heel — front knee should not cave in' },
  { name: 'Hip Abduction Machine', primary_muscle: 'Glutes', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Sit tall with feet flexed, drive through the outer hip not the knees, control the return slowly — avoid using momentum by leaning side to side' },
  { name: 'Abduction Machine', primary_muscle: 'Glutes', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Sit upright, squeeze outer glutes as you push knees apart, hold briefly at the outer range, slow and controlled return' },
  { name: 'Cable Kickback', primary_muscle: 'Glutes', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Slight forward hinge, keep working leg straight, kick back and up squeezing the glute at the top — avoid rotating the hips or swinging the leg' },
  { name: 'Donkey Kick', primary_muscle: 'Glutes', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 45, coaching_cues: 'On all fours, knee bent at 90°, kick through the heel toward the ceiling, squeeze the glute at the top — keep the hips square to the floor' },
  { name: 'Frog Pump', primary_muscle: 'Glutes', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 45, coaching_cues: 'Lie on your back, press soles of feet together, knees dropped out to the sides, drive hips up squeezing glutes — great for glute activation' },
  { name: 'Sumo Squat', primary_muscle: 'Glutes', secondary_muscles: ['Quads', 'Adductors'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Wide stance with toes turned out 30–45°, drive knees out in line with toes, chest tall throughout, squeeze glutes at the top' },
  { name: 'Step Up', primary_muscle: 'Glutes', secondary_muscles: ['Quads'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Full foot on the platform, drive through the heel of the raised leg, avoid pushing off the back foot — the working leg does all the lifting' },
  { name: 'Hyperextension', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings', 'Back'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Hinge at the hips not the lower back, lower until you feel a hamstring stretch, squeeze glutes to rise back up — stop at neutral spine, do not hyperextend' },
  { name: 'Cable Pull Through', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Stand facing away from the cable, hinge at hips and push them back to the stack, drive hips forward using glutes — this is a hinge, not a squat' },
  { name: 'Sumo Deadlift', primary_muscle: 'Glutes', secondary_muscles: ['Hamstrings', 'Back', 'Adductors'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 180, coaching_cues: 'Wide stance, toes out, grip inside the legs, keep chest tall and knees tracking over toes, drive the floor apart and stand tall at the top' },
  { name: 'Lateral Band Walk', primary_muscle: 'Glutes', equipment: 'Resistance Band', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 45, coaching_cues: 'Band just above knees, slight squat position, step sideways keeping tension in the band — feet never come together, drive through the outer hip' },
  { name: 'Monster Walk', primary_muscle: 'Glutes', equipment: 'Resistance Band', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 45, coaching_cues: 'Band around ankles, half-squat position, walk forward diagonally — drive each step through the outer hip and glute, stay low throughout' },

  // ── QUADS ───────────────────────────────────────────────────────────────
  { name: 'Back Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 180, coaching_cues: 'Bar on upper traps, brace core before unracking, feet shoulder-width with toes slightly out, chest up, drive knees out as you descend, depth to at least parallel' },
  { name: 'Front Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes', 'Core'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 180, coaching_cues: 'Bar rests on front deltoids, elbows high and forward, very upright torso, knees track over toes — this position naturally biases the quads over the glutes' },
  { name: 'Leg Press', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: 'Feet hip-width in the centre of the platform, lower until 90° at the knee, push through the full foot — do not lock out the knees at the top' },
  { name: 'Hack Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Feet shoulder-width, knees track over toes on the way down, go as deep as the machine allows, push evenly through the full foot on the way up' },
  { name: 'Pendulum Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Upright torso, feet hip-width, knees track over toes, full range of motion — excellent for quad development with reduced lower back stress' },
  { name: 'Leg Extension', primary_muscle: 'Quads', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Knee at the edge of the seat pad, extend to full lockout and flex hard at the top, slow 3-second eccentric — do not let the stack crash' },
  { name: 'Goblet Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 90, coaching_cues: 'Hold DB at chest, feet shoulder-width, elbows inside knees at the bottom, tall chest throughout — great for learning squat mechanics' },
  { name: 'Walking Lunge', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Big step forward, front knee tracks over toes, back knee drops to just above the floor, drive through the front heel to step forward — keep torso upright' },
  { name: 'Reverse Lunge', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Step back until back knee nearly touches the floor, front shin stays close to vertical, drive through the front heel to return — more knee-friendly than forward lunge' },
  { name: 'Smith Machine Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Smith Machine', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: 'Walk feet slightly in front of the bar (not directly underneath), adjust stance until you feel comfortable at the bottom — use the fixed path to focus on depth and control' },
  { name: 'Single Leg Press', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'One foot in the centre, other leg out of the way, same cues as bilateral leg press — great for addressing strength imbalances between legs' },
  { name: 'Box Squat', primary_muscle: 'Quads', secondary_muscles: ['Glutes'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 150, coaching_cues: 'Sit back to the box with control, pause briefly without relaxing, drive up by pushing knees out and pressing through the heels — teaches proper hip hinge in a squat' },
  { name: 'Sissy Squat', primary_muscle: 'Quads', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Advanced', default_rest_seconds: 90, coaching_cues: 'Hold something for balance, knees travel forward as you lean back, feel a deep quad stretch at the bottom — extremely demanding on the patella tendon, build up slowly' },

  // ── HAMSTRINGS ───────────────────────────────────────────────────────────
  { name: 'Lying Leg Curl', primary_muscle: 'Hamstrings', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Hips flat on the pad, feet hip-width apart, curl heels toward glutes squeezing the hamstrings, slow 3-second eccentric — avoid lifting the hips as you curl' },
  { name: 'Seated Leg Curl', primary_muscle: 'Hamstrings', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Adjust so knees are exactly at the pivot point, drive heels down to the bottom, squeeze hard at the end range, control the return — the seated position creates a better hamstring stretch' },
  { name: 'Single Leg Curl', primary_muscle: 'Hamstrings', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Same cues as lying leg curl on one leg at a time — identifies and corrects strength imbalances between legs' },
  { name: 'Nordic Curl', primary_muscle: 'Hamstrings', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 120, coaching_cues: 'Ankles secured, lower yourself as slowly as possible using hamstrings to resist the fall, use hands to push up from the bottom if needed — one of the most effective hamstring exercises' },
  { name: 'Good Morning', primary_muscle: 'Hamstrings', secondary_muscles: ['Back', 'Glutes'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Bar on upper traps, soft knee bend, hinge at hips until torso is parallel to the floor, feel the hamstring stretch, squeeze glutes to return — keep a neutral spine throughout' },
  { name: 'Glute Ham Raise', primary_muscle: 'Hamstrings', secondary_muscles: ['Glutes'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 120, coaching_cues: 'Curl body up using hamstrings to pull the heel pad, squeeze at the top, lower with control — one of the best hamstring exercises available' },
  { name: 'Kettlebell Swing', primary_muscle: 'Hamstrings', secondary_muscles: ['Glutes', 'Back'], equipment: 'Kettlebell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 60, coaching_cues: 'Hip hinge movement, not a squat — drive the hips back on the downswing, then explosively snap the hips forward to drive the bell up. Keep core braced throughout' },

  // ── BACK ────────────────────────────────────────────────────────────────
  { name: 'Pull Up', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Pull-up Bar', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Start from a full dead hang, depress the shoulder blades to initiate, drive elbows down and back toward the hips, chin over the bar, lower with control all the way to a dead hang' },
  { name: 'Chin Up', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Pull-up Bar', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Supinated (underhand) grip shoulder-width apart, pull chest to the bar, squeeze biceps and lats at the top, full extension at the bottom — biceps are more involved than a pull up' },
  { name: 'Lat Pulldown', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 90, coaching_cues: 'Lean back slightly, pull the bar to your upper chest driving elbows toward your hips, squeeze lats at the bottom, let the arms fully extend at the top — think elbows to back pockets' },
  { name: 'Close Grip Lat Pulldown', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 90, coaching_cues: 'Neutral grip attachment, pull to the chest driving elbows straight down, squeeze lats hard, full stretch at the top — targets the lower lats more than wide grip' },
  { name: 'Straight Arm Pulldown', primary_muscle: 'Back', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Arms straight throughout, hinge slightly forward, pull the rope or bar from overhead down to the hips — pure lat isolation with no bicep involvement' },
  { name: 'Seated Cable Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 90, coaching_cues: 'Sit tall with chest up, pull elbows past your body, squeeze shoulder blades together at the end range, control the return to a full stretch — avoid rounding forward as the weight goes back' },
  { name: 'Single Arm Cable Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'One arm at a time, slight rotation of the torso on the way out, pull elbow back and rotate the shoulder back at the end — great for lat stretch and controlled range of motion' },
  { name: 'Bent Over Barbell Row', primary_muscle: 'Back', secondary_muscles: ['Biceps', 'Core'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Hip hinge position with torso around 45° or parallel to the floor, pull bar to your lower chest or navel, drive elbows behind you and squeeze the back — control the eccentric' },
  { name: 'Pendlay Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Torso parallel to the floor, pull the bar explosively off the floor to the lower chest, set it back down each rep — more explosive than a bent over row, great for upper back thickness' },
  { name: 'Single Arm Dumbbell Row', primary_muscle: 'Back', equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Support on a bench, flat neutral back, pull the elbow straight up toward the ceiling, squeeze the lat at the top — think of the hand as just a hook, initiate with the elbow' },
  { name: 'Chest Supported Row', primary_muscle: 'Back', equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 90, coaching_cues: 'Chest flat on the incline pad, arms hang freely, pull elbows back and up squeezing shoulder blades — the chest support eliminates lower back fatigue for pure back work' },
  { name: 'Seal Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Lie prone on a raised bench, arms hang freely below, row the barbell up touching your chest — completely removes momentum and lower back involvement' },
  { name: 'Meadows Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Landmine setup, stagger stance with outside leg forward, row the sleeve up to your hip, squeeze hard at the top — great for lat width and upper back thickness' },
  { name: 'T-Bar Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Hip hinge position, narrow neutral grip, pull to the chest and squeeze the upper back, lower with control — you can load this heavy for serious thickness' },
  { name: 'Face Pull', primary_muscle: 'Back', secondary_muscles: ['Shoulders'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Rope at face height, pull to your face with elbows high and wide, externally rotate hands at the end so they point to the ceiling — targets rear delts and external rotators' },
  { name: 'Inverted Row', primary_muscle: 'Back', secondary_muscles: ['Biceps'], equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Hang under a bar or rings, body straight like a plank, pull chest to the bar driving elbows back — adjust difficulty by changing body angle (more horizontal = harder)' },
  { name: 'Dumbbell Pullover', primary_muscle: 'Back', secondary_muscles: ['Chest'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Lie across a bench, slight bend in elbows, lower the DB behind your head feeling a big lat stretch, pull back to the start — keep the movement in an arc not straight up' },
  { name: 'Deadlift', primary_muscle: 'Back', secondary_muscles: ['Glutes', 'Hamstrings', 'Core'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Advanced', default_rest_seconds: 180, coaching_cues: 'Bar over mid-foot, neutral spine before you pull, lat tension to protect the back, drive the floor away with your legs, lock out hips and glutes at the top — the most complete posterior chain exercise' },
  { name: 'Rack Pull', primary_muscle: 'Back', secondary_muscles: ['Glutes', 'Hamstrings'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 180, coaching_cues: 'Same cues as deadlift but starting from just below the knee — allows heavier loading for upper back and trap development, good deadlift accessory' },
  { name: 'Trap Bar Deadlift', primary_muscle: 'Back', secondary_muscles: ['Quads', 'Glutes', 'Hamstrings'], equipment: 'Trap Bar', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 180, coaching_cues: 'Stand in the centre, neutral grip handles, sit into the lift like a squat, neutral spine, drive through the floor — more quad-dominant than conventional deadlift, more forgiving on the lower back' },

  // ── CHEST ────────────────────────────────────────────────────────────────
  { name: 'Barbell Bench Press', primary_muscle: 'Chest', secondary_muscles: ['Shoulders', 'Triceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 150, coaching_cues: 'Retract and depress shoulder blades, slight arch, feet flat on the floor, bar to lower chest, elbows at 45–75° from torso — drive through the chest not the shoulders' },
  { name: 'Incline Barbell Press', primary_muscle: 'Chest', secondary_muscles: ['Shoulders', 'Triceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 150, coaching_cues: '30–45° incline, bar to upper chest, elbows slightly forward of the bar path, retract shoulder blades, drive through upper pec and tricep' },
  { name: 'Dumbbell Bench Press', primary_muscle: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: 'Same shoulder blade retraction as barbell, wrists stacked over elbows, touch dumbbells at the top, feel a bigger range of motion and stretch than the barbell version' },
  { name: 'Incline Dumbbell Press', primary_muscle: 'Chest', secondary_muscles: ['Shoulders'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: '30–45° incline, lower the DBs to the sides of your upper chest, slight stretch at the bottom, press and bring DBs together slightly at the top to fully contract the upper pec' },
  { name: 'Decline Dumbbell Press', primary_muscle: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: 'Slight decline bench, same cues as flat dumbbell press, targets the lower chest — keep shoulder blades retracted and avoid shoulder impingement' },
  { name: 'Smith Machine Bench Press', primary_muscle: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Smith Machine', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: 'Use the fixed path to focus on the pec contraction, retract shoulder blades, lower to lower chest, drive through — good for drop sets and pressing to failure safely' },
  { name: 'Cable Fly', primary_muscle: 'Chest', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Slight lean forward, slight bend in elbows maintained throughout, bring hands together in a hugging arc and squeeze the pecs hard — cables maintain constant tension unlike dumbbells' },
  { name: 'High to Low Cable Fly', primary_muscle: 'Chest', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Cables set high, pull downward and inward in an arc, squeeze lower pecs at the bottom — specifically targets the lower chest fibres' },
  { name: 'Low to High Cable Fly', primary_muscle: 'Chest', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Cables set low, pull upward and inward in an arc, squeeze upper pecs at the top — targets the upper chest fibres and is great combined with incline pressing' },
  { name: 'Dumbbell Fly', primary_muscle: 'Chest', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Slight bend in elbows maintained throughout, lower in a wide arc feeling a deep stretch, bring together squeezing the pecs at the top — do not go too heavy as the shoulder is vulnerable' },
  { name: 'Pec Deck', primary_muscle: 'Chest', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Elbows bent at 90°, bring arms together squeezing pecs hard at the midpoint, feel a good stretch at the outside — easy to overload safely without a spotter' },
  { name: 'Push Up', primary_muscle: 'Chest', secondary_muscles: ['Triceps', 'Core'], equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Body in a straight line from head to heels, hands slightly wider than shoulders, elbows at 45° from the torso, chest to the floor — squeeze the chest at the top' },
  { name: 'Dips', primary_muscle: 'Chest', secondary_muscles: ['Triceps'], equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'For chest emphasis: lean forward slightly, wide grip, feel the stretch across the chest at the bottom, drive through the chest to lockout — stay upright for more tricep focus' },

  // ── SHOULDERS ────────────────────────────────────────────────────────────
  { name: 'Barbell Overhead Press', primary_muscle: 'Shoulders', secondary_muscles: ['Triceps', 'Core'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 150, coaching_cues: 'Grip slightly wider than shoulder-width, bar rests on the front deltoids, brace the core, press to lockout moving head back through the window the bar creates, lower under control' },
  { name: 'Dumbbell Shoulder Press', primary_muscle: 'Shoulders', secondary_muscles: ['Triceps'], equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 120, coaching_cues: 'DBs at ear height with elbows at 90°, press to full extension without fully locking out, control the descent back to ear height — more rotator cuff stability required than barbell' },
  { name: 'Machine Shoulder Press', primary_muscle: 'Shoulders', secondary_muscles: ['Triceps'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 90, coaching_cues: 'Adjust the seat so handles are at shoulder height, press to full extension, control the return — great for safely training to failure or high volume without shoulder fatigue from stability demands' },
  { name: 'Landmine Press', primary_muscle: 'Shoulders', secondary_muscles: ['Triceps', 'Core'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'One hand holds the end of the bar, stagger stance, press in an arc upward and slightly forward — more shoulder-friendly than overhead pressing for those with impingement issues' },
  { name: 'Lateral Raise', primary_muscle: 'Shoulders', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Slight lean forward, lead with the pinky finger and elbow (not the hand), raise arms to shoulder height, slow 4-second eccentric — resist the urge to use momentum or go too heavy' },
  { name: 'Cable Lateral Raise', primary_muscle: 'Shoulders', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Cable from the side at hip height, pull arm to parallel with a slight forward lean, control the descent — cables provide more constant tension than dumbbells at the start position' },
  { name: 'Rear Delt Fly', primary_muscle: 'Shoulders', secondary_muscles: ['Back'], equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Bent over or lying prone, arms slightly bent, lead with the elbows and drive them up and out, squeeze rear delts at the top — avoid turning it into a row by bending the elbows too much' },
  { name: 'Cable Rear Delt Fly', primary_muscle: 'Shoulders', secondary_muscles: ['Back'], equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Cables crossed at face height, pull arms apart and back with a slight elbow bend, squeeze rear delts at the end — cross-cable setup maintains tension throughout the range of motion' },
  { name: 'Lying Rear Delt Raise', primary_muscle: 'Shoulders', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Lie face down on an incline bench, arms hang below, raise arms out to the side and up — the incline bench supports the body and removes any momentum, pure rear delt work' },
  { name: 'Front Raise', primary_muscle: 'Shoulders', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Neutral or pronated grip, raise to eye level, slow eccentric — avoid swinging and keep the core tight. Note: anterior delts are usually well trained from pressing; use sparingly' },
  { name: 'Band Pull Apart', primary_muscle: 'Shoulders', secondary_muscles: ['Back'], equipment: 'Resistance Band', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 45, coaching_cues: 'Hold band at shoulder height, pull apart squeezing rear delts and upper back — excellent for shoulder health and posture, use as a warm-up or high-rep finisher' },
  { name: 'Arnold Press', primary_muscle: 'Shoulders', equipment: 'Dumbbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Start with palms facing you at chin height, rotate the wrists outward as you press overhead, reverse on the way down — hits all three heads of the deltoid across the range' },
  { name: 'Upright Row', primary_muscle: 'Shoulders', secondary_muscles: ['Back', 'Biceps'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Grip shoulder-width or slightly wider, lead with the elbows up and out, bar reaches lower chest level — use a wide grip to reduce impingement risk; avoid if you have shoulder issues' },

  // ── BICEPS ───────────────────────────────────────────────────────────────
  { name: 'Barbell Curl', primary_muscle: 'Biceps', equipment: 'Barbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Elbows pinned at your sides, curl to a full peak contraction squeezing the bicep, slow 3-second eccentric — do not swing or use the lower back to assist the lift' },
  { name: 'EZ Bar Curl', primary_muscle: 'Biceps', equipment: 'Barbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Same as barbell curl but the angled grip reduces wrist strain — elbows pinned, full contraction at the top, slow eccentric. Great for higher volume sets' },
  { name: 'Dumbbell Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Supinate the wrist as you curl (palm facing ceiling at the top), squeeze the bicep at the top, lower with control — allows each arm to work independently, good for addressing imbalances' },
  { name: 'Hammer Curl', primary_muscle: 'Biceps', secondary_muscles: ['Forearms'], equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Neutral grip (thumbs up) throughout the movement, curl to shoulder height, squeeze at the top — targets the brachialis and brachioradialis for overall arm thickness' },
  { name: 'Cable Curl', primary_muscle: 'Biceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Elbows at your sides, curl to full contraction squeezing hard, slow controlled eccentric — the cable maintains tension throughout the full range unlike a barbell where tension drops at the top' },
  { name: 'Incline Dumbbell Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Lie back on a 45–60° incline, arms hang behind the body creating a deep stretch, curl up fully — the incline position stretches the long head of the bicep for maximum stimulus' },
  { name: 'Bayesian Curl', primary_muscle: 'Biceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Cable set low behind you, stand upright or lean slightly forward, curl with the elbow behind the body — like the incline curl, this stretches the long head of the bicep at the start' },
  { name: 'Preacher Curl', primary_muscle: 'Biceps', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Upper arm on the pad, lower to full extension on every rep, curl to a peak contraction — the pad prevents swinging and puts constant tension on the bicep throughout the range' },
  { name: 'Concentration Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Elbow braced on inner thigh, curl fully, squeeze hard at the top — elbow is completely fixed so all work is done by the bicep. Great for mind-muscle connection' },
  { name: 'Spider Curl', primary_muscle: 'Biceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Lie face down on an incline bench, arms hang straight down, curl DBs up to full contraction — elbows are fixed in front of the body, completely isolates the bicep with no cheating possible' },
  { name: 'Zottman Curl', primary_muscle: 'Biceps', secondary_muscles: ['Forearms'], equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Intermediate', default_rest_seconds: 60, coaching_cues: 'Curl up supinated (palms up), rotate to pronated (palms down) at the top, lower slowly in the pronated position — works the bicep on the way up and the brachioradialis on the way down' },

  // ── TRICEPS ───────────────────────────────────────────────────────────────
  { name: 'Tricep Pushdown', primary_muscle: 'Triceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Elbows pinned at your sides, push down to full extension squeezing the tricep, slow controlled return — do not let the elbows flare out or the upper arms move' },
  { name: 'Rope Pushdown', primary_muscle: 'Triceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Same cues as pushdown, but pull the rope apart at the bottom to achieve full tricep contraction — the rope split at the bottom gives a better end-range squeeze' },
  { name: 'Overhead Cable Extension', primary_muscle: 'Triceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Face away from the cable or use a high pulley, hinge slightly forward, extend elbows from behind the head to full lockout — the overhead position stretches the long head of the tricep' },
  { name: 'Skull Crusher', primary_muscle: 'Triceps', equipment: 'Barbell', exercise_type: 'Isolation', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Elbows pointing toward the ceiling, lower the bar to forehead or behind the head, extend to lockout — keep elbows in position and only move at the elbow joint' },
  { name: 'Overhead Tricep Extension', primary_muscle: 'Triceps', equipment: 'Dumbbell', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Hold one DB with both hands overhead, elbow pointed at the ceiling, lower behind the head, extend fully — the overhead position stretches the long head maximally for greater growth stimulus' },
  { name: 'Close Grip Bench Press', primary_muscle: 'Triceps', secondary_muscles: ['Chest'], equipment: 'Barbell', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 120, coaching_cues: 'Grip shoulder-width (not ultra-close), elbows at 45° to the body, lower to lower chest, drive through triceps to lockout — you can load this heavier than isolation movements' },
  { name: 'JM Press', primary_muscle: 'Triceps', equipment: 'Barbell', exercise_type: 'Isolation', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Cross between a skull crusher and close grip press — lower toward the chin with elbows tucked at 45°, press up and slightly toward feet. Heavy tricep overload exercise' },
  { name: 'Tricep Dips', primary_muscle: 'Triceps', secondary_muscles: ['Chest'], equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Intermediate', default_rest_seconds: 90, coaching_cues: 'Upright torso for tricep focus (lean forward for chest), elbows point directly behind you, lower to a deep stretch, drive through triceps to lockout — add weight when bodyweight becomes easy' },
  { name: 'Cable Tricep Kickback', primary_muscle: 'Triceps', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Hinge forward at the hip, upper arm parallel to the floor, extend the elbow to a straight arm — squeeze the tricep hard at full extension' },

  // ── CORE ─────────────────────────────────────────────────────────────────
  { name: 'Plank', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner', coaching_cues: 'Body in a rigid straight line from head to heels, squeeze glutes and abs, breathe steadily — do not let the hips sag or pike up. Progress by adding time or weight on the back' },
  { name: 'Side Plank', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner', coaching_cues: 'Stack feet or stagger for stability, hips high off the floor, squeeze the oblique and glute — body forms a straight diagonal line from head to feet' },
  { name: 'Dead Bug', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Beginner', coaching_cues: 'Lower back pressed to the floor throughout, slowly extend opposite arm and leg, breathe out on the extension — the goal is anti-extension stability, not speed' },
  { name: 'Crunches', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner', coaching_cues: 'Hands behind head lightly (do not pull on the neck), curl shoulders off the floor, squeeze abs hard at the top, lower slowly — full range of motion is a short arc, not a full sit up' },
  { name: 'Bicycle Crunch', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner', coaching_cues: 'Rotate shoulder to opposite knee (not elbow to knee), extend the opposite leg fully, slow and deliberate — quality of rotation matters more than speed' },
  { name: 'Cable Crunch', primary_muscle: 'Core', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Kneel facing the cable, hold rope at forehead, curl the spine forward toward the knees, squeeze abs hard at the bottom — this is a spine flexion movement, not a hip flexion movement' },
  { name: 'Reverse Crunch', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner', coaching_cues: 'Lie flat, curl the hips and knees toward the chest, squeeze the lower abs at the top, lower with control — avoid using momentum by swinging the legs' },
  { name: 'Hanging Leg Raise', primary_muscle: 'Core', equipment: 'Pull-up Bar', exercise_type: 'Compound', difficulty: 'Intermediate', coaching_cues: 'Full hang from the bar, raise legs to parallel or above by curling the hips up, control the descent — avoid swinging. Bend knees to make it easier, straighten legs to make it harder' },
  { name: 'Toes to Bar', primary_muscle: 'Core', secondary_muscles: ['Back'], equipment: 'Pull-up Bar', exercise_type: 'Compound', difficulty: 'Advanced', coaching_cues: 'Hang from a pull up bar, raise both feet to touch the bar using your core, control the descent — requires significant grip, lat and core strength. Progress from knee raises first' },
  { name: 'Ab Wheel Rollout', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Advanced', coaching_cues: 'Kneel with wheel in front, roll out until arms are fully extended while keeping hips neutral, use the core to pull back in — one of the best anti-extension core exercises. Start with partial range' },
  { name: 'Pallof Press', primary_muscle: 'Core', equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Intermediate', coaching_cues: 'Stand sideways to the cable, hold the handle at chest height, press out resisting the rotation, hold and return — trains anti-rotation which is often overlooked but critical for spinal health' },
  { name: 'Cable Woodchop', primary_muscle: 'Core', secondary_muscles: ['Shoulders'], equipment: 'Cable', exercise_type: 'Compound', difficulty: 'Intermediate', coaching_cues: 'Cable set high, rotate diagonally downward across the body in a chopping motion, resist the pull back to start — trains rotational power and anti-rotation strength' },
  { name: 'Hollow Hold', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Intermediate', coaching_cues: 'Lie flat, press lower back to the floor, lift shoulders and legs off the floor simultaneously, arms overhead, hold the position — a gymnastic staple for developing core tension' },
  { name: 'Russian Twist', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Beginner', coaching_cues: 'Feet off the floor, lean back slightly, rotate side to side touching the floor each side — add weight to increase difficulty. Focus on rotating the ribcage not just the arms' },
  { name: 'Back Extension', primary_muscle: 'Core', secondary_muscles: ['Glutes', 'Hamstrings'], equipment: 'Machine', exercise_type: 'Compound', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Hinge at the hips (not the lower back), lower until you feel a hamstring stretch, squeeze glutes to rise back to a neutral spine position — stop at parallel, do not hyperextend' },
  { name: 'Dragon Flag', primary_muscle: 'Core', equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Advanced', coaching_cues: 'Grip a bench behind your head, raise the body into a hollow position, slowly lower as a rigid unit — only your upper back touches the bench. Extreme core strength exercise, progress very gradually' },

  // ── ADDUCTORS ────────────────────────────────────────────────────────────
  { name: 'Adduction Machine', primary_muscle: 'Adductors', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Sit tall, squeeze legs together from wide to narrow, hold briefly at the midline, slow controlled return — great for inner thigh development' },
  { name: 'Copenhagen Plank', primary_muscle: 'Adductors', secondary_muscles: ['Core'], equipment: 'Bodyweight', exercise_type: 'Compound', difficulty: 'Advanced', coaching_cues: 'Top leg rests on a bench, bottom leg hovers, hold the side plank position — one of the most effective adductor strengthening exercises. Build up from the easier short-lever version' },
  { name: 'Cable Adduction', primary_muscle: 'Adductors', equipment: 'Cable', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Ankle cuff on the working leg, pull leg inward and across the body, squeeze the inner thigh at the end range, controlled return — use a wall or rack for balance' },

  // ── CALVES ───────────────────────────────────────────────────────────────
  { name: 'Standing Calf Raise', primary_muscle: 'Calves', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Full range of motion — deep stretch at the bottom and full rise to toes at the top, pause at each end, slow eccentric. Calves are stubborn and respond best to full ROM and high volume' },
  { name: 'Seated Calf Raise', primary_muscle: 'Calves', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Pads on the lower quad just above the knee, full range of motion, pause at the top squeeze and at the bottom stretch — the seated position shifts emphasis to the soleus (deeper calf muscle)' },
  { name: 'Leg Press Calf Raise', primary_muscle: 'Calves', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Beginner', default_rest_seconds: 60, coaching_cues: 'Feet at the bottom of the platform, only toes on the edge, full range of motion pressing through the balls of the feet — allows heavier loading than standing calf raises for some people' },
  { name: 'Single Leg Calf Raise', primary_muscle: 'Calves', equipment: 'Bodyweight', exercise_type: 'Isolation', difficulty: 'Intermediate', coaching_cues: 'Hold something for balance, full range of motion — deep stretch at the bottom, rise fully to toes, slow eccentric. Double the intensity of both legs at once' },
  { name: 'Donkey Calf Raise', primary_muscle: 'Calves', equipment: 'Machine', exercise_type: 'Isolation', difficulty: 'Intermediate', coaching_cues: 'Hinged forward at the hips (machine or with partner on back), full range of motion — the hip flexed position pre-stretches the gastrocnemius for a greater stimulus' },
]

const EMPTY_FORM = { name: '', primary_muscle: '', secondary_muscles: [], equipment: '', exercise_type: '', difficulty: '', video_url: '', coaching_cues: '', instructions: '', tempo: '', default_rest_seconds: '', tags: [], notes: '' }

function Badge({ label, colourClass }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colourClass || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{label}</span>
}

function ExerciseModal({ exercise, onSave, onClose }) {
  const [form, setForm] = useState(exercise ? {
    ...exercise,
    secondary_muscles: exercise.secondary_muscles || [],
    tags: exercise.tags || [],
    default_rest_seconds: exercise.default_rest_seconds ?? '',
  } : { ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [secInput, setSecInput] = useState('')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({
      ...form,
      name: form.name.trim(),
      default_rest_seconds: form.default_rest_seconds !== '' ? parseInt(form.default_rest_seconds) : null,
    })
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
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Equipment</label>
              <select className="input w-full" value={form.equipment} onChange={e => set('equipment', e.target.value)}>
                <option value="">Select…</option>
                {EQUIPMENT_LIST.map(e => <option key={e} value={e}>{e}</option>)}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Default rest (seconds)</label>
              <input type="number" min={0} className="input w-full" placeholder="e.g. 90" value={form.default_rest_seconds} onChange={e => set('default_rest_seconds', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Tempo</label>
              <input className="input w-full" placeholder="e.g. 3010" value={form.tempo} onChange={e => set('tempo', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Video URL (optional)</label>
            <input type="url" className="input w-full" placeholder="https://…" value={form.video_url} onChange={e => set('video_url', e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Coaching cues</label>
            <textarea rows={2} className="input w-full resize-none" placeholder="Key cues for the client…" value={form.coaching_cues} onChange={e => set('coaching_cues', e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Instructions</label>
            <textarea rows={3} className="input w-full resize-none" placeholder="Step-by-step instructions…" value={form.instructions} onChange={e => set('instructions', e.target.value)} />
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
  const [expandedId, setExpandedId] = useState(null)

  async function load() {
    const { data } = await supabase.from('exercises').select('*').eq('coach_id', profile.id).eq('is_archived', false).order('name')
    setExercises(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = exercises.filter(ex => {
    if (filterMuscle && ex.primary_muscle !== filterMuscle) return false
    if (filterEquipment && ex.equipment !== filterEquipment) return false
    if (filterType && ex.exercise_type !== filterType) return false
    if (search) {
      const q = search.toLowerCase()
      return ex.name.toLowerCase().includes(q) || (ex.primary_muscle || '').toLowerCase().includes(q)
    }
    return true
  })

  async function handleSave(form) {
    if (modal === 'new') {
      await supabase.from('exercises').insert({ ...form, coach_id: profile.id })
    } else {
      await supabase.from('exercises').update(form).eq('id', modal.id)
    }
    setModal(null)
    load()
  }

  async function handleDelete(ex) {
    if (!confirm(`Archive "${ex.name}"?`)) return
    await supabase.from('exercises').update({ is_archived: true }).eq('id', ex.id)
    load()
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
          equipment: ex.equipment || existing.equipment,
          exercise_type: ex.exercise_type || existing.exercise_type,
          difficulty: ex.difficulty || existing.difficulty,
          coaching_cues: ex.coaching_cues || existing.coaching_cues,
          default_rest_seconds: ex.default_rest_seconds ?? existing.default_rest_seconds,
        }
      })

    const toInsert = SEED_EXERCISES
      .filter(ex => !existingByName[ex.name.toLowerCase()])
      .map(ex => ({ ...ex, coach_id: profile.id, secondary_muscles: ex.secondary_muscles || [] }))

    if (toUpdate.length > 0) {
      await supabase.from('exercises').upsert(toUpdate, { onConflict: 'id' })
    }
    if (toInsert.length > 0) {
      await supabase.from('exercises').insert(toInsert)
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
        {filtered.map(ex => {
          const isExpanded = expandedId === ex.id
          const hasDetails = ex.coaching_cues || ex.instructions || (ex.secondary_muscles?.length > 0) || ex.notes
          return (
            <div key={ex.id} className="card hover:border-brand-300 dark:hover:border-brand-700 transition-colors group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{ex.name}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ex.primary_muscle && (
                      <Badge label={ex.primary_muscle} colourClass={MUSCLE_COLOURS[ex.primary_muscle]} />
                    )}
                    {(ex.secondary_muscles || []).map(m => (
                      <Badge key={m} label={m} colourClass="bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400" />
                    ))}
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
                  <div className="flex items-center gap-3 mt-1.5">
                    {ex.equipment && <p className="text-xs text-gray-400 dark:text-gray-500">{ex.equipment}</p>}
                    {ex.default_rest_seconds && <p className="text-xs text-gray-400 dark:text-gray-500">Rest {ex.default_rest_seconds}s</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => setModal(ex)} className="text-xs text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 px-1.5 py-1">Edit</button>
                  <button onClick={() => handleDelete(ex)} className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-1">Archive</button>
                </div>
              </div>

              {ex.coaching_cues && (
                <p className={`text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {ex.coaching_cues}
                </p>
              )}

              {isExpanded && ex.instructions && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Instructions</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{ex.instructions}</p>
                </div>
              )}

              {isExpanded && ex.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Notes</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{ex.notes}</p>
                </div>
              )}

              {hasDetails && (
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                  className="mt-2 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {modal && (
        <ExerciseModal
          exercise={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
