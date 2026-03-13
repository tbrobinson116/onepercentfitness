import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography } from '../theme';
import type { WorkoutExercise, Exercise, ExerciseNote, WeightUnit, CardioEntry, CardioType } from '../types';

// Default starting weights in lbs for intermediate lifters
const DEFAULT_WEIGHTS_LBS: Record<string, number> = {
  'Barbell Bench Press': 135, 'Incline Dumbbell Press': 50, 'Dumbbell Bench Press': 50,
  'Decline Barbell Press': 135, 'Cable Flyes': 30, 'Machine Chest Press': 100,
  'Push-Ups': 0, 'Chest Dips': 0, 'Dips': 0,
  'Barbell Deadlift': 185, 'Deadlift': 185, 'Pull-Ups': 0,
  'Barbell Bent-Over Row': 115, 'Barbell Row': 115, 'Dumbbell Row': 50,
  'Seated Cable Row': 100, 'T-Bar Row': 90, 'Lat Pulldown': 100, 'Face Pulls': 40,
  'Overhead Press': 85, 'Barbell Overhead Press': 85, 'Dumbbell Shoulder Press': 40,
  'Arnold Press': 35, 'Lateral Raises': 15, 'Cable Lateral Raise': 15, 'Rear Delt Flyes': 15,
  'Barbell Curl': 65, 'Dumbbell Curl': 25, 'Hammer Curl': 30, 'Preacher Curl': 50,
  'Tricep Pushdown': 50, 'Skull Crushers': 55, 'Overhead Tricep Extension': 40,
  'Close-Grip Bench Press': 115,
  'Barbell Squat': 155, 'Barbell Back Squat': 155, 'Front Squat': 115,
  'Leg Press': 200, 'Romanian Deadlift': 135, 'Bulgarian Split Squat': 30,
  'Leg Extension': 80, 'Leg Curl': 70, 'Hip Thrust': 135, 'Calf Raises': 100,
  'Goblet Squat': 40, 'Smith Machine Squat': 115, 'Hack Squat': 140,
  'Walking Lunges': 30, 'Lunges': 30,
  'Plank': 0, 'Cable Crunches': 60, 'Hanging Leg Raise': 0,
};

const MUSCLE_ICONS: Record<string, string> = {
  chest: '🫁', back: '🔙', shoulders: '🦾', biceps: '💪', triceps: '💪',
  forearms: '🤲', abs: '🧱', obliques: '🧱', quads: '🦵', hamstrings: '🦵',
  glutes: '🍑', calves: '🦶', traps: '🔺', lats: '🔙', lower_back: '🔙',
  hip_flexors: '🦵', adductors: '🦵', abductors: '🦵', full_body: '🏋️', cardio: '❤️',
};

const CARDIO_TYPES: { value: CardioType; label: string }[] = [
  { value: 'treadmill', label: 'Treadmill' },
  { value: 'elliptical', label: 'Elliptical' },
  { value: 'bike', label: 'Stationary Bike' },
  { value: 'stairmaster', label: 'Stairmaster' },
  { value: 'rowing', label: 'Rowing Machine' },
  { value: 'outdoor_run', label: 'Outdoor Run' },
  { value: 'outdoor_walk', label: 'Outdoor Walk' },
  { value: 'other', label: 'Other Cardio' },
];

