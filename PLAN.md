# One Percent Fitness — UX Overhaul & Smart Onboarding Plan

## Overview

Transform the app from a functional MVP into a polished, retention-driving fitness experience. The core philosophy: **get users to their first workout in under 60 seconds**, estimate smart starting weights, and make every interaction feel smooth and intentional.

---

## Phase 1: Smart Onboarding Flow (New Screen)

### 1A. Create `OnboardingScreen.tsx` — Multi-step welcome flow

**Step 1: Welcome + Motivation** (lead with WHY)
- "What's your #1 fitness goal?" — cards with icons:
  - Build Muscle / Get Stronger / Lose Weight / Get Lean / Improve Endurance / General Fitness
- Single tap selection, auto-advance

**Step 2: About You** (basic profile)
- Gender (Male / Female / Other / Prefer not to say)
- Age (number picker)
- Height (ft/in or cm toggle)
- Current weight (lbs or kg toggle)
- Experience level: Beginner / Intermediate / Advanced (with descriptions like "Less than 6 months", "6 months to 2 years", "2+ years")

**Step 3: Equipment Access**
- Quick presets: "Full Gym" / "Home Gym" / "Minimal/Bodyweight"
- Expandable detail picker for specific equipment (barbell, dumbbells, cables, machines, kettlebells, bands, pull-up bar)
- Save as equipment profile

**Step 4: Training Preferences**
- Days per week (3-6 slider)
- Session duration (30/45/60/75/90 min)
- Split preference: "Let AI decide" / Full Body / Upper-Lower / Push-Pull-Legs

**Step 5: Initial Strength Assessment** (the key differentiator)
- Brief explanation: "Let's estimate your starting weights. We'll use your profile + a quick assessment."
- AI generates conservative weight estimates for key compound lifts based on:
  - Body weight, gender, age, experience level
  - Population data averages with safety margin (start at ~60-70% of estimated capability)
- Show user their estimated starting weights for 4-5 key lifts (bench, squat/goblet squat, deadlift/RDL, overhead press, row)
- Users can adjust any weight up or down
- Message: "These are conservative starting points. The app learns from every workout and adjusts automatically."

**Step 6: Generate First Workout**
- "Ready for your first workout?" — single CTA button
- AI generates a short introductory workout (20-30 min) based on all inputs
- Navigate directly to ActiveWorkoutScreen

### 1B. Backend: Initial Weight Estimation Endpoint

- `POST /api/profile/estimate-weights` — takes gender, weight, age, experience → returns estimated working weights for all exercises
- Uses formula-based estimation (percentage of body weight by experience level per exercise category) with AI refinement
- Conservative by default (better to start too light than too heavy)

### 1C. Navigation Updates

- Add OnboardingScreen as initial route when `profile.isOnboarded === false`
- Add `isOnboarded` flag to profile in store
- Persist onboarding completion to AsyncStorage

---

## Phase 2: Data Persistence (Critical Fix)

### 2A. AsyncStorage Integration

- Install `@react-native-async-storage/async-storage`
- Add Zustand `persist` middleware to the store
- All state (profile, goals, workouts, nutrition, measurements) survives app restart
- Hydration loading screen while store rehydrates

### 2B. Store Improvements

- Remove hardcoded macro defaults — derive from profile (weight × multiplier based on goal)
- Add `lastSyncedAt` timestamp for future API sync
- Add workout history persistence

---

## Phase 3: Active Workout UX Polish

### 3A. Auto Rest Timer
- Timer starts automatically when a set is marked complete
- Default rest times by exercise type:
  - Compound heavy (squat, deadlift, bench): 180s
  - Compound light (rows, OHP): 120s
  - Isolation: 60-90s
  - Warm-up sets: 60s
- Visual countdown with progress ring
- Haptic vibration + sound on timer complete
- User can adjust default rest per exercise

### 3B. Inline Previous Performance
- Show last workout's weight/reps next to current set input fields
- Format: "Last: 135lb × 10" in muted text above/below the input
- If no history, show AI-estimated weight with "(est.)" label

### 3C. Exercise Search & Filter
- Search bar at top of exercise picker with real-time filtering
- Filter chips: by muscle group, by equipment
- Recently used exercises section at top
- Exercise cards show: name, primary muscle, equipment icon

### 3D. Cleaner Set Logging UI
- Inline set editing (not modal-based)
- Swipe to complete a set
- Completed sets get checkmark + subtle color change
- RPE/RiR selector as simple 1-10 horizontal pill selector below each set
- Add set / remove set buttons clearly visible

### 3E. Component Refactor
- Break ActiveWorkoutScreen (~1300 lines) into smaller components:
  - `ExerciseCard` — single exercise with its sets
  - `SetRow` — individual set input row
  - `RestTimer` — countdown timer component
  - `ExercisePicker` — search/filter modal for adding exercises
  - `WorkoutSummary` — post-workout stats

