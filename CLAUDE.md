# CLAUDE.md - AI Assistant Guide for One Percent Fitness

> **Last Updated:** 2026-03-09
> **Repository Status:** Active development - MVP phase

## Project Overview

**One Percent Fitness** is a comprehensive fitness app that combines AI-powered workout programming, nutrition tracking, and goal setting. Get 1% better every day.

### Core Features
```
🎯 Goal Setting      → Set strength, physique, weight, and custom goals with photo references
💪 Workout Programs   → AI-generated periodized programs (like Fitbod)
📊 Workout Tracking   → Log sets, reps, weight with Fitbod-style UI
🍽️ Nutrition Tracking → Log meals, track macros (calories, protein, carbs, fat)
🧑‍🍳 Recipe Generator   → AI creates recipes from your fridge contents
📏 Body Metrics       → Weight, body fat %, circumference measurements
🩸 Blood Work         → Track health markers, factored into AI recommendations
🔑 External API       → API key auth for third-party agents and integrations
```

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Project Name** | One Percent Fitness |
| **Repository** | `tbrobinson116/onepercentfitness` |
| **Primary Branch** | `main` |
| **Mobile App** | React Native + Expo + TypeScript |
| **Backend** | Node.js + Express |
| **AI Providers** | Anthropic Claude + OpenAI (flexible) |
| **State Management** | Zustand |
| **Target Platform** | iOS 15+, Android 10+ |

---

## Tech Stack

### Mobile App
- **Framework:** React Native 0.76 with Expo 52
- **Language:** TypeScript 5.7 (strict mode)
- **State:** Zustand 5.0
- **Navigation:** React Navigation (bottom tabs + stack)
- **UI:** Custom dark theme

### Backend API
- **Runtime:** Node.js 20+
- **Framework:** Express 4.21
- **Validation:** Zod 3.24
- **AI:** @anthropic-ai/sdk + openai (flexible provider)
- **Auth:** API key middleware with rate limiting
- **Storage:** In-memory (ready for PostgreSQL + Prisma)

---

## Project Structure

```
onepercentfitness/
├── CLAUDE.md
├── .gitignore
│
├── app/                          # React Native mobile app
│   ├── App.tsx                   # Root component
│   ├── app.json                  # Expo config
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── theme.ts              # Colors, typography
│       ├── types/
│       │   └── index.ts          # All TypeScript types
│       ├── services/
│       │   ├── api.ts            # Backend API client
│       │   └── store.ts          # Zustand global store
│       ├── navigation/
│       │   └── AppNavigator.tsx   # Tab + stack navigation
│       └── screens/
│           ├── HomeScreen.tsx         # Dashboard with daily progress
│           ├── GoalsScreen.tsx        # Goal setting with photo/strength goals
│           ├── WorkoutsScreen.tsx     # Workout list, programs, history
│           ├── ActiveWorkoutScreen.tsx # Fitbod-style workout tracker
│           ├── NutritionScreen.tsx    # Meal logging, macro tracking
│           ├── ProfileScreen.tsx      # Measurements, blood work, settings
│           ├── GenerateProgramScreen.tsx # AI program generation form
│           └── FridgeManagerScreen.tsx   # Fridge contents + recipe gen
│
└── api/                          # Node.js backend
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    └── src/
        ├── index.ts              # Express server + API docs endpoint
        ├── types/
        │   └── index.ts          # Server-side types
        ├── middleware/
        │   └── apiAuth.ts        # API key auth + rate limiting
        ├── data/
        │   └── exercises.ts      # Exercise database (60+ exercises)
        ├── services/
        │   ├── workout-generator.ts  # AI workout program generation
        │   ├── meal-generator.ts     # AI meal plan + recipe generation
        │   └── ai/
        │       ├── index.ts          # AI client factory
        │       ├── provider.ts       # Provider interface
        │       ├── anthropic.ts      # Claude integration
        │       └── openai.ts         # GPT-4o integration
        └── routes/
            ├── workouts.ts       # Workout CRUD + program generation
            ├── nutrition.ts      # Nutrition logging + meal plans + recipes + fridge
            ├── goals.ts          # Goal CRUD
            ├── profile.ts        # Profile, measurements, blood work
            └── exercises.ts      # Exercise database with search/filter
```

---

## API Endpoints

### Authentication
External API access via API keys:
```
POST   /api/auth/keys           # Create API key
GET    /api/auth/keys           # List keys
DELETE /api/auth/keys/:prefix   # Revoke key
```

