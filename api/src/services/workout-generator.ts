import { v4 as uuid } from 'uuid';
import { getAIClient } from './ai/index.js';
import type { GenerateWorkoutRequest, WorkoutProgram } from '../types/index.js';
import { exerciseDatabase } from '../data/exercises.js';

const SYSTEM_PROMPT = `You are an expert personal trainer and exercise scientist. You create detailed, periodized workout programs tailored to individual goals, body composition, experience level, and available equipment.

Your programs should:
- Follow proven training principles (progressive overload, adequate volume, proper recovery)
- Account for the user's goals (strength, hypertrophy, endurance, weight loss)
- Consider any injuries or limitations
- Include appropriate warm-up sets
- Specify rep ranges, rest periods, and RPE targets
- Be realistic and sustainable

Respond ONLY with valid JSON matching the requested schema. No markdown, no explanation.`;

export async function generateWorkoutProgram(
  request: GenerateWorkoutRequest
): Promise<WorkoutProgram> {
  const ai = getAIClient();

  const exerciseList = exerciseDatabase
    .filter(e => request.availableEquipment.includes(e.equipment))
    .map(e => `${e.name} (${e.primaryMuscle}, ${e.equipment})`)
    .join('\n');

  const userPrompt = buildPrompt(request, exerciseList);

  const response = await ai.generate({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    maxTokens: 8192,
    temperature: 0.7,
  });

  const parsed = JSON.parse(response);

  return {
    id: uuid(),
    name: parsed.name,
    description: parsed.description,
    durationWeeks: parsed.durationWeeks ?? 8,
    daysPerWeek: request.daysPerWeek,
    goal: request.goals[0]?.title ?? 'General fitness',
    difficulty: request.experience,
    workouts: parsed.workouts.map((w: Record<string, unknown>, i: number) => ({
      dayIndex: i,
      dayName: w.dayName as string,
      muscleGroups: w.muscleGroups as string[],
      exercises: (w.exercises as Record<string, unknown>[]).map((ex: Record<string, unknown>) => {
        const matchedExercise = exerciseDatabase.find(
          e => e.name.toLowerCase() === (ex.name as string).toLowerCase()
        );
        return {
          exerciseId: matchedExercise?.id ?? uuid(),
          exercise: matchedExercise ?? {
            id: uuid(),
            name: ex.name as string,
            type: 'strength' as const,
            primaryMuscle: ex.primaryMuscle as string ?? 'chest',
            secondaryMuscles: [],
            equipment: ex.equipment as string ?? 'barbell',
          },
          sets: ex.sets as number,
          repsMin: ex.repsMin as number,
          repsMax: ex.repsMax as number,
          restSeconds: ex.restSeconds as number ?? 90,
          notes: ex.notes as string | undefined,
        };
      }),
    })),
    createdAt: new Date().toISOString(),
    isAiGenerated: true,
  };
}

function buildPrompt(request: GenerateWorkoutRequest, exerciseList: string): string {
  let prompt = `Create a workout program with these parameters:

**Goals:** ${request.goals.map(g => `${g.title} (${g.type})`).join(', ')}
**Experience:** ${request.experience}
**Days per week:** ${request.daysPerWeek}
**Session duration:** ${request.sessionDurationMinutes} minutes
**Available equipment:** ${request.availableEquipment.join(', ')}`;

  if (request.measurements) {
    prompt += `\n**Body stats:** ${request.measurements.weightKg ? `Weight: ${request.measurements.weightKg}kg` : ''} ${request.measurements.bodyFatPercent ? `BF%: ${request.measurements.bodyFatPercent}%` : ''}`;
  }

  if (request.injuries?.length) {
    prompt += `\n**Injuries/Limitations:** ${request.injuries.join(', ')}`;
  }

  if (request.preferences) {
    prompt += `\n**Preferences:** ${request.preferences}`;
  }

  if (request.bloodWork) {
    const flagged = request.bloodWork.results.filter(r => r.status !== 'normal');
    if (flagged.length) {
      prompt += `\n**Blood work concerns:** ${flagged.map(r => `${r.marker}: ${r.value}${r.unit} (${r.status})`).join(', ')}`;
    }
  }

  prompt += `

**Available exercises from database:**
${exerciseList}

Respond with JSON in this exact format:
{
  "name": "Program Name",
  "description": "Brief description",
  "durationWeeks": 8,
  "workouts": [
    {
      "dayName": "Day 1 - Push",
      "muscleGroups": ["chest", "shoulders", "triceps"],
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "primaryMuscle": "chest",
          "equipment": "barbell",
          "sets": 4,
          "repsMin": 6,
          "repsMax": 8,
          "restSeconds": 120,
          "notes": "Focus on controlled eccentric"
        }
      ]
    }
  ]
}`;

  return prompt;
}
