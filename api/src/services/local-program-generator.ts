import { v4 as uuid } from 'uuid';
import type { GenerateWorkoutRequest, WorkoutProgram, ProgramWorkout, ProgramExercise, Exercise, MuscleGroup, Equipment } from '../types/index.js';
import { exerciseDatabase } from '../data/exercises.js';

// Split templates based on days per week
type SplitDay = { name: string; muscles: MuscleGroup[] };

const SPLITS: Record<number, SplitDay[]> = {
  2: [
    { name: 'Day 1 - Upper Body', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'lats'] },
    { name: 'Day 2 - Lower Body & Core', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'] },
  ],
  3: [
    { name: 'Day 1 - Push', muscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Day 2 - Pull', muscles: ['back', 'lats', 'biceps', 'traps'] },
    { name: 'Day 3 - Legs & Core', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'] },
  ],
  4: [
    { name: 'Day 1 - Upper Push', muscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Day 2 - Lower Body', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
    { name: 'Day 3 - Upper Pull', muscles: ['back', 'lats', 'biceps', 'traps'] },
    { name: 'Day 4 - Legs & Core', muscles: ['quads', 'glutes', 'hamstrings', 'abs'] },
  ],
  5: [
    { name: 'Day 1 - Chest & Triceps', muscles: ['chest', 'triceps'] },
    { name: 'Day 2 - Back & Biceps', muscles: ['back', 'lats', 'biceps', 'traps'] },
    { name: 'Day 3 - Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
    { name: 'Day 4 - Shoulders & Arms', muscles: ['shoulders', 'biceps', 'triceps'] },
    { name: 'Day 5 - Full Body & Core', muscles: ['chest', 'back', 'quads', 'glutes', 'abs'] },
  ],
  6: [
    { name: 'Day 1 - Push', muscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Day 2 - Pull', muscles: ['back', 'lats', 'biceps', 'traps'] },
    { name: 'Day 3 - Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
    { name: 'Day 4 - Push (Volume)', muscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Day 5 - Pull (Volume)', muscles: ['back', 'lats', 'biceps'] },
    { name: 'Day 6 - Legs & Core', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'] },
  ],
};

// Rep/set schemes by experience and goal
interface SetScheme { sets: number; repsMin: number; repsMax: number; restSeconds: number }

function getSetScheme(experience: string, isCompound: boolean, goalType?: string): SetScheme {
  if (goalType === 'strength') {
    return isCompound
      ? { sets: experience === 'beginner' ? 3 : 4, repsMin: 3, repsMax: 6, restSeconds: 180 }
      : { sets: 3, repsMin: 6, repsMax: 10, restSeconds: 120 };
  }
  // Default: hypertrophy
  if (isCompound) {
    return {
      sets: experience === 'beginner' ? 3 : 4,
      repsMin: experience === 'beginner' ? 8 : 6,
      repsMax: experience === 'beginner' ? 12 : 10,
      restSeconds: experience === 'beginner' ? 90 : 120,
    };
  }
  return {
    sets: 3,
    repsMin: 10,
    repsMax: 15,
    restSeconds: 60,
  };
}

const COMPOUND_EXERCISES = new Set([
  'Barbell Bench Press', 'Incline Dumbbell Press', 'Dumbbell Bench Press', 'Decline Barbell Press',
  'Barbell Deadlift', 'Barbell Bent-Over Row', 'Pull-Ups', 'T-Bar Row',
  'Overhead Press', 'Dumbbell Shoulder Press', 'Arnold Press',
  'Barbell Squat', 'Romanian Deadlift', 'Leg Press', 'Bulgarian Split Squat',
  'Hip Thrust', 'Close-Grip Bench Press', 'Dips', 'Goblet Squat',
]);

function getExercisesPerDay(durationMinutes: number, experience: string): number {
  // ~6-8 min per exercise (including rest)
  const base = Math.floor(durationMinutes / 7);
  if (experience === 'beginner') return Math.min(base, 5);
  if (experience === 'advanced') return Math.min(base, 8);
  return Math.min(base, 7);
}

function pickExercises(
  muscles: MuscleGroup[],
  equipment: Equipment[],
  count: number,
  injuries?: string[]
): Exercise[] {
  const available = exerciseDatabase.filter(e => {
    if (!equipment.includes(e.equipment)) return false;
    if (e.type === 'cardio') return false;
    // Check if exercise targets any of the day's muscles
    const targetsMuscle = muscles.includes(e.primaryMuscle) ||
      e.secondaryMuscles.some(m => muscles.includes(m));
    if (!targetsMuscle) return false;
    // Filter out exercises that might aggravate injuries
    if (injuries?.length) {
      const exName = e.name.toLowerCase();
      const exMuscle = e.primaryMuscle.toLowerCase();
      for (const injury of injuries) {
        const inj = injury.toLowerCase();
        if (inj.includes('shoulder') && (exMuscle === 'shoulders' || exName.includes('overhead') || exName.includes('press'))) {
          // Allow some pressing but skip overhead for shoulder issues
          if (exName.includes('overhead') || exName.includes('arnold')) return false;
        }
        if (inj.includes('knee') && (exName.includes('squat') || exName.includes('lunge'))) return false;
        if (inj.includes('back') && (exName.includes('deadlift') || exName.includes('row'))) return false;
      }
    }
    return true;
  });

  if (available.length === 0) return [];

  // Prioritize: compound first (for primary muscles), then isolation
  const compounds = available.filter(e =>
    COMPOUND_EXERCISES.has(e.name) && muscles.includes(e.primaryMuscle)
  );
  const isolations = available.filter(e =>
    !COMPOUND_EXERCISES.has(e.name) && muscles.includes(e.primaryMuscle)
  );

  const selected: Exercise[] = [];
  const usedIds = new Set<string>();

  // Pick compounds first
  for (const ex of shuffleArray(compounds)) {
    if (selected.length >= Math.ceil(count * 0.5)) break;
    if (!usedIds.has(ex.id)) {
      selected.push(ex);
      usedIds.add(ex.id);
    }
  }

  // Fill with isolations
  for (const ex of shuffleArray(isolations)) {
    if (selected.length >= count) break;
    if (!usedIds.has(ex.id)) {
      selected.push(ex);
      usedIds.add(ex.id);
    }
  }

  // If still short, pick from secondary muscle matches
  if (selected.length < count) {
    const secondary = available.filter(e => !usedIds.has(e.id));
    for (const ex of shuffleArray(secondary)) {
      if (selected.length >= count) break;
      selected.push(ex);
      usedIds.add(ex.id);
    }
  }

  return selected;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateProgramName(request: GenerateWorkoutRequest): string {
  const goalType = request.goals[0]?.type ?? 'custom';
  const days = request.daysPerWeek;

  const names: Record<string, string[]> = {
    strength: ['Strength Builder', 'Power Program', 'Strong Foundations'],
    physique: ['Physique Pro', 'Body Sculpt', 'Aesthetic Builder'],
    weight: ['Lean Machine', 'Fat Loss Focus', 'Body Recomp'],
    endurance: ['Endurance Edge', 'Stamina Builder', 'Athletic Performance'],
    custom: ['Custom Program', 'Personal Plan', 'Tailored Training'],
  };

  const nameList = names[goalType] ?? names.custom;
  const name = nameList[Math.floor(Math.random() * nameList.length)];
  return `${name} - ${days}x/week`;
}

export function generateLocalProgram(request: GenerateWorkoutRequest): WorkoutProgram {
  const days = Math.min(Math.max(request.daysPerWeek, 2), 6);
  const split = SPLITS[days];
  const exercisesPerDay = getExercisesPerDay(request.sessionDurationMinutes, request.experience);
  const goalType = request.goals[0]?.type;

  const workouts: ProgramWorkout[] = split.map((day, i) => {
    const exercises = pickExercises(
      day.muscles,
      request.availableEquipment as Equipment[],
      exercisesPerDay,
      request.injuries
    );

    const programExercises: ProgramExercise[] = exercises.map(ex => {
      const isCompound = COMPOUND_EXERCISES.has(ex.name);
      const scheme = getSetScheme(request.experience, isCompound, goalType);
      return {
        exerciseId: ex.id,
        exercise: ex,
        sets: scheme.sets,
        repsMin: scheme.repsMin,
        repsMax: scheme.repsMax,
        restSeconds: scheme.restSeconds,
        notes: isCompound ? 'Compound movement - focus on form' : undefined,
      };
    });

    return {
      dayIndex: i,
      dayName: day.name,
      muscleGroups: day.muscles,
      exercises: programExercises,
    };
  });

  const description = buildDescription(request);

  return {
    id: uuid(),
    name: generateProgramName(request),
    description,
    durationWeeks: 8,
    daysPerWeek: days,
    goal: request.goals[0]?.title ?? 'General fitness',
    difficulty: request.experience,
    workouts,
    createdAt: new Date().toISOString(),
    isAiGenerated: false,
  };
}

function buildDescription(request: GenerateWorkoutRequest): string {
  const parts = [];
  parts.push(`${request.daysPerWeek}-day ${request.experience} program`);
  parts.push(`${request.sessionDurationMinutes}-minute sessions`);
  if (request.goals.length > 0) {
    parts.push(`focused on ${request.goals.map(g => g.title).join(', ')}`);
  }
  if (request.injuries?.length) {
    parts.push(`modified for: ${request.injuries.join(', ')}`);
  }
  return parts.join('. ') + '.';
}
