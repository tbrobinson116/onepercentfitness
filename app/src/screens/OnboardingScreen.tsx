import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
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

  // Multipliers of body weight by experience (conservative — ~60-70% of typical capability)
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
    // Bodyweight exercises
    'Push-Ups': 0,
    'Pull-Ups': 0,
    'Dips': 0,
    'Chest Dips': 0,
    'Plank': 0,
    'Hanging Leg Raise': 0,
  };
}

// ---- Goal Selection Step ----
function GoalStep({ selected, onSelect }: {
  selected: FitnessGoalType | null;
  onSelect: (g: FitnessGoalType) => void;
}) {
  const goals: { key: FitnessGoalType; icon: string; label: string; desc: string }[] = [
    { key: 'build_muscle', icon: '💪', label: 'Build Muscle', desc: 'Gain size and definition' },
    { key: 'get_stronger', icon: '🏋️', label: 'Get Stronger', desc: 'Increase strength and power' },
    { key: 'lose_weight', icon: '⚡', label: 'Lose Weight', desc: 'Burn fat and drop pounds' },
    { key: 'get_lean', icon: '🔥', label: 'Get Lean', desc: 'Tone up and cut body fat' },
    { key: 'improve_endurance', icon: '🏃', label: 'Improve Endurance', desc: 'Build stamina and cardio fitness' },
    { key: 'general_fitness', icon: '🎯', label: 'General Fitness', desc: 'Overall health and wellness' },
  ];

  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.title}>What's your #1 goal?</Text>
      <Text style={stepStyles.subtitle}>This helps us build your perfect program</Text>
      <View style={stepStyles.grid}>
        {goals.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[stepStyles.goalCard, selected === g.key && stepStyles.goalCardSelected]}
            onPress={() => onSelect(g.key)}
            activeOpacity={0.7}
          >
            <Text style={stepStyles.goalIcon}>{g.icon}</Text>
            <Text style={[stepStyles.goalLabel, selected === g.key && stepStyles.goalLabelSelected]}>
              {g.label}
            </Text>
            <Text style={stepStyles.goalDesc}>{g.desc}</Text>
          </TouchableOpacity>
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
      <Text style={stepStyles.title}>About You</Text>
      <Text style={stepStyles.subtitle}>Helps us personalize your experience</Text>

      <Text style={stepStyles.fieldLabel}>Gender</Text>
      <View style={stepStyles.pillRow}>
        {genders.map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[stepStyles.pill, data.gender === g.key && stepStyles.pillSelected]}
            onPress={() => onChange('gender', g.key)}
          >
            <Text style={[stepStyles.pillText, data.gender === g.key && stepStyles.pillTextSelected]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={stepStyles.fieldLabel}>Age</Text>
      <TextInput
        style={stepStyles.input}
        value={data.age?.toString() ?? ''}
        onChangeText={(v) => onChange('age', parseInt(v) || null)}
        keyboardType="number-pad"
        placeholder="25"
        placeholderTextColor={colors.textSecondary}
        maxLength={3}
      />

      <Text style={stepStyles.fieldLabel}>Height</Text>
      <View style={stepStyles.heightRow}>
        <TextInput
          style={[stepStyles.input, { flex: 1, marginRight: 8 }]}
          value={heightFt}
          onChangeText={(v) => { setHeightFt(v); updateHeight(v, heightIn); }}
          keyboardType="number-pad"
          placeholder="5"
          placeholderTextColor={colors.textSecondary}
          maxLength={1}
        />
        <Text style={stepStyles.heightUnit}>ft</Text>
        <TextInput
          style={[stepStyles.input, { flex: 1, marginHorizontal: 8 }]}
          value={heightIn}
          onChangeText={(v) => { setHeightIn(v); updateHeight(heightFt, v); }}
          keyboardType="number-pad"
          placeholder="10"
          placeholderTextColor={colors.textSecondary}
          maxLength={2}
        />
        <Text style={stepStyles.heightUnit}>in</Text>
      </View>

      <Text style={stepStyles.fieldLabel}>Current Weight (lbs)</Text>
      <TextInput
        style={stepStyles.input}
        value={weightLbs}
        onChangeText={(v) => { setWeightLbs(v); updateWeight(v); }}
        keyboardType="number-pad"
        placeholder="180"
        placeholderTextColor={colors.textSecondary}
        maxLength={3}
      />
    </View>
  );
}