---

## Phase 4: Home Screen Enhancement

### 4A. Richer Dashboard
- **Today's workout preview** — show scheduled exercises with quick-start
- **Weekly streak** — dots for each day worked out this week
- **Volume trend** — simple sparkline showing weekly volume progression
- **Recovery status** — muscle group recovery indicators (simple version: days since last trained per muscle group)
- **Next goal milestone** — "12 lbs to go" or "15 lb PR away from bench goal"

### 4B. Better Empty States
- First-time empty states with illustrations and clear CTAs
- "Start your first workout" prominent button
- Quick tips that rotate daily

---

## Phase 5: AI-Driven Goal Discovery

### 5A. Smart Goal Suggestions
- After onboarding, AI suggests 2-3 specific goals based on profile
- Example: For a 180lb intermediate male wanting to build muscle:
  - "Bench Press 185 lbs for 5 reps" (based on estimated current + realistic 12-week progression)
  - "Gain 5 lbs of lean mass in 12 weeks"
  - "Complete 4 workouts per week for 8 weeks"
- Users can accept, modify, or skip each suggestion

### 5B. Progressive Overload Tracking
- Track estimated 1RM per exercise over time
- After each workout, check if user exceeded previous performance
- Subtle celebration on PRs ("New personal record! 🎉")
- Suggest weight increases when user consistently hits top of rep range

---

## Implementation Order (Priority)

1. **Phase 2: Data Persistence** — Without this, nothing else matters (users lose all data)
2. **Phase 1: Onboarding** — First impression is everything for retention
3. **Phase 3: Active Workout Polish** — This is where users spend the most time
4. **Phase 4: Home Screen** — Makes the app feel alive and motivating
5. **Phase 5: AI Goals** — Differentiator that drives long-term engagement

---

## Phase 6: AI Coach Chat

### 6A. In-App AI Chat Screen
- Conversational interface for on-the-fly adjustments
- "I'm at a hotel with just dumbbells and a bench" → AI instantly adapts today's workout
- "My shoulder is bothering me today" → swaps exercises in real-time
- "What should I eat post-workout?" → personalized nutrition advice
- Chat history persisted locally, context-aware (knows your goals, recent workouts, measurements)

### 6B. Travel/Adaptive Workouts
- Quick "I'm traveling" mode that generates bodyweight or hotel-gym workouts
- Equipment override without changing saved profile
- One-tap workout adjustment based on available equipment

---

## Phase 7: Periodic Assessments

### 7A. Weekly Check-In (Opt-in)
- Quick "How did this week feel?" survey after last workout of the week
- Auto-summary: workouts completed, total volume, PRs hit
- AI feedback: "Great consistency! Consider adding 5 lbs to your bench next week."

### 7B. Monthly Assessment (Guided)
- Upload progress photo → side-by-side comparison with last month (before/after slider)
- Log measurements → auto-comparison with trends
- Review strength progression per exercise
- AI comprehensive feedback on progress toward goals

---

## Phase 8: The 1% Leaderboard (Brand Identity)

### 8A. Percentile Rankings
- Based on real fitness industry data (CDC/ACSM exercise frequency stats):
  - "You worked out 4x this week — that puts you in the **top 3%** of Americans your age"
  - "12 consecutive weeks of training — **top 1%** consistency"
- Focus on **showing up** (motivating), not comparing lifts (intimidating)
- Demographic-aware: age, gender for accurate percentile

### 8B. Motivation Engine
- Pre-workout motivational content (opt-in):
  - Quick video/message popup before starting a workout
  - Morning motivation push notification
  - Sourced from curated fitness/motivational content
- Daily tips that rotate on the home screen
- PR celebrations with shareable cards
- Milestone badges (1 month, 100 workouts, etc.)

---

## Implementation Status

### Done ✅
- [x] Phase 2: Data persistence (AsyncStorage + Zustand persist)
- [x] Phase 1: Smart onboarding (6-step with weight estimation)
- [x] Phase 3A: Auto rest timer with haptic feedback
- [x] Phase 3B: Inline previous performance display
- [x] Phase 4A: Weekly streak + volume tracking on home screen
- [x] Workout history tracking for progressive overload

### Next Up
- [ ] Phase 5: AI goal suggestions
- [ ] Phase 6: AI coach chat
- [ ] Phase 7: Periodic assessments
- [ ] Phase 8: 1% leaderboard
- [ ] Phase 3E: Component refactor (break up ActiveWorkoutScreen)

---

## Technical Notes

- All new screens follow existing dark theme from `theme.ts`
- Weight estimation formulas use conservative percentages of body weight by exercise category and experience level (no external API needed for v1)
- AsyncStorage for persistence now, ready for PostgreSQL sync later
- Keep AI provider abstraction — weight estimation can use any provider
- Exercise search uses the existing 60+ exercise database on the backend
