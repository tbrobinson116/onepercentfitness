import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Card, PressableScale, FadeInView } from '../components/ui';
import type { ProgramExercise, ProgramWorkout, WeightUnit, WorkoutProgram } from '../types';

const DEFAULT_WEIGHTS_LBS: Record<string, number> = {
  'Barbell Bench Press': 135, 'Incline Dumbbell Press': 50, 'Dumbbell Bench Press': 50,
  'Decline Barbell Press': 135, 'Cable Flyes': 30, 'Machine Chest Press': 100,
  'Barbell Deadlift': 185, 'Deadlift': 185, 'Barbell Bent-Over Row': 115,
  'Barbell Row': 115, 'Dumbbell Row': 50, 'Seated Cable Row': 100,
  'T-Bar Row': 90, 'Lat Pulldown': 100, 'Face Pulls': 40,
  'Overhead Press': 85, 'Barbell Overhead Press': 85, 'Dumbbell Shoulder Press': 40,
  'Arnold Press': 35, 'Lateral Raises': 15, 'Cable Lateral Raise': 15,
  'Barbell Curl': 65, 'Dumbbell Curl': 25, 'Hammer Curl': 30,
  'Tricep Pushdown': 50, 'Skull Crushers': 55, 'Close-Grip Bench Press': 115,
  'Barbell Squat': 155, 'Barbell Back Squat': 155, 'Front Squat': 115,
  'Leg Press': 200, 'Romanian Deadlift': 135, 'Bulgarian Split Squat': 30,
  'Leg Extension': 80, 'Leg Curl': 70, 'Hip Thrust': 135, 'Calf Raises': 100,
  'Goblet Squat': 40, 'Smith Machine Squat': 115, 'Hack Squat': 140,
  'Cable Crunches': 60,
};

function getDefaultWeight(name: string, unit: WeightUnit): number {
  const lbs = DEFAULT_WEIGHTS_LBS[name] ?? 0;
  if (lbs === 0) return 0;
  return unit === 'lbs' ? lbs : Math.round(lbs * 0.453592 * 10) / 10;
}

interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function ProgramDetailScreen({ navigation, route }: any) {
  const { programId } = route.params;
  const {
    programs, setPrograms, setActiveWorkout, weightUnit,
    programProgress, advanceProgramDay,
  } = useStore();
  const program = programs.find((p) => p.id === programId);

  // Coach chat state
  const [chatMessages, setChatMessages] = useState<CoachMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  if (!program) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>Program not found</Text>
      </View>
    );
  }

  // Auto-detect the next workout day
  const nextDayIndex = programProgress[program.id] ?? 0;
  const todayWorkout = program.workouts[nextDayIndex];

  const startWorkout = () => {
    if (!todayWorkout) return;

    const workout = {
      id: Date.now().toString(),
      name: todayWorkout.dayName,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toISOString(),
      exercises: todayWorkout.exercises.map((ex, i) => ({
        id: `${Date.now()}-${i}`,
        exerciseId: ex.exerciseId,
        exercise: ex.exercise,
        sets: Array.from({ length: ex.sets }, (_, j) => ({
          id: `${Date.now()}-${i}-${j}`,
          setNumber: j + 1,
          reps: ex.repsMin,
          weight: getDefaultWeight(ex.exercise.name, weightUnit),
          completed: false,
          restSeconds: ex.restSeconds,
        })),
        notes: ex.notes,
        exerciseNotes: [],
        order: i,
      })),
      isCompleted: false,
      programId: program.id,
      programDayIndex: nextDayIndex,
    };
    setActiveWorkout(workout);
    advanceProgramDay(program.id, program.workouts.length);
    navigation.navigate('ActiveWorkout', { workoutId: workout.id });
  };

  // Apply an exercise swap from coach response to the program
  const applySwap = (
    oldExerciseName: string,
    newExercise: { name: string; equipment?: string; primaryMuscle?: string },
  ) => {
    const updatedPrograms = programs.map((p) => {
      if (p.id !== program.id) return p;
      return {
        ...p,
        workouts: p.workouts.map((day, di) => {
          if (di !== nextDayIndex) return day;
          return {
            ...day,
            exercises: day.exercises.map((ex) => {
              if (ex.exercise.name.toLowerCase() !== oldExerciseName.toLowerCase()) return ex;
              return {
                ...ex,
                exercise: {
                  ...ex.exercise,
                  name: newExercise.name,
                  equipment: (newExercise.equipment as any) ?? ex.exercise.equipment,
                  primaryMuscle: (newExercise.primaryMuscle as any) ?? ex.exercise.primaryMuscle,
                },
              };
            }),
          };
        }),
      };
    });
    setPrograms(updatedPrograms);
  };

  const sendCoachMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: CoachMessage = { role: 'user', content: text };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const exerciseList = todayWorkout.exercises
        .map((ex, i) => `${i + 1}. ${ex.exercise.name} — ${ex.sets}x${ex.repsMin}-${ex.repsMax} (${ex.exercise.equipment})`)
        .join('\n');

      const result = await api.coachChat(updatedMessages, {
        currentProgram: {
          name: program.name,
          dayName: todayWorkout.dayName,
          dayIndex: nextDayIndex,
          exercises: exerciseList,
          muscleGroups: todayWorkout.muscleGroups,
        },
      });

      const assistantMsg: CoachMessage = { role: 'assistant', content: result.message };
      setChatMessages([...updatedMessages, assistantMsg]);

      // If coach returned a swap, apply it
      if (result.program?.swap) {
        const swap = result.program.swap;
        applySwap(swap.oldExercise, { name: swap.newExercise, equipment: swap.equipment, primaryMuscle: swap.primaryMuscle });
      }

      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      const errMsg: CoachMessage = {
        role: 'assistant',
        content: 'Sorry, I couldn\'t connect right now. Try again in a moment.',
      };
      setChatMessages([...updatedMessages, errMsg]);
    }
    setChatLoading(false);
  };

  const quickSwapSuggestions = [
    'Swap bench press for incline press',
    'Replace squats with leg press',
    'Add an extra set to everything',
    'Make this workout shorter',
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>UP NEXT</Text>
            <Text style={styles.title} numberOfLines={1}>{todayWorkout.dayName}</Text>
          </View>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>
              {nextDayIndex + 1}/{program.workouts.length}
            </Text>
          </View>
        </View>

        {/* Muscle group tags */}
        <View style={styles.muscleRow}>
          {todayWorkout.muscleGroups.map((mg) => (
            <View key={mg} style={styles.muscleTag}>
              <Text style={styles.muscleTagText}>{mg}</Text>
            </View>
          ))}
          <Text style={styles.exerciseCount}>
            {todayWorkout.exercises.length} exercises
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.content}
          contentContainerStyle={{ paddingBottom: showChat ? 300 : 180 }}
        >
          {/* Exercise list */}
          {todayWorkout.exercises.map((ex, i) => (
            <FadeInView key={`${ex.exerciseId}-${i}`} delay={i * 60}>
              <ExerciseRow exercise={ex} index={i} weightUnit={weightUnit} />
            </FadeInView>
          ))}

          {/* Coach Chat Section */}
          {showChat && (
            <FadeInView delay={100}>
              <View style={styles.chatSection}>
                <View style={styles.chatHeader}>
                  <Ionicons name="sparkles" size={16} color={colors.accent} />
                  <Text style={styles.chatHeaderText}>Coach</Text>
                  <TouchableOpacity onPress={() => setShowChat(false)} style={{ marginLeft: 'auto' }}>
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {chatMessages.length === 0 && (
                  <View style={styles.suggestionsWrap}>
                    <Text style={styles.suggestionsLabel}>Quick actions:</Text>
                    {quickSwapSuggestions.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={styles.suggestionChip}
                        onPress={() => {
                          setChatInput(s);
                        }}
                      >
                        <Text style={styles.suggestionText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <ScrollView
                  ref={chatScrollRef}
                  style={styles.chatMessages}
                  contentContainerStyle={{ paddingBottom: spacing.sm }}
                >
                  {chatMessages.map((msg, i) => (
                    <View
                      key={i}
                      style={[
                        styles.chatBubble,
                        msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleCoach,
                      ]}
                    >
                      {msg.role === 'assistant' && (
                        <View style={styles.coachBubbleHeader}>
                          <Ionicons name="sparkles" size={12} color={colors.accent} />
                          <Text style={styles.coachBubbleLabel}>Coach</Text>
                        </View>
                      )}
                      <Text style={styles.chatBubbleText}>{msg.content}</Text>
                    </View>
                  ))}
                  {chatLoading && (
                    <View style={[styles.chatBubble, styles.chatBubbleCoach]}>
                      <ActivityIndicator size="small" color={colors.accent} />
                    </View>
                  )}
                </ScrollView>

                {/* Chat input */}
                <View style={styles.chatInputRow}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Swap bench for incline..."
                    placeholderTextColor={colors.textMuted}
                    value={chatInput}
                    onChangeText={setChatInput}
                    onSubmitEditing={sendCoachMessage}
                    returnKeyType="send"
                  />
                  <PressableScale
                    onPress={sendCoachMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    style={styles.sendBtn}
                  >
                    <Ionicons name="send" size={18} color={colors.text} />
                  </PressableScale>
                </View>
              </View>
            </FadeInView>
          )}
        </ScrollView>

        {/* Bottom bar — Start workout + Ask Coach */}
        <View style={styles.bottomBar}>
          {!showChat && (
            <PressableScale onPress={() => setShowChat(true)} style={styles.coachBtn}>
              <Ionicons name="chatbubble-ellipses" size={20} color={colors.accent} />
              <Text style={styles.coachBtnText}>Modify</Text>
            </PressableScale>
          )}
          <PressableScale onPress={startWorkout} style={[styles.startBtn, showChat && { flex: 1 }]}>
            <Ionicons name="play" size={20} color={colors.text} />
            <Text style={styles.startBtnText}>Start Workout</Text>
          </PressableScale>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function ExerciseRow({
  exercise,
  index,
  weightUnit,
}: {
  exercise: ProgramExercise;
  index: number;
  weightUnit: WeightUnit;
}) {
  const weight = getDefaultWeight(exercise.exercise.name, weightUnit);
  const weightLabel = weight > 0 ? `~${weight} ${weightUnit}` : '';

  return (
    <View style={styles.exerciseRow}>
      <View style={styles.exerciseNum}>
        <Text style={styles.exerciseNumText}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
        <View style={styles.exerciseDetailRow}>
          <View style={styles.detailChip}>
            <Text style={styles.detailChipText}>
              {exercise.sets} × {exercise.repsMin}
              {exercise.repsMax !== exercise.repsMin ? `-${exercise.repsMax}` : ''}
            </Text>
          </View>
          {weightLabel ? (
            <View style={styles.detailChip}>
              <Text style={styles.detailChipText}>{weightLabel}</Text>
            </View>
          ) : null}
          {exercise.restSeconds ? (
            <View style={styles.detailChip}>
              <Ionicons name="time-outline" size={10} color={colors.textSecondary} />
              <Text style={styles.detailChipText}>{exercise.restSeconds}s</Text>
            </View>
          ) : null}
        </View>
        {exercise.notes && (
          <Text style={styles.exerciseNote}>{exercise.notes}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  errorText: { ...typography.body, color: colors.danger, textAlign: 'center', marginTop: 100 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLabel: {
    ...typography.label,
    color: colors.accent,
    marginBottom: 2,
  },
  title: { ...typography.h1, color: colors.text },
  dayBadge: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  dayBadgeText: { ...typography.captionBold, color: colors.accent },

  // Muscle tags
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  muscleTag: {
    backgroundColor: colors.cardLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  muscleTagText: { ...typography.smallBold, color: colors.textSecondary, textTransform: 'capitalize' },
  exerciseCount: { ...typography.caption, color: colors.textMuted },

  content: { flex: 1, paddingHorizontal: spacing.lg },

  // Exercise row
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseNumText: { ...typography.captionBold, color: colors.textSecondary },
  exerciseName: { ...typography.bodyBold, color: colors.text },
  exerciseDetailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  detailChipText: { ...typography.small, color: colors.textSecondary },
  exerciseNote: { ...typography.caption, color: colors.accent, marginTop: spacing.xs, fontStyle: 'italic' },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.button,
  },
  startBtnText: { ...typography.bodyBold, color: colors.text },
  coachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentDim,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  coachBtnText: { ...typography.captionBold, color: colors.accent },

  // Coach Chat
  chatSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatHeaderText: { ...typography.bodyBold, color: colors.accent },
  chatMessages: { maxHeight: 250, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  chatBubble: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    maxWidth: '85%',
  },
  chatBubbleUser: {
    backgroundColor: colors.accent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  chatBubbleCoach: {
    backgroundColor: colors.cardLight,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  coachBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  coachBubbleLabel: { ...typography.smallBold, color: colors.accent },
  chatBubbleText: { ...typography.body, color: colors.text },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
  },
  suggestionsWrap: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  suggestionsLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  suggestionChip: {
    backgroundColor: colors.cardLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  suggestionText: { ...typography.caption, color: colors.textSecondary },
});
