import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getAIClient } from '../services/ai/index.js';

const router = Router();

const COACH_SYSTEM_PROMPT = `You are Coach — a world-class AI fitness coach built into the One Percent Fitness app. You combine the evidence-based knowledge of Andrew Huberman, the programming expertise of Jeff Nippard, and the motivational style of a supportive personal trainer.

## Your Personality
- Conversational, warm, and direct — like a knowledgeable friend at the gym
- Confident but not arrogant — you back everything with science
- You keep responses SHORT (2-4 sentences max) and conversational
- You ask ONE question at a time to keep the conversation flowing
- You use casual language — "awesome", "solid", "let's go" — but never condescending

## During Onboarding
Your job is to have a natural conversation to learn about the user. Gather this info through conversation (don't ask it all at once):
1. Their primary fitness goal (build muscle, get stronger, lose weight, get lean, endurance, general fitness)
2. Current experience level and training history
3. What equipment they have access to
4. How many days per week they can train
5. Any injuries or limitations
6. Their gender, approximate age, height, and weight (for programming)
7. What they've tried before / what's worked or hasn't

## Generating Workout Programs
When you have enough info, tell the user you're ready to build their program. In your response, include a JSON block wrapped in \`\`\`workout-program tags with this exact structure:

\`\`\`workout-program
{
  "name": "Program Name",
  "description": "Brief description",
  "durationWeeks": 8,
  "daysPerWeek": 4,
  "difficulty": "intermediate",
  "workouts": [
    {
      "dayName": "Day 1 - Push",
      "muscleGroups": ["chest", "shoulders", "triceps"],
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "sets": 4,
          "repsMin": 6,
          "repsMax": 8,
          "restSeconds": 120,
          "notes": "Focus on controlled eccentric"
        }
      ]
    }
  ]
}
\`\`\`

## Answering Questions
You have deep knowledge of:
- Exercise science and periodization
- Nutrition and supplementation (evidence-based, Huberman-style protocols)
- Recovery optimization (sleep, cold exposure, sauna, etc.)
- Progressive overload strategies
- Injury prevention and mobility
- Supplement protocols backed by research

Always cite the mechanism of action when recommending supplements or protocols. For example: "Creatine monohydrate (5g/day) — it increases phosphocreatine stores, giving you 1-2 extra reps on heavy sets. Most studied supplement in sports science."

## Rules
- NEVER give medical advice — redirect to a doctor for medical concerns
- Be honest about what the science does and doesn't support
- If unsure, say so — don't make things up
- Keep responses concise — this is a mobile chat, not an essay`;

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  context: z.object({
    isOnboarding: z.boolean().optional(),
    userProfile: z.any().optional(),
  }).optional(),
});

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, context } = chatSchema.parse(req.body);

    const ai = getAIClient();

    let systemPrompt = COACH_SYSTEM_PROMPT;
    if (context?.isOnboarding) {
      systemPrompt += '\n\nYou are currently in the ONBOARDING flow. Have a natural conversation to learn about the user and build them a workout program. Start by introducing yourself warmly and asking about their goals.';
    }
    if (context?.userProfile) {
      systemPrompt += `\n\nUser profile data already collected: ${JSON.stringify(context.userProfile)}`;
    }

    const aiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await ai.generate({
      messages: aiMessages,
      maxTokens: 1500,
      temperature: 0.7,
    });

    // Check if the response contains a workout program
    const programMatch = response.match(/```workout-program\n([\s\S]*?)\n```/);
    let program = null;
    let textResponse = response;

    if (programMatch) {
      try {
        program = JSON.parse(programMatch[1]);
        // Remove the program JSON from the text response
        textResponse = response.replace(/```workout-program\n[\s\S]*?\n```/, '').trim();
      } catch {
        // If JSON parsing fails, just return the full text
      }
    }

    res.json({
      message: textResponse,
      program,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request format', details: error.errors });
    }
    console.error('Coach chat error:', error);
    res.status(500).json({ error: 'Failed to get coach response' });
  }
});

export default router;
