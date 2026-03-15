import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  ProgressPhoto,
} from '../types';

// --- Onboarding types ---
export type FitnessGoalType = 'build_muscle' | 'get_stronger' | 'lose_weight' | 'get_lean' | 'improve_endurance' | 'general_fitness';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type SplitPreference = 'ai_decides' | 'full_body' | 'upper_lower' | 'push_pull_legs';

export interface OnboardingData {
  fitnessGoal: FitnessGoalType | null;
  gender: 'male' | 'female' | 'other' | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  experience: ExperienceLevel | null;
  equipment: string[];
  daysPerWeek: number;
  sessionMinutes: number;
  splitPreference: SplitPreference;
}

export interface EstimatedWeights {
  [exerciseName: string]: number; // weight in lbs
}

interface AppState {
  // Onboarding
  isOnboarded: boolean;
  onboardingData: OnboardingData;
  estimatedWeights: EstimatedWeights;
  setOnboarded: (v: boolean) => void;
  setOnboardingData: (data: Partial<OnboardingData>) => void;
  setEstimatedWeights: (w: EstimatedWeights) => void;

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

  // Program progress — tracks which day index to do next per program
  programProgress: Record<string, number>; // programId → next day index
  advanceProgramDay: (programId: string, totalDays: number) => void;
  setProgramProgress: (progress: Record<string, number>) => void;

  // Workout history (for progressive overload)
  workoutHistory: Workout[];
  addToHistory: (w: Workout) => void;
  setWorkoutHistory: (w: Workout[]) => void;

  // Progress photos
  progressPhotos: ProgressPhoto[];
  addProgressPhoto: (p: ProgressPhoto) => void;
  removeProgressPhoto: (id: string) => void;
  setProgressPhotos: (p: ProgressPhoto[]) => void;

  // Settings
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // UI State (not persisted)
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const DEFAULT_ONBOARDING: OnboardingData = {
  fitnessGoal: null,
  gender: null,
  age: null,
  heightCm: null,
  weightKg: null,
  experience: null,
  equipment: [],
  daysPerWeek: 4,
  sessionMinutes: 60,
  splitPreference: 'ai_decides',
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Onboarding
      isOnboarded: false,
      onboardingData: DEFAULT_ONBOARDING,
      estimatedWeights: {},
      setOnboarded: (isOnboarded) => set({ isOnboarded }),
      setOnboardingData: (data) =>
        set((s) => ({ onboardingData: { ...s.onboardingData, ...data } })),
      setEstimatedWeights: (estimatedWeights) => set({ estimatedWeights }),

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

      // Program progress
      programProgress: {},
      advanceProgramDay: (programId, totalDays) =>
        set((s) => ({
          programProgress: {
            ...s.programProgress,
            [programId]: ((s.programProgress[programId] ?? 0) + 1) % totalDays,
          },
        })),
      setProgramProgress: (programProgress) => set({ programProgress }),

      // Workout history
      workoutHistory: [],
      addToHistory: (w) =>
        set((s) => ({ workoutHistory: [w, ...s.workoutHistory].slice(0, 200) })),
      setWorkoutHistory: (workoutHistory) => set({ workoutHistory }),

      // Progress photos
      progressPhotos: [],
      addProgressPhoto: (p) =>
        set((s) => ({ progressPhotos: [p, ...s.progressPhotos] })),
      removeProgressPhoto: (id) =>
        set((s) => ({ progressPhotos: s.progressPhotos.filter((p) => p.id !== id) })),
      setProgressPhotos: (progressPhotos) => set({ progressPhotos }),

      // Settings
      weightUnit: 'lbs' as WeightUnit,
      setWeightUnit: (weightUnit) => set({ weightUnit }),

      // Hydration
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      // UI
      isLoading: false,
      error: null,
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'onepercent-fitness-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist transient UI state
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        onboardingData: state.onboardingData,
        estimatedWeights: state.estimatedWeights,
        profile: state.profile,
        measurements: state.measurements,
        bloodWork: state.bloodWork,
        goals: state.goals,
        workouts: state.workouts,
        programs: state.programs,
        macroTargets: state.macroTargets,
        recipes: state.recipes,
        fridgeItems: state.fridgeItems,
        programProgress: state.programProgress,
        workoutHistory: state.workoutHistory,
        progressPhotos: state.progressPhotos,
        weightUnit: state.weightUnit,
      }),
      // Don't persist isOnboarded — always start fresh for now
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as object),
        isOnboarded: false,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('[Store] Rehydration error:', error);
        }
        // Always mark hydrated, even on error
        useStore.getState().setHasHydrated(true);
      },
    }
  )
);
