import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { PressableScale, Card } from '../components/ui';
import { useStore } from '../services/store';
import type { FitnessGoalType, ExperienceLevel, SplitPreference } from '../services/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 6;

// Conservative weight estimation based on body weight, gender, and experience
function estimateWeights(
  weightKg: number,
  gender: 'male' | 'female' | 'other' | null,
  experience: ExperienceLevel | null,
): Record<string, number> {
  const bodyWeightLbs = weightKg * 2.205;
  const isMale = gender === 'male';

  const mult = {
    beginner: {
      bench: isMale ? 0.45 : 0.25,
      squat: isMale ? 0.55 : 0.35,
      deadlift: isMale ? 0.65 : 0.40,
      ohp: isMale ? 0.30 : 0.15,
      row: isMale ? 0.40 : 0.22,
      goblet: isMale ? 0.20 : 0.12,
      curl: isMale ? 0.12 : 0.07,
      tricep: isMale ? 0.12 : 0.07,
      lateral: isMale ? 0.06 : 0.04,
      legPress: isMale ? 0.85 : 0.60,
      latPull: isMale ? 0.45 : 0.30,
    },
    intermediate: {
      bench: isMale ? 0.65 : 0.35,
      squat: isMale ? 0.80 : 0.50,
      deadlift: isMale ? 0.90 : 0.55,
      ohp: isMale ? 0.40 : 0.22,
      row: isMale ? 0.55 : 0.30,
      goblet: isMale ? 0.30 : 0.18,
      curl: isMale ? 0.16 : 0.09,
      tricep: isMale ? 0.16 : 0.09,
      lateral: isMale ? 0.08 : 0.05,
      legPress: isMale ? 1.20 : 0.85,
      latPull: isMale ? 0.55 : 0.38,
    },
    advanced: {
      bench: isMale ? 0.85 : 0.45,
      squat: isMale ? 1.05 : 0.65,
      deadlift: isMale ? 1.15 : 0.70,
      ohp: isMale ? 0.50 : 0.28,
      row: isMale ? 0.65 : 0.38,
      goblet: isMale ? 0.38 : 0.25,
      curl: isMale ? 0.20 : 0.12,
      tricep: isMale ? 0.20 : 0.12,
      lateral: isMale ? 0.10 : 0.07,
      legPress: isMale ? 1.50 : 1.05,
      latPull: isMale ? 0.70 : 0.48,
    },
  };

  const m = mult[experience ?? 'beginner'];
  const round5 = (n: number) => Math.round(n / 5) * 5;

  return {
    'Barbell Bench Press': round5(bodyWeightLbs * m.bench),
    'Dumbbell Bench Press': round5((bodyWeightLbs * m.bench) / 2 * 0.8),
    'Incline Dumbbell Press': round5((bodyWeightLbs * m.bench) / 2 * 0.7),
    'Decline Barbell Press': round5(bodyWeightLbs * m.bench * 1.05),
    'Barbell Squat': round5(bodyWeightLbs * m.squat),
    'Barbell Back Squat': round5(bodyWeightLbs * m.squat),
    'Front Squat': round5(bodyWeightLbs * m.squat * 0.75),
    'Goblet Squat': round5(bodyWeightLbs * m.goblet),
    'Barbell Deadlift': round5(bodyWeightLbs * m.deadlift),
    'Deadlift': round5(bodyWeightLbs * m.deadlift),
    'Romanian Deadlift': round5(bodyWeightLbs * m.deadlift * 0.65),
    'Overhead Press': round5(bodyWeightLbs * m.ohp),
    'Barbell Overhead Press': round5(bodyWeightLbs * m.ohp),
    'Dumbbell Shoulder Press': round5((bodyWeightLbs * m.ohp) / 2 * 0.85),
    'Arnold Press': round5((bodyWeightLbs * m.ohp) / 2 * 0.75),
    'Barbell Bent-Over Row': round5(bodyWeightLbs * m.row),
    'Barbell Row': round5(bodyWeightLbs * m.row),
    'Dumbbell Row': round5((bodyWeightLbs * m.row) / 2 * 0.85),
    'Seated Cable Row': round5(bodyWeightLbs * m.row * 0.85),
    'T-Bar Row': round5(bodyWeightLbs * m.row * 0.75),
    'Lat Pulldown': round5(bodyWeightLbs * m.latPull),
    'Leg Press': round5(bodyWeightLbs * m.legPress),
    'Leg Extension': round5(bodyWeightLbs * m.squat * 0.35),
    'Leg Curl': round5(bodyWeightLbs * m.squat * 0.30),
    'Hip Thrust': round5(bodyWeightLbs * m.squat * 0.85),
    'Bulgarian Split Squat': round5((bodyWeightLbs * m.squat) / 2 * 0.35),
    'Calf Raises': round5(bodyWeightLbs * m.squat * 0.55),
    'Barbell Curl': round5(bodyWeightLbs * m.curl * 2),
    'Dumbbell Curl': round5(bodyWeightLbs * m.curl),
    'Hammer Curl': round5(bodyWeightLbs * m.curl * 1.1),
    'Preacher Curl': round5(bodyWeightLbs * m.curl * 1.6),
    'Tricep Pushdown': round5(bodyWeightLbs * m.tricep * 1.5),
    'Skull Crushers': round5(bodyWeightLbs * m.tricep * 1.8),
    'Overhead Tricep Extension': round5(bodyWeightLbs * m.tricep * 1.3),
    'Close-Grip Bench Press': round5(bodyWeightLbs * m.bench * 0.80),
    'Lateral Raises': round5(bodyWeightLbs * m.lateral),
    'Cable Lateral Raise': round5(bodyWeightLbs * m.lateral),
    'Rear Delt Flyes': round5(bodyWeightLbs * m.lateral * 0.9),
    'Face Pulls': round5(bodyWeightLbs * m.lateral * 1.5),
    'Cable Flyes': round5(bodyWeightLbs * m.lateral * 1.3),
    'Machine Chest Press': round5(bodyWeightLbs * m.bench * 0.70),
    'Cable Crunches': round5(bodyWeightLbs * 0.25),
    'Smith Machine Squat': round5(bodyWeightLbs * m.squat * 0.70),
    'Hack Squat': round5(bodyWeightLbs * m.squat * 0.75),
    'Walking Lunges': round5((bodyWeightLbs * m.squat) / 2 * 0.30),
    'Lunges': round5((bodyWeightLbs * m.squat) / 2 * 0.30),
    'Push-Ups': 0,
    'Pull-Ups': 0,
    'Dips': 0,
    'Chest Dips': 0,
    'Plank': 0,
    'Hanging Leg Raise': 0,
  };
}

