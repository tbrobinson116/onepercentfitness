import type { Exercise } from '../types/index.js';

export const exerciseDatabase: Exercise[] = [
  // --- CHEST ---
  {
    id: 'ex-001', name: 'Barbell Bench Press', type: 'strength',
    primaryMuscle: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'barbell',
    instructions: 'Lie on bench, grip bar slightly wider than shoulders. Lower to chest, press up.',
  },
  {
    id: 'ex-002', name: 'Incline Dumbbell Press', type: 'strength',
    primaryMuscle: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'dumbbell',
    instructions: 'Set bench to 30-45 degrees. Press dumbbells up from shoulder level.',
  },
  {
    id: 'ex-003', name: 'Cable Flyes', type: 'strength',
    primaryMuscle: 'chest', secondaryMuscles: [], equipment: 'cable',
    instructions: 'Stand between cables set at shoulder height. Bring hands together in arc.',
  },
  {
    id: 'ex-004', name: 'Dumbbell Bench Press', type: 'strength',
    primaryMuscle: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'dumbbell',
    instructions: 'Lie on bench, press dumbbells up from chest level.',
  },
  {
    id: 'ex-005', name: 'Push-Ups', type: 'bodyweight',
    primaryMuscle: 'chest', secondaryMuscles: ['shoulders', 'triceps', 'abs'], equipment: 'bodyweight',
    instructions: 'Hands shoulder-width apart, lower chest to floor, press up.',
  },
  {
    id: 'ex-006', name: 'Decline Barbell Press', type: 'strength',
    primaryMuscle: 'chest', secondaryMuscles: ['triceps'], equipment: 'barbell',
    instructions: 'Lie on decline bench, press barbell from lower chest.',
  },
  {
    id: 'ex-007', name: 'Machine Chest Press', type: 'strength',
    primaryMuscle: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'machine',
    instructions: 'Sit in machine, grip handles at chest height, press forward.',
  },

  // --- BACK ---
  {
    id: 'ex-010', name: 'Barbell Deadlift', type: 'strength',
    primaryMuscle: 'back', secondaryMuscles: ['hamstrings', 'glutes', 'traps', 'forearms'], equipment: 'barbell',
    instructions: 'Stand over bar, hinge at hips, grip bar and stand up straight.',
  },
  {
    id: 'ex-011', name: 'Pull-Ups', type: 'bodyweight',
    primaryMuscle: 'lats', secondaryMuscles: ['biceps', 'forearms'], equipment: 'bodyweight',
    instructions: 'Hang from bar with overhand grip, pull chin above bar.',
  },
  {
    id: 'ex-012', name: 'Barbell Bent-Over Row', type: 'strength',
    primaryMuscle: 'back', secondaryMuscles: ['biceps', 'lats'], equipment: 'barbell',
    instructions: 'Hinge forward at hips, row barbell to lower chest.',
  },
  {
    id: 'ex-013', name: 'Dumbbell Single-Arm Row', type: 'strength',
    primaryMuscle: 'lats', secondaryMuscles: ['biceps', 'back'], equipment: 'dumbbell',
    instructions: 'One hand on bench, row dumbbell to hip.',
  },
  {
    id: 'ex-014', name: 'Lat Pulldown', type: 'strength',
    primaryMuscle: 'lats', secondaryMuscles: ['biceps'], equipment: 'cable',
    instructions: 'Sit at cable machine, pull bar to upper chest.',
  },
  {
    id: 'ex-015', name: 'Seated Cable Row', type: 'strength',
    primaryMuscle: 'back', secondaryMuscles: ['biceps', 'lats'], equipment: 'cable',
    instructions: 'Sit upright, pull handle to lower chest squeezing shoulder blades.',
  },
  {
    id: 'ex-016', name: 'T-Bar Row', type: 'strength',
    primaryMuscle: 'back', secondaryMuscles: ['biceps', 'lats'], equipment: 'barbell',
    instructions: 'Straddle bar, row to chest with close grip.',
  },

  // --- SHOULDERS ---
  {
    id: 'ex-020', name: 'Overhead Press', type: 'strength',
    primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'barbell',
    instructions: 'Press barbell overhead from shoulder level to full lockout.',
  },
  {
    id: 'ex-021', name: 'Dumbbell Lateral Raise', type: 'strength',
    primaryMuscle: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell',
    instructions: 'Raise dumbbells to sides until arms are parallel to floor.',
  },
  {
    id: 'ex-022', name: 'Dumbbell Shoulder Press', type: 'strength',
    primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'dumbbell',
    instructions: 'Seated or standing, press dumbbells overhead.',
  },
  {
    id: 'ex-023', name: 'Face Pulls', type: 'strength',
    primaryMuscle: 'shoulders', secondaryMuscles: ['traps'], equipment: 'cable',
    instructions: 'Pull rope attachment to face, externally rotating at top.',
  },
  {
    id: 'ex-024', name: 'Arnold Press', type: 'strength',
    primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'dumbbell',
    instructions: 'Start with palms facing you, rotate as you press overhead.',
  },
  {
    id: 'ex-025', name: 'Rear Delt Flyes', type: 'strength',
    primaryMuscle: 'shoulders', secondaryMuscles: ['traps'], equipment: 'dumbbell',
    instructions: 'Bent over, raise dumbbells to sides targeting rear delts.',
  },

  // --- BICEPS ---
  {
    id: 'ex-030', name: 'Barbell Curl', type: 'strength',
    primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'barbell',
    instructions: 'Stand with barbell, curl to shoulders keeping elbows stationary.',
  },
  {
    id: 'ex-031', name: 'Dumbbell Curl', type: 'strength',
    primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'dumbbell',
    instructions: 'Alternating or together, curl dumbbells to shoulders.',
  },
  {
    id: 'ex-032', name: 'Hammer Curl', type: 'strength',
    primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'dumbbell',
    instructions: 'Curl with neutral (hammer) grip targeting brachialis.',
  },
  {
    id: 'ex-033', name: 'Cable Curl', type: 'strength',
    primaryMuscle: 'biceps', secondaryMuscles: [], equipment: 'cable',
    instructions: 'Stand at cable machine, curl bar or rope attachment.',
  },
  {
    id: 'ex-034', name: 'Preacher Curl', type: 'strength',
    primaryMuscle: 'biceps', secondaryMuscles: [], equipment: 'dumbbell',
    instructions: 'Arms on preacher bench, curl dumbbells up.',
  },

  // --- TRICEPS ---
  {
    id: 'ex-040', name: 'Tricep Pushdown', type: 'strength',
    primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'cable',
    instructions: 'Push cable attachment down, extending arms fully.',
  },
  {
    id: 'ex-041', name: 'Overhead Tricep Extension', type: 'strength',
    primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'dumbbell',
    instructions: 'Hold dumbbell overhead with both hands, lower behind head.',
  },
  {
    id: 'ex-042', name: 'Close-Grip Bench Press', type: 'strength',
    primaryMuscle: 'triceps', secondaryMuscles: ['chest'], equipment: 'barbell',
    instructions: 'Bench press with hands shoulder-width or closer.',
  },
  {
    id: 'ex-043', name: 'Dips', type: 'bodyweight',
    primaryMuscle: 'triceps', secondaryMuscles: ['chest', 'shoulders'], equipment: 'bodyweight',
    instructions: 'Support on parallel bars, lower body by bending arms, press up.',
  },
  {
    id: 'ex-044', name: 'Skull Crushers', type: 'strength',
    primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'barbell',
    instructions: 'Lie on bench, lower barbell to forehead by bending elbows.',
  },

  // --- LEGS ---
  {
    id: 'ex-050', name: 'Barbell Squat', type: 'strength',
    primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'barbell',
    instructions: 'Bar on upper back, squat down until thighs are parallel or below.',
  },
  {
    id: 'ex-051', name: 'Romanian Deadlift', type: 'strength',
    primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'lower_back'], equipment: 'barbell',
    instructions: 'Hinge at hips, lower barbell along legs keeping legs nearly straight.',
  },
  {
    id: 'ex-052', name: 'Leg Press', type: 'strength',
    primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'machine',
    instructions: 'Sit in leg press, push platform away by extending legs.',
  },
  {
    id: 'ex-053', name: 'Bulgarian Split Squat', type: 'strength',
    primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'dumbbell',
    instructions: 'Rear foot on bench, lunge down with front leg.',
  },
  {
    id: 'ex-054', name: 'Leg Curl', type: 'strength',
    primaryMuscle: 'hamstrings', secondaryMuscles: [], equipment: 'machine',
    instructions: 'Lie on machine, curl legs up squeezing hamstrings.',
  },
  {
    id: 'ex-055', name: 'Leg Extension', type: 'strength',
    primaryMuscle: 'quads', secondaryMuscles: [], equipment: 'machine',
    instructions: 'Sit in machine, extend legs squeezing quads at top.',
  },
  {
    id: 'ex-056', name: 'Hip Thrust', type: 'strength',
    primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'barbell',
    instructions: 'Upper back on bench, barbell on hips, thrust up.',
  },
  {
    id: 'ex-057', name: 'Calf Raise', type: 'strength',
    primaryMuscle: 'calves', secondaryMuscles: [], equipment: 'machine',
    instructions: 'Stand on platform, raise onto toes, lower slowly.',
  },
  {
    id: 'ex-058', name: 'Goblet Squat', type: 'strength',
    primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'dumbbell',
    instructions: 'Hold dumbbell at chest, squat down keeping torso upright.',
  },
  {
    id: 'ex-059', name: 'Walking Lunges', type: 'strength',
    primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'dumbbell',
    instructions: 'Step forward into lunge, alternate legs while walking.',
  },

  // --- ABS / CORE ---
  {
    id: 'ex-060', name: 'Hanging Leg Raise', type: 'bodyweight',
    primaryMuscle: 'abs', secondaryMuscles: ['hip_flexors'], equipment: 'bodyweight',
    instructions: 'Hang from bar, raise legs to parallel or higher.',
  },
  {
    id: 'ex-061', name: 'Cable Crunch', type: 'strength',
    primaryMuscle: 'abs', secondaryMuscles: [], equipment: 'cable',
    instructions: 'Kneel at cable, crunch down squeezing abs.',
  },
  {
    id: 'ex-062', name: 'Plank', type: 'bodyweight',
    primaryMuscle: 'abs', secondaryMuscles: ['shoulders'], equipment: 'bodyweight',
    instructions: 'Hold push-up position on forearms, keep body straight.',
  },
  {
    id: 'ex-063', name: 'Ab Wheel Rollout', type: 'bodyweight',
    primaryMuscle: 'abs', secondaryMuscles: ['shoulders', 'lats'], equipment: 'bodyweight',
    instructions: 'Kneel, roll wheel forward extending body, pull back.',
  },
  {
    id: 'ex-064', name: 'Russian Twist', type: 'bodyweight',
    primaryMuscle: 'abs', secondaryMuscles: [], equipment: 'bodyweight',
    instructions: 'Sit with feet raised, rotate torso side to side.',
  },

  // --- TRAPS ---
  {
    id: 'ex-070', name: 'Barbell Shrug', type: 'strength',
    primaryMuscle: 'traps', secondaryMuscles: [], equipment: 'barbell',
    instructions: 'Hold barbell at waist, shrug shoulders up to ears.',
  },
  {
    id: 'ex-071', name: 'Dumbbell Shrug', type: 'strength',
    primaryMuscle: 'traps', secondaryMuscles: [], equipment: 'dumbbell',
    instructions: 'Hold dumbbells at sides, shrug shoulders up.',
  },

  // --- CARDIO ---
  {
    id: 'ex-080', name: 'Treadmill Run', type: 'cardio',
    primaryMuscle: 'cardio', secondaryMuscles: ['quads', 'calves'], equipment: 'machine',
    instructions: 'Run on treadmill at target pace and incline.',
  },
  {
    id: 'ex-081', name: 'Rowing Machine', type: 'cardio',
    primaryMuscle: 'cardio', secondaryMuscles: ['back', 'biceps', 'quads'], equipment: 'machine',
    instructions: 'Row with full body motion: legs, back, arms.',
  },
  {
    id: 'ex-082', name: 'Kettlebell Swing', type: 'cardio',
    primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings', 'back', 'shoulders'], equipment: 'kettlebell',
    instructions: 'Hinge at hips, swing kettlebell to shoulder height.',
  },
  {
    id: 'ex-083', name: 'Burpees', type: 'plyometric',
    primaryMuscle: 'full_body', secondaryMuscles: [], equipment: 'bodyweight',
    instructions: 'Squat, kick feet back, push up, jump up. Repeat.',
  },
  {
    id: 'ex-084', name: 'Jump Rope', type: 'cardio',
    primaryMuscle: 'cardio', secondaryMuscles: ['calves', 'shoulders'], equipment: 'bodyweight',
    instructions: 'Skip rope continuously at target pace.',
  },
];
