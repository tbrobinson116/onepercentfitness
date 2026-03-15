import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { PressableScale, FadeInView } from '../components/ui';
import { useStore } from '../services/store';
import { api } from '../services/api';
import type { FitnessGoalType, ExperienceLevel } from '../services/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---- Types ----
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quickReplies?: QuickReply[];
  timestamp: number;
}

interface QuickReply {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

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
    'Barbell Bent-Over Row': round5(bodyWeightLbs * m.row),
    'Dumbbell Row': round5((bodyWeightLbs * m.row) / 2 * 0.85),
    'Seated Cable Row': round5(bodyWeightLbs * m.row * 0.85),
    'Lat Pulldown': round5(bodyWeightLbs * m.latPull),
    'Leg Press': round5(bodyWeightLbs * m.legPress),
    'Leg Extension': round5(bodyWeightLbs * m.squat * 0.35),
    'Leg Curl': round5(bodyWeightLbs * m.squat * 0.30),
    'Hip Thrust': round5(bodyWeightLbs * m.squat * 0.85),
    'Barbell Curl': round5(bodyWeightLbs * m.curl * 2),
    'Dumbbell Curl': round5(bodyWeightLbs * m.curl),
    'Hammer Curl': round5(bodyWeightLbs * m.curl * 1.1),
    'Tricep Pushdown': round5(bodyWeightLbs * m.tricep * 1.5),
    'Skull Crushers': round5(bodyWeightLbs * m.tricep * 1.8),
    'Lateral Raises': round5(bodyWeightLbs * m.lateral),
    'Face Pulls': round5(bodyWeightLbs * m.lateral * 1.5),
    'Cable Flyes': round5(bodyWeightLbs * m.lateral * 1.3),
    'Push-Ups': 0,
    'Pull-Ups': 0,
    'Dips': 0,
    'Plank': 0,
  };
}

// ---- Chat Bubble ----
function CoachBubble({ message, isLatest }: { message: ChatMessage; isLatest: boolean }) {
  return (
    <FadeInView delay={isLatest ? 100 : 0}>
      <View style={bubbleStyles.coachRow}>
        <View style={bubbleStyles.avatar}>
          <Ionicons name="sparkles" size={16} color={colors.accent} />
        </View>
        <View style={bubbleStyles.coachBubble}>
          <Text style={bubbleStyles.coachText}>{message.content}</Text>
        </View>
      </View>
    </FadeInView>
  );
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <FadeInView delay={0}>
      <View style={bubbleStyles.userRow}>
        <View style={bubbleStyles.userBubble}>
          <Text style={bubbleStyles.userText}>{message.content}</Text>
        </View>
      </View>
    </FadeInView>
  );
}

const bubbleStyles = StyleSheet.create({
  coachRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    paddingRight: 50,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accentSoft,
  },
  coachBubble: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardLight,
  },
  coachText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
    paddingLeft: 50,
  },
  userBubble: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userText: {
    ...typography.body,
    color: '#fff',
    lineHeight: 22,
  },
});

// ---- Quick Reply Buttons ----
function QuickReplies({ replies, onSelect }: { replies: QuickReply[]; onSelect: (value: string) => void }) {
  return (
    <FadeInView delay={200}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={qrStyles.container}
      >
        {replies.map((reply, index) => (
          <PressableScale key={index} onPress={() => onSelect(reply.value)}>
            <View style={qrStyles.chip}>
              {reply.icon && (
                <Ionicons name={reply.icon} size={16} color={colors.accent} style={{ marginRight: 6 }} />
              )}
              <Text style={qrStyles.chipText}>{reply.label}</Text>
            </View>
          </PressableScale>
        ))}
      </ScrollView>
    </FadeInView>
  );
}

const qrStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentDim,
    borderRadius: borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.accentSoft,
  },
  chipText: {
    ...typography.body,
    color: colors.accentLight,
    fontWeight: '600',
  },
});

