import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { generateWorkoutProgram } from '../services/workout-generator.js';
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
    const program = await generateWorkoutProgram(input as Parameters<typeof generateWorkoutProgram>[0]);
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

export default router;
