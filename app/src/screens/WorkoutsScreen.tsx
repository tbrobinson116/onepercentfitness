import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Card, PressableScale, SectionHeader, EmptyState } from '../components/ui';
import type { Workout, WorkoutProgram, WeightUnit } from '../types';

// Default starting weights in lbs (same map as ActiveWorkoutScreen)
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

const TABS = ['today', 'history', 'programs'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  today: 'Today',
  history: 'History',
  programs: 'Programs',
};

export function WorkoutsScreen({ navigation }: any) {
  const { workouts, programs, setWorkouts, setPrograms, setActiveWorkout, weightUnit } = useStore();
  const [tab, setTab] = useState<Tab>('today');

  const loadData = useCallback(async () => {
    try {
      const [w, p] = await Promise.all([api.getWorkouts(), api.getPrograms()]);
      setWorkouts(w);
      setPrograms(p);
    } catch { /* offline */ }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Reload when returning to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const today = new Date().toISOString().split('T')[0];
  const todayWorkouts = workouts.filter((w) => w.date === today);
  const pastWorkouts = workouts
    .filter((w) => w.date !== today && w.isCompleted)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const startQuickWorkout = () => {
    const workout: Workout = {
      id: Date.now().toString(),
      name: 'Quick Workout',
      date: today,
      startTime: new Date().toISOString(),
      exercises: [],
      isCompleted: false,
    };
    setActiveWorkout(workout);
    navigation.navigate('ActiveWorkout', { workoutId: workout.id });
  };

  const startProgramWorkout = (programId: string, dayIndex: number) => {
    const program = programs.find((p) => p.id === programId);
    if (!program) return;

    const day = program.workouts[dayIndex];
    if (!day) return;

    const workout: Workout = {
      id: Date.now().toString(),
      name: day.dayName,
      date: today,
      startTime: new Date().toISOString(),
      exercises: day.exercises.map((ex, i) => ({
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
      programId,
      programDayIndex: dayIndex,
    };
    setActiveWorkout(workout);
    navigation.navigate('ActiveWorkout', { workoutId: workout.id });
  };

  const deleteProgram = (programId: string) => {
    Alert.alert('Delete Program', 'Remove this program?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = programs.filter((p) => p.id !== programId);
          setPrograms(updated);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="barbell" size={24} color={colors.accent} style={{ marginRight: spacing.sm }} />
          <Text style={styles.title}>Workouts</Text>
        </View>
        <PressableScale
          onPress={() => navigation.navigate('GenerateProgram')}
          style={styles.newProgramBtn}
        >
          <Ionicons name="sparkles" size={16} color={colors.text} style={{ marginRight: spacing.xs }} />
          <Text style={styles.newProgramText}>New Program</Text>
        </PressableScale>
      </View>

      {/* Pill Tabs */}
      <View style={styles.tabBar}>
        <View style={styles.tabContainer}>
          {TABS.map((t) => (
            <PressableScale
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {TAB_LABELS[t]}
              </Text>
            </PressableScale>
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        {tab === 'today' && (
          <>
            {/* Quick Start */}
            <Animated.View entering={FadeInDown.duration(350).delay(50)}>
              <PressableScale onPress={startQuickWorkout} style={styles.startCard}>
                <Ionicons name="add-circle" size={32} color={colors.accent} />
                <View style={styles.startTextWrap}>
                  <Text style={styles.startTitle}>Start Empty Workout</Text>
                  <Text style={styles.startSubtitle}>Build your workout as you go</Text>
                </View>
              </PressableScale>
            </Animated.View>

            {/* Today's Completed Workouts */}
            {todayWorkouts.length > 0 && (
              <>
                <SectionHeader title="Today's Workouts" />
                {todayWorkouts.map((w, index) => (
                  <WorkoutCard key={w.id} workout={w} index={index} />
                ))}
              </>
            )}

            {/* Program Workouts */}
            {programs.length > 0 && (
              <>
                <SectionHeader title="Your Programs" />
                {programs.map((program, index) => (
                  <ProgramQuickStart
                    key={program.id}
                    program={program}
                    index={index}
                    onStartDay={(dayIndex) => startProgramWorkout(program.id, dayIndex)}
                  />
                ))}
              </>
            )}

            {/* No programs prompt */}
            {programs.length === 0 && todayWorkouts.length === 0 && (
              <EmptyState
                icon="barbell-outline"
                title="No workout program yet"
                subtitle="Generate a personalized program based on your goals and equipment"
                actionLabel="Create Program"
                onAction={() => navigation.navigate('GenerateProgram')}
              />
            )}
          </>
        )}

        {tab === 'history' && (
          <>
            {pastWorkouts.length === 0 ? (
              <EmptyState
                icon="time-outline"
                title="No past workouts yet"
                subtitle="Complete your first workout to see it here"
              />
            ) : (
              pastWorkouts.map((w, index) => (
                <WorkoutCard key={w.id} workout={w} index={index} />
              ))
            )}
          </>
        )}

        {tab === 'programs' && (
          <>
            {/* Generate new program card */}
            <Animated.View entering={FadeInDown.duration(350).delay(50)}>
              <PressableScale
                onPress={() => navigation.navigate('GenerateProgram')}
                style={styles.generateCard}
              >
                <View style={styles.generateIconWrap}>
                  <Ionicons name="sparkles" size={24} color={colors.accent} />
                </View>
                <Text style={styles.generateCardTitle}>Generate New Program</Text>
                <Text style={styles.generateCardDesc}>
                  Personalized workout plan based on your goals and equipment
                </Text>
              </PressableScale>
            </Animated.View>

            {programs.length === 0 && (
              <EmptyState
                icon="documents-outline"
                title="No programs yet"
                subtitle="Generate your first program above"
              />
            )}

            {programs.map((program, index) => (
              <ProgramDetailCard
                key={program.id}
                program={program}
                index={index}
                onStartDay={(dayIndex) => startProgramWorkout(program.id, dayIndex)}
                onDelete={() => deleteProgram(program.id)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ---- Program Quick Start (Today tab) ----
function ProgramQuickStart({
  program,
  index,
  onStartDay,
}: {
  program: WorkoutProgram;
  index: number;
  onStartDay: (dayIndex: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      entering={FadeInDown.duration(350).delay(100 + index * 80)}
      style={styles.programQuickCard}
    >
      <PressableScale onPress={() => setExpanded(!expanded)} style={styles.programQuickHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.programName}>{program.name}</Text>
          <Text style={styles.programDesc}>{program.description}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={20}
          color={colors.textSecondary}
        />
      </PressableScale>

      {expanded ? (
        program.workouts.map((day, i) => (
          <DayRow
            key={i}
            dayName={day.dayName}
            exercises={day.exercises.slice(0, 3).map((e) => e.exercise.name)}
            extraCount={day.exercises.length > 3 ? day.exercises.length - 3 : 0}
            onStart={() => onStartDay(i)}
          />
        ))
      ) : (
        <DayRow
          dayName={program.workouts[0]?.dayName ?? ''}
          exercises={program.workouts[0]?.exercises.slice(0, 3).map((e) => e.exercise.name) ?? []}
          extraCount={
            (program.workouts[0]?.exercises.length ?? 0) > 3
              ? (program.workouts[0]?.exercises.length ?? 0) - 3
              : 0
          }
          onStart={() => onStartDay(0)}
        />
      )}
    </Card>
  );
}

// ---- Day Row (shared between quick start and detail) ----
function DayRow({
  dayName,
  exercises,
  extraCount,
  onStart,
}: {
  dayName: string;
  exercises: string[];
  extraCount: number;
  onStart: () => void;
}) {
  return (
    <PressableScale onPress={onStart} style={styles.dayRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.dayName}>{dayName}</Text>
        <Text style={styles.dayExercisePreview}>
          {exercises.join(', ')}
          {extraCount > 0 ? ` +${extraCount} more` : ''}
        </Text>
      </View>
      <Ionicons name="play-circle" size={32} color={colors.accent} />
    </PressableScale>
  );
}

// ---- Program Detail Card (Programs tab) ----
function ProgramDetailCard({
  program,
  index,
  onStartDay,
  onDelete,
}: {
  program: WorkoutProgram;
  index: number;
  onStartDay: (dayIndex: number) => void;
  onDelete: () => void;
}) {
  return (
    <Card entering={FadeInDown.duration(350).delay(150 + index * 80)}>
      <View style={styles.programHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.programName}>{program.name}</Text>
          <Text style={styles.programDesc}>{program.description}</Text>
        </View>
        <PressableScale onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </PressableScale>
      </View>

      <View style={styles.programMeta}>
        <View style={styles.metaChip}>
          <Ionicons name="calendar-outline" size={13} color={colors.accent} style={{ marginRight: 4 }} />
          <Text style={styles.metaText}>{program.durationWeeks} weeks</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="repeat-outline" size={13} color={colors.accent} style={{ marginRight: 4 }} />
          <Text style={styles.metaText}>{program.daysPerWeek} days/week</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="fitness-outline" size={13} color={colors.accent} style={{ marginRight: 4 }} />
          <Text style={styles.metaText}>{program.difficulty}</Text>
        </View>
      </View>

      {program.workouts.map((day, i) => (
        <PressableScale
          key={i}
          style={styles.dayRowDetail}
          onPress={() => onStartDay(i)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.dayName}>{day.dayName}</Text>
            <Text style={styles.dayExercises}>
              {day.exercises.map((e) => e.exercise.name).join(' \u00B7 ')}
            </Text>
          </View>
          <Ionicons name="play-circle" size={28} color={colors.accent} />
        </PressableScale>
      ))}
    </Card>
  );
}

// ---- Workout Card ----
function WorkoutCard({ workout, index }: { workout: Workout; index: number }) {
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0,
  );

  return (
    <Card entering={FadeInDown.duration(350).delay(100 + index * 60)}>
      <View style={styles.workoutHeader}>
        <Text style={styles.workoutName}>{workout.name}</Text>
        {workout.isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.completedText}>Done</Text>
          </View>
        )}
      </View>
      <View style={styles.workoutMetaRow}>
        <View style={styles.workoutMetaItem}>
          <Ionicons name="barbell-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.workoutMeta}>{workout.exercises.length} exercises</Text>
        </View>
        <View style={styles.workoutMetaItem}>
          <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.workoutMeta}>{completedSets}/{totalSets} sets</Text>
        </View>
        {workout.durationMinutes != null && workout.durationMinutes > 0 && (
          <View style={styles.workoutMetaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.workoutMeta}>{workout.durationMinutes} min</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  newProgramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    ...shadows.button,
  },
  newProgramText: {
    ...typography.captionBold,
    color: colors.text,
  },

  // Tabs
  tabBar: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // Start Card
  startCard: {
    backgroundColor: colors.accentDim,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent,
    marginBottom: spacing.md,
  },
  startTextWrap: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  startTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  startSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Workout Card
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutName: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryDim,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  completedText: {
    ...typography.smallBold,
    color: colors.success,
    marginLeft: spacing.xs,
  },
  workoutMetaRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.lg,
  },
  workoutMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  workoutMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // Program Quick Start (Today tab)
  programQuickCard: {
    padding: 0,
  },
  programQuickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.md,
  },
  programName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  programDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Day rows
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dayRowDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  dayName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  dayExercisePreview: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dayExercises: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Program Detail Card (Programs tab)
  programHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deleteBtn: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  programMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentDim,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  metaText: {
    ...typography.smallBold,
    color: colors.accent,
  },

  // Generate Card
  generateCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    ...shadows.cardLight,
  },
  generateIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  generateCardTitle: {
    ...typography.bodyBold,
    color: colors.accent,
  },
  generateCardDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
