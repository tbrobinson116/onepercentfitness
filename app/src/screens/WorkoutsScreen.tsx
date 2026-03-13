import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography } from '../theme';
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

export function WorkoutsScreen({ navigation }: any) {
  const { workouts, programs, setWorkouts, setPrograms, setActiveWorkout, weightUnit } = useStore();
  const [tab, setTab] = useState<'today' | 'history' | 'programs'>('today');

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
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={() => navigation.navigate('GenerateProgram')}
        >
          <Text style={styles.generateText}>+ New Program</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['today', 'history', 'programs'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.activeTab]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 32 }}>
        {tab === 'today' && (
          <>
            {/* Quick Start */}
            <TouchableOpacity style={styles.startCard} onPress={startQuickWorkout}>
              <Text style={styles.startIcon}>+</Text>
              <View>
                <Text style={styles.startTitle}>Start Empty Workout</Text>
                <Text style={styles.startSubtitle}>Build your workout as you go</Text>
              </View>
            </TouchableOpacity>

            {/* Today's Completed Workouts */}
            {todayWorkouts.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Today's Workouts</Text>
                {todayWorkouts.map((w) => (
                  <WorkoutCard key={w.id} workout={w} />
                ))}
              </>
            )}

            {/* Program Workouts */}
            {programs.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Your Programs</Text>
                {programs.map((program) => (
                  <ProgramQuickStart
                    key={program.id}
                    program={program}
                    onStartDay={(dayIndex) => startProgramWorkout(program.id, dayIndex)}
                  />
                ))}
              </>
            )}

            {/* No programs prompt */}
            {programs.length === 0 && todayWorkouts.length === 0 && (
              <TouchableOpacity
                style={styles.emptyPrompt}
                onPress={() => navigation.navigate('GenerateProgram')}
              >
                <Text style={styles.emptyPromptTitle}>No workout program yet</Text>
                <Text style={styles.emptyPromptText}>
                  Generate a personalized program based on your goals and equipment
                </Text>
                <Text style={styles.emptyPromptCta}>Create Program →</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {tab === 'history' && (
          <>
            {pastWorkouts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No past workouts yet</Text>
                <Text style={styles.emptySubtext}>Complete your first workout to see it here</Text>
              </View>
            ) : (
              pastWorkouts.map((w) => (
                <WorkoutCard key={w.id} workout={w} />
              ))
            )}
          </>
        )}

        {tab === 'programs' && (
          <>
            <TouchableOpacity
              style={styles.generateCard}
              onPress={() => navigation.navigate('GenerateProgram')}
            >
              <Text style={styles.generateCardTitle}>+ Generate New Program</Text>
              <Text style={styles.generateCardDesc}>
                Personalized workout plan based on your goals and equipment
              </Text>
            </TouchableOpacity>

            {programs.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No programs yet</Text>
                <Text style={styles.emptySubtext}>Generate your first program above</Text>
              </View>
            )}

            {programs.map((program) => (
              <View key={program.id} style={styles.programDetailCard}>
                <View style={styles.programHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.programName}>{program.name}</Text>
                    <Text style={styles.programDesc}>{program.description}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteProgram(program.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.programMeta}>
                  <Text style={styles.metaText}>{program.durationWeeks} weeks</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{program.daysPerWeek} days/week</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{program.difficulty}</Text>
                </View>
                {program.workouts.map((day, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.dayRow}
                    onPress={() => startProgramWorkout(program.id, i)}
                  >
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayName}>{day.dayName}</Text>
                      <Text style={styles.tapStart}>Start →</Text>
                    </View>
                    <Text style={styles.dayExercises}>
                      {day.exercises.map(e => e.exercise.name).join(' · ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ProgramQuickStart({ program, onStartDay }: { program: WorkoutProgram; onStartDay: (dayIndex: number) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.programQuickCard}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={styles.programName}>{program.name}</Text>
        <Text style={styles.programDesc}>{program.description}</Text>
        <Text style={styles.expandHint}>{expanded ? '▾ Hide days' : '▸ Show all days'}</Text>
      </TouchableOpacity>

      {expanded ? (
        program.workouts.map((day, i) => (
          <TouchableOpacity
            key={i}
            style={styles.dayStartRow}
            onPress={() => onStartDay(i)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.dayName}>{day.dayName}</Text>
              <Text style={styles.dayExercisePreview}>
                {day.exercises.slice(0, 3).map(e => e.exercise.name).join(', ')}
                {day.exercises.length > 3 ? ` +${day.exercises.length - 3} more` : ''}
              </Text>
            </View>
            <View style={styles.startDayBtn}>
              <Text style={styles.startDayText}>Start</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        // Show just the first day as quick start
        <TouchableOpacity
          style={styles.dayStartRow}
          onPress={() => onStartDay(0)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.dayName}>{program.workouts[0]?.dayName}</Text>
            <Text style={styles.dayExercisePreview}>
              {program.workouts[0]?.exercises.slice(0, 3).map(e => e.exercise.name).join(', ')}
            </Text>
          </View>
          <View style={styles.startDayBtn}>
            <Text style={styles.startDayText}>Start</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  return (
    <View style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <Text style={styles.workoutName}>{workout.name}</Text>
        {workout.isCompleted && <Text style={styles.completedBadge}>Done</Text>}
      </View>
      <Text style={styles.workoutMeta}>
        {workout.exercises.length} exercises · {completedSets}/{totalSets} sets
        {workout.durationMinutes ? ` · ${workout.durationMinutes} min` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  title: { ...typography.h1, color: colors.text },
  generateBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  generateText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTab: { backgroundColor: colors.accent },
  tabText: { ...typography.body, color: colors.textSecondary },
  activeTabText: { color: colors.text, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { ...typography.h3, color: colors.textSecondary, marginTop: 20, marginBottom: 8 },
  startCard: {
    backgroundColor: colors.accent + '22',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: 8,
  },
  startIcon: { fontSize: 28, color: colors.accent, marginRight: 16, fontWeight: '300' },
  startTitle: { ...typography.bodyBold, color: colors.text },
  startSubtitle: { ...typography.caption, color: colors.textSecondary },
  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workoutName: { ...typography.bodyBold, color: colors.text },
  completedBadge: { ...typography.caption, color: colors.success, fontWeight: '600' },
  workoutMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  // Program Quick Start on Today tab
  programQuickCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  expandHint: { ...typography.caption, color: colors.accent, marginTop: 8 },
  dayStartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  dayExercisePreview: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  startDayBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startDayText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  // Programs tab
  programDetailCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  programHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  programName: { ...typography.bodyBold, color: colors.text },
  programDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  deleteText: { ...typography.caption, color: colors.danger },
  programMeta: { flexDirection: 'row', marginTop: 8, marginBottom: 4 },
  metaText: { ...typography.caption, color: colors.accent },
  metaDot: { ...typography.caption, color: colors.textSecondary, marginHorizontal: 6 },
  dayRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { ...typography.bodyBold, color: colors.text },
  dayExercises: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  tapStart: { ...typography.caption, color: colors.accent, fontWeight: '600' },
  // Empty states
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptySubtext: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  emptyPrompt: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  emptyPromptTitle: { ...typography.h3, color: colors.text },
  emptyPromptText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  emptyPromptCta: { ...typography.bodyBold, color: colors.accent, marginTop: 12 },
  generateCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  generateCardTitle: { ...typography.bodyBold, color: colors.accent },
  generateCardDesc: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
});
