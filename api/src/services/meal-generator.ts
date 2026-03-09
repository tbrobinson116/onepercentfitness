import { v4 as uuid } from 'uuid';
import { getAIClient } from './ai/index.js';
import type {
  GenerateMealPlanRequest,
  GenerateRecipeRequest,
  MealPlan,
  Recipe,
} from '../types/index.js';

const NUTRITION_SYSTEM_PROMPT = `You are an expert sports nutritionist and chef. You create detailed, macro-optimized meal plans and recipes tailored to fitness goals.

Your meal plans should:
- Hit macro targets (calories, protein, carbs, fat)
- Include realistic, delicious meals that people actually want to eat
- Account for dietary restrictions and preferences
- Use ingredients the user has available when specified
- Provide exact quantities and macro breakdowns per meal

Respond ONLY with valid JSON matching the requested schema. No markdown, no explanation.`;

export async function generateMealPlan(
  request: GenerateMealPlanRequest
): Promise<MealPlan> {
  const ai = getAIClient();

  const userPrompt = buildMealPlanPrompt(request);

  const response = await ai.generate({
    messages: [
      { role: 'system', content: NUTRITION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    maxTokens: 8192,
    temperature: 0.7,
  });

  const parsed = JSON.parse(response);

  return {
    id: uuid(),
    name: parsed.name,
    dailyTargets: parsed.dailyTargets,
    days: parsed.days.map((day: Record<string, unknown>, i: number) => ({
      dayIndex: i,
      meals: (day.meals as Record<string, unknown>[]).map((meal: Record<string, unknown>) => ({
        id: uuid(),
        type: meal.type,
        name: meal.name,
        foods: (meal.foods as Record<string, unknown>[]).map((food: Record<string, unknown>) => ({
          name: food.name,
          servingSize: food.servingSize,
          servingUnit: food.servingUnit,
          quantity: food.quantity,
          macros: food.macros,
        })),
        totals: meal.totals,
      })),
      totals: day.totals,
    })),
    createdAt: new Date().toISOString(),
    isAiGenerated: true,
  };
}

export async function generateRecipeFromFridge(
  request: GenerateRecipeRequest
): Promise<Recipe> {
  const ai = getAIClient();

  const fridgeList = request.fridgeItems
    .map(item => `${item.name}${item.quantity ? ` (${item.quantity} ${item.unit ?? ''})` : ''}`)
    .join(', ');

  let prompt = `Create a recipe using these ingredients from my fridge: ${fridgeList}`;

  if (request.macroTargets) {
    prompt += `\n\nTarget macros per serving:`;
    if (request.macroTargets.calories) prompt += `\n- Calories: ~${request.macroTargets.calories}`;
    if (request.macroTargets.proteinG) prompt += `\n- Protein: ~${request.macroTargets.proteinG}g`;
    if (request.macroTargets.carbsG) prompt += `\n- Carbs: ~${request.macroTargets.carbsG}g`;
    if (request.macroTargets.fatG) prompt += `\n- Fat: ~${request.macroTargets.fatG}g`;
  }

  if (request.dietaryRestrictions?.length) {
    prompt += `\n\nDietary restrictions: ${request.dietaryRestrictions.join(', ')}`;
  }

  if (request.mealType) {
    prompt += `\n\nThis is for: ${request.mealType}`;
  }

  if (request.maxPrepTimeMinutes) {
    prompt += `\nMax prep + cook time: ${request.maxPrepTimeMinutes} minutes`;
  }

  if (request.preferences) {
    prompt += `\nPreferences: ${request.preferences}`;
  }

  prompt += `

Respond with JSON in this format:
{
  "name": "Recipe Name",
  "description": "Brief description",
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 20,
  "servings": 2,
  "difficulty": "easy",
  "tags": ["high-protein", "quick"],
  "ingredients": [
    { "foodItem": "chicken breast", "amount": 200, "unit": "g", "notes": "diced" }
  ],
  "instructions": [
    "Step 1...",
    "Step 2..."
  ],
  "macrosPerServing": {
    "calories": 450,
    "proteinG": 40,
    "carbsG": 30,
    "fatG": 15,
    "fiberG": 5
  }
}`;

  const response = await ai.generate({
    messages: [
      { role: 'system', content: NUTRITION_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    maxTokens: 4096,
    temperature: 0.7,
  });

  const parsed = JSON.parse(response);

  return {
    id: uuid(),
    ...parsed,
    isAiGenerated: true,
  };
}

function buildMealPlanPrompt(request: GenerateMealPlanRequest): string {
  let prompt = `Create a daily meal plan with these parameters:

**Goals:** ${request.goals.map(g => g.title).join(', ')}
**Meals per day:** ${request.mealsPerDay}`;

  if (request.dailyCalorieTarget) {
    prompt += `\n**Daily calorie target:** ${request.dailyCalorieTarget} kcal`;
  }

  if (request.dailyProteinTarget) {
    prompt += `\n**Daily protein target:** ${request.dailyProteinTarget}g`;
  }

  if (request.measurements?.weightKg) {
    prompt += `\n**Current weight:** ${request.measurements.weightKg}kg`;
  }

  if (request.dietaryRestrictions?.length) {
    prompt += `\n**Dietary restrictions:** ${request.dietaryRestrictions.join(', ')}`;
  }

  if (request.fridgeItems?.length) {
    const items = request.fridgeItems.map(i => i.name).join(', ');
    prompt += `\n**Available ingredients:** ${items}`;
  }

  if (request.preferences) {
    prompt += `\n**Preferences:** ${request.preferences}`;
  }

  prompt += `

Respond with JSON:
{
  "name": "Meal Plan Name",
  "dailyTargets": { "calories": 2500, "proteinG": 180, "carbsG": 250, "fatG": 80, "fiberG": 30 },
  "days": [
    {
      "meals": [
        {
          "type": "breakfast",
          "name": "Meal name",
          "foods": [
            { "name": "eggs", "servingSize": 1, "servingUnit": "large", "quantity": 3, "macros": { "calories": 210, "proteinG": 18, "carbsG": 1, "fatG": 15, "fiberG": 0 } }
          ],
          "totals": { "calories": 500, "proteinG": 40, "carbsG": 30, "fatG": 20, "fiberG": 5 }
        }
      ],
      "totals": { "calories": 2500, "proteinG": 180, "carbsG": 250, "fatG": 80, "fiberG": 30 }
    }
  ]
}`;

  return prompt;
}