// MET values for calorie estimation
// MET = Metabolic Equivalent of Task
function estimateCalories(
  type: CardioType,
  durationMinutes: number,
  speedMph: number,
  inclinePercent: number,
  weightedVestLbs: number,
  bodyWeightLbs: number = 170, // default assumption
): number {
  // Base MET for different activities
  let met: number;
  switch (type) {
    case 'treadmill':
    case 'outdoor_run':
    case 'outdoor_walk': {
      if (speedMph <= 2.0) met = 2.5;
      else if (speedMph <= 3.0) met = 3.3;
      else if (speedMph <= 3.5) met = 3.8;
      else if (speedMph <= 4.0) met = 5.0;
      else if (speedMph <= 4.5) met = 6.3;
      else if (speedMph <= 5.0) met = 8.3;
      else if (speedMph <= 5.5) met = 9.0;
      else if (speedMph <= 6.0) met = 9.8;
      else if (speedMph <= 6.5) met = 10.5;
      else if (speedMph <= 7.0) met = 11.0;
      else if (speedMph <= 7.5) met = 11.8;
      else if (speedMph <= 8.0) met = 12.3;
      else if (speedMph <= 9.0) met = 12.8;
      else if (speedMph <= 10.0) met = 14.5;
      else met = 16.0;
      // Incline adds ~0.1 MET per % incline for treadmill
      met += inclinePercent * 0.1;
      break;
    }
    case 'elliptical':
      met = 5.0 + (speedMph > 0 ? speedMph * 0.3 : 0);
      break;
    case 'bike':
      if (speedMph <= 10) met = 4.0;
      else if (speedMph <= 12) met = 6.8;
      else if (speedMph <= 14) met = 8.0;
      else if (speedMph <= 16) met = 10.0;
      else met = 12.0;
      break;
    case 'stairmaster':
      met = 9.0 + inclinePercent * 0.05;
      break;
    case 'rowing':
      met = speedMph <= 0 ? 7.0 : 7.0 + speedMph * 0.2;
      break;
    default:
      met = 5.0;
  }

  // Total effective weight in kg
  const totalWeightKg = (bodyWeightLbs + weightedVestLbs) * 0.453592;

  // Calories = MET × weight(kg) × duration(hours)
  const calories = met * totalWeightKg * (durationMinutes / 60);
  return Math.round(calories);
}

function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10;
}

function getDefaultWeight(exerciseName: string, unit: WeightUnit): number {
  const lbs = DEFAULT_WEIGHTS_LBS[exerciseName] ?? 0;
  if (lbs === 0) return 0;
  return unit === 'lbs' ? lbs : lbsToKg(lbs);
}