Headers: `X-API-Key: your_key` or `Authorization: Bearer your_key`

### Core Endpoints
```
# Workouts
GET    /api/workouts
POST   /api/workouts
PUT    /api/workouts/:id
DELETE /api/workouts/:id
POST   /api/workouts/programs/generate   # AI program generation
GET    /api/workouts/programs

# Nutrition
GET    /api/nutrition/log/:date
POST   /api/nutrition/log
POST   /api/nutrition/meal-plans/generate  # AI meal plan
POST   /api/nutrition/recipes/generate     # AI recipe from fridge
GET    /api/nutrition/recipes
GET    /api/nutrition/fridge
POST   /api/nutrition/fridge
DELETE /api/nutrition/fridge/:id

# Goals
GET    /api/goals
POST   /api/goals
PUT    /api/goals/:id
DELETE /api/goals/:id

# Profile
GET    /api/profile
PUT    /api/profile
GET    /api/profile/measurements
POST   /api/profile/measurements
GET    /api/profile/blood-work
POST   /api/profile/blood-work

# Exercises
GET    /api/exercises?search=bench&muscle=chest&equipment=barbell
GET    /api/exercises/:id
```

Full API docs available at `GET /api`.

---

## Environment Variables

```bash
# Server
PORT=3001

# AI Providers (flexible - use one or both)
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
AI_PROVIDER=anthropic  # or "openai"

# Database (future)
DATABASE_URL=postgresql://localhost:5432/onepercent_fitness
```

---

## Commands

```bash
# Mobile App (from /app)
npm install              # Install dependencies
npm start                # Start Metro/Expo
npm run ios              # iOS simulator
npm run android          # Android emulator

# Backend API (from /api)
npm install              # Install dependencies
npm run dev              # Start dev server (port 3001)
npm run build            # Build TypeScript
npm test                 # Run tests
```

---

## Key Design Decisions

1. **Flexible AI Provider** - Abstracted AI layer supports both Claude and GPT-4o, configurable via env var
2. **External API** - API key auth with rate limiting enables third-party agents and tools to access all fitness data programmatically
3. **Offline-First Mobile** - App works with local state when API is unavailable
4. **Exercise Database** - 60+ exercises with muscle groups, equipment, and instructions built-in
5. **Fitbod-Style Tracking** - Per-set logging with weight, reps, RPE, warmup/drop set support

---

## Implementation Status

### Phase 1: Core MVP ✅ Complete
- [x] React Native app with dark theme
- [x] 5-tab navigation (Home, Workouts, Nutrition, Goals, Profile)
- [x] Goal setting (strength, physique, weight, endurance, custom)
- [x] AI workout program generation
- [x] Fitbod-style workout tracking (sets, reps, weight)
- [x] Nutrition/macro tracking with meal logging
- [x] Fridge manager + AI recipe generation
- [x] Body measurements tracking
- [x] Blood work logging
- [x] Exercise database (60+ exercises)
- [x] External API with key auth + rate limiting
- [x] Backend with all CRUD endpoints

### Phase 2: Enhancement (Next)
- [ ] Progress photos with goal image comparison
- [ ] Workout history analytics and charts
- [ ] Progressive overload tracking/suggestions
- [ ] Food barcode scanning
- [ ] PostgreSQL + Prisma migration
- [ ] User authentication (JWT)
- [ ] Push notifications for workout reminders

### Phase 3: Social & Advanced
- [ ] Chef's Edge recipe integration
- [ ] Social features (share workouts, challenges)
- [ ] Wearable integrations (Apple Watch, Garmin)
- [ ] AI coaching chat
- [ ] Supplement recommendations based on blood work

---

## AI Assistant Guidelines

1. **Read Before Writing:** Always read existing files before modifying
2. **Follow Patterns:** Match the dark theme, Zustand store pattern, and Express route structure
3. **Type Safety:** All new code must use TypeScript with strict mode
4. **Minimal Changes:** Only change what's necessary
5. **Exercise Database:** Add new exercises to `/api/src/data/exercises.ts`

### Things to Avoid
- Hardcoding API keys
- Skipping Zod validation on API routes
- Breaking the AI provider abstraction
- Adding dependencies without justification

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-03-09 | Complete rewrite: One Percent Fitness MVP with workouts, nutrition, goals, measurements, blood work, AI generation, external API |
| 2026-01-27 | Original DutySnap project |

---

*1% better every day.*