// ---- Experience Step ----
function ExperienceStep({ selected, onSelect }: {
  selected: ExperienceLevel | null;
  onSelect: (e: ExperienceLevel) => void;
}) {
  const levels: { key: ExperienceLevel; label: string; desc: string; icon: string }[] = [
    { key: 'beginner', label: 'Beginner', desc: 'New to lifting or < 6 months', icon: '🌱' },
    { key: 'intermediate', label: 'Intermediate', desc: '6 months to 2 years of training', icon: '💪' },
    { key: 'advanced', label: 'Advanced', desc: '2+ years of consistent training', icon: '🏆' },
  ];

  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.title}>Experience Level</Text>
      <Text style={stepStyles.subtitle}>We'll adjust weights and complexity accordingly</Text>
      {levels.map((l) => (
        <TouchableOpacity
          key={l.key}
          style={[stepStyles.expCard, selected === l.key && stepStyles.expCardSelected]}
          onPress={() => onSelect(l.key)}
          activeOpacity={0.7}
        >
          <Text style={stepStyles.expIcon}>{l.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[stepStyles.expLabel, selected === l.key && stepStyles.goalLabelSelected]}>
              {l.label}
            </Text>
            <Text style={stepStyles.expDesc}>{l.desc}</Text>
          </View>
        </TouchableOpacity>
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
    { key: 'minimal', label: 'Minimal / Bodyweight', items: ['bodyweight', 'band'] },
  ];

  const allEquipment: { key: string; label: string; icon: string }[] = [
    { key: 'barbell', label: 'Barbell', icon: '🏋️' },
    { key: 'dumbbell', label: 'Dumbbells', icon: '🔩' },
    { key: 'cable', label: 'Cables', icon: '🔗' },
    { key: 'machine', label: 'Machines', icon: '⚙️' },
    { key: 'kettlebell', label: 'Kettlebells', icon: '🔔' },
    { key: 'band', label: 'Bands', icon: '〰️' },
    { key: 'pull_up_bar', label: 'Pull-Up Bar', icon: '🪜' },
    { key: 'bench', label: 'Bench', icon: '🪑' },
    { key: 'bodyweight', label: 'Bodyweight', icon: '🧍' },
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
      <Text style={stepStyles.title}>Your Equipment</Text>
      <Text style={stepStyles.subtitle}>Quick start or pick individual items</Text>

      <View style={stepStyles.presetRow}>
        {presets.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[stepStyles.presetBtn]}
            onPress={() => onSelect(p.items)}
            activeOpacity={0.7}
          >
            <Text style={stepStyles.presetText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={stepStyles.equipGrid}>
        {allEquipment.map((eq) => (
          <TouchableOpacity
            key={eq.key}
            style={[stepStyles.equipChip, selected.includes(eq.key) && stepStyles.equipChipSelected]}
            onPress={() => toggleEquipment(eq.key)}
            activeOpacity={0.7}
          >
            <Text style={stepStyles.equipIcon}>{eq.icon}</Text>
            <Text style={[stepStyles.equipLabel, selected.includes(eq.key) && stepStyles.equipLabelSelected]}>
              {eq.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
      <Text style={stepStyles.title}>Training Preferences</Text>
      <Text style={stepStyles.subtitle}>Fine-tune your program</Text>

      <Text style={stepStyles.fieldLabel}>Days per Week</Text>
      <View style={stepStyles.pillRow}>
        {days.map((d) => (
          <TouchableOpacity
            key={d}
            style={[stepStyles.pill, data.daysPerWeek === d && stepStyles.pillSelected]}
            onPress={() => onChange('daysPerWeek', d)}
          >
            <Text style={[stepStyles.pillText, data.daysPerWeek === d && stepStyles.pillTextSelected]}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={stepStyles.fieldLabel}>Session Duration</Text>
      <View style={stepStyles.pillRow}>
        {durations.map((d) => (
          <TouchableOpacity
            key={d}
            style={[stepStyles.pill, data.sessionMinutes === d && stepStyles.pillSelected]}
            onPress={() => onChange('sessionMinutes', d)}
          >
            <Text style={[stepStyles.pillText, data.sessionMinutes === d && stepStyles.pillTextSelected]}>
              {d}m
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={stepStyles.fieldLabel}>Workout Split</Text>
      {splits.map((s) => (
        <TouchableOpacity
          key={s.key}
          style={[stepStyles.splitBtn, data.splitPreference === s.key && stepStyles.splitBtnSelected]}
          onPress={() => onChange('splitPreference', s.key)}
        >
          <Text style={[stepStyles.splitText, data.splitPreference === s.key && stepStyles.splitTextSelected]}>
            {s.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ---- Strength Assessment Step ----
function StrengthStep({ weights, onAdjust }: {
  weights: Record<string, number>;
  onAdjust: (exercise: string, weight: number) => void;
}) {
  // Show key compound lifts for assessment
  const keyLifts = [
    { name: 'Barbell Bench Press', icon: '🏋️' },
    { name: 'Barbell Squat', icon: '🦵' },
    { name: 'Barbell Deadlift', icon: '💀' },
    { name: 'Overhead Press', icon: '🙌' },
    { name: 'Barbell Bent-Over Row', icon: '🚣' },
    { name: 'Lat Pulldown', icon: '🔽' },
  ];

  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.title}>Starting Weights</Text>
      <Text style={stepStyles.subtitle}>
        We estimated conservative starting weights based on your profile. Adjust anything that feels off.
      </Text>
      <View style={stepStyles.infoBox}>
        <Text style={stepStyles.infoText}>
          These are intentionally conservative. The app learns from every workout and adjusts automatically.
        </Text>
      </View>

      {keyLifts.map((lift) => (
        <View key={lift.name} style={stepStyles.weightRow}>
          <View style={stepStyles.weightInfo}>
            <Text style={stepStyles.weightIcon}>{lift.icon}</Text>
            <Text style={stepStyles.weightName}>{lift.name}</Text>
          </View>
          <View style={stepStyles.weightAdjust}>
            <TouchableOpacity
              style={stepStyles.adjustBtn}
              onPress={() => onAdjust(lift.name, Math.max(0, (weights[lift.name] ?? 0) - 5))}
            >
              <Text style={stepStyles.adjustText}>−</Text>
            </TouchableOpacity>
            <Text style={stepStyles.weightValue}>{weights[lift.name] ?? 0} lbs</Text>
            <TouchableOpacity
              style={stepStyles.adjustBtn}
              onPress={() => onAdjust(lift.name, (weights[lift.name] ?? 0) + 5)}
            >
              <Text style={stepStyles.adjustText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

// ---- Ready Step ----
function ReadyStep({ goalLabel, loading }: { goalLabel: string; loading: boolean }) {
  return (
    <View style={[stepStyles.container, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
      <Text style={{ fontSize: 64, marginBottom: 24 }}>🚀</Text>
      <Text style={[stepStyles.title, { textAlign: 'center' }]}>You're All Set!</Text>
      <Text style={[stepStyles.subtitle, { textAlign: 'center', marginBottom: 32 }]}>
        Your personalized {goalLabel} program is ready. Let's get your first workout in.
      </Text>
      {loading && (
        <View style={stepStyles.loadingRow}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={stepStyles.loadingText}>Generating your first workout...</Text>
        </View>
      )}
    </View>
  );
}

// ---- Main Onboarding Screen ----
export function OnboardingScreen({ navigation }: any) {
  const { onboardingData, setOnboardingData, setOnboarded, setEstimatedWeights, setProfile } = useStore();
  const [step, setStep] = useState(0);
  const [localWeights, setLocalWeights] = useState<Record<string, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goalLabels: Record<string, string> = {
    build_muscle: 'muscle building',
    get_stronger: 'strength',
    lose_weight: 'weight loss',
    get_lean: 'lean body',
    improve_endurance: 'endurance',
    general_fitness: 'general fitness',
  };

  const animateTransition = (newStep: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(newStep);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
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
      // After experience step, calculate estimated weights
      const w = estimateWeights(onboardingData.weightKg, onboardingData.gender, onboardingData.experience);
      setLocalWeights(w);
    }

    if (step === TOTAL_STEPS - 1) {
      // Complete onboarding
      completeOnboarding();
      return;
    }

    // Skip equipment step straight to preferences if step 3 → 4
    animateTransition(step + 1);
  };

  const handleBack = () => {
    if (step > 0) animateTransition(step - 1);
  };

  const completeOnboarding = () => {
    setIsGenerating(true);

    // Save estimated weights
    setEstimatedWeights(localWeights);

    // Create initial profile
    setProfile({
      id: 'user-1',
      name: '',
      heightCm: onboardingData.heightCm ?? 178,
      gender: onboardingData.gender as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Mark onboarding complete
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
        // Show strength assessment if they have weight data, otherwise ready screen
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
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i <= step && styles.progressDotActive]}
            />
          ))}
        </View>

        {/* Step content */}
        <ScrollView ref={scrollRef} style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderStep()}
          </Animated.View>
        </ScrollView>

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <TouchableOpacity
            style={[styles.nextBtn, !canAdvance() && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canAdvance() || isGenerating}
            activeOpacity={0.8}
          >
            <Text style={styles.nextText}>
              {step === TOTAL_STEPS - 1 ? "Let's Go!" : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  progressDot: {
    width: (SCREEN_WIDTH - 80) / TOTAL_STEPS,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressDotActive: { backgroundColor: colors.accent },
  scrollContent: { flex: 1 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  backText: { ...typography.body, color: colors.textSecondary },
  nextBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextText: { ...typography.bodyBold, color: '#fff' },
});

const stepStyles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 16 },
  title: { ...typography.h1, color: colors.text, marginBottom: 8 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: 24 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardSelected: { borderColor: colors.accent, backgroundColor: colors.cardLight },
  goalIcon: { fontSize: 32, marginBottom: 8 },
  goalLabel: { ...typography.bodyBold, color: colors.text, marginBottom: 4 },
  goalLabelSelected: { color: colors.accent },
  goalDesc: { ...typography.caption, color: colors.textSecondary },

  fieldLabel: { ...typography.bodyBold, color: colors.text, marginBottom: 8, marginTop: 20 },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heightRow: { flexDirection: 'row', alignItems: 'center' },
  heightUnit: { ...typography.body, color: colors.textSecondary, width: 20 },

  pillRow: { flexDirection: 'row', gap: 10 },
  pill: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pillSelected: { borderColor: colors.accent, backgroundColor: colors.cardLight },
  pillText: { ...typography.body, color: colors.textSecondary },
  pillTextSelected: { color: colors.accent, fontWeight: '600' },

  expCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  expCardSelected: { borderColor: colors.accent, backgroundColor: colors.cardLight },
  expIcon: { fontSize: 32, marginRight: 16 },
  expLabel: { ...typography.bodyBold, color: colors.text },
  expDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  presetBtn: {
    flex: 1,
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  presetText: { ...typography.caption, color: colors.accent, fontWeight: '600' },

  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  equipChip: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  equipChipSelected: { borderColor: colors.accent, backgroundColor: colors.cardLight },
  equipIcon: { fontSize: 20, marginRight: 8 },
  equipLabel: { ...typography.body, color: colors.textSecondary },
  equipLabelSelected: { color: colors.accent },

  splitBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  splitBtnSelected: { borderColor: colors.accent, backgroundColor: colors.cardLight },
  splitText: { ...typography.body, color: colors.textSecondary },
  splitTextSelected: { color: colors.accent, fontWeight: '600' },

  // Weight estimation
  infoBox: {
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
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
  weightIcon: { fontSize: 20, marginRight: 12 },
  weightName: { ...typography.body, color: colors.text, flex: 1 },
  weightAdjust: { flexDirection: 'row', alignItems: 'center' },
  adjustBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustText: { color: colors.accent, fontSize: 20, fontWeight: '700' },
  weightValue: { ...typography.bodyBold, color: colors.text, width: 80, textAlign: 'center' },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loadingText: { ...typography.body, color: colors.textSecondary },
});