// ---- AI Coach Message Bubble ----
function CoachBubble({ message, delay = 0 }: { message: string; delay?: number }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      style={bubbleStyles.container}
    >
      <View style={bubbleStyles.header}>
        <View style={bubbleStyles.iconWrap}>
          <Ionicons name="sparkles" size={14} color={colors.accent} />
        </View>
        <Text style={bubbleStyles.label}>Coach</Text>
      </View>
      <Text style={bubbleStyles.message}>{message}</Text>
    </Animated.View>
  );
}

const bubbleStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  label: {
    ...typography.captionBold,
    color: colors.accentLight,
  },
  message: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
});

// ---- Progress Dots ----
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={dotStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            i === current && dotStyles.dotActive,
            i < current && dotStyles.dotCompleted,
          ]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  dotCompleted: {
    backgroundColor: colors.accentSoft,
  },
});

// ---- Goal Selection Step ----
function GoalStep({ selected, onSelect }: {
  selected: FitnessGoalType | null;
  onSelect: (g: FitnessGoalType) => void;
}) {
  const goals: { key: FitnessGoalType; icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }[] = [
    { key: 'build_muscle', icon: 'barbell', label: 'Build Muscle', desc: 'Gain size and definition' },
    { key: 'get_stronger', icon: 'fitness', label: 'Get Stronger', desc: 'Increase strength and power' },
    { key: 'lose_weight', icon: 'flash', label: 'Lose Weight', desc: 'Burn fat and drop pounds' },
    { key: 'get_lean', icon: 'flame', label: 'Get Lean', desc: 'Tone up and cut body fat' },
    { key: 'improve_endurance', icon: 'walk', label: 'Improve Endurance', desc: 'Build stamina and cardio fitness' },
    { key: 'general_fitness', icon: 'heart', label: 'General Fitness', desc: 'Overall health and wellness' },
  ];

  return (
    <View style={stepStyles.container}>
      <CoachBubble message="Hey! I'm your AI coach. What's your primary fitness goal?" />
      <View style={stepStyles.grid}>
        {goals.map((g, index) => (
          <Animated.View
            key={g.key}
            entering={FadeInUp.duration(350).delay(100 + index * 60)}
            style={{ width: '48%' }}
          >
            <PressableScale onPress={() => onSelect(g.key)}>
              <View style={[stepStyles.goalCard, selected === g.key && stepStyles.goalCardSelected]}>
                <View style={[stepStyles.goalIconWrap, selected === g.key && stepStyles.goalIconWrapSelected]}>
                  <Ionicons
                    name={g.icon}
                    size={26}
                    color={selected === g.key ? colors.accent : colors.textSecondary}
                  />
                </View>
                <Text style={[stepStyles.goalLabel, selected === g.key && stepStyles.goalLabelSelected]}>
                  {g.label}
                </Text>
                <Text style={stepStyles.goalDesc}>{g.desc}</Text>
              </View>
            </PressableScale>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// ---- About You Step ----
function AboutYouStep({ data, onChange }: {
  data: { gender: string | null; age: number | null; heightCm: number | null; weightKg: number | null };
  onChange: (field: string, value: any) => void;
}) {
  const [heightFt, setHeightFt] = useState(data.heightCm ? Math.floor(data.heightCm / 30.48).toString() : '');
  const [heightIn, setHeightIn] = useState(data.heightCm ? Math.round((data.heightCm / 2.54) % 12).toString() : '');
  const [weightLbs, setWeightLbs] = useState(data.weightKg ? Math.round(data.weightKg * 2.205).toString() : '');

  const genders: { key: string; label: string }[] = [
    { key: 'male', label: 'Male' },
    { key: 'female', label: 'Female' },
    { key: 'other', label: 'Other' },
  ];

  const updateHeight = (ft: string, inches: string) => {
    const f = parseInt(ft) || 0;
    const i = parseInt(inches) || 0;
    const cm = (f * 12 + i) * 2.54;
    if (cm > 0) onChange('heightCm', Math.round(cm));
  };

  const updateWeight = (lbs: string) => {
    const w = parseInt(lbs) || 0;
    if (w > 0) onChange('weightKg', Math.round(w / 2.205));
  };

  return (
    <View style={stepStyles.container}>
      <CoachBubble message="Great choice! Let me learn a bit about you so I can personalize everything." />

      <Animated.View entering={FadeInUp.duration(350).delay(100)}>
        <Text style={stepStyles.fieldLabel}>Gender</Text>
        <View style={stepStyles.pillRow}>
          {genders.map((g) => (
            <PressableScale key={g.key} onPress={() => onChange('gender', g.key)}>
              <View style={[stepStyles.pill, data.gender === g.key && stepStyles.pillSelected]}>
                <Text style={[stepStyles.pillText, data.gender === g.key && stepStyles.pillTextSelected]}>
                  {g.label}
                </Text>
              </View>
            </PressableScale>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(200)}>
        <Text style={stepStyles.fieldLabel}>Age</Text>
        <TextInput
          style={stepStyles.input}
          value={data.age?.toString() ?? ''}
          onChangeText={(v) => onChange('age', parseInt(v) || null)}
          keyboardType="number-pad"
          placeholder="25"
          placeholderTextColor={colors.textMuted}
          maxLength={3}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(300)}>
        <Text style={stepStyles.fieldLabel}>Height</Text>
        <View style={stepStyles.heightRow}>
          <TextInput
            style={[stepStyles.input, { flex: 1, marginRight: spacing.sm }]}
            value={heightFt}
            onChangeText={(v) => { setHeightFt(v); updateHeight(v, heightIn); }}
            keyboardType="number-pad"
            placeholder="5"
            placeholderTextColor={colors.textMuted}
            maxLength={1}
          />
          <Text style={stepStyles.heightUnit}>ft</Text>
          <TextInput
            style={[stepStyles.input, { flex: 1, marginHorizontal: spacing.sm }]}
            value={heightIn}
            onChangeText={(v) => { setHeightIn(v); updateHeight(heightFt, v); }}
            keyboardType="number-pad"
            placeholder="10"
            placeholderTextColor={colors.textMuted}
            maxLength={2}
          />
          <Text style={stepStyles.heightUnit}>in</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(400)}>
        <Text style={stepStyles.fieldLabel}>Current Weight (lbs)</Text>
        <TextInput
          style={stepStyles.input}
          value={weightLbs}
          onChangeText={(v) => { setWeightLbs(v); updateWeight(v); }}
          keyboardType="number-pad"
          placeholder="180"
          placeholderTextColor={colors.textMuted}
          maxLength={3}
        />
      </Animated.View>
    </View>
  );
}

// ---- Experience Step ----
function ExperienceStep({ selected, onSelect }: {
  selected: ExperienceLevel | null;
  onSelect: (e: ExperienceLevel) => void;
}) {
  const levels: { key: ExperienceLevel; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'beginner', label: 'Beginner', desc: 'New to lifting or < 6 months', icon: 'leaf' },
    { key: 'intermediate', label: 'Intermediate', desc: '6 months to 2 years of training', icon: 'barbell-outline' },
    { key: 'advanced', label: 'Advanced', desc: '2+ years of consistent training', icon: 'trophy' },
  ];

  return (
    <View style={stepStyles.container}>
      <CoachBubble message="How long have you been training?" />
      {levels.map((l, index) => (
        <Animated.View key={l.key} entering={FadeInUp.duration(350).delay(100 + index * 80)}>
          <PressableScale onPress={() => onSelect(l.key)}>
            <View style={[stepStyles.expCard, selected === l.key && stepStyles.expCardSelected]}>
              <View style={[stepStyles.expIconWrap, selected === l.key && stepStyles.expIconWrapSelected]}>
                <Ionicons
                  name={l.icon}
                  size={24}
                  color={selected === l.key ? colors.accent : colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[stepStyles.expLabel, selected === l.key && stepStyles.goalLabelSelected]}>
                  {l.label}
                </Text>
                <Text style={stepStyles.expDesc}>{l.desc}</Text>
              </View>
            </View>
          </PressableScale>
        </Animated.View>
      ))}
    </View>
  );
}

// ---- Equipment Step ----
function EquipmentStep({ selected, onSelect }: {
  selected: string[];
  onSelect: (eq: string[]) => void;
}) {
  const presets = [
    { key: 'full_gym', label: 'Full Gym', items: ['barbell', 'dumbbell', 'cable', 'machine', 'kettlebell', 'band', 'pull_up_bar', 'bench'] },
    { key: 'home_gym', label: 'Home Gym', items: ['dumbbell', 'band', 'kettlebell', 'pull_up_bar', 'bench'] },
    { key: 'minimal', label: 'Minimal', items: ['bodyweight', 'band'] },
  ];

  const allEquipment: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'barbell', label: 'Barbell', icon: 'barbell-outline' },
    { key: 'dumbbell', label: 'Dumbbells', icon: 'fitness-outline' },
    { key: 'cable', label: 'Cables', icon: 'git-pull-request-outline' },
    { key: 'machine', label: 'Machines', icon: 'cog-outline' },
    { key: 'kettlebell', label: 'Kettlebells', icon: 'disc-outline' },
    { key: 'band', label: 'Bands', icon: 'infinite-outline' },
    { key: 'pull_up_bar', label: 'Pull-Up Bar', icon: 'remove-outline' },
    { key: 'bench', label: 'Bench', icon: 'bed-outline' },
    { key: 'bodyweight', label: 'Bodyweight', icon: 'body-outline' },
  ];

  const toggleEquipment = (key: string) => {
    if (selected.includes(key)) {
      onSelect(selected.filter((e) => e !== key));
    } else {
      onSelect([...selected, key]);
    }
  };

  return (
    <View style={stepStyles.container}>
      <CoachBubble message="What equipment do you have access to?" />

      <Animated.View entering={FadeInUp.duration(350).delay(100)}>
        <View style={stepStyles.presetRow}>
          {presets.map((p) => (
            <PressableScale key={p.key} onPress={() => onSelect(p.items)} style={{ flex: 1 }}>
              <View style={stepStyles.presetBtn}>
                <Text style={stepStyles.presetText}>{p.label}</Text>
              </View>
            </PressableScale>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(200)}>
        <View style={stepStyles.equipGrid}>
          {allEquipment.map((eq) => (
            <PressableScale key={eq.key} onPress={() => toggleEquipment(eq.key)}>
              <View style={[stepStyles.equipChip, selected.includes(eq.key) && stepStyles.equipChipSelected]}>
                <Ionicons
                  name={eq.icon}
                  size={18}
                  color={selected.includes(eq.key) ? colors.accent : colors.textSecondary}
                  style={{ marginRight: spacing.sm }}
                />
                <Text style={[stepStyles.equipLabel, selected.includes(eq.key) && stepStyles.equipLabelSelected]}>
                  {eq.label}
                </Text>
              </View>
            </PressableScale>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// ---- Training Preferences Step ----
function PreferencesStep({ data, onChange }: {
  data: { daysPerWeek: number; sessionMinutes: number; splitPreference: SplitPreference };
  onChange: (field: string, value: any) => void;
}) {
  const days = [3, 4, 5, 6];
  const durations = [30, 45, 60, 75, 90];
  const splits: { key: SplitPreference; label: string }[] = [
    { key: 'ai_decides', label: 'Let AI Decide' },
    { key: 'full_body', label: 'Full Body' },
    { key: 'upper_lower', label: 'Upper / Lower' },
    { key: 'push_pull_legs', label: 'Push / Pull / Legs' },
  ];

  return (
    <View style={stepStyles.container}>
      <CoachBubble message="Almost there! Let's set up your training schedule." />

      <Animated.View entering={FadeInUp.duration(350).delay(100)}>
        <Text style={stepStyles.fieldLabel}>Days per Week</Text>
        <View style={stepStyles.pillRow}>
          {days.map((d) => (
            <PressableScale key={d} onPress={() => onChange('daysPerWeek', d)}>
              <View style={[stepStyles.pill, data.daysPerWeek === d && stepStyles.pillSelected]}>
                <Text style={[stepStyles.pillText, data.daysPerWeek === d && stepStyles.pillTextSelected]}>
                  {d}
                </Text>
              </View>
            </PressableScale>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(200)}>
        <Text style={stepStyles.fieldLabel}>Session Duration</Text>
        <View style={stepStyles.pillRow}>
          {durations.map((d) => (
            <PressableScale key={d} onPress={() => onChange('sessionMinutes', d)}>
              <View style={[stepStyles.pill, data.sessionMinutes === d && stepStyles.pillSelected]}>
                <Text style={[stepStyles.pillText, data.sessionMinutes === d && stepStyles.pillTextSelected]}>
                  {d}m
                </Text>
              </View>
            </PressableScale>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(300)}>
        <Text style={stepStyles.fieldLabel}>Workout Split</Text>
        {splits.map((s) => (
          <PressableScale key={s.key} onPress={() => onChange('splitPreference', s.key)}>
            <View style={[stepStyles.splitBtn, data.splitPreference === s.key && stepStyles.splitBtnSelected]}>
              <Text style={[stepStyles.splitText, data.splitPreference === s.key && stepStyles.splitTextSelected]}>
                {s.label}
              </Text>
            </View>
          </PressableScale>
        ))}
      </Animated.View>
    </View>
  );
}

// ---- Strength Assessment Step ----
function StrengthStep({ weights, onAdjust }: {
  weights: Record<string, number>;
  onAdjust: (exercise: string, weight: number) => void;
}) {
  const keyLifts: { name: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { name: 'Barbell Bench Press', icon: 'barbell-outline' },
    { name: 'Barbell Squat', icon: 'fitness-outline' },
    { name: 'Barbell Deadlift', icon: 'trophy-outline' },
    { name: 'Overhead Press', icon: 'arrow-up-circle-outline' },
    { name: 'Barbell Bent-Over Row', icon: 'boat-outline' },
    { name: 'Lat Pulldown', icon: 'chevron-down-circle-outline' },
  ];

  return (
    <View style={stepStyles.container}>
      <CoachBubble message="Here are your estimated starting weights. Feel free to adjust." />

      <Animated.View entering={FadeInUp.duration(350).delay(100)}>
        <Card style={stepStyles.infoBox}>
          <Text style={stepStyles.infoText}>
            These are intentionally conservative. The app learns from every workout and adjusts automatically.
          </Text>
        </Card>
      </Animated.View>

      {keyLifts.map((lift, index) => (
        <Animated.View key={lift.name} entering={FadeInUp.duration(300).delay(150 + index * 60)}>
          <View style={stepStyles.weightRow}>
            <View style={stepStyles.weightInfo}>
              <Ionicons name={lift.icon} size={20} color={colors.accentLight} style={{ marginRight: spacing.md }} />
              <Text style={stepStyles.weightName}>{lift.name}</Text>
            </View>
            <View style={stepStyles.weightAdjust}>
              <PressableScale onPress={() => onAdjust(lift.name, Math.max(0, (weights[lift.name] ?? 0) - 5))}>
                <View style={stepStyles.adjustBtn}>
                  <Ionicons name="remove-circle-outline" size={24} color={colors.accent} />
                </View>
              </PressableScale>
              <Text style={stepStyles.weightValue}>{weights[lift.name] ?? 0} lbs</Text>
              <PressableScale onPress={() => onAdjust(lift.name, (weights[lift.name] ?? 0) + 5)}>
                <View style={stepStyles.adjustBtn}>
                  <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
                </View>
              </PressableScale>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

// ---- Ready Step ----
function ReadyStep({ goalLabel, loading }: { goalLabel: string; loading: boolean }) {
  return (
    <View style={[stepStyles.container, { justifyContent: 'center', alignItems: 'center', flex: 1, paddingTop: 60 }]}>
      <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center' }}>
        <View style={readyStyles.iconWrap}>
          <Ionicons name="rocket" size={48} color={colors.accent} />
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ alignItems: 'center' }}>
        <Text style={[stepStyles.title, { textAlign: 'center', marginTop: spacing.xxl }]}>You're All Set!</Text>
        <Text style={[stepStyles.subtitle, { textAlign: 'center', marginBottom: spacing.xxxl }]}>
          Your personalized {goalLabel} program is ready. Let's get your first workout in.
        </Text>
      </Animated.View>
      {loading && (
        <Animated.View entering={FadeIn.duration(300).delay(400)} style={readyStyles.loadingRow}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={readyStyles.loadingText}>Generating your first workout...</Text>
        </Animated.View>
      )}
    </View>
  );
}

const readyStyles = StyleSheet.create({
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accentSoft,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

// ---- Main Onboarding Screen ----
export function OnboardingScreen({ navigation }: any) {
  const { onboardingData, setOnboardingData, setOnboarded, setEstimatedWeights, setProfile } = useStore();
  const [step, setStep] = useState(0);
  const [localWeights, setLocalWeights] = useState<Record<string, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [stepKey, setStepKey] = useState(0);

  const goalLabels: Record<string, string> = {
    build_muscle: 'muscle building',
    get_stronger: 'strength',
    lose_weight: 'weight loss',
    get_lean: 'lean body',
    improve_endurance: 'endurance',
    general_fitness: 'general fitness',
  };

  const animateTransition = (newStep: number) => {
    setStep(newStep);
    setStepKey((k) => k + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const canAdvance = () => {
    switch (step) {
      case 0: return onboardingData.fitnessGoal !== null;
      case 1: return onboardingData.gender !== null && onboardingData.age !== null &&
                     onboardingData.heightCm !== null && onboardingData.weightKg !== null;
      case 2: return onboardingData.experience !== null;
      case 3: return onboardingData.equipment.length > 0;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 2 && onboardingData.weightKg && onboardingData.gender && onboardingData.experience) {
      const w = estimateWeights(onboardingData.weightKg, onboardingData.gender, onboardingData.experience);
      setLocalWeights(w);
    }

    if (step === TOTAL_STEPS - 1) {
      completeOnboarding();
      return;
    }

    animateTransition(step + 1);
  };

  const handleBack = () => {
    if (step > 0) animateTransition(step - 1);
  };

  const completeOnboarding = () => {
    setIsGenerating(true);

    setEstimatedWeights(localWeights);

    setProfile({
      id: 'user-1',
      name: '',
      heightCm: onboardingData.heightCm ?? 178,
      gender: onboardingData.gender as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setTimeout(() => {
      setOnboarded(true);
      setIsGenerating(false);
    }, 1500);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <GoalStep
            selected={onboardingData.fitnessGoal}
            onSelect={(g) => setOnboardingData({ fitnessGoal: g })}
          />
        );
      case 1:
        return (
          <AboutYouStep
            data={onboardingData}
            onChange={(field, value) => setOnboardingData({ [field]: value })}
          />
        );
      case 2:
        return (
          <ExperienceStep
            selected={onboardingData.experience}
            onSelect={(e) => setOnboardingData({ experience: e })}
          />
        );
      case 3:
        return (
          <EquipmentStep
            selected={onboardingData.equipment}
            onSelect={(eq) => setOnboardingData({ equipment: eq })}
          />
        );
      case 4:
        return (
          <PreferencesStep
            data={onboardingData}
            onChange={(field, value) => setOnboardingData({ [field]: value })}
          />
        );
      case 5:
        if (onboardingData.weightKg && Object.keys(localWeights).length > 0) {
          return (
            <StrengthStep
              weights={localWeights}
              onAdjust={(exercise, weight) =>
                setLocalWeights((prev) => ({ ...prev, [exercise]: weight }))
              }
            />
          );
        }
        return (
          <ReadyStep
            goalLabel={goalLabels[onboardingData.fitnessGoal ?? 'general_fitness']}
            loading={isGenerating}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Progress dots */}
        <ProgressDots current={step} total={TOTAL_STEPS} />

        {/* Step content */}
        <ScrollView
          ref={scrollRef}
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View key={stepKey} entering={FadeIn.duration(300)}>
            {renderStep()}
          </Animated.View>
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          {step > 0 ? (
            <PressableScale onPress={handleBack}>
              <View style={styles.backBtn}>
                <Ionicons name="arrow-back" size={18} color={colors.textSecondary} style={{ marginRight: spacing.xs }} />
                <Text style={styles.backText}>Back</Text>
              </View>
            </PressableScale>
          ) : (
            <View />
          )}

          <PressableScale
            onPress={handleNext}
            disabled={!canAdvance() || isGenerating}
          >
            <View style={[styles.nextBtn, !canAdvance() && styles.nextBtnDisabled]}>
              <Text style={styles.nextText}>
                {step === TOTAL_STEPS - 1 ? "Let's Go!" : 'Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: spacing.sm }} />
            </View>
          </PressableScale>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: { flex: 1 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backText: { ...typography.body, color: colors.textSecondary },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
    ...shadows.button,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextText: { ...typography.bodyBold, color: '#fff' },
});

const stepStyles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xxl, paddingTop: spacing.lg },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.cardLight,
  },
  goalCardSelected: { borderColor: colors.accent, backgroundColor: colors.cardLight },
  goalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalIconWrapSelected: {
    backgroundColor: colors.accentDim,
  },
  goalLabel: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.xs },
  goalLabelSelected: { color: colors.accent },
  goalDesc: { ...typography.caption, color: colors.textSecondary },

  fieldLabel: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.xl },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heightRow: { flexDirection: 'row', alignItems: 'center' },
  heightUnit: { ...typography.body, color: colors.textSecondary, width: 20 },

  pillRow: { flexDirection: 'row', gap: spacing.sm + 2 },
  pill: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pillSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  pillText: { ...typography.body, color: colors.textSecondary },
  pillTextSelected: { color: colors.accentLight, fontWeight: '600' },

  expCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.cardLight,
  },
  expCardSelected: { borderColor: colors.accent, backgroundColor: colors.cardLight },
  expIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  expIconWrapSelected: {
    backgroundColor: colors.accentDim,
  },
  expLabel: { ...typography.bodyBold, color: colors.text },
  expDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  presetRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  presetBtn: {
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  presetText: { ...typography.captionBold, color: colors.accent },

  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  equipChip: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  equipChipSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  equipLabel: { ...typography.body, color: colors.textSecondary },
  equipLabelSelected: { color: colors.accentLight },

  splitBtn: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  splitBtnSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  splitText: { ...typography.body, color: colors.textSecondary },
  splitTextSelected: { color: colors.accentLight, fontWeight: '600' },

  // Weight estimation
  infoBox: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    marginBottom: spacing.xl,
  },
  infoText: { ...typography.caption, color: colors.textSecondary, lineHeight: 20 },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weightInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  weightName: { ...typography.body, color: colors.text, flex: 1 },
  weightAdjust: { flexDirection: 'row', alignItems: 'center' },
  adjustBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightValue: { ...typography.bodyBold, color: colors.text, width: 80, textAlign: 'center' },
});