// ---- Program Preview Card ----
function ProgramPreview({ program, onAccept, onAdjust }: {
  program: any;
  onAccept: () => void;
  onAdjust: () => void;
}) {
  return (
    <FadeInView delay={200}>
      <View style={programStyles.container}>
        <View style={programStyles.header}>
          <View style={programStyles.iconWrap}>
            <Ionicons name="barbell" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={programStyles.name}>{program.name}</Text>
            <Text style={programStyles.meta}>
              {program.durationWeeks} weeks  •  {program.daysPerWeek} days/week  •  {program.difficulty}
            </Text>
          </View>
        </View>

        {program.description && (
          <Text style={programStyles.description}>{program.description}</Text>
        )}

        {program.workouts?.map((day: any, i: number) => (
          <View key={i} style={programStyles.dayCard}>
            <Text style={programStyles.dayName}>{day.dayName}</Text>
            <View style={programStyles.exerciseList}>
              {day.exercises?.map((ex: any, j: number) => (
                <View key={j} style={programStyles.exerciseRow}>
                  <Text style={programStyles.exerciseDot}>•</Text>
                  <Text style={programStyles.exerciseName}>{ex.name}</Text>
                  <Text style={programStyles.exerciseSets}>
                    {ex.sets}x{ex.repsMin}{ex.repsMax !== ex.repsMin ? `-${ex.repsMax}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={programStyles.actions}>
          <PressableScale onPress={onAdjust} style={{ flex: 1 }}>
            <View style={programStyles.adjustBtn}>
              <Ionicons name="create-outline" size={18} color={colors.accent} />
              <Text style={programStyles.adjustText}>Adjust</Text>
            </View>
          </PressableScale>
          <PressableScale onPress={onAccept} style={{ flex: 1 }}>
            <View style={programStyles.acceptBtn}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={programStyles.acceptText}>Let's Go!</Text>
            </View>
          </PressableScale>
        </View>
      </View>
    </FadeInView>
  );
}

const programStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentSoft,
    ...shadows.cardLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  name: {
    ...typography.h3,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  dayCard: {
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dayName: {
    ...typography.bodyBold,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  exerciseList: {
    gap: 4,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseDot: {
    color: colors.textMuted,
    marginRight: spacing.sm,
    fontSize: 10,
  },
  exerciseName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontSize: 13,
  },
  exerciseSets: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentSoft,
  },
  adjustText: {
    ...typography.bodyBold,
    color: colors.accent,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    ...shadows.button,
  },
  acceptText: {
    ...typography.bodyBold,
    color: '#fff',
  },
});

// ---- Typing Indicator ----
function TypingIndicator() {
  return (
    <View style={typingStyles.row}>
      <View style={bubbleStyles.avatar}>
        <Ionicons name="sparkles" size={16} color={colors.accent} />
      </View>
      <View style={typingStyles.bubble}>
        <View style={typingStyles.dots}>
          <View style={[typingStyles.dot, { opacity: 0.4 }]} />
          <View style={[typingStyles.dot, { opacity: 0.7 }]} />
          <View style={typingStyles.dot} />
        </View>
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  bubble: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
});

// ---- Fallback coach responses when API is unavailable ----
const FALLBACK_CONVERSATION: { trigger: number; message: string; quickReplies?: QuickReply[] }[] = [
  {
    trigger: 0, // Initial greeting
    message: "Hey! I'm Coach — your AI training partner. I'm going to build you a workout program that's dialed in for YOUR goals, experience, and equipment. Think of me as that knowledgeable friend at the gym who actually knows what they're talking about.\n\nSo first things first — what's your main goal right now?",
    quickReplies: [
      { label: 'Build Muscle', value: 'I want to build muscle and gain size', icon: 'barbell' },
      { label: 'Get Stronger', value: 'I want to get stronger and increase my lifts', icon: 'fitness' },
      { label: 'Lose Weight', value: 'I want to lose weight and burn fat', icon: 'flash' },
      { label: 'Get Lean', value: 'I want to get lean and tone up', icon: 'flame' },
      { label: 'Improve Endurance', value: 'I want to improve my endurance and cardio', icon: 'bicycle' },
      { label: 'General Health', value: 'Just general fitness and health', icon: 'heart' },
    ],
  },
  {
    trigger: 1, // After goal
    message: "Solid choice. That gives me a clear direction for your programming.\n\nHow long have you been training? This helps me dial in the right volume and exercise selection.",
    quickReplies: [
      { label: 'Brand New', value: "I'm brand new to lifting, less than 3 months", icon: 'leaf' },
      { label: '6 months - 2 years', value: "I've been training for about 6 months to 2 years", icon: 'barbell-outline' },
      { label: '2+ Years', value: "I've been training consistently for over 2 years", icon: 'trophy' },
    ],
  },
  {
    trigger: 2, // After experience
    message: "Got it. Now — what are you working with? What equipment do you have access to?",
    quickReplies: [
      { label: 'Full Gym', value: 'I have access to a full gym with barbells, dumbbells, cables, and machines', icon: 'business' },
      { label: 'Home Gym', value: 'I have a home gym with dumbbells, a bench, and some bands', icon: 'home' },
      { label: 'Minimal', value: 'Minimal equipment - just bodyweight and resistance bands', icon: 'body' },
    ],
  },
  {
    trigger: 3, // After equipment
    message: "How many days per week can you realistically commit to training? Be honest — consistency beats intensity.",
    quickReplies: [
      { label: '3 days', value: '3 days per week', icon: 'calendar-outline' },
      { label: '4 days', value: '4 days per week', icon: 'calendar-outline' },
      { label: '5 days', value: '5 days per week', icon: 'calendar-outline' },
      { label: '6 days', value: '6 days per week', icon: 'calendar-outline' },
    ],
  },
  {
    trigger: 4, // After days
    message: "Quick stats for programming — I need your gender, age, height and weight so I can estimate starting weights and set up your macros. What's your info?",
    quickReplies: [
      { label: 'Male', value: "I'm male", icon: 'man-outline' },
      { label: 'Female', value: "I'm female", icon: 'woman-outline' },
    ],
  },
  {
    trigger: 5, // After gender - need more info
    message: "And your age, height, and current weight?",
  },
  {
    trigger: 6, // After stats
    message: "Any injuries or limitations I should know about? Bad shoulder, knee issues, back problems? If none, just say none.",
  },
  {
    trigger: 7, // After injuries
    message: "Last thing — any preferences? Exercises you love, exercises you hate, anything specific you want included or excluded?",
  },
];

// ---- Parse user info from conversation ----
function parseUserInfo(messages: ChatMessage[]) {
  const info: {
    goal: FitnessGoalType | null;
    experience: ExperienceLevel | null;
    equipment: string[];
    daysPerWeek: number;
    gender: 'male' | 'female' | 'other' | null;
    age: number | null;
    heightCm: number | null;
    weightKg: number | null;
    injuries: string;
    preferences: string;
  } = {
    goal: null,
    experience: null,
    equipment: [],
    daysPerWeek: 4,
    gender: null,
    age: null,
    heightCm: null,
    weightKg: null,
    injuries: '',
    preferences: '',
  };

  const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content.toLowerCase());

  for (const msg of userMessages) {
    // Goal
    if (msg.includes('build muscle') || msg.includes('gain size') || msg.includes('hypertrophy')) info.goal = 'build_muscle';
    else if (msg.includes('get stronger') || msg.includes('strength') || msg.includes('increase my lifts')) info.goal = 'get_stronger';
    else if (msg.includes('lose weight') || msg.includes('burn fat') || msg.includes('weight loss')) info.goal = 'lose_weight';
    else if (msg.includes('get lean') || msg.includes('tone') || msg.includes('cut')) info.goal = 'get_lean';
    else if (msg.includes('endurance') || msg.includes('cardio') || msg.includes('stamina')) info.goal = 'improve_endurance';
    else if (msg.includes('general fitness') || msg.includes('health') || msg.includes('overall')) info.goal = 'general_fitness';

    // Experience
    if (msg.includes('brand new') || msg.includes('beginner') || msg.includes('less than 3 months') || msg.includes('never lifted')) info.experience = 'beginner';
    else if (msg.includes('6 months') || msg.includes('year') || msg.includes('intermediate') || msg.includes('some experience')) info.experience = 'intermediate';
    else if (msg.includes('2+ year') || msg.includes('over 2 year') || msg.includes('advanced') || msg.includes('consistently for')) info.experience = 'advanced';

    // Equipment
    if (msg.includes('full gym')) info.equipment = ['barbell', 'dumbbell', 'cable', 'machine', 'kettlebell', 'bench', 'pull_up_bar'];
    else if (msg.includes('home gym')) info.equipment = ['dumbbell', 'bench', 'band', 'kettlebell'];
    else if (msg.includes('minimal') || msg.includes('bodyweight')) info.equipment = ['bodyweight', 'band'];

    // Days
    const daysMatch = msg.match(/(\d)\s*days?\s*(per|a)?\s*week/);
    if (daysMatch) info.daysPerWeek = parseInt(daysMatch[1]);

    // Gender
    if (msg.includes("i'm male") || msg.includes('im male') || msg === 'male') info.gender = 'male';
    else if (msg.includes("i'm female") || msg.includes('im female') || msg === 'female') info.gender = 'female';

    // Age, height, weight - try to parse numbers
    const ageMatch = msg.match(/(?:i'm|im|i am|age)\s*(\d{2})/);
    if (ageMatch) info.age = parseInt(ageMatch[1]);

    const heightMatch = msg.match(/(\d)['']\s*(\d{1,2})[""]/);
    const heightMatch2 = msg.match(/(\d)\s*(?:foot|feet|ft)\s*(\d{1,2})?/);
    if (heightMatch) {
      info.heightCm = Math.round((parseInt(heightMatch[1]) * 12 + parseInt(heightMatch[2])) * 2.54);
    } else if (heightMatch2) {
      const inches = parseInt(heightMatch2[2] || '0');
      info.heightCm = Math.round((parseInt(heightMatch2[1]) * 12 + inches) * 2.54);
    }

    const weightMatch = msg.match(/(\d{2,3})\s*(?:lbs?|pounds?)/);
    if (weightMatch) info.weightKg = Math.round(parseInt(weightMatch[1]) / 2.205);

    // Injuries
    if (msg.includes('none') && (msg.includes('injur') || msg.includes('limitation'))) {
      info.injuries = 'none';
    } else if (msg.includes('shoulder') || msg.includes('knee') || msg.includes('back') || msg.includes('wrist')) {
      info.injuries = msg;
    }
  }

  return info;
}

// ---- Main Onboarding Screen ----
export function OnboardingScreen({ navigation }: any) {
  const {
    setOnboardingData,
    setOnboarded,
    setEstimatedWeights,
    setProfile,
    addProgram,
  } = useStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isCoachTyping, setIsCoachTyping] = useState(false);
  const [currentQuickReplies, setCurrentQuickReplies] = useState<QuickReply[] | null>(null);
  const [generatedProgram, setGeneratedProgram] = useState<any>(null);
  const [conversationStep, setConversationStep] = useState(0);
  const [useAI, setUseAI] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isCoachTyping, generatedProgram]);

  // Send initial coach greeting
  useEffect(() => {
    sendCoachMessage(
      FALLBACK_CONVERSATION[0].message,
      FALLBACK_CONVERSATION[0].quickReplies,
    );
  }, []);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const msg: ChatMessage = {
      id: Date.now().toString() + Math.random(),
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const sendCoachMessage = useCallback((content: string, quickReplies?: QuickReply[]) => {
    setIsCoachTyping(true);
    // Simulate typing delay for natural feel
    const delay = Math.min(content.length * 15, 2000);
    setTimeout(() => {
      addMessage('assistant', content);
      setCurrentQuickReplies(quickReplies ?? null);
      setIsCoachTyping(false);
    }, delay);
  }, [addMessage]);

  const sendMessageToCoach = useCallback(async (userText: string) => {
    addMessage('user', userText);
    setInputText('');
    setCurrentQuickReplies(null);

    const nextStep = conversationStep + 1;
    setConversationStep(nextStep);

    // Try AI first
    if (useAI) {
      try {
        setIsCoachTyping(true);
        const allMessages = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user' as const, content: userText },
        ];

        const response = await api.coachChat(allMessages, { isOnboarding: true });

        setIsCoachTyping(false);

        if (response.program) {
          addMessage('assistant', response.message);
          setGeneratedProgram(response.program);
        } else {
          // Check if we have enough info to suggest generating
          const info = parseUserInfo([
            ...messages,
            { id: '', role: 'user', content: userText, timestamp: 0 },
          ]);
          const hasEnoughInfo = info.goal && info.experience && info.equipment.length > 0 && info.daysPerWeek;

          if (hasEnoughInfo && nextStep >= 7) {
            addMessage('assistant', response.message + "\n\nI've got everything I need. Let me build your program...");
            setIsCoachTyping(true);
            // Trigger program generation
            setTimeout(async () => {
              try {
                const programResponse = await api.coachChat([
                  ...allMessages,
                  { role: 'assistant', content: response.message },
                  { role: 'user', content: 'Yes, please generate my workout program now.' },
                ], { isOnboarding: true });

                setIsCoachTyping(false);
                if (programResponse.program) {
                  addMessage('assistant', programResponse.message || 'Here\'s your program!');
                  setGeneratedProgram(programResponse.program);
                } else {
                  addMessage('assistant', programResponse.message);
                }
              } catch {
                setIsCoachTyping(false);
                generateFallbackProgram();
              }
            }, 500);
          } else {
            addMessage('assistant', response.message);
          }
        }
        return;
      } catch {
        setUseAI(false);
        setIsCoachTyping(false);
        // Fall through to fallback
      }
    }

    // Fallback conversation flow
    const fallback = FALLBACK_CONVERSATION[nextStep];
    if (fallback) {
      sendCoachMessage(fallback.message, fallback.quickReplies);
    } else if (nextStep >= 8) {
      // We have enough info — generate program
      sendCoachMessage("Alright, I've got everything I need. Let me put together your program...");
      setTimeout(() => generateFallbackProgram(), 2000);
    }
  }, [messages, conversationStep, useAI, addMessage, sendCoachMessage]);

  const generateFallbackProgram = useCallback(() => {
    const info = parseUserInfo(messages);

    // Build a sensible program based on parsed info
    const isStrength = info.goal === 'get_stronger';
    const isEndurance = info.goal === 'improve_endurance';
    const hasBarbell = info.equipment.includes('barbell');
    const days = info.daysPerWeek;

    let program: any;

    if (days <= 3) {
      // Full body program
      program = {
        name: `${isStrength ? 'Strength' : 'Muscle Building'} Full Body`,
        description: `A ${days}-day full body program designed for ${info.goal?.replace('_', ' ') ?? 'building muscle'}. Each session hits all major muscle groups with compound movements.`,
        durationWeeks: 8,
        daysPerWeek: days,
        difficulty: info.experience ?? 'beginner',
        workouts: Array.from({ length: days }, (_, i) => ({
          dayName: `Day ${i + 1} - Full Body`,
          muscleGroups: ['chest', 'back', 'legs', 'shoulders'],
          exercises: [
            hasBarbell
              ? { name: 'Barbell Squat', sets: isStrength ? 5 : 4, repsMin: isStrength ? 3 : 8, repsMax: isStrength ? 5 : 12, restSeconds: isStrength ? 180 : 90, notes: '' }
              : { name: 'Goblet Squat', sets: 4, repsMin: 10, repsMax: 15, restSeconds: 60, notes: '' },
            hasBarbell
              ? { name: i % 2 === 0 ? 'Barbell Bench Press' : 'Overhead Press', sets: isStrength ? 5 : 4, repsMin: isStrength ? 3 : 8, repsMax: isStrength ? 5 : 12, restSeconds: isStrength ? 180 : 90, notes: '' }
              : { name: 'Push-Ups', sets: 4, repsMin: 8, repsMax: 15, restSeconds: 60, notes: '' },
            hasBarbell
              ? { name: 'Barbell Bent-Over Row', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 90, notes: '' }
              : { name: 'Dumbbell Row', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 60, notes: '' },
            hasBarbell
              ? { name: 'Romanian Deadlift', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, notes: '' }
              : { name: 'Hip Thrust', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, notes: '' },
            { name: 'Lateral Raises', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, notes: '' },
            { name: 'Dumbbell Curl', sets: 2, repsMin: 10, repsMax: 15, restSeconds: 60, notes: '' },
          ],
        })),
      };
    } else if (days === 4) {
      // Upper/Lower split
      program = {
        name: `${isStrength ? 'Strength' : 'Hypertrophy'} Upper/Lower`,
        description: `A 4-day upper/lower split optimized for ${info.goal?.replace('_', ' ') ?? 'muscle growth'}. Two upper and two lower days with progressive overload built in.`,
        durationWeeks: 8,
        daysPerWeek: 4,
        difficulty: info.experience ?? 'intermediate',
        workouts: [
          {
            dayName: 'Day 1 - Upper (Strength)',
            muscleGroups: ['chest', 'back', 'shoulders', 'arms'],
            exercises: [
              { name: hasBarbell ? 'Barbell Bench Press' : 'Dumbbell Bench Press', sets: 4, repsMin: 5, repsMax: 8, restSeconds: 120, notes: 'Heavy compound — progressive overload focus' },
              { name: hasBarbell ? 'Barbell Bent-Over Row' : 'Dumbbell Row', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 120, notes: '' },
              { name: 'Overhead Press', sets: 3, repsMin: 6, repsMax: 10, restSeconds: 90, notes: '' },
              { name: 'Lat Pulldown', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 60, notes: '' },
              { name: 'Lateral Raises', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, notes: '' },
              { name: 'Dumbbell Curl', sets: 2, repsMin: 10, repsMax: 15, restSeconds: 60, notes: '' },
              { name: 'Tricep Pushdown', sets: 2, repsMin: 10, repsMax: 15, restSeconds: 60, notes: '' },
            ],
          },
          {
            dayName: 'Day 2 - Lower (Strength)',
            muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'],
            exercises: [
              { name: hasBarbell ? 'Barbell Squat' : 'Leg Press', sets: 4, repsMin: 5, repsMax: 8, restSeconds: 180, notes: 'Main compound — focus on depth and bracing' },
              { name: hasBarbell ? 'Romanian Deadlift' : 'Leg Curl', sets: 4, repsMin: 8, repsMax: 10, restSeconds: 90, notes: '' },
              { name: 'Leg Press', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90, notes: '' },
              { name: 'Leg Extension', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, notes: '' },
              { name: 'Leg Curl', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60, notes: '' },
              { name: 'Calf Raises', sets: 4, repsMin: 12, repsMax: 20, restSeconds: 45, notes: '' },
            ],
          },
          {
            dayName: 'Day 3 - Upper (Hypertrophy)',
            muscleGroups: ['chest', 'back', 'shoulders', 'arms'],
            exercises: [
              { name: 'Incline Dumbbell Press', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90, notes: 'Higher rep range for growth' },
              { name: 'Seated Cable Row', sets: 4, repsMin: 10, repsMax: 12, restSeconds: 60, notes: '' },
              { name: 'Cable Flyes', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, notes: '' },
              { name: 'Face Pulls', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 45, notes: '' },
              { name: 'Lateral Raises', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 45, notes: '' },
              { name: 'Hammer Curl', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60, notes: '' },
              { name: 'Skull Crushers', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60, notes: '' },
            ],
          },
          {
            dayName: 'Day 4 - Lower (Hypertrophy)',
            muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'],
            exercises: [
              { name: hasBarbell ? 'Front Squat' : 'Goblet Squat', sets: 4, repsMin: 8, repsMax: 12, restSeconds: 90, notes: '' },
              { name: 'Hip Thrust', sets: 4, repsMin: 10, repsMax: 12, restSeconds: 90, notes: '' },
              { name: 'Bulgarian Split Squat', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60, notes: '' },
              { name: 'Leg Curl', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, notes: '' },
              { name: 'Leg Extension', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, notes: '' },
              { name: 'Calf Raises', sets: 4, repsMin: 15, repsMax: 25, restSeconds: 45, notes: '' },
            ],
          },
        ],
      };
    } else {
      // PPL for 5-6 days
      const pplDays = [
        {
          dayName: 'Day 1 - Push',
          muscleGroups: ['chest', 'shoulders', 'triceps'],
          exercises: [
            { name: hasBarbell ? 'Barbell Bench Press' : 'Dumbbell Bench Press', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 120, notes: '' },
            { name: 'Incline Dumbbell Press', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, notes: '' },
            { name: 'Overhead Press', sets: 3, repsMin: 8, repsMax: 10, restSeconds: 90, notes: '' },
            { name: 'Lateral Raises', sets: 4, repsMin: 12, repsMax: 15, restSeconds: 45, notes: '' },
            { name: 'Cable Flyes', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, notes: '' },
            { name: 'Tricep Pushdown', sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60, notes: '' },
            { name: 'Overhead Tricep Extension', sets: 2, repsMin: 12, repsMax: 15, restSeconds: 60, notes: '' },
          ],
        },
        {
          dayName: 'Day 2 - Pull',
          muscleGroups: ['back', 'biceps', 'rear delts'],
          exercises: [
            { name: hasBarbell ? 'Barbell Deadlift' : 'Romanian Deadlift', sets: 3, repsMin: 5, repsMax: 8, restSeconds: 180, notes: '' },
            { name: hasBarbell ? 'Barbell Bent-Over Row' : 'Dumbbell Row', sets: 4, repsMin: 6, repsMax: 10, restSeconds: 90, notes: '' },
            { name: 'Lat Pulldown', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 60, notes: '' },
            { name: 'Seated Cable Row', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60, notes: '' },
            { name: 'Face Pulls', sets: 3, repsMin: 15, repsMax: 20, restSeconds: 45, notes: '' },
            { name: 'Barbell Curl', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 60, notes: '' },
            { name: 'Hammer Curl', sets: 2, repsMin: 10, repsMax: 15, restSeconds: 60, notes: '' },
          ],
        },
        {
          dayName: 'Day 3 - Legs',
          muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'],
          exercises: [
            { name: hasBarbell ? 'Barbell Squat' : 'Leg Press', sets: 4, repsMin: 6, repsMax: 8, restSeconds: 180, notes: '' },
            { name: 'Romanian Deadlift', sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, notes: '' },
            { name: 'Leg Press', sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90, notes: '' },
            { name: 'Leg Extension', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, notes: '' },
            { name: 'Leg Curl', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60, notes: '' },
            { name: 'Calf Raises', sets: 4, repsMin: 15, repsMax: 20, restSeconds: 45, notes: '' },
          ],
        },
      ];

      program = {
        name: `${isStrength ? 'Strength' : 'Hypertrophy'} Push/Pull/Legs`,
        description: `A ${days}-day push/pull/legs program. ${days >= 6 ? 'Each muscle group is hit twice per week for maximum growth.' : 'Hit each muscle group directly with focused training days.'}`,
        durationWeeks: 8,
        daysPerWeek: days,
        difficulty: info.experience ?? 'intermediate',
        workouts: days >= 6
          ? [...pplDays, ...pplDays.map((d, i) => ({ ...d, dayName: `Day ${i + 4} - ${d.dayName.split(' - ')[1]} (Volume)` }))]
          : [...pplDays, ...pplDays.slice(0, days - 3).map((d, i) => ({ ...d, dayName: `Day ${i + 4} - ${d.dayName.split(' - ')[1]} (Volume)` }))],
      };
    }

    // Add ID
    program.id = `program-${Date.now()}`;
    program.createdAt = new Date().toISOString();

    addMessage('assistant', `Here's your personalized ${program.name} program. Take a look and let me know if you want any adjustments!`);
    setGeneratedProgram(program);
    setIsCoachTyping(false);
  }, [messages, addMessage]);

  const handleAcceptProgram = useCallback(() => {
    const info = parseUserInfo(messages);

    // Save onboarding data
    setOnboardingData({
      fitnessGoal: info.goal ?? 'general_fitness',
      gender: info.gender,
      age: info.age,
      heightCm: info.heightCm,
      weightKg: info.weightKg,
      experience: info.experience ?? 'beginner',
      equipment: info.equipment.length > 0 ? info.equipment : ['barbell', 'dumbbell', 'cable', 'machine'],
      daysPerWeek: info.daysPerWeek,
      sessionMinutes: 60,
      splitPreference: 'ai_decides',
    });

    // Save weight estimates
    if (info.weightKg && info.gender) {
      const weights = estimateWeights(info.weightKg, info.gender, info.experience);
      setEstimatedWeights(weights);
    }

    // Save profile
    setProfile({
      id: 'user-1',
      name: '',
      heightCm: info.heightCm ?? 178,
      gender: info.gender as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Save the generated program
    if (generatedProgram) {
      const programToSave = {
        ...generatedProgram,
        id: generatedProgram.id ?? `program-${Date.now()}`,
        createdAt: generatedProgram.createdAt ?? new Date().toISOString(),
      };
      addProgram(programToSave);
    }

    // Mark onboarded
    setOnboarded(true);
  }, [messages, generatedProgram, setOnboardingData, setEstimatedWeights, setProfile, addProgram, setOnboarded]);

  const handleAdjustProgram = useCallback(() => {
    setGeneratedProgram(null);
    setCurrentQuickReplies(null);
    setInputText('');
    sendCoachMessage("No problem! Tell me what you'd like changed — different exercises, more or fewer days, different rep ranges, whatever you need.");
  }, [sendCoachMessage]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || isCoachTyping) return;
    sendMessageToCoach(text);
  }, [inputText, isCoachTyping, sendMessageToCoach]);

  const handleQuickReply = useCallback((value: string) => {
    if (isCoachTyping) return;
    sendMessageToCoach(value);
  }, [isCoachTyping, sendMessageToCoach]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.coachAvatarLg}>
              <Ionicons name="sparkles" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Your Coach</Text>
              <Text style={styles.headerSubtitle}>
                {isCoachTyping ? 'typing...' : '1% Better Every Day'}
              </Text>
            </View>
          </View>
          <View style={styles.onlineIndicator} />
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg, index) => (
            msg.role === 'assistant' ? (
              <CoachBubble key={msg.id} message={msg} isLatest={index === messages.length - 1} />
            ) : (
              <UserBubble key={msg.id} message={msg} />
            )
          ))}

          {isCoachTyping && <TypingIndicator />}

          {generatedProgram && (
            <ProgramPreview
              program={generatedProgram}
              onAccept={handleAcceptProgram}
              onAdjust={handleAdjustProgram}
            />
          )}
        </ScrollView>

        {/* Quick Replies */}
        {currentQuickReplies && !isCoachTyping && !generatedProgram && (
          <QuickReplies replies={currentQuickReplies} onSelect={handleQuickReply} />
        )}

        {/* Input Bar */}
        {!generatedProgram && (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
              maxLength={500}
              editable={!isCoachTyping}
            />
            <PressableScale
              onPress={handleSend}
              disabled={!inputText.trim() || isCoachTyping}
            >
              <View style={[
                styles.sendBtn,
                (!inputText.trim() || isCoachTyping) && styles.sendBtnDisabled,
              ]}>
                <Ionicons
                  name="send"
                  size={18}
                  color={inputText.trim() && !isCoachTyping ? '#fff' : colors.textMuted}
                />
              </View>
            </PressableScale>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  coachAvatarLg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accentSoft,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.card,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    ...typography.body,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.cardLight,
  },
});
