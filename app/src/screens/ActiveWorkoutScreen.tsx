import React, { useState, useEffect, useRef } from 'react';
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
import type { WorkoutExercise, Exercise } from '../types';

// Built-in exercise fallback so the picker always has exercises
const FALLBACK_EXERCISES: Exercise[] = [
  { id: 'fb-001', name: 'Barbell Bench Press', type: 'strength', primaryMuscle: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'barbell' },
  { id: 'fb-002', name: 'Incline Dumbbell Press', type: 'strength', primaryMuscle: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'dumbbell' },
  { id: 'fb-003', name: 'Push-Ups', type: 'bodyweight', primaryMuscle: 'chest', secondaryMuscles: ['shoulders', 'triceps', 'abs'], equipment: 'bodyweight' },
  { id: 'fb-004', name: 'Cable Flyes', type: 'strength', primaryMuscle: 'chest', secondaryMuscles: [], equipment: 'cable' },
  { id: 'fb-005', name: 'Barbell Back Squat', type: 'strength', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'barbell' },
  { id: 'fb-006', name: 'Leg Press', type: 'strength', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'machine' },
  { id: 'fb-007', name: 'Romanian Deadlift', type: 'strength', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'lower_back'], equipment: 'barbell' },
  { id: 'fb-008', name: 'Leg Extension', type: 'strength', primaryMuscle: 'quads', secondaryMuscles: [], equipment: 'machine' },
  { id: 'fb-009', name: 'Leg Curl', type: 'strength', primaryMuscle: 'hamstrings', secondaryMuscles: [], equipment: 'machine' },
  { id: 'fb-010', name: 'Barbell Overhead Press', type: 'strength', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'barbell' },
  { id: 'fb-011', name: 'Lateral Raises', type: 'strength', primaryMuscle: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell' },
  { id: 'fb-012', name: 'Pull-Ups', type: 'bodyweight', primaryMuscle: 'lats', secondaryMuscles: ['biceps', 'back'], equipment: 'bodyweight' },
  { id: 'fb-013', name: 'Barbell Row', type: 'strength', primaryMuscle: 'back', secondaryMuscles: ['biceps', 'lats'], equipment: 'barbell' },
  { id: 'fb-014', name: 'Lat Pulldown', type: 'strength', primaryMuscle: 'lats', secondaryMuscles: ['biceps'], equipment: 'cable' },
  { id: 'fb-015', name: 'Seated Cable Row', type: 'strength', primaryMuscle: 'back', secondaryMuscles: ['biceps', 'lats'], equipment: 'cable' },
  { id: 'fb-016', name: 'Barbell Curl', type: 'strength', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'barbell' },
  { id: 'fb-017', name: 'Dumbbell Curl', type: 'strength', primaryMuscle: 'biceps', secondaryMuscles: [], equipment: 'dumbbell' },
  { id: 'fb-018', name: 'Tricep Pushdown', type: 'strength', primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'cable' },
  { id: 'fb-019', name: 'Skull Crushers', type: 'strength', primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'barbell' },
  { id: 'fb-020', name: 'Deadlift', type: 'strength', primaryMuscle: 'back', secondaryMuscles: ['hamstrings', 'glutes', 'traps'], equipment: 'barbell' },
  { id: 'fb-021', name: 'Hip Thrust', type: 'strength', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'barbell' },
  { id: 'fb-022', name: 'Calf Raises', type: 'strength', primaryMuscle: 'calves', secondaryMuscles: [], equipment: 'machine' },
  { id: 'fb-023', name: 'Plank', type: 'bodyweight', primaryMuscle: 'abs', secondaryMuscles: [], equipment: 'bodyweight' },
  { id: 'fb-024', name: 'Face Pulls', type: 'strength', primaryMuscle: 'shoulders', secondaryMuscles: ['traps'], equipment: 'cable' },
  { id: 'fb-025', name: 'Dumbbell Shoulder Press', type: 'strength', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'dumbbell' },
  { id: 'fb-026', name: 'Smith Machine Squat', type: 'strength', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'machine' },
  { id: 'fb-027', name: 'Hack Squat', type: 'strength', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'machine' },
  { id: 'fb-028', name: 'Chest Dips', type: 'bodyweight', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'bodyweight' },
  { id: 'fb-029', name: 'Dumbbell Row', type: 'strength', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'dumbbell' },
  { id: 'fb-030', name: 'Cable Lateral Raise', type: 'strength', primaryMuscle: 'shoulders', secondaryMuscles: [], equipment: 'cable' },
];

