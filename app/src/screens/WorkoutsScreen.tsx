import React, { useEffect, useState } from 'react';
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
import type { Workout, WorkoutExercise, WorkoutSet } from '../types';

export function WorkoutsScreen({ navigation }: any) {
  const { workouts, programs, setWorkouts, setPrograms, activeWorkout, setActiveWorkout, addWorkout } = useStore();
  const [tab, setTab] = useState<'today' | 'history' | 'programs'>('today');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [w, p] = await Promise.all([api.getWorkouts(), api.getPrograms()]);
      setWorkouts(w);
      setPrograms(p);
    } catch { /* offline */ }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayWorkouts = workouts.filter((w) => w.date === today);
  const pastWorkouts = workouts.filter((w) => w.date !== today);

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
          weightKg: 0,
          completed: false,
          restSeconds: ex.restSeconds,
        })),
        notes: ex.notes,
        order: i,
      })),
      isCompleted: false,
      programId,
      programDayIndex: dayIndex,
    };
    setActiveWorkout(workout);
    navigation.navigate('ActiveWorkout', { workoutId: workout.id });
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
          <Text style={styles.generateText}>✨ AI Program</Text>
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

      <ScrollView style={styles.content}>
        {tab === 'today' && (
          <>
            {/* Quick Start */}
            <TouchableOpacity style={styles.startCard} onPress={startQuickWorkout}>
              <Text style={styles.startIcon}>🏋️</Text>
              <View>
                <Text style={styles.startTitle}>Start Empty Workout</Text>
                <Text style={styles.startSubtitle}>Build your workout as you go</Text>
              </View>
            </TouchableOpacity>

            {/* Today's Workouts */}
            {todayWorkouts.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Today's Workouts</Text>
                {todayWorkouts.map((w) => (
                  <WorkoutCard key={w.id} workout={w} navigation={navigation} />
                ))}
              </>
            )}

            {/* Next Program Workout */}
            {programs.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Next Program Workout</Text>
                {programs.map((program) => {
                  const nextDay = program.workouts[0]; // simplified - would track actual progress
                  return (
                    <TouchableOpacity
                      key={program.id}
                      style={styles.programCard}
                      onPress={() => startProgramWorkout(program.id, 0)}
                    >
                      <Text style={styles.programName}>{program.name}</Text>
                      <Text style={styles.programDay}>{nextDay?.dayName}</Text>
                      <Text style={styles.programExercises}>
                        {nextDay?.exercises.length} exercises
                      </Text>
                      <Text style={styles.tapStart}>Tap to start →</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </>
        )}

        {tab === 'history' && (
          <>
            {pastWorkouts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No past workouts yet</Text>
                <Text style={styles.emptySubtext}>Start your first workout above!</Text>
              </View>
            ) : (
              pastWorkouts.map((w) => (
                <WorkoutCard key={w.id} workout={w} navigation={navigation} />
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
              <Text style={styles.generateCardIcon}>✨</Text>
              <Text style={styles.generateCardTitle}>Generate AI Program</Text>
              <Text style={styles.generateCardDesc}>
                Get a personalized workout program based on your goals, body, and experience
              </Text>
            </TouchableOpacity>

            {programs.map((program) => (
              <View key={program.id} style={styles.programDetailCard}>
                <Text style={styles.programName}>{program.name}</Text>
                <Text style={styles.programDesc}>{program.description}</Text>
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
                    <Text style={styles.dayName}>{day.dayName}</Text>
                    <Text style={styles.dayExercises}>
                      {day.exercises.length} exercises · {day.muscleGroups.join(', ')}
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

function WorkoutCard({ workout, navigation }: { workout: Workout; navigation: any }) {
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  return (
    <TouchableOpacity
      style={styles.workoutCard}
      onPress={() => navigation.navigate('ActiveWorkout', { workoutId: workout.id })}
    >
      <View style={styles.workoutHeader}>
        <Text style={styles.workoutName}>{workout.name}</Text>
        {workout.isCompleted && <Text style={styles.completedBadge}>✓ Done</Text>}
      </View>
      <Text style={styles.workoutMeta}>
        {workout.exercises.length} exercises · {completedSets}/{totalSets} sets
        {workout.durationMinutes ? ` · ${workout.durationMinutes} min` : ''}
      </Text>
      <Text style={styles.workoutDate}>{workout.date}</Text>
    </TouchableOpacity>
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
  sectionTitle: { ...typography.h3, color: colors.textSecondary, marginTop: 16, marginBottom: 8 },
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
  startIcon: { fontSize: 32, marginRight: 16 },
  startTitle: { ...typography.bodyBold, color: colors.text },
  startSubtitle: { ...typography.caption, color: colors.textSecondary },
  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  workoutName: { ...typography.bodyBold, color: colors.text },
  completedBadge: { ...typography.caption, color: colors.success },
  workoutMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  workoutDate: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  programCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  programName: { ...typography.bodyBold, color: colors.text },
  programDay: { ...typography.body, color: colors.accent, marginTop: 4 },
  programExercises: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  tapStart: { ...typography.caption, color: colors.accent, marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptySubtext: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  generateCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  generateCardIcon: { fontSize: 40, marginBottom: 8 },
  generateCardTitle: { ...typography.h3, color: colors.text },
  generateCardDesc: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  programDetailCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  programDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  programMeta: { flexDirection: 'row', marginTop: 8, marginBottom: 12 },
  metaText: { ...typography.caption, color: colors.accent },
  metaDot: { ...typography.caption, color: colors.textSecondary, marginHorizontal: 6 },
  dayRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dayName: { ...typography.bodyBold, color: colors.text },
  dayExercises: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
