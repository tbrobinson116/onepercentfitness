# UI/UX Overhaul Plan - One Percent Fitness

## Vision
Transform from a form-heavy, static, emoji-icon app into a **modern, polished fitness app** that feels like Fitbod/Hevy/Strong — with AI as the conversational centerpiece, not buried behind forms.

---

## Phase 1: Foundation — Design System Upgrade

### 1.1 Install Expo Vector Icons (replace all emoji icons)
- Replace every emoji icon (🏠💪🍽️🎯👤 etc.) with `@expo/vector-icons` (Ionicons/MaterialCommunityIcons)
- Tab bar icons, section headers, buttons, empty states — all get proper icons
- This single change eliminates the "90s" feel immediately

### 1.2 Add React Native Reanimated for Animations
- Install `react-native-reanimated` for smooth layout animations
- Add `FadeIn`, `SlideInUp`, `FadeInDown` entering animations to cards/sections
- Animated progress bars that fill on mount
- Smooth tab transitions

### 1.3 Typography & Spacing Polish
- Add subtle gradient or glassmorphism effect to key cards (weekly summary, macro card)
- Increase spacing between sections (currently too dense)
- Add section headers with more visual weight
- Softer shadows/elevation on cards

### 1.4 Enhanced Theme
- Add gradient colors for hero elements
- Add subtle card shadows (not just flat cards)
- Slightly warmer background tones

---

## Phase 2: Screen-by-Screen UX Redesign

### 2.1 Home Screen — The Daily Hub
**Current:** Static cards, small text, no energy
**New:**
- **Hero greeting card** with gradient background, motivational line
- **Animated ring/arc** for daily calorie progress (like Apple Watch rings)
- **Today's workout card** is prominent with large "Start Workout" CTA
- **Streak counter** with fire animation/glow effect
- **Quick action buttons** redesigned as large, icon-forward tiles (not small text buttons)
- Cards animate in on load with staggered fade

### 2.2 Onboarding — Conversational AI Flow
**Current:** 6-step form wizard with lots of buttons/inputs
**New:**
- **AI chat-style onboarding** — the AI asks questions one at a time in a conversational bubble UI
- User responds by tapping option cards (not tiny buttons)
- Feels like talking to a personal trainer, not filling out a form
- Smooth transitions between questions
- Progress shown as dots, not a bar
- Final step: AI "thinking" animation → reveals personalized plan summary

### 2.3 Workout Tracking (ActiveWorkoutScreen)
**Current:** Dense table of inputs, small touch targets
**New:**
- **Larger set rows** with bigger touch targets for weight/reps
- **Swipe to complete** a set (in addition to checkbox)
- **Rest timer** as a persistent banner at top (not a modal popup)
- **Previous performance** shown inline (ghost text: "Last: 185×8")
- **Exercise cards** with subtle muscle group color coding
- **Floating "Finish" button** that's always visible

### 2.4 Nutrition Screen
**Current:** Shows all 6 meal slots always, dense macro numbers
**New:**
- **Animated macro rings** (circular progress) for calories/protein/carbs/fat at top
- **Collapsible meal sections** — only expand meals that have entries + "next meal"
- **Quick-add AI button**: "What did you eat?" → type naturally → AI parses macros
- **Recipe cards** with food imagery placeholders and better layout

### 2.5 Goals Screen
**Current:** Long scroll of cards, all same visual weight
**New:**
- **Featured goal** card at top (your primary goal, large)
- **Progress timeline** visualization
- **Milestone markers** on progress bars
- **AI suggestions** for goal adjustments based on progress
- Cleaner card design with more whitespace

### 2.6 Profile Screen
**Current:** 4 tabs crammed with forms
**New:**
- **Clean overview** with avatar/initials circle
- **Stat cards** with trend arrows (↑↓)
- **Chart for weight/measurement trends** (simple line chart)
- Settings moved to a gear icon → separate settings sheet

### 2.7 Generate Program Screen
**Current:** Long form with many button groups
**New:**
- **Conversational AI flow** — similar to onboarding
- AI asks: "How many days can you train?" → user picks
- AI asks: "Any equipment limitations?" → user picks
- Feels like chatting with a coach, not filling forms
- Final: AI "designing your program..." animation → reveal

---

## Phase 3: Micro-interactions & Polish

### 3.1 Button/Touch Feedback
- Scale-down animation on press (not just opacity)
- Haptic feedback on key actions (complete set, finish workout, achieve goal)

### 3.2 Loading States
- Skeleton screens instead of spinners where possible
- AI "thinking" animation (typing dots) for generation screens

### 3.3 Empty States
- Illustrated empty states with proper icons (not just emoji)
- Clear, encouraging CTAs

### 3.4 Transitions
- Screen transitions with shared element animations where practical
- Tab switching with subtle crossfade

---

## Implementation Order (Priority)

1. **Install dependencies** (`@expo/vector-icons` already in Expo, `react-native-reanimated`)
2. **Replace all emoji icons** with vector icons across all screens + tab bar
3. **Update theme** with gradients, shadows, improved spacing
4. **Home Screen redesign** — animated rings, better cards, staggered animations
5. **Onboarding redesign** — conversational AI chat flow
6. **ActiveWorkout polish** — bigger touch targets, rest timer banner, swipe gestures
7. **Nutrition screen** — circular macro rings, collapsible meals
8. **Goals screen** — featured goal, better progress viz
9. **Profile screen** — trend charts, cleaner layout
10. **Generate Program** — conversational AI flow
11. **Micro-interactions** — press animations, haptics, skeletons

---

## Dependencies to Add
- `react-native-reanimated` — smooth animations
- `react-native-svg` — for circular progress rings/charts
- `react-native-gesture-handler` — swipe gestures (likely already installed via navigation)
- `@expo/vector-icons` — already included with Expo, just need to import

## Dependencies NOT Needed
- No new UI framework (no NativeBase, no Tamagui) — we keep custom components but polish them
- No charting library yet — we'll build simple progress visualizations with SVG

---

## Key Principle
**AI-first interaction.** Wherever the user currently fills out a form, we ask: "Could the AI just ask them conversationally instead?" The app should feel like you have a personal trainer in your pocket, not like you're filling out a spreadsheet.
