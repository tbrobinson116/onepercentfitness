import { create } from 'zustand';
import type {
  UserProfile,
  BodyMeasurement,
  BloodWork,
  FitnessGoal,
  Workout,
  WorkoutProgram,
  NutritionDay,
  Recipe,
  FridgeItem,
  MacroTotals,
  WeightUnit,
} from '../types';

interface AppState {
  // Profile
  profile: UserProfile | null;
  measurements: BodyMeasurement[];
  bloodWork: BloodWork[];
  setProfile: (profile: UserProfile) => void;
  addMeasurement: (m: BodyMeasurement) => void;
  setMeasurements: (m: BodyMeasurement[]) => void;
  addBloodWork: (b: BloodWork) => void;
  setBloodWork: (b: BloodWork[]) => void;

  // Goals
  goals: FitnessGoal[];
  setGoals: (goals: FitnessGoal[]) => void;
  addGoal: (goal: FitnessGoal) => void;
  updateGoal: (id: string, updates: Partial<FitnessGoal>) => void;
  removeGoal: (id: string) => void;

  // Workouts
  workouts: Workout[];
  activeWorkout: Workout | null;
  programs: WorkoutProgram[];
  setWorkouts: (w: Workout[]) => void;
  addWorkout: (w: Workout) => void;
  setActiveWorkout: (w: Workout | null) => void;
  updateActiveWorkout: (updates: Partial<Workout>) => void;
  setPrograms: (p: WorkoutProgram[]) => void;
  addProgram: (p: WorkoutProgram) => void;

  // Nutrition
  todayNutrition: NutritionDay | null;
  macroTargets: MacroTotals;
  recipes: Recipe[];
  fridgeItems: FridgeItem[];
  setTodayNutrition: (n: NutritionDay) => void;
  setMacroTargets: (t: MacroTotals) => void;
  setRecipes: (r: Recipe[]) => void;
  addRecipe: (r: Recipe) => void;
  setFridgeItems: (items: FridgeItem[]) => void;
  addFridgeItem: (item: FridgeItem) => void;
  removeFridgeItem: (id: string) => void;

  // Settings
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;

  // UI State
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  // Profile
  profile: null,
  measurements: [],
  bloodWork: [],
  setProfile: (profile) => set({ profile }),
  addMeasurement: (m) => set((s) => ({ measurements: [m, ...s.measurements] })),
  setMeasurements: (measurements) => set({ measurements }),
  addBloodWork: (b) => set((s) => ({ bloodWork: [b, ...s.bloodWork] })),
  setBloodWork: (bloodWork) => set({ bloodWork }),

  // Goals
  goals: [],
  setGoals: (goals) => set({ goals }),
  addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),
  updateGoal: (id, updates) =>
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),
  removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

  // Workouts
  workouts: [],
  activeWorkout: null,
  programs: [],
  setWorkouts: (workouts) => set({ workouts }),
  addWorkout: (w) => set((s) => ({ workouts: [w, ...s.workouts] })),
  setActiveWorkout: (activeWorkout) => set({ activeWorkout }),
  updateActiveWorkout: (updates) =>
    set((s) => ({
      activeWorkout: s.activeWorkout ? { ...s.activeWorkout, ...updates } : null,
    })),
  setPrograms: (programs) => set({ programs }),
  addProgram: (p) => set((s) => ({ programs: [p, ...s.programs] })),

  // Nutrition
  todayNutrition: null,
  macroTargets: { calories: 2500, proteinG: 180, carbsG: 250, fatG: 80, fiberG: 30 },
  recipes: [],
  fridgeItems: [],
  setTodayNutrition: (todayNutrition) => set({ todayNutrition }),
  setMacroTargets: (macroTargets) => set({ macroTargets }),
  setRecipes: (recipes) => set({ recipes }),
  addRecipe: (r) => set((s) => ({ recipes: [r, ...s.recipes] })),
  setFridgeItems: (fridgeItems) => set({ fridgeItems }),
  addFridgeItem: (item) => set((s) => ({ fridgeItems: [...s.fridgeItems, item] })),
  removeFridgeItem: (id) =>
    set((s) => ({ fridgeItems: s.fridgeItems.filter((i) => i.id !== id) })),

  // Settings
  weightUnit: 'lbs' as WeightUnit,
  setWeightUnit: (weightUnit) => set({ weightUnit }),

  // UI
  isLoading: false,
  error: null,
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
