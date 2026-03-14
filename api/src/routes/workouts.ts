import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { generateWorkoutProgram } from '../services/workout-generator.js';
import { generateLocalProgram } from '../services/local-program-generator.js';
import type { Workout, WorkoutProgram } from '../types/index.js';

const router = Router();

// In-memory storage (swap for DB later)
const workouts = new Map<string, Workout>();
const programs = new Map<string, WorkoutProgram>();

// --- Workout Programs (AI-generated) ---

const generateProgramSchema = z.object({
  goals: z.array(z.object({
    id: z.string(),
    type: z.enum(['physique', 'strength', 'endurance', 'weight', 'custom']),
    title: z.string(),
    description: z.string().optional(),
    targetValue: z.number().optional(),
    targetUnit: z.string().optional(),
    currentValue: z.number().optional(),
    status: z.enum(['active', 'completed', 'paused']),
    progressPercent: z.number(),
  })),
  measurements: z.object({
    weightKg: z.number().optional(),
    bodyFatPercent: z.number().optional(),
  }).optional(),
  bloodWork: z.object({
    id: z.string(),
    date: z.string(),
    results: z.array(z.object({
      marker: z.string(),
      value: z.number(),
      unit: z.string(),
      status: z.enum(['low', 'normal', 'high']).optional(),
    })),
  }).optional(),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.number().min(1).max(7),
  sessionDurationMinutes: z.number().min(20).max(180),
  availableEquipment: z.array(z.string()),
  injuries: z.array(z.string()).optional(),
  preferences: z.string().optional(),
});

router.post('/programs/generate', async (req, res) => {
  try {
    const input = generateProgramSchema.parse(req.body);
    let program: WorkoutProgram;

    try {
      // Try AI generation first
      program = await generateWorkoutProgram(input as Parameters<typeof generateWorkoutProgram>[0]);
    } catch (aiError) {
      // Fall back to local smart generator
      console.log('AI unavailable, using local program generator');
      program = generateLocalProgram(input as Parameters<typeof generateLocalProgram>[0]);
    }

    programs.set(program.id, program);
    res.json(program);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    console.error('Error generating program:', error);
    res.status(500).json({ error: 'Failed to generate workout program' });
  }
});

router.get('/programs', (_req, res) => {
  res.json(Array.from(programs.values()));
});

router.get('/programs/:id', (req, res) => {
  const program = programs.get(req.params.id);
  if (!program) { res.status(404).json({ error: 'Program not found' }); return; }
  res.json(program);
});

// --- Workout Logging ---

router.post('/', (req, res) => {
  const workout: Workout = {
    ...req.body,
    id: req.body.id ?? uuid(),
  };
  workouts.set(workout.id, workout);
  res.status(201).json(workout);
});