// Built-in exercise fallback
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
  const { activeWorkout, setActiveWorkout, addWorkout, weightUnit, setWeightUnit } = useStore();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>(FALLBACK_EXERCISES);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [exerciseInfoIdx, setExerciseInfoIdx] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteExIdx, setNoteExIdx] = useState<number | null>(null);
  // Cardio state
  const [showCardioForm, setShowCardioForm] = useState(false);
  const [cardioType, setCardioType] = useState<CardioType>('treadmill');
  const [cardioDuration, setCardioDuration] = useState('30');
  const [cardioSpeed, setCardioSpeed] = useState('3.5');
  const [cardioIncline, setCardioIncline] = useState('0');
  const [cardioVestWeight, setCardioVestWeight] = useState('0');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.getExercises().then((apiExercises) => {
      if (apiExercises && apiExercises.length > 0) {
        setExercises(apiExercises);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  useEffect(() => {
    if (activeWorkout && (activeWorkout.exercises.length > 0 || (activeWorkout.cardioEntries?.length ?? 0) > 0) && !timerRunning) {
      setTimerRunning(true);
    }
  }, [activeWorkout?.exercises.length, activeWorkout?.cardioEntries?.length]);

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
    const defaultWeight = getDefaultWeight(exercise.name, weightUnit);
    const newExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseId: exercise.id,
      exercise,
      sets: [
        {
          id: `${Date.now()}-0`,
          setNumber: 1,
          reps: 10,
          weight: defaultWeight,
          completed: false,
        },
      ],
      exerciseNotes: [],
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
        reps: lastSet?.reps ?? 10,
        weight: lastSet?.weight ?? lastSet?.weightKg ?? 0,
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
    field: 'reps' | 'weight',
    value: string
  ) => {
    const updated = { ...activeWorkout };
    const ex = { ...updated.exercises[exerciseIndex] };
    const numVal = Number(value) || 0;

    // Update this set and propagate to subsequent uncompleted sets
    const newSets = ex.sets.map((set, idx) => {
      if (idx === setIndex) {
        return { ...set, [field]: numVal };
      }
      if (idx > setIndex && !set.completed) {
        return { ...set, [field]: numVal };
      }
      return set;
    });

    ex.sets = newSets;
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

  const addExerciseNote = (exerciseIndex: number, text: string) => {
    if (!text.trim()) return;
    const updated = { ...activeWorkout };
    const ex = { ...updated.exercises[exerciseIndex] };
    const note: ExerciseNote = {
      id: Date.now().toString(),
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    ex.exerciseNotes = [...(ex.exerciseNotes ?? []), note];
    updated.exercises = [...updated.exercises];
    updated.exercises[exerciseIndex] = ex;
    setActiveWorkout(updated);
    setNoteText('');
    setNoteExIdx(null);
  };

  const toggleWeightUnit = () => {
    const newUnit: WeightUnit = weightUnit === 'lbs' ? 'kg' : 'lbs';
    setWeightUnit(newUnit);
  };

  // Cardio
  const cardioCalEstimate = estimateCalories(
    cardioType,
    Number(cardioDuration) || 0,
    Number(cardioSpeed) || 0,
    Number(cardioIncline) || 0,
    Number(cardioVestWeight) || 0,
  );

  const addCardioEntry = () => {
    const entry: CardioEntry = {
      id: Date.now().toString(),
      type: cardioType,
      durationMinutes: Number(cardioDuration) || 0,
      speedMph: Number(cardioSpeed) || undefined,
      inclinePercent: Number(cardioIncline) || undefined,
      weightedVestLbs: Number(cardioVestWeight) || undefined,
      estimatedCalories: cardioCalEstimate,
    };
    setActiveWorkout({
      ...activeWorkout,
      cardioEntries: [...(activeWorkout.cardioEntries ?? []), entry],
    });
    setShowCardioForm(false);
    // Reset form
    setCardioDuration('30');
    setCardioSpeed('3.5');
    setCardioIncline('0');
    setCardioVestWeight('0');
  };

  const removeCardioEntry = (id: string) => {
    setActiveWorkout({
      ...activeWorkout,
      cardioEntries: (activeWorkout.cardioEntries ?? []).filter((c) => c.id !== id),
    });
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
  const hasContent = activeWorkout.exercises.length > 0 || (activeWorkout.cardioEntries?.length ?? 0) > 0;
  const totalCardioCalories = (activeWorkout.cardioEntries ?? []).reduce((sum, c) => sum + c.estimatedCalories, 0);

  const exerciseForInfo = exerciseInfoIdx !== null ? activeWorkout.exercises[exerciseInfoIdx] : null;

  return (
    <View style={styles.container}>
      {/* Timer Header */}
      <View style={styles.timerHeader}>
        <TouchableOpacity onPress={cancelWorkout}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.timerCenter}>
          {hasContent ? (
            <>
              <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
              <Text style={styles.setsCount}>
                {completedSets}/{totalSets} sets
                {totalCardioCalories > 0 ? ` · ~${totalCardioCalories} cal` : ''}
              </Text>
            </>
          ) : (
            <Text style={styles.readyText}>Add an exercise to begin</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.finishBtn, !hasContent && { opacity: 0.4 }]}
          onPress={finishWorkout}
          disabled={!hasContent}
        >
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Weight Unit Toggle */}
      <View style={styles.unitToggleRow}>
        <TouchableOpacity style={styles.unitToggle} onPress={toggleWeightUnit}>
          <Text style={[styles.unitOption, weightUnit === 'lbs' && styles.unitOptionActive]}>LBS</Text>
          <Text style={styles.unitDivider}>/</Text>
          <Text style={[styles.unitOption, weightUnit === 'kg' && styles.unitOptionActive]}>KG</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.exerciseList} keyboardShouldPersistTaps="handled">
        {/* Cardio Entries */}
        {(activeWorkout.cardioEntries ?? []).map((entry) => (
          <View key={entry.id} style={styles.cardioCard}>
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>
                  {CARDIO_TYPES.find((t) => t.value === entry.type)?.label ?? entry.type}
                </Text>
                <Text style={styles.muscleGroup}>❤️ Cardio</Text>
              </View>
              <TouchableOpacity onPress={() => removeCardioEntry(entry.id)}>
                <Text style={styles.removeExText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardioStats}>
              <View style={styles.cardioStatItem}>
                <Text style={styles.cardioStatValue}>{entry.durationMinutes}</Text>
                <Text style={styles.cardioStatLabel}>min</Text>
              </View>
              {entry.speedMph ? (
                <View style={styles.cardioStatItem}>
                  <Text style={styles.cardioStatValue}>{entry.speedMph}</Text>
                  <Text style={styles.cardioStatLabel}>mph</Text>
                </View>
              ) : null}
              {entry.inclinePercent ? (
                <View style={styles.cardioStatItem}>
                  <Text style={styles.cardioStatValue}>{entry.inclinePercent}%</Text>
                  <Text style={styles.cardioStatLabel}>incline</Text>
                </View>
              ) : null}
              {entry.weightedVestLbs ? (
                <View style={styles.cardioStatItem}>
                  <Text style={styles.cardioStatValue}>{entry.weightedVestLbs}</Text>
                  <Text style={styles.cardioStatLabel}>lb vest</Text>
                </View>
              ) : null}
              <View style={styles.cardioStatItem}>
                <Text style={[styles.cardioStatValue, { color: colors.warning }]}>~{entry.estimatedCalories}</Text>
                <Text style={styles.cardioStatLabel}>cal</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Strength Exercises */}
        {activeWorkout.exercises.map((exercise, exIdx) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => setExerciseInfoIdx(exIdx)}
              >
                <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
                <View style={styles.muscleRow}>
                  <Text style={styles.muscleIcon}>
                    {MUSCLE_ICONS[exercise.exercise.primaryMuscle] ?? '🏋️'}
                  </Text>
                  <Text style={styles.muscleGroup}>
                    {exercise.exercise.primaryMuscle}
                    {exercise.exercise.secondaryMuscles.length > 0
                      ? ` + ${exercise.exercise.secondaryMuscles.join(', ')}`
                      : ''}
                  </Text>
                  <Text style={styles.infoHint}>ⓘ</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeExercise(exIdx)}>
                <Text style={styles.removeExText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Set Headers */}
            <View style={styles.setHeader}>
              <Text style={[styles.setHeaderText, { width: 40 }]}>Set</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>Weight ({weightUnit})</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
              <Text style={[styles.setHeaderText, { width: 40 }]}></Text>
            </View>

            {exercise.sets.map((set, setIdx) => (
              <View key={set.id} style={[styles.setRow, set.completed && styles.setCompleted]}>
                <Text style={[styles.setNumber, set.isWarmup && styles.warmupText]}>
                  {set.isWarmup ? 'W' : set.setNumber}
                </Text>
                <TextInput
                  style={styles.setInput}
                  keyboardType="numeric"
                  value={(set.weight ?? set.weightKg) ? (set.weight ?? set.weightKg)!.toString() : ''}
                  onChangeText={(v) => updateSet(exIdx, setIdx, 'weight', v)}
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

            {/* Exercise Notes */}
            {(exercise.exerciseNotes?.length ?? 0) > 0 && (
              <View style={styles.notesSection}>
                {exercise.exerciseNotes!.map((note) => (
                  <View key={note.id} style={styles.noteItem}>
                    <Text style={styles.noteText}>{note.text}</Text>
                    <Text style={styles.noteTime}>
                      {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Add Note Input */}
            <View style={styles.noteInputRow}>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a note about this exercise..."
                placeholderTextColor={colors.textSecondary}
                value={noteExIdx === exIdx ? noteText : ''}
                onFocus={() => setNoteExIdx(exIdx)}
                onChangeText={(v) => { setNoteExIdx(exIdx); setNoteText(v); }}
                onSubmitEditing={() => addExerciseNote(exIdx, noteText)}
                returnKeyType="send"
              />
              {noteExIdx === exIdx && noteText.trim() ? (
                <TouchableOpacity
                  style={styles.sendNoteBtn}
                  onPress={() => addExerciseNote(exIdx, noteText)}
                >
                  <Text style={styles.sendNoteText}>Send</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}

        {/* Add Exercise / Cardio Buttons */}
        <View style={styles.addButtonsRow}>
          <TouchableOpacity
            style={[styles.addExerciseBtn, { flex: 1, marginRight: 6 }]}
            onPress={() => setShowExercisePicker(true)}
          >
            <Text style={styles.addExerciseText}>+ Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addExerciseBtn, { flex: 1, marginLeft: 6, borderColor: colors.warning }]}
            onPress={() => setShowCardioForm(true)}
          >
            <Text style={[styles.addExerciseText, { color: colors.warning }]}>+ Cardio</Text>
          </TouchableOpacity>
        </View>

        {/* Cardio Form */}
        {showCardioForm && (
          <View style={styles.picker}>
            <Text style={styles.pickerTitle}>Log Cardio</Text>

            {/* Cardio Type Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {CARDIO_TYPES.map((ct) => (
                <TouchableOpacity
                  key={ct.value}
                  style={[styles.filterChip, cardioType === ct.value && styles.filterChipActive]}
                  onPress={() => setCardioType(ct.value)}
                >
                  <Text style={[styles.filterText, cardioType === ct.value && styles.filterTextActive]}>
                    {ct.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Cardio Inputs */}
            <View style={styles.cardioInputGrid}>
              <View style={styles.cardioInputItem}>
                <Text style={styles.cardioInputLabel}>Duration (min)</Text>
                <TextInput
                  style={styles.cardioInputField}
                  keyboardType="numeric"
                  value={cardioDuration}
                  onChangeText={setCardioDuration}
                  placeholder="30"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.cardioInputItem}>
                <Text style={styles.cardioInputLabel}>Speed (mph)</Text>
                <TextInput
                  style={styles.cardioInputField}
                  keyboardType="decimal-pad"
                  value={cardioSpeed}
                  onChangeText={setCardioSpeed}
                  placeholder="3.5"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.cardioInputItem}>
                <Text style={styles.cardioInputLabel}>Incline (%)</Text>
                <TextInput
                  style={styles.cardioInputField}
                  keyboardType="numeric"
                  value={cardioIncline}
                  onChangeText={setCardioIncline}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.cardioInputItem}>
                <Text style={styles.cardioInputLabel}>Vest (lbs)</Text>
                <TextInput
                  style={styles.cardioInputField}
                  keyboardType="numeric"
                  value={cardioVestWeight}
                  onChangeText={setCardioVestWeight}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            {/* Calorie Estimate */}
            <View style={styles.calorieEstimate}>
              <Text style={styles.calorieLabel}>Estimated Calories</Text>
              <Text style={styles.calorieValue}>~{cardioCalEstimate} cal</Text>
            </View>

            <View style={styles.cardioFormButtons}>
              <TouchableOpacity
                style={styles.cardioAddBtn}
                onPress={addCardioEntry}
              >
                <Text style={styles.cardioAddText}>Add Cardio</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerClose}
                onPress={() => setShowCardioForm(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Exercise Picker */}
        {showExercisePicker && (
          <View style={styles.picker}>
            <Text style={styles.pickerTitle}>Select Exercise</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
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
            <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
              {filteredExercises.length === 0 ? (
                <Text style={styles.noResults}>No exercises found</Text>
              ) : (
                filteredExercises.map((ex) => (
                  <TouchableOpacity
                    key={ex.id}
                    style={styles.pickerItem}
                    onPress={() => addExercise(ex)}
                  >
                    <View style={styles.pickerItemRow}>
                      <Text style={styles.pickerMuscleIcon}>
                        {MUSCLE_ICONS[ex.primaryMuscle] ?? '🏋️'}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickerItemName}>{ex.name}</Text>
                        <Text style={styles.pickerItemMeta}>
                          {ex.primaryMuscle} · {ex.equipment}
                          {getDefaultWeight(ex.name, weightUnit) > 0
                            ? ` · ~${getDefaultWeight(ex.name, weightUnit)} ${weightUnit}`
                            : ''}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerClose}
              onPress={() => { setShowExercisePicker(false); setSearchQuery(''); setMuscleFilter('All'); }}
            >
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Exercise Info Modal */}
      <Modal
        visible={exerciseInfoIdx !== null && !showExercisePicker && !showCardioForm}
        transparent
        animationType="slide"
        onRequestClose={() => setExerciseInfoIdx(null)}
      >
        {exerciseForInfo && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{exerciseForInfo.exercise.name}</Text>
                <TouchableOpacity onPress={() => setExerciseInfoIdx(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalSectionTitle}>Muscles Targeted</Text>
                <View style={styles.muscleChips}>
                  <View style={styles.primaryMuscleChip}>
                    <Text style={styles.muscleChipIcon}>
                      {MUSCLE_ICONS[exerciseForInfo.exercise.primaryMuscle] ?? '🏋️'}
                    </Text>
                    <Text style={styles.primaryMuscleText}>
                      {exerciseForInfo.exercise.primaryMuscle} (primary)
                    </Text>
                  </View>
                  {exerciseForInfo.exercise.secondaryMuscles.map((m) => (
                    <View key={m} style={styles.secondaryMuscleChip}>
                      <Text style={styles.muscleChipIcon}>{MUSCLE_ICONS[m] ?? '🏋️'}</Text>
                      <Text style={styles.secondaryMuscleText}>{m}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.modalSectionTitle}>Equipment</Text>
                <Text style={styles.modalBodyText}>
                  {exerciseForInfo.exercise.equipment.charAt(0).toUpperCase() +
                    exerciseForInfo.exercise.equipment.slice(1)}
                </Text>

                {exerciseForInfo.exercise.instructions && (
                  <>
                    <Text style={styles.modalSectionTitle}>How to Perform</Text>
                    <Text style={styles.modalBodyText}>
                      {exerciseForInfo.exercise.instructions}
                    </Text>
                  </>
                )}

                {getDefaultWeight(exerciseForInfo.exercise.name, weightUnit) > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Suggested Starting Weight</Text>
                    <Text style={styles.modalBodyText}>
                      ~{getDefaultWeight(exerciseForInfo.exercise.name, weightUnit)} {weightUnit} (intermediate)
                    </Text>
                  </>
                )}

                {(exerciseForInfo.exerciseNotes?.length ?? 0) > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Your Notes</Text>
                    {exerciseForInfo.exerciseNotes!.map((note) => (
                      <View key={note.id} style={styles.modalNoteItem}>
                        <Text style={styles.modalNoteText}>{note.text}</Text>
                        <Text style={styles.modalNoteTime}>
                          {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
              <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setExerciseInfoIdx(null)}>
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 100 },
  timerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: colors.card,
  },
  cancelText: { ...typography.body, color: colors.danger },
  timerCenter: { alignItems: 'center' },
  timer: { ...typography.h1, color: colors.text },
  readyText: { ...typography.body, color: colors.textSecondary },
  setsCount: { ...typography.caption, color: colors.textSecondary },
  finishBtn: { backgroundColor: colors.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  finishText: { ...typography.bodyBold, color: colors.text },
  // Unit toggle
  unitToggleRow: {
    alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  unitToggle: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg,
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6,
  },
  unitOption: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  unitOptionActive: { color: colors.accent },
  unitDivider: { ...typography.caption, color: colors.textSecondary, marginHorizontal: 4 },
  // Exercise list
  exerciseList: { flex: 1, padding: 16 },
  exerciseCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardioCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: colors.warning },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  exerciseName: { ...typography.h3, color: colors.text },
  muscleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  muscleIcon: { fontSize: 14, marginRight: 4 },
  muscleGroup: { ...typography.caption, color: colors.accent, flex: 1 },
  infoHint: { ...typography.caption, color: colors.accent, marginLeft: 4, fontSize: 16 },
  removeExText: { ...typography.body, color: colors.danger, padding: 4 },
  setHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingHorizontal: 4 },
  setHeaderText: { ...typography.small, color: colors.textSecondary, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderRadius: 8, marginBottom: 2 },
  setCompleted: { backgroundColor: colors.success + '15' },
  setNumber: { width: 40, textAlign: 'center', ...typography.body, color: colors.text },
  warmupText: { color: colors.warning },
  setInput: {
    flex: 1, textAlign: 'center', backgroundColor: colors.inputBg, borderRadius: 8,
    padding: 8, marginHorizontal: 4, color: colors.text, ...typography.body,
  },
  checkBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },
  checkBtnDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkText: { color: colors.text, fontWeight: '700' },
  addSetBtn: { marginTop: 8, alignItems: 'center' },
  addSetText: { ...typography.body, color: colors.accent },
  // Notes
  notesSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  noteItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 },
  noteText: { ...typography.caption, color: colors.text, flex: 1 },
  noteTime: { ...typography.small, color: colors.textSecondary, marginLeft: 8 },
  noteInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  noteInput: {
    flex: 1, backgroundColor: colors.inputBg, borderRadius: 12, padding: 10,
    color: colors.text, ...typography.caption, borderWidth: 1, borderColor: colors.border,
  },
  sendNoteBtn: { backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  sendNoteText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  // Add buttons
  addButtonsRow: { flexDirection: 'row', marginBottom: 12 },
  addExerciseBtn: {
    backgroundColor: colors.card, borderRadius: 12, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: colors.accent, borderStyle: 'dashed', marginBottom: 8,
  },
  addExerciseText: { ...typography.bodyBold, color: colors.accent },
  // Cardio stats
  cardioStats: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' },
  cardioStatItem: { alignItems: 'center', minWidth: 60, paddingVertical: 4 },
  cardioStatValue: { ...typography.h3, color: colors.text },
  cardioStatLabel: { ...typography.small, color: colors.textSecondary },
  // Cardio form
  cardioInputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  cardioInputItem: { width: '47%' as any },
  cardioInputLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  cardioInputField: {
    backgroundColor: colors.inputBg, borderRadius: 10, padding: 12,
    color: colors.text, ...typography.body, borderWidth: 1, borderColor: colors.border,
  },
  calorieEstimate: {
    backgroundColor: colors.warning + '15', borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  calorieLabel: { ...typography.bodyBold, color: colors.text },
  calorieValue: { ...typography.h2, color: colors.warning },
  cardioFormButtons: { gap: 8 },
  cardioAddBtn: { backgroundColor: colors.warning, borderRadius: 12, padding: 14, alignItems: 'center' },
  cardioAddText: { ...typography.bodyBold, color: '#000' },
  // Picker
  picker: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 32 },
  pickerTitle: { ...typography.h3, color: colors.text, marginBottom: 12 },
  searchInput: {
    backgroundColor: colors.inputBg, borderRadius: 12, padding: 12, color: colors.text,
    ...typography.body, borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', marginBottom: 12, maxHeight: 36 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: colors.inputBg, marginRight: 8, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.accent + '22', borderColor: colors.accent },
  filterText: { ...typography.caption, color: colors.textSecondary },
  filterTextActive: { color: colors.accent, fontWeight: '600' },
  pickerList: { maxHeight: 300 },
  noResults: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
  pickerItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerItemRow: { flexDirection: 'row', alignItems: 'center' },
  pickerMuscleIcon: { fontSize: 20, marginRight: 10 },
  pickerItemName: { ...typography.body, color: colors.text },
  pickerItemMeta: { ...typography.caption, color: colors.textSecondary },
  pickerClose: { marginTop: 12, alignItems: 'center' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { ...typography.h2, color: colors.text, flex: 1 },
  modalClose: { ...typography.h3, color: colors.textSecondary, padding: 4 },
  modalScroll: { marginBottom: 16 },
  modalSectionTitle: { ...typography.bodyBold, color: colors.accent, marginTop: 16, marginBottom: 8 },
  modalBodyText: { ...typography.body, color: colors.text, lineHeight: 22 },
  muscleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primaryMuscleChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent + '22',
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.accent,
  },
  muscleChipIcon: { fontSize: 14, marginRight: 6 },
  primaryMuscleText: { ...typography.caption, color: colors.accent, fontWeight: '600' },
  secondaryMuscleChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg,
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.border,
  },
  secondaryMuscleText: { ...typography.caption, color: colors.textSecondary },
  modalNoteItem: { backgroundColor: colors.inputBg, borderRadius: 12, padding: 12, marginBottom: 8 },
  modalNoteText: { ...typography.body, color: colors.text },
  modalNoteTime: { ...typography.small, color: colors.textSecondary, marginTop: 4 },
  modalDoneBtn: { backgroundColor: colors.accent, borderRadius: 16, padding: 16, alignItems: 'center' },
  modalDoneText: { ...typography.bodyBold, color: colors.text },
});
