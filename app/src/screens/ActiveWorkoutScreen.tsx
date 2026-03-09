import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography } from '../theme';
import type { WorkoutExercise, WorkoutSet, Exercise } from '../types';

export function ActiveWorkoutScreen({ route, navigation }: any) {
  const { activeWorkout, setActiveWorkout, addWorkout } = useStore();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.getExercises().then(setExercises).catch(() => {});
  }, []);

  if (!activeWorkout) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No active workout</Text>
      </View>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const addExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseId: exercise.id,
      exercise,
      sets: [
        {
          id: `${Date.now()}-0`,
          setNumber: 1,
          reps: 0,
          weightKg: 0,
          completed: false,
        },
      ],
      order: activeWorkout.exercises.length,
    };
    setActiveWorkout({
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, newExercise],
    });
    setShowExercisePicker(false);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = { ...activeWorkout };
    const ex = { ...updated.exercises[exerciseIndex] };
    const lastSet = ex.sets[ex.sets.length - 1];
    ex.sets = [
      ...ex.sets,
      {
        id: Date.now().toString(),
        setNumber: ex.sets.length + 1,
        reps: lastSet?.reps ?? 0,
        weightKg: lastSet?.weightKg ?? 0,
        completed: false,
      },
    ];
    updated.exercises = [...updated.exercises];
    updated.exercises[exerciseIndex] = ex;
    setActiveWorkout(updated);
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weightKg',
    value: string
  ) => {
    const updated = { ...activeWorkout };
    const ex = { ...updated.exercises[exerciseIndex] };
    const set = { ...ex.sets[setIndex] };
    set[field] = Number(value) || 0;
    ex.sets = [...ex.sets];
    ex.sets[setIndex] = set;
    updated.exercises = [...updated.exercises];
    updated.exercises[exerciseIndex] = ex;
    setActiveWorkout(updated);
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const updated = { ...activeWorkout };
    const ex = { ...updated.exercises[exerciseIndex] };
    const set = { ...ex.sets[setIndex] };
    set.completed = !set.completed;
    ex.sets = [...ex.sets];
    ex.sets[setIndex] = set;
    updated.exercises = [...updated.exercises];
    updated.exercises[exerciseIndex] = ex;
    setActiveWorkout(updated);
  };

  const finishWorkout = async () => {
    const completed = {
      ...activeWorkout,
      isCompleted: true,
      endTime: new Date().toISOString(),
      durationMinutes: Math.round(elapsedSeconds / 60),
    };
    try {
      await api.saveWorkout(completed);
    } catch { /* offline */ }
    addWorkout(completed);
    setActiveWorkout(null);
    navigation.goBack();
  };

  const cancelWorkout = () => {
    Alert.alert('Cancel Workout', 'Discard this workout?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setActiveWorkout(null);
          navigation.goBack();
        },
      },
    ]);
  };

  const totalSets = activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = activeWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  return (
    <View style={styles.container}>
      {/* Timer Header */}
      <View style={styles.timerHeader}>
        <TouchableOpacity onPress={cancelWorkout}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.timerCenter}>
          <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
          <Text style={styles.setsCount}>
            {completedSets}/{totalSets} sets
          </Text>
        </View>
        <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout}>
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.exerciseList}>
        {activeWorkout.exercises.map((exercise, exIdx) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
            <Text style={styles.muscleGroup}>
              {exercise.exercise.primaryMuscle} · {exercise.exercise.equipment}
            </Text>

            {/* Set Headers */}
            <View style={styles.setHeader}>
              <Text style={[styles.setHeaderText, { width: 40 }]}>Set</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>Weight (kg)</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
              <Text style={[styles.setHeaderText, { width: 40 }]}>✓</Text>
            </View>

            {/* Sets */}
            {exercise.sets.map((set, setIdx) => (
              <View key={set.id} style={[styles.setRow, set.completed && styles.setCompleted]}>
                <Text style={[styles.setNumber, set.isWarmup && styles.warmupText]}>
                  {set.isWarmup ? 'W' : set.setNumber}
                </Text>
                <TextInput
                  style={styles.setInput}
                  keyboardType="numeric"
                  value={set.weightKg ? set.weightKg.toString() : ''}
                  onChangeText={(v) => updateSet(exIdx, setIdx, 'weightKg', v)}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  style={styles.setInput}
                  keyboardType="numeric"
                  value={set.reps ? set.reps.toString() : ''}
                  onChangeText={(v) => updateSet(exIdx, setIdx, 'reps', v)}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
                  onPress={() => toggleSetComplete(exIdx, setIdx)}
                >
                  <Text style={styles.checkText}>{set.completed ? '✓' : ''}</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(exIdx)}>
              <Text style={styles.addSetText}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Exercise Button */}
        <TouchableOpacity
          style={styles.addExerciseBtn}
          onPress={() => setShowExercisePicker(true)}
        >
          <Text style={styles.addExerciseText}>+ Add Exercise</Text>
        </TouchableOpacity>

        {/* Simple Exercise Picker */}
        {showExercisePicker && (
          <View style={styles.picker}>
            <Text style={styles.pickerTitle}>Select Exercise</Text>
            <ScrollView style={styles.pickerList}>
              {exercises.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.pickerItem}
                  onPress={() => addExercise(ex)}
                >
                  <Text style={styles.pickerItemName}>{ex.name}</Text>
                  <Text style={styles.pickerItemMeta}>
                    {ex.primaryMuscle} · {ex.equipment}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerClose}
              onPress={() => setShowExercisePicker(false)}
            >
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 100 },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: colors.card,
  },
  cancelText: { ...typography.body, color: colors.danger },
  timerCenter: { alignItems: 'center' },
  timer: { ...typography.h1, color: colors.text },
  setsCount: { ...typography.caption, color: colors.textSecondary },
  finishBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  finishText: { ...typography.bodyBold, color: colors.text },
  exerciseList: { flex: 1, padding: 16 },
  exerciseCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  exerciseName: { ...typography.h3, color: colors.text },
  muscleGroup: { ...typography.caption, color: colors.accent, marginTop: 2, marginBottom: 12 },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  setHeaderText: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 2,
  },
  setCompleted: { backgroundColor: colors.success + '15' },
  setNumber: {
    width: 40,
    textAlign: 'center',
    ...typography.body,
    color: colors.text,
  },
  warmupText: { color: colors.warning },
  setInput: {
    flex: 1,
    textAlign: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
    color: colors.text,
    ...typography.body,
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  checkBtnDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkText: { color: colors.text, fontWeight: '700' },
  addSetBtn: { marginTop: 8, alignItems: 'center' },
  addSetText: { ...typography.body, color: colors.accent },
  addExerciseBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    marginBottom: 32,
  },
  addExerciseText: { ...typography.bodyBold, color: colors.accent },
  picker: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  pickerTitle: { ...typography.h3, color: colors.text, marginBottom: 12 },
  pickerList: { maxHeight: 300 },
  pickerItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemName: { ...typography.body, color: colors.text },
  pickerItemMeta: { ...typography.caption, color: colors.textSecondary },
  pickerClose: { marginTop: 12, alignItems: 'center' },
});
