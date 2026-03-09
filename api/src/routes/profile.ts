import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import type { BodyMeasurement, BloodWork } from '../types/index.js';

const router = Router();

// In-memory storage
const measurements = new Map<string, BodyMeasurement>();
const bloodWorkRecords = new Map<string, BloodWork>();
let userProfile = {
  id: uuid(),
  name: 'User',
  heightCm: 175,
};

// --- Profile ---

router.get('/', (_req, res) => {
  res.json(userProfile);
});

router.put('/', (req, res) => {
  userProfile = { ...userProfile, ...req.body, id: userProfile.id };
  res.json(userProfile);
});

// --- Body Measurements ---

router.get('/measurements', (_req, res) => {
  const all = Array.from(measurements.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(all);
});

router.post('/measurements', (req, res) => {
  const measurement: BodyMeasurement = {
    ...req.body,
    id: req.body.id ?? uuid(),
    date: req.body.date ?? new Date().toISOString().split('T')[0],
  };
  measurements.set(measurement.id, measurement);
  res.status(201).json(measurement);
});

router.get('/measurements/:id', (req, res) => {
  const m = measurements.get(req.params.id);
  if (!m) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(m);
});

router.delete('/measurements/:id', (req, res) => {
  if (!measurements.has(req.params.id)) { res.status(404).json({ error: 'Not found' }); return; }
  measurements.delete(req.params.id);
  res.status(204).send();
});

// --- Blood Work ---

router.get('/blood-work', (_req, res) => {
  const all = Array.from(bloodWorkRecords.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(all);
});

router.post('/blood-work', (req, res) => {
  const record: BloodWork = {
    ...req.body,
    id: req.body.id ?? uuid(),
    date: req.body.date ?? new Date().toISOString().split('T')[0],
  };
  bloodWorkRecords.set(record.id, record);
  res.status(201).json(record);
});

router.get('/blood-work/:id', (req, res) => {
  const record = bloodWorkRecords.get(req.params.id);
  if (!record) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(record);
});

router.delete('/blood-work/:id', (req, res) => {
  if (!bloodWorkRecords.has(req.params.id)) { res.status(404).json({ error: 'Not found' }); return; }
  bloodWorkRecords.delete(req.params.id);
  res.status(204).send();
});

export default router;