const MUSCLE_FILTERS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];

export function ActiveWorkoutScreen({ route, navigation }: any) {
  const { activeWorkout, setActiveWorkout, addWorkout } = useStore();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>(FALLBACK_EXERCISES);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch exercises from API, fall back to built-in list
  useEffect(() => {
    api.getExercises().then((apiExercises) => {
      if (apiExercises && apiExercises.length > 0) {
        setExercises(apiExercises);
      }
    }).catch(() => {});
  }, []);

  // Timer only runs when there are exercises
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  // Start timer when first exercise is added
  useEffect(() => {
    if (activeWorkout && activeWorkout.exercises.length > 0 && !timerRunning) {
      setTimerRunning(true);
    }
  }, [activeWorkout?.exercises.length]);

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

  const matchesMuscleFilter = (ex: Exercise) => {
    if (muscleFilter === 'All') return true;
    const muscle = ex.primaryMuscle.toLowerCase();
    switch (muscleFilter) {
      case 'Chest': return muscle === 'chest';
      case 'Back': return ['back', 'lats', 'lower_back', 'traps'].includes(muscle);
      case 'Shoulders': return muscle === 'shoulders';
      case 'Arms': return ['biceps', 'triceps', 'forearms'].includes(muscle);
      case 'Legs': return ['quads', 'hamstrings', 'glutes', 'calves', 'hip_flexors', 'adductors', 'abductors'].includes(muscle);
      case 'Core': return ['abs', 'obliques'].includes(muscle);
      default: return true;
    }
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = !searchQuery ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && matchesMuscleFilter(ex);
  });

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
    setSearchQuery('');
    setMuscleFilter('All');
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

  const removeExercise = (exerciseIndex: number) => {
    const updated = { ...activeWorkout };
    updated.exercises = activeWorkout.exercises.filter((_, i) => i !== exerciseIndex);
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
          {activeWorkout.exercises.length > 0 ? (
            <>
              <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
              <Text style={styles.setsCount}>
                {completedSets}/{totalSets} sets
              </Text>
            </>
          ) : (
            <Text style={styles.readyText}>Add an exercise to begin</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.finishBtn, activeWorkout.exercises.length === 0 && { opacity: 0.4 }]}
          onPress={finishWorkout}
          disabled={activeWorkout.exercises.length === 0}
        >
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.exerciseList}>
        {activeWorkout.exercises.map((exercise, exIdx) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
                <Text style={styles.muscleGroup}>
                  {exercise.exercise.primaryMuscle} · {exercise.exercise.equipment}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeExercise(exIdx)}>
                <Text style={styles.removeExText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Set Headers */}
            <View style={styles.setHeader}>
              <Text style={[styles.setHeaderText, { width: 40 }]}>Set</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>Weight (kg)</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
              <Text style={[styles.setHeaderText, { width: 40 }]}></Text>
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

        {/* Exercise Picker */}
        {showExercisePicker && (
          <View style={styles.picker}>
            <Text style={styles.pickerTitle}>Select Exercise</Text>

            {/* Search */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />

            {/* Muscle Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {MUSCLE_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, muscleFilter === filter && styles.filterChipActive]}
                  onPress={() => setMuscleFilter(filter)}
                >
                  <Text style={[styles.filterText, muscleFilter === filter && styles.filterTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.pickerList}>
              {filteredExercises.length === 0 ? (
                <Text style={styles.noResults}>No exercises found</Text>
              ) : (
                filteredExercises.map((ex) => (
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
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerClose}
              onPress={() => {
                setShowExercisePicker(false);
                setSearchQuery('');
                setMuscleFilter('All');
              }}
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
  readyText: { ...typography.body, color: colors.textSecondary },
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
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  exerciseName: { ...typography.h3, color: colors.text },
  muscleGroup: { ...typography.caption, color: colors.accent, marginTop: 2 },
  removeExText: { ...typography.body, color: colors.danger, padding: 4 },
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
  searchInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', marginBottom: 12, maxHeight: 36 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.inputBg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.accent + '22', borderColor: colors.accent },
  filterText: { ...typography.caption, color: colors.textSecondary },
  filterTextActive: { color: colors.accent, fontWeight: '600' },
  pickerList: { maxHeight: 300 },
  noResults: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
  pickerItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemName: { ...typography.body, color: colors.text },
  pickerItemMeta: { ...typography.caption, color: colors.textSecondary },
  pickerClose: { marginTop: 12, alignItems: 'center' },
});