router.get('/', (_req, res) => {
  const all = Array.from(workouts.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(all);
});

router.get('/:id', (req, res) => {
  const workout = workouts.get(req.params.id);
  if (!workout) { res.status(404).json({ error: 'Workout not found' }); return; }
  res.json(workout);
});

router.put('/:id', (req, res) => {
  const existing = workouts.get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Workout not found' }); return; }
  const updated = { ...existing, ...req.body, id: existing.id };
  workouts.set(existing.id, updated);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  if (!workouts.has(req.params.id)) { res.status(404).json({ error: 'Not found' }); return; }
  workouts.delete(req.params.id);
  res.status(204).send();
});

// --- Analytics ---

router.get('/analytics/summary', (_req, res) => {
  const all = Array.from(workouts.values());

  if (all.length === 0) {
    res.json({
      totalWorkouts: 0,
      totalSets: 0,
      totalReps: 0,
      totalVolumeKg: 0,
      averageDurationMinutes: 0,
      workoutsPerWeek: 0,
      streakDays: 0,
      muscleGroupFrequency: {},
    });
    return;
  }

  let totalSets = 0;
  let totalReps = 0;
  let totalVolumeKg = 0;
  let totalDuration = 0;
  const muscleGroupFrequency: Record<string, number> = {};

  for (const workout of all) {
    totalDuration += workout.durationMinutes ?? 0;
    for (const ex of workout.exercises) {
      // Count muscle group frequency
      const primary = ex.exercise?.primaryMuscle;
      if (primary) {
        muscleGroupFrequency[primary] = (muscleGroupFrequency[primary] || 0) + 1;
      }
      if (ex.exercise?.secondaryMuscles) {
        for (const sec of ex.exercise.secondaryMuscles) {
          muscleGroupFrequency[sec] = (muscleGroupFrequency[sec] || 0) + 1;
        }
      }

      for (const set of ex.sets) {
        if (set.isWarmup) continue;
        totalSets++;
        const reps = set.reps ?? 0;
        const weight = set.weightKg ?? 0;
        totalReps += reps;
        totalVolumeKg += weight * reps;
      }
    }
  }

  // Workouts per week over last 4 weeks
  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const recentCount = all.filter(w => new Date(w.date) >= fourWeeksAgo).length;
  const workoutsPerWeek = Math.round((recentCount / 4) * 10) / 10;

  // Streak: consecutive days with workouts ending at today or most recent workout day
  const workoutDates = new Set(
    all.map(w => new Date(w.date).toISOString().slice(0, 10))
  );
  let streakDays = 0;
  const checkDate = new Date(now);
  // Start from today and walk backwards
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (workoutDates.has(dateStr)) {
      streakDays++;
    } else if (i === 0) {
      // If no workout today, don't break yet — check yesterday
    } else {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const averageDurationMinutes =
    all.length > 0 ? Math.round(totalDuration / all.length) : 0;

  res.json({
    totalWorkouts: all.length,
    totalSets,
    totalReps,
    totalVolumeKg: Math.round(totalVolumeKg * 100) / 100,
    averageDurationMinutes,
    workoutsPerWeek,
    streakDays,
    muscleGroupFrequency,
  });
});

router.get('/analytics/exercise/:exerciseId', (req, res) => {
  const { exerciseId } = req.params;
  const all = Array.from(workouts.values());

  const history: Array<{
    date: string;
    sets: Array<{ weight: number; reps: number; volume: number }>;
    estimatedOneRepMax: number;
    totalVolume: number;
  }> = [];

  for (const workout of all) {
    for (const ex of workout.exercises) {
      if (ex.exerciseId !== exerciseId) continue;

      const sets: Array<{ weight: number; reps: number; volume: number }> = [];
      let totalVolume = 0;
      let bestE1RM = 0;

      for (const set of ex.sets) {
        if (set.isWarmup) continue;
        const weight = set.weightKg ?? 0;
        const reps = set.reps ?? 0;
        const volume = weight * reps;
        sets.push({ weight, reps, volume });
        totalVolume += volume;

        // Epley formula: weight * (1 + reps / 30)
        if (weight > 0 && reps > 0) {
          const e1rm = weight * (1 + reps / 30);
          if (e1rm > bestE1RM) bestE1RM = e1rm;
        }
      }

      if (sets.length > 0) {
        history.push({
          date: workout.date,
          sets,
          estimatedOneRepMax: Math.round(bestE1RM * 100) / 100,
          totalVolume: Math.round(totalVolume * 100) / 100,
        });
      }
    }
  }

  // Sort ascending by date for charting
  history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  res.json(history);
});

router.get('/analytics/progressive-overload', (_req, res) => {
  const all = Array.from(workouts.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group workout exercises by exerciseId
  const exerciseHistory = new Map<
    string,
    Array<{
      date: string;
      exerciseName: string;
      sets: Array<{ weightKg: number; reps: number }>;
    }>
  >();

  for (const workout of all) {
    for (const ex of workout.exercises) {
      const entries = exerciseHistory.get(ex.exerciseId) ?? [];
      const workingSets = ex.sets
        .filter(s => !s.isWarmup)
        .map(s => ({ weightKg: s.weightKg ?? 0, reps: s.reps ?? 0 }));
      if (workingSets.length > 0) {
        entries.push({
          date: workout.date,
          exerciseName: ex.exercise?.name ?? ex.exerciseId,
          sets: workingSets,
        });
        exerciseHistory.set(ex.exerciseId, entries);
      }
    }
  }

  const suggestions: Array<{
    exerciseId: string;
    exerciseName: string;
    lastWeight: number;
    lastReps: number;
    suggestedWeight: number;
    suggestedReps: number;
    progressType: 'weight' | 'reps' | 'sets';
    message: string;
  }> = [];

  for (const [exerciseId, entries] of exerciseHistory) {
    if (entries.length < 3) continue;

    const last = entries[entries.length - 1];
    const previous = entries[entries.length - 2];

    // Use the heaviest working set for comparison
    const lastBest = last.sets.reduce(
      (best, s) => (s.weightKg * s.reps > best.weightKg * best.reps ? s : best),
      last.sets[0]
    );
    const prevBest = previous.sets.reduce(
      (best, s) => (s.weightKg * s.reps > best.weightKg * best.reps ? s : best),
      previous.sets[0]
    );

    let suggestedWeight = lastBest.weightKg;
    let suggestedReps = lastBest.reps;
    let progressType: 'weight' | 'reps' | 'sets' = 'weight';
    let message = '';

    if (lastBest.reps >= 12) {
      // Hit high reps — suggest increasing weight
      suggestedWeight = Math.round((lastBest.weightKg * 1.05) * 100) / 100;
      suggestedReps = Math.max(6, lastBest.reps - 2);
      progressType = 'weight';
      message = `You hit ${lastBest.reps} reps at ${lastBest.weightKg}kg. Try increasing to ${suggestedWeight}kg for ${suggestedReps} reps.`;
    } else if (lastBest.reps < 6) {
      // Low reps — suggest increasing reps at same weight
      suggestedReps = lastBest.reps + 1;
      progressType = 'reps';
      message = `You're at ${lastBest.reps} reps at ${lastBest.weightKg}kg. Try adding 1 rep to reach ${suggestedReps} reps before increasing weight.`;
    } else if (lastBest.weightKg === prevBest.weightKg && lastBest.reps === prevBest.reps) {
      // Stalled — suggest adding a set
      progressType = 'sets';
      suggestedReps = lastBest.reps;
      message = `You've plateaued at ${lastBest.weightKg}kg x ${lastBest.reps}. Try adding an extra set to increase total volume.`;
    } else {
      // Normal progression — small weight increase
      suggestedWeight = Math.round((lastBest.weightKg + 2.5) * 100) / 100;
      suggestedReps = lastBest.reps;
      progressType = 'weight';
      message = `Good progress! Try ${suggestedWeight}kg for ${suggestedReps} reps next session.`;
    }

    suggestions.push({
      exerciseId,
      exerciseName: last.exerciseName,
      lastWeight: lastBest.weightKg,
      lastReps: lastBest.reps,
      suggestedWeight,
      suggestedReps,
      progressType,
      message,
    });
  }

  res.json(suggestions);
});

export default router;
