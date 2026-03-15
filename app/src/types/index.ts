// ============================================================
// One Percent Fitness - Core Type Definitions
// ============================================================

// --- User Profile & Measurements ---

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  heightCm: number;
  createdAt: string;
  updatedAt: string;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg?: number;
  bodyFatPercent?: number;
  muscleMassKg?: number;
  // Circumference measurements in cm
  chest?: number;
  waist?: number;
  hips?: number;
  bicepLeft?: number;
  bicepRight?: number;
  thighLeft?: number;
  thighRight?: number;
  calfLeft?: number;
  calfRight?: number;
  shoulders?: number;
  neck?: number;
  forearmLeft?: number;
  forearmRight?: number;
  notes?: string;
}

export interface BloodWork {
  id: string;
  date: string;
  labName?: string;
  results: BloodWorkResult[];
  notes?: string;
}

export interface BloodWorkResult {
  marker: string; // e.g. "Testosterone", "Vitamin D", "HDL Cholesterol"
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  status?: 'low' | 'normal' | 'high';
}

// --- Goals ---

export type GoalType = 'physique' | 'strength' | 'endurance' | 'weight' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'paused';

export interface FitnessGoal {
  id: string;
  type: GoalType;
  title: string;
  description?: string;
  targetDate?: string;
  status: GoalStatus;
  createdAt: string;
  // For physique goals - progress photos
  currentPhotoUri?: string;
  goalImageUri?: string;
  // For strength goals
  exercise?: string;
  targetValue?: number;
  targetUnit?: string; // "lbs", "kg", "reps", "seconds"
  currentValue?: number;
  // For weight goals
  targetWeightKg?: number;
  targetBodyFatPercent?: number;
  // Progress tracking
  progressPercent: number;
  milestones?: GoalMilestone[];
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  achieved: boolean;
  achievedDate?: string;
}

// --- Settings ---

export type WeightUnit = 'lbs' | 'kg';

// --- Workouts & Exercises ---

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'abs' | 'obliques' | 'quads' | 'hamstrings'
  | 'glutes' | 'calves' | 'traps' | 'lats' | 'lower_back'
  | 'hip_flexors' | 'adductors' | 'abductors' | 'full_body' | 'cardio';

export type ExerciseType = 'strength' | 'cardio' | 'flexibility' | 'plyometric' | 'bodyweight';
export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'band' | 'other';

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  instructions?: string;
  videoUrl?: string;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  weightKg?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  rpe?: number; // Rate of Perceived Exertion 1-10
  isWarmup?: boolean;
  isDropSet?: boolean;
  isFailure?: boolean;
  completed: boolean;
  restSeconds?: number;
}

export interface ExerciseNote {
  id: string;
  text: string;
  timestamp: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
  exerciseNotes?: ExerciseNote[];
  order: number;
}

export type CardioType = 'treadmill' | 'elliptical' | 'bike' | 'stairmaster' | 'rowing' | 'outdoor_run' | 'outdoor_walk' | 'other';

export interface CardioEntry {
  id: string;
  type: CardioType;
  durationMinutes: number;
  speedMph?: number;
  inclinePercent?: number;
  resistanceLevel?: number;
  weightedVestLbs?: number;
  distanceMiles?: number;
  estimatedCalories: number;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  exercises: WorkoutExercise[];
  cardioEntries?: CardioEntry[];
  notes?: string;
  isCompleted: boolean;
  // AI-generated program reference
  programId?: string;
  programDayIndex?: number;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  durationWeeks: number;
  daysPerWeek: number;
  goal: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  workouts: ProgramWorkout[];
  createdAt: string;
  isAiGenerated: boolean;
}

export interface ProgramWorkout {
  dayIndex: number;
  dayName: string; // "Day 1 - Push", "Day 2 - Pull"
  muscleGroups: MuscleGroup[];
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  notes?: string;
}

// --- Nutrition ---

export interface NutritionDay {
  id: string;
  date: string;
  meals: Meal[];
  waterMl: number;
  totals: MacroTotals;
  targets: MacroTotals;
}

export interface MacroTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';

export interface Meal {
  id: string;
  type: MealType;
  name?: string;
  time?: string;
  foods: FoodEntry[];
  totals: MacroTotals;
}

export interface FoodEntry {
  id: string;
  foodId?: string;
  name: string;
  servingSize: number;
  servingUnit: string;
  quantity: number;
  macros: MacroTotals;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  macrosPerServing: MacroTotals;
  category?: string;
  imageUrl?: string;
}

// --- Recipes ---

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[]; // "high-protein", "low-carb", "meal-prep", etc.
  ingredients: RecipeIngredient[];
  instructions: string[];
  macrosPerServing: MacroTotals;
  imageUrl?: string;
  isAiGenerated: boolean;
}

export interface RecipeIngredient {
  foodItem: string;
  amount: number;
  unit: string;
  notes?: string; // "diced", "melted", etc.
}

export interface FridgeItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  expiryDate?: string;
  category?: 'protein' | 'dairy' | 'vegetable' | 'fruit' | 'grain' | 'condiment' | 'other';
}

// --- AI Generation Requests ---

export interface GenerateWorkoutRequest {
  goals: FitnessGoal[];
  measurements?: BodyMeasurement;
  bloodWork?: BloodWork;
  experience: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  sessionDurationMinutes: number;
  availableEquipment: Equipment[];
  injuries?: string[];
  preferences?: string;
}

export interface GenerateMealPlanRequest {
  goals: FitnessGoal[];
  measurements?: BodyMeasurement;
  dailyCalorieTarget?: number;
  dailyProteinTarget?: number;
  dietaryRestrictions?: string[];
  fridgeItems?: FridgeItem[];
  mealsPerDay: number;
  preferences?: string;
}

export interface GenerateRecipeRequest {
  fridgeItems: FridgeItem[];
  macroTargets?: Partial<MacroTotals>;
  dietaryRestrictions?: string[];
  mealType?: MealType;
  maxPrepTimeMinutes?: number;
  preferences?: string;
}

// --- Progress Photos ---

export type PhotoPose = 'front' | 'side' | 'back' | 'custom';

export interface ProgressPhoto {
  id: string;
  uri: string;
  date: string;
  pose: PhotoPose;
  bodyWeight?: number;
  bodyFatPercent?: number;
  notes?: string;
  goalId?: string; // Link to a physique goal
}

// --- Navigation ---

export type RootStackParamList = {
  MainTabs: undefined;
  WorkoutDetail: { workoutId: string };
  ExerciseDetail: { exerciseId: string };
  ActiveWorkout: { workoutId: string };
  GoalDetail: { goalId: string };
  AddGoal: undefined;
  AddMeasurement: undefined;
  RecipeDetail: { recipeId: string };
  MealDetail: { mealId: string; date: string };
  GenerateProgram: undefined;
  GenerateMealPlan: undefined;
  BloodWorkEntry: undefined;
  FridgeManager: undefined;
  WorkoutAnalytics: undefined;
  ProgressPhotos: undefined;
  ProgramDetail: { programId: string };
};

export type TabParamList = {
  Home: undefined;
  Workouts: undefined;
  Nutrition: undefined;
  Goals: undefined;
  Profile: undefined;
};
