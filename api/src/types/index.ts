// ============================================================
// One Percent Fitness API - Type Definitions
// ============================================================

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  heightCm: number;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg?: number;
  bodyFatPercent?: number;
  muscleMassKg?: number;
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
  notes?: string;
}

export interface BloodWorkResult {
  marker: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  status?: 'low' | 'normal' | 'high';
}

export interface BloodWork {
  id: string;
  date: string;
  labName?: string;
  results: BloodWorkResult[];
  notes?: string;
}

export interface FitnessGoal {
  id: string;
  type: 'physique' | 'strength' | 'endurance' | 'weight' | 'custom';
  title: string;
  description?: string;
  targetDate?: string;
  status: 'active' | 'completed' | 'paused';
  exercise?: string;
  targetValue?: number;
  targetUnit?: string;
  currentValue?: number;
  targetWeightKg?: number;
  targetBodyFatPercent?: number;
  progressPercent: number;
}

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'abs' | 'quads' | 'hamstrings' | 'glutes'
  | 'calves' | 'traps' | 'lats' | 'lower_back' | 'hip_flexors' | 'full_body' | 'cardio';

export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'band' | 'other';

export interface Exercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'plyometric' | 'bodyweight';
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  instructions?: string;
}

export interface WorkoutSet {
  setNumber: number;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
  rpe?: number;
  isWarmup?: boolean;
  completed: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
  order: number;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  durationMinutes?: number;
  exercises: WorkoutExercise[];
  isCompleted: boolean;
  programId?: string;
}

export interface MacroTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface FoodEntry {
  name: string;
  servingSize: number;
  servingUnit: string;
  quantity: number;
  macros: MacroTotals;
}

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  name?: string;
  foods: FoodEntry[];
  totals: MacroTotals;
}

export interface RecipeIngredient {
  foodItem: string;
  amount: number;
  unit: string;
  notes?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  ingredients: RecipeIngredient[];
  instructions: string[];
  macrosPerServing: MacroTotals;
  isAiGenerated: boolean;
}

export interface FridgeItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  expiryDate?: string;
  category?: 'protein' | 'dairy' | 'vegetable' | 'fruit' | 'grain' | 'condiment' | 'other';
}

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
  mealType?: string;
  maxPrepTimeMinutes?: number;
  preferences?: string;
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
  dayName: string;
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

export interface MealPlan {
  id: string;
  name: string;
  dailyTargets: MacroTotals;
  days: MealPlanDay[];
  createdAt: string;
  isAiGenerated: boolean;
}

export interface MealPlanDay {
  dayIndex: number;
  meals: Meal[];
  totals: MacroTotals;
}

export interface NutritionDay {
  id: string;
  date: string;
  meals: Meal[];
  waterMl: number;
  totals: MacroTotals;
  targets: MacroTotals;
}

export type AIProvider = 'anthropic' | 'openai' | 'grok';
