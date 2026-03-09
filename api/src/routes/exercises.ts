import { Router } from 'express';
import { exerciseDatabase } from '../data/exercises.js';

const router = Router();

router.get('/', (req, res) => {
  let exercises = [...exerciseDatabase];

  const muscle = req.query.muscle as string | undefined;
  if (muscle) {
    exercises = exercises.filter(
      e => e.primaryMuscle === muscle || e.secondaryMuscles.includes(muscle as never)
    );
  }

  const equipment = req.query.equipment as string | undefined;
  if (equipment) {
    exercises = exercises.filter(e => e.equipment === equipment);
  }

  const type = req.query.type as string | undefined;
  if (type) {
    exercises = exercises.filter(e => e.type === type);
  }

  const search = req.query.search as string | undefined;
  if (search) {
    const lower = search.toLowerCase();
    exercises = exercises.filter(e => e.name.toLowerCase().includes(lower));
  }

  res.json(exercises);
});

router.get('/:id', (req, res) => {
  const exercise = exerciseDatabase.find(e => e.id === req.params.id);
  if (!exercise) { res.status(404).json({ error: 'Exercise not found' }); return; }
  res.json(exercise);
});

export default router;
