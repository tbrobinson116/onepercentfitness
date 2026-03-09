import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { generateMealPlan, generateRecipeFromFridge } from '../services/meal-generator.js';
import type { NutritionDay, Recipe, FridgeItem, MealPlan } from '../types/index.js';

const router = Router();

// In-memory storage
const nutritionDays = new Map<string, NutritionDay>();
const recipes = new Map<string, Recipe>();
const fridgeItems = new Map<string, FridgeItem>();
const mealPlans = new Map<string, MealPlan>();

// --- Nutrition Day Logging ---

router.post('/log', (req, res) => {
  const day: NutritionDay = {
    ...req.body,
    id: req.body.id ?? uuid(),
  };
  nutritionDays.set(day.date, day);
  res.status(201).json(day);
});

router.get('/log/:date', (req, res) => {
  const day = nutritionDays.get(req.params.date);
  if (!day) {
    // Return empty day template
    res.json({
      id: uuid(),
      date: req.params.date,
      meals: [],
      waterMl: 0,
      totals: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
      targets: { calories: 2500, proteinG: 180, carbsG: 250, fatG: 80, fiberG: 30 },
    });
    return;
  }
  res.json(day);
});

router.get('/log', (_req, res) => {
  const all = Array.from(nutritionDays.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(all);
});

// --- Meal Plans (AI-generated) ---

const generateMealPlanSchema = z.object({
  goals: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    status: z.string(),
    progressPercent: z.number(),
  })),
  measurements: z.object({
    weightKg: z.number().optional(),
    bodyFatPercent: z.number().optional(),
  }).optional(),
  dailyCalorieTarget: z.number().optional(),
  dailyProteinTarget: z.number().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  fridgeItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
  })).optional(),
  mealsPerDay: z.number().min(1).max(8),
  preferences: z.string().optional(),
});

router.post('/meal-plans/generate', async (req, res) => {
  try {
    const input = generateMealPlanSchema.parse(req.body);
    const plan = await generateMealPlan(input as Parameters<typeof generateMealPlan>[0]);
    mealPlans.set(plan.id, plan);
    res.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    console.error('Error generating meal plan:', error);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
});

router.get('/meal-plans', (_req, res) => {
  res.json(Array.from(mealPlans.values()));
});

// --- Recipes ---

const generateRecipeSchema = z.object({
  fridgeItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
  })),
  macroTargets: z.object({
    calories: z.number().optional(),
    proteinG: z.number().optional(),
    carbsG: z.number().optional(),
    fatG: z.number().optional(),
  }).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  mealType: z.string().optional(),
  maxPrepTimeMinutes: z.number().optional(),
  preferences: z.string().optional(),
});

router.post('/recipes/generate', async (req, res) => {
  try {
    const input = generateRecipeSchema.parse(req.body);
    const recipe = await generateRecipeFromFridge(input as Parameters<typeof generateRecipeFromFridge>[0]);
    recipes.set(recipe.id, recipe);
    res.json(recipe);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
      return;
    }
    console.error('Error generating recipe:', error);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
});

router.get('/recipes', (_req, res) => {
  res.json(Array.from(recipes.values()));
});

router.get('/recipes/:id', (req, res) => {
  const recipe = recipes.get(req.params.id);
  if (!recipe) { res.status(404).json({ error: 'Recipe not found' }); return; }
  res.json(recipe);
});

// --- Fridge Manager ---

router.get('/fridge', (_req, res) => {
  res.json(Array.from(fridgeItems.values()));
});

router.post('/fridge', (req, res) => {
  const item: FridgeItem = {
    ...req.body,
    id: req.body.id ?? uuid(),
  };
  fridgeItems.set(item.id, item);
  res.status(201).json(item);
});

router.delete('/fridge/:id', (req, res) => {
  if (!fridgeItems.has(req.params.id)) { res.status(404).json({ error: 'Not found' }); return; }
  fridgeItems.delete(req.params.id);
  res.status(204).send();
});

router.put('/fridge/:id', (req, res) => {
  const existing = fridgeItems.get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  const updated = { ...existing, ...req.body, id: existing.id };
  fridgeItems.set(existing.id, updated);
  res.json(updated);
});

export default router;

// Re-export NutritionDay type for the index
export type { NutritionDay };
