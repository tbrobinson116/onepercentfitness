import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import type { FitnessGoal } from '../types/index.js';

const router = Router();

const goals = new Map<string, FitnessGoal>();

router.get('/', (_req, res) => {
  res.json(Array.from(goals.values()));
});

router.post('/', (req, res) => {
  const goal: FitnessGoal = {
    ...req.body,
    id: req.body.id ?? uuid(),
    progressPercent: req.body.progressPercent ?? 0,
    status: req.body.status ?? 'active',
  };
  goals.set(goal.id, goal);
  res.status(201).json(goal);
});

router.get('/:id', (req, res) => {
  const goal = goals.get(req.params.id);
  if (!goal) { res.status(404).json({ error: 'Goal not found' }); return; }
  res.json(goal);
});

router.put('/:id', (req, res) => {
  const existing = goals.get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Goal not found' }); return; }
  const updated = { ...existing, ...req.body, id: existing.id };
  goals.set(existing.id, updated);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  if (!goals.has(req.params.id)) { res.status(404).json({ error: 'Not found' }); return; }
  goals.delete(req.params.id);
  res.status(204).send();
});

export default router;
