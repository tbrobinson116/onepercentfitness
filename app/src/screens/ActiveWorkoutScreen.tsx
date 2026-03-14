import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { PressableScale, ProgressRing } from '../components/ui';
import type { WorkoutExercise, Exercise, ExerciseNote, WeightUnit, CardioEntry, CardioType } from '../types';

// Fallback weights only used if no onboarding estimation exists
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

const REST_TIMES: Record<string, number> = {
  heavy_compound: 180, light_compound: 120, isolation: 90, bodyweight: 60,
};

function getRestTime(exerciseName: string): number {
  const name = exerciseName.toLowerCase();
  if (name.includes('squat') || name.includes('deadlift') || name.includes('bench press'))
    return REST_TIMES.heavy_compound;
  if (name.includes('row') || name.includes('press') || name.includes('pull'))
    return REST_TIMES.light_compound;
  if (name.includes('push-up') || name.includes('pull-up') || name.includes('dip') || name.includes('plank'))
    return REST_TIMES.bodyweight;
  return REST_TIMES.isolation;
}

const MUSCLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  chest: 'body-outline', back: 'body-outline', shoulders: 'body-outline',
  biceps: 'barbell-outline', triceps: 'barbell-outline', forearms: 'hand-left-outline',
  abs: 'body-outline', obliques: 'body-outline', quads: 'walk-outline',
  hamstrings: 'walk-outline', glutes: 'walk-outline', calves: 'walk-outline',
  traps: 'body-outline', lats: 'body-outline', lower_back: 'body-outline',
  hip_flexors: 'walk-outline', adductors: 'walk-outline', abductors: 'walk-outline',
  full_body: 'barbell-outline', cardio: 'heart-outline',
};

const CARDIO_TYPES: { value: CardioType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'treadmill', label: 'Treadmill', icon: 'walk-outline' },
  { value: 'elliptical', label: 'Elliptical', icon: 'fitness-outline' },
  { value: 'bike', label: 'Bike', icon: 'bicycle-outline' },
  { value: 'stairmaster', label: 'Stairmaster', icon: 'trending-up' },
  { value: 'rowing', label: 'Rowing', icon: 'boat-outline' },
  { value: 'outdoor_run', label: 'Run', icon: 'walk-outline' },
  { value: 'outdoor_walk', label: 'Walk', icon: 'footsteps-outline' },
  { value: 'other', label: 'Other', icon: 'heart-outline' },
];

function estimateCalories(
  type: CardioType, durationMinutes: number, speedMph: number,
  inclinePercent: number, weightedVestLbs: number, bodyWeightLbs: number = 170,
): number {
  let met: number;
  switch (type) {
    case 'treadmill': case 'outdoor_run': case 'outdoor_walk': {
      if (speedMph <= 2.0) met = 2.5;
      else if (speedMph <= 3.0) met = 3.3;
      else if (speedMph <= 4.0) met = 5.0;
      else if (speedMph <= 5.0) met = 8.3;
      else if (speedMph <= 6.0) met = 9.8;
      else if (speedMph <= 7.0) met = 11.0;
      else if (speedMph <= 8.0) met = 12.3;
      else if (speedMph <= 10.0) met = 14.5;
      else met = 16.0;
      met += inclinePercent * 0.1;
      break;
    }
    case 'elliptical': met = 5.0 + (speedMph > 0 ? speedMph * 0.3 : 0); break;
    case 'bike':
      if (speedMph <= 10) met = 4.0;
      else if (speedMph <= 14) met = 8.0;
      else met = 12.0;
      break;
    case 'stairmaster': met = 9.0 + inclinePercent * 0.05; break;
    case 'rowing': met = speedMph <= 0 ? 7.0 : 7.0 + speedMph * 0.2; break;
    default: met = 5.0;
  }
  const totalWeightKg = (bodyWeightLbs + weightedVestLbs) * 0.453592;
  return Math.round(met * totalWeightKg * (durationMinutes / 60));
}

function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10;
}

function getDefaultWeight(exerciseName: string, unit: WeightUnit, estimated?: Record<string, number>): number {
  const lbs = estimated?.[exerciseName] ?? DEFAULT_WEIGHTS_LBS[exerciseName] ?? 0;
  if (lbs === 0) return 0;
  return unit === 'lbs' ? lbs : lbsToKg(lbs);
}

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
  const { activeWorkout, setActiveWorkout, addWorkout, addToHistory, weightUnit, setWeightUnit, estimatedWeights, workoutHistory } = useStore();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>(FALLBACK_EXERCISES);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [exerciseInfoIdx, setExerciseInfoIdx] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteExIdx, setNoteExIdx] = useState<number | null>(null);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTarget, setRestTarget] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showCardioForm, setShowCardioForm] = useState(false);
  const [cardioType, setCardioType] = useState<CardioType>('treadmill');
  const [cardioDuration, setCardioDuration] = useState('30');
  const [cardioSpeed, setCardioSpeed] = useState('3.5');
  const [cardioIncline, setCardioIncline] = useState('0');
  const [cardioVestWeight, setCardioVestWeight] = useState('0');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getPrevPerformance = useCallback((exerciseName: string): { weight: number; reps: number } | null => {
    for (const w of workoutHistory) {
      const ex = w.exercises.find((e) => e.exercise.name === exerciseName);
      if (ex) {
        const completedSet = ex.sets.find((s) => s.completed && (s.weight ?? 0) > 0);
        if (completedSet) return { weight: completedSet.weight ?? 0, reps: completedSet.reps ?? 0 };
      }
    }
    return null;
  }, [workoutHistory]);

  const startRestTimer = useCallback((exerciseName: string) => {
    const target = getRestTime(exerciseName);
    setRestTarget(target);
    setRestSeconds(target);
    setIsResting(true);
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    restTimerRef.current = setInterval(() => {
      setRestSeconds((s) => {
        if (s <= 1) {
          clearInterval(restTimerRef.current!);
          restTimerRef.current = null;
          setIsResting(false);
          Vibration.vibrate([0, 300, 100, 300]);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const skipRest = useCallback(() => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    restTimerRef.current = null;
    setIsResting(false);
    setRestSeconds(0);
  }, []);

  useEffect(() => {
    api.getExercises().then((apiExercises) => {
      if (apiExercises && apiExercises.length > 0) setExercises(apiExercises);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  useEffect(() => {
    if (activeWorkout && (activeWorkout.exercises.length > 0 || (activeWorkout.cardioEntries?.length ?? 0) > 0) && !timerRunning) {
      setTimerRunning(true);
    }
  }, [activeWorkout?.exercises.length, activeWorkout?.cardioEntries?.length]);

  if (!activeWorkout) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="barbell-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No active workout</Text>
        </View>
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
    const prev = getPrevPerformance(exercise.name);
    const defaultWeight = prev?.weight ?? getDefaultWeight(exercise.name, weightUnit, estimatedWeights);
    const defaultReps = prev?.reps ?? 10;
    const newExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseId: exercise.id,
      exercise,
      sets: [{ id: `${Date.now()}-0`, setNumber: 1, reps: defaultReps, weight: defaultWeight, completed: false }],
      exerciseNotes: [],
      order: activeWorkout.exercises.length,
    };
    setActiveWorkout({ ...activeWorkout, exercises: [...activeWorkout.exercises, newExercise] });
    setShowExercisePicker(false);
    setSearchQuery('');
    setMuscleFilter('All');
  };

  const addSet = (exerciseIndex: number) => {
    const updated = { ...activeWorkout };
    const ex = { ...updated.exercises[exerciseIndex] };
    const lastSet = ex.sets[ex.sets.length - 1];
    ex.sets = [...ex.sets, {
      id: Date.now().toString(), setNumber: ex.sets.length + 1,
      reps: lastSet?.reps ?? 10, weight: lastSet?.weight ?? lastSet?.weightKg ?? 0, completed: false,
    }];
    updated.exercises = [...updated.exercises];
    updated.exercises[exerciseIndex] = ex;
    setActiveWorkout(updated);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) => {
    const updated = { ...activeWorkout };
    const ex = { ...updated.exercises[exerciseIndex] };
    const numVal = Number(value) || 0;
    const newSets = ex.sets.map((set, idx) => {
      if (idx === setIndex) return { ...set, [field]: numVal };
      if (idx > setIndex && !set.completed) return { ...set, [field]: numVal };
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
    const wasCompleted = set.completed;
    set.completed = !set.completed;
    ex.sets = [...ex.sets];
    ex.sets[setIndex] = set;
    updated.exercises = [...updated.exercises];
    updated.exercises[exerciseIndex] = ex;
    setActiveWorkout(updated);
    if (!wasCompleted) startRestTimer(ex.exercise.name);
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
    const note: ExerciseNote = { id: Date.now().toString(), text: text.trim(), timestamp: new Date().toISOString() };
    ex.exerciseNotes = [...(ex.exerciseNotes ?? []), note];
    updated.exercises = [...updated.exercises];
    updated.exercises[exerciseIndex] = ex;
    setActiveWorkout(updated);
    setNoteText('');
    setNoteExIdx(null);
  };

  const toggleWeightUnit = () => setWeightUnit(weightUnit === 'lbs' ? 'kg' : 'lbs');

  const cardioCalEstimate = estimateCalories(
    cardioType, Number(cardioDuration) || 0, Number(cardioSpeed) || 0,
    Number(cardioIncline) || 0, Number(cardioVestWeight) || 0,
  );

  const addCardioEntry = () => {
    const entry: CardioEntry = {
      id: Date.now().toString(), type: cardioType,
      durationMinutes: Number(cardioDuration) || 0,
      speedMph: Number(cardioSpeed) || undefined,
      inclinePercent: Number(cardioIncline) || undefined,
      weightedVestLbs: Number(cardioVestWeight) || undefined,
      estimatedCalories: cardioCalEstimate,
    };
    setActiveWorkout({ ...activeWorkout, cardioEntries: [...(activeWorkout.cardioEntries ?? []), entry] });
    setShowCardioForm(false);
    setCardioDuration('30'); setCardioSpeed('3.5'); setCardioIncline('0'); setCardioVestWeight('0');
  };

  const removeCardioEntry = (id: string) => {
    setActiveWorkout({ ...activeWorkout, cardioEntries: (activeWorkout.cardioEntries ?? []).filter((c) => c.id !== id) });
  };

  const finishWorkout = async () => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setIsResting(false);
    const completed = {
      ...activeWorkout, isCompleted: true,
      endTime: new Date().toISOString(), durationMinutes: Math.round(elapsedSeconds / 60),
    };
    try { await api.saveWorkout(completed); } catch { /* offline */ }
    addWorkout(completed);
    addToHistory(completed);
    setActiveWorkout(null);
    navigation.goBack();
  };

  const cancelWorkout = () => {
    Alert.alert('Cancel Workout', 'Discard this workout?', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { setActiveWorkout(null); navigation.goBack(); } },
    ]);
  };

  const totalSets = activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0);
  const hasContent = activeWorkout.exercises.length > 0 || (activeWorkout.cardioEntries?.length ?? 0) > 0;
  const totalCardioCalories = (activeWorkout.cardioEntries ?? []).reduce((sum, c) => sum + c.estimatedCalories, 0);
  const exerciseForInfo = exerciseInfoIdx !== null ? activeWorkout.exercises[exerciseInfoIdx] : null;

  return (
    <View style={styles.container}>
      {/* Timer Header */}
      <View style={styles.timerHeader}>
        <TouchableOpacity onPress={cancelWorkout} style={styles.headerBtn}>
          <Ionicons name="close" size={22} color={colors.danger} />
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
        <PressableScale
          onPress={finishWorkout}
          disabled={!hasContent}
          style={[styles.finishBtn, !hasContent && { opacity: 0.3 }]}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.finishText}>Done</Text>
        </PressableScale>
      </View>

      {/* Unit Toggle + Rest Timer */}
      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.unitToggle} onPress={toggleWeightUnit}>
          <Text style={[styles.unitOption, weightUnit === 'lbs' && styles.unitActive]}>LBS</Text>
          <Text style={styles.unitDivider}>/</Text>
          <Text style={[styles.unitOption, weightUnit === 'kg' && styles.unitActive]}>KG</Text>
        </TouchableOpacity>
      </View>

      {/* Rest Timer Banner */}
      {isResting && (
        <View style={styles.restBanner}>
          <View style={styles.restProgressBg}>
            <View style={[styles.restProgressFill, { width: `${(restSeconds / restTarget) * 100}%` }]} />
          </View>
          <View style={styles.restContent}>
            <Ionicons name="timer-outline" size={18} color={colors.accent} />
            <Text style={styles.restLabel}>Rest</Text>
            <Text style={styles.restTime}>
              {Math.floor(restSeconds / 60)}:{(restSeconds % 60).toString().padStart(2, '0')}
            </Text>
            <TouchableOpacity style={styles.skipBtn} onPress={skipRest}>
              <Text style={styles.skipText}>Skip</Text>
              <Ionicons name="play-forward" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.exerciseList} keyboardShouldPersistTaps="handled">
        {/* Cardio Entries */}
        {(activeWorkout.cardioEntries ?? []).map((entry) => (
          <View key={entry.id} style={styles.cardioCard}>
            <View style={styles.exerciseHeader}>
              <Ionicons name={CARDIO_TYPES.find((t) => t.value === entry.type)?.icon || 'heart-outline'} size={20} color={colors.warning} />
              <Text style={[styles.exerciseName, { marginLeft: spacing.sm }]}>
                {CARDIO_TYPES.find((t) => t.value === entry.type)?.label ?? entry.type}
              </Text>
              <TouchableOpacity onPress={() => removeCardioEntry(entry.id)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
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
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setExerciseInfoIdx(exIdx)}>
                <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
                <View style={styles.muscleRow}>
                  <Ionicons
                    name={MUSCLE_ICONS[exercise.exercise.primaryMuscle] ?? 'barbell-outline'}
                    size={14}
                    color={colors.accent}
                  />
                  <Text style={styles.muscleGroup}>
                    {exercise.exercise.primaryMuscle}
                    {exercise.exercise.secondaryMuscles.length > 0
                      ? ` + ${exercise.exercise.secondaryMuscles.join(', ')}` : ''}
                  </Text>
                  <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeExercise(exIdx)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>

            {/* Previous Performance */}
            {(() => {
              const prev = getPrevPerformance(exercise.exercise.name);
              if (prev) return (
                <View style={styles.prevPerf}>
                  <Ionicons name="time-outline" size={12} color={colors.accent} />
                  <Text style={styles.prevPerfText}>Last: {prev.weight} {weightUnit} x {prev.reps}</Text>
                </View>
              );
              return null;
            })()}

            {/* Set Headers */}
            <View style={styles.setHeader}>
              <Text style={[styles.setHeaderText, { width: 40 }]}>Set</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>Weight</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
              <Text style={[styles.setHeaderText, { width: 44 }]}></Text>
            </View>

            {exercise.sets.map((set, setIdx) => (
              <View key={set.id} style={[styles.setRow, set.completed && styles.setCompleted]}>
                <View style={[styles.setNumCircle, set.isWarmup && { backgroundColor: colors.warningDim }]}>
                  <Text style={[styles.setNumber, set.isWarmup && { color: colors.warning }]}>
                    {set.isWarmup ? 'W' : set.setNumber}
                  </Text>
                </View>
                <TextInput
                  style={styles.setInput}
                  keyboardType="numeric"
                  value={(set.weight ?? set.weightKg) ? (set.weight ?? set.weightKg)!.toString() : ''}
                  onChangeText={(v) => updateSet(exIdx, setIdx, 'weight', v)}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.setInput}
                  keyboardType="numeric"
                  value={set.reps ? set.reps.toString() : ''}
                  onChangeText={(v) => updateSet(exIdx, setIdx, 'reps', v)}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity
                  style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
                  onPress={() => toggleSetComplete(exIdx, setIdx)}
                >
                  {set.completed && <Ionicons name="checkmark" size={18} color="#fff" />}
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(exIdx)}>
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>

            {/* Notes */}
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

            <View style={styles.noteInputRow}>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a note..."
                placeholderTextColor={colors.textMuted}
                value={noteExIdx === exIdx ? noteText : ''}
                onFocus={() => setNoteExIdx(exIdx)}
                onChangeText={(v) => { setNoteExIdx(exIdx); setNoteText(v); }}
                onSubmitEditing={() => addExerciseNote(exIdx, noteText)}
                returnKeyType="send"
              />
              {noteExIdx === exIdx && noteText.trim() ? (
                <TouchableOpacity style={styles.sendNoteBtn} onPress={() => addExerciseNote(exIdx, noteText)}>
                  <Ionicons name="send" size={16} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}

        {/* Add Buttons */}
        <View style={styles.addButtonsRow}>
          <PressableScale
            onPress={() => setShowExercisePicker(true)}
            style={[styles.addBtn, { flex: 1, marginRight: 6 }]}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
            <Text style={styles.addBtnText}>Exercise</Text>
          </PressableScale>
          <PressableScale
            onPress={() => setShowCardioForm(true)}
            style={[styles.addBtn, { flex: 1, marginLeft: 6, borderColor: colors.warning }]}
          >
            <Ionicons name="heart-outline" size={20} color={colors.warning} />
            <Text style={[styles.addBtnText, { color: colors.warning }]}>Cardio</Text>
          </PressableScale>
        </View>

        {/* Cardio Form */}
        {showCardioForm && (
          <View style={styles.picker}>
            <View style={styles.pickerTitleRow}>
              <Ionicons name="heart-outline" size={20} color={colors.warning} />
              <Text style={styles.pickerTitle}>Log Cardio</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {CARDIO_TYPES.map((ct) => (
                <TouchableOpacity
                  key={ct.value}
                  style={[styles.filterChip, cardioType === ct.value && styles.filterChipActive]}
                  onPress={() => setCardioType(ct.value)}
                >
                  <Ionicons name={ct.icon} size={14} color={cardioType === ct.value ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.filterText, cardioType === ct.value && styles.filterTextActive]}>{ct.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.cardioInputGrid}>
              {[
                { label: 'Duration (min)', value: cardioDuration, setter: setCardioDuration, placeholder: '30' },
                { label: 'Speed (mph)', value: cardioSpeed, setter: setCardioSpeed, placeholder: '3.5' },
                { label: 'Incline (%)', value: cardioIncline, setter: setCardioIncline, placeholder: '0' },
                { label: 'Vest (lbs)', value: cardioVestWeight, setter: setCardioVestWeight, placeholder: '0' },
              ].map((f) => (
                <View key={f.label} style={styles.cardioInputItem}>
                  <Text style={styles.cardioInputLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.cardioInputField}
                    keyboardType="decimal-pad"
                    value={f.value}
                    onChangeText={f.setter}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ))}
            </View>
            <View style={styles.calorieEstimate}>
              <Ionicons name="flame-outline" size={18} color={colors.warning} />
              <Text style={styles.calorieLabel}>Est. Calories</Text>
              <Text style={styles.calorieValue}>~{cardioCalEstimate}</Text>
            </View>
            <View style={{ gap: spacing.sm }}>
              <PressableScale onPress={addCardioEntry} style={styles.cardioAddBtn}>
                <Text style={styles.cardioAddText}>Add Cardio</Text>
              </PressableScale>
              <TouchableOpacity style={styles.pickerClose} onPress={() => setShowCardioForm(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Exercise Picker */}
        {showExercisePicker && (
          <View style={styles.picker}>
            <View style={styles.pickerTitleRow}>
              <Ionicons name="search" size={20} color={colors.accent} />
              <Text style={styles.pickerTitle}>Select Exercise</Text>
            </View>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginLeft: 12 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search exercises..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {MUSCLE_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, muscleFilter === filter && styles.filterChipActive]}
                  onPress={() => setMuscleFilter(filter)}
                >
                  <Text style={[styles.filterText, muscleFilter === filter && styles.filterTextActive]}>{filter}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
              {filteredExercises.length === 0 ? (
                <Text style={styles.noResults}>No exercises found</Text>
              ) : (
                filteredExercises.map((ex) => (
                  <TouchableOpacity key={ex.id} style={styles.pickerItem} onPress={() => addExercise(ex)}>
                    <View style={styles.pickerItemRow}>
                      <View style={styles.pickerIcon}>
                        <Ionicons
                          name={MUSCLE_ICONS[ex.primaryMuscle] ?? 'barbell-outline'}
                          size={18}
                          color={colors.accent}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickerItemName}>{ex.name}</Text>
                        <Text style={styles.pickerItemMeta}>
                          {ex.primaryMuscle} · {ex.equipment}
                          {getDefaultWeight(ex.name, weightUnit, estimatedWeights) > 0
                            ? ` · ~${getDefaultWeight(ex.name, weightUnit, estimatedWeights)} ${weightUnit}` : ''}
                        </Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
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
        transparent animationType="slide" onRequestClose={() => setExerciseInfoIdx(null)}
      >
        {exerciseForInfo && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{exerciseForInfo.exercise.name}</Text>
                <TouchableOpacity onPress={() => setExerciseInfoIdx(null)} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalSectionTitle}>Muscles Targeted</Text>
                <View style={styles.muscleChips}>
                  <View style={styles.primaryMuscleChip}>
                    <Ionicons name={MUSCLE_ICONS[exerciseForInfo.exercise.primaryMuscle] ?? 'barbell-outline'} size={14} color={colors.accent} />
                    <Text style={styles.primaryMuscleText}>{exerciseForInfo.exercise.primaryMuscle} (primary)</Text>
                  </View>
                  {exerciseForInfo.exercise.secondaryMuscles.map((m) => (
                    <View key={m} style={styles.secondaryMuscleChip}>
                      <Ionicons name={MUSCLE_ICONS[m] ?? 'barbell-outline'} size={14} color={colors.textSecondary} />
                      <Text style={styles.secondaryMuscleText}>{m}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.modalSectionTitle}>Equipment</Text>
                <Text style={styles.modalBodyText}>
                  {exerciseForInfo.exercise.equipment.charAt(0).toUpperCase() + exerciseForInfo.exercise.equipment.slice(1)}
                </Text>

                {exerciseForInfo.exercise.instructions && (
                  <>
                    <Text style={styles.modalSectionTitle}>How to Perform</Text>
                    <Text style={styles.modalBodyText}>{exerciseForInfo.exercise.instructions}</Text>
                  </>
                )}

                {getDefaultWeight(exerciseForInfo.exercise.name, weightUnit) > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Suggested Starting Weight</Text>
                    <Text style={styles.modalBodyText}>
                      ~{getDefaultWeight(exerciseForInfo.exercise.name, weightUnit)} {weightUnit}
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
              <PressableScale onPress={() => setExerciseInfoIdx(null)} style={styles.modalDoneBtn}>
                <Text style={styles.modalDoneText}>Done</Text>
              </PressableScale>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 16 },

  // Timer Header
  timerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: borderRadius.md,
    backgroundColor: colors.dangerDim, justifyContent: 'center', alignItems: 'center',
  },
  timerCenter: { alignItems: 'center' },
  timer: { ...typography.h1, color: colors.text, fontVariant: ['tabular-nums'] },
  readyText: { ...typography.body, color: colors.textSecondary },
  setsCount: { ...typography.caption, color: colors.textSecondary },
  finishBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.success, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderRadius: borderRadius.full,
  },
  finishText: { ...typography.captionBold, color: '#fff' },

  // Sub header
  subHeader: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  unitToggle: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardLight,
    borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  unitOption: { ...typography.smallBold, color: colors.textMuted },
  unitActive: { color: colors.accent },
  unitDivider: { ...typography.small, color: colors.textMuted, marginHorizontal: 4 },

  // Rest timer
  restBanner: { backgroundColor: colors.accentDim, overflow: 'hidden' },
  restProgressBg: { height: 3, backgroundColor: colors.border },
  restProgressFill: { height: 3, backgroundColor: colors.accent },
  restContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md,
  },
  restLabel: { ...typography.captionBold, color: colors.accent },
  restTime: { ...typography.h2, color: colors.text, fontVariant: ['tabular-nums'] },
  skipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.cardLight, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  skipText: { ...typography.smallBold, color: colors.textSecondary },

  // Previous performance
  prevPerf: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.accentDim, borderRadius: borderRadius.sm,
    paddingVertical: 4, paddingHorizontal: 8, marginBottom: spacing.sm, alignSelf: 'flex-start',
  },
  prevPerfText: { ...typography.caption, color: colors.accent },

  // Exercise list
  exerciseList: { flex: 1, padding: spacing.lg },
  exerciseCard: {
    backgroundColor: colors.card, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  cardioCard: {
    backgroundColor: colors.card, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 3, borderLeftColor: colors.warning,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  exerciseName: { ...typography.h3, color: colors.text },
  muscleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  muscleGroup: { ...typography.caption, color: colors.accent, flex: 1 },

  setHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingHorizontal: 2 },
  setHeaderText: { ...typography.small, color: colors.textMuted, textAlign: 'center' },
  setRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.xs, borderRadius: borderRadius.sm, marginBottom: 2,
  },
  setCompleted: { backgroundColor: 'rgba(52, 211, 153, 0.08)' },
  setNumCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.cardLight, justifyContent: 'center', alignItems: 'center',
  },
  setNumber: { ...typography.captionBold, color: colors.text, textAlign: 'center' },
  setInput: {
    flex: 1, textAlign: 'center', backgroundColor: colors.inputBg,
    borderRadius: borderRadius.sm, padding: spacing.sm, marginHorizontal: 4,
    color: colors.text, ...typography.body, fontSize: 16, fontWeight: '600',
    borderWidth: 1, borderColor: colors.border,
  },
  checkBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },
  checkBtnDone: { backgroundColor: colors.success, borderColor: colors.success },
  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, marginTop: spacing.sm, paddingVertical: spacing.sm,
  },
  addSetText: { ...typography.captionBold, color: colors.accent },

  // Notes
  notesSection: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  noteItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 },
  noteText: { ...typography.caption, color: colors.text, flex: 1 },
  noteTime: { ...typography.small, color: colors.textMuted, marginLeft: 8 },
  noteInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  noteInput: {
    flex: 1, backgroundColor: colors.inputBg, borderRadius: borderRadius.md,
    padding: spacing.sm + 2, color: colors.text, ...typography.caption,
    borderWidth: 1, borderColor: colors.border,
  },
  sendNoteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center',
  },

  // Add buttons
  addButtonsRow: { flexDirection: 'row', marginBottom: spacing.md },
  addBtn: {
    backgroundColor: colors.card, borderRadius: borderRadius.lg,
    padding: spacing.lg, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: spacing.sm,
    borderWidth: 1.5, borderColor: colors.accent, borderStyle: 'dashed',
  },
  addBtnText: { ...typography.captionBold, color: colors.accent },

  // Cardio
  cardioStats: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' },
  cardioStatItem: { alignItems: 'center', minWidth: 60, paddingVertical: 4 },
  cardioStatValue: { ...typography.h3, color: colors.text },
  cardioStatLabel: { ...typography.small, color: colors.textSecondary },
  cardioInputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  cardioInputItem: { width: '47%' as any },
  cardioInputLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  cardioInputField: {
    backgroundColor: colors.inputBg, borderRadius: borderRadius.md,
    padding: spacing.md, color: colors.text, ...typography.body,
    borderWidth: 1, borderColor: colors.border,
  },
  calorieEstimate: {
    backgroundColor: colors.warningDim, borderRadius: borderRadius.md,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.md,
  },
  calorieLabel: { ...typography.bodyBold, color: colors.text, flex: 1 },
  calorieValue: { ...typography.h3, color: colors.warning },
  cardioAddBtn: {
    backgroundColor: colors.warning, borderRadius: borderRadius.md,
    padding: spacing.md, alignItems: 'center',
  },
  cardioAddText: { ...typography.bodyBold, color: '#000' },

  // Picker
  picker: {
    backgroundColor: colors.card, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: 32,
    borderWidth: 1, borderColor: colors.border,
  },
  pickerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  pickerTitle: { ...typography.h3, color: colors.text },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBg, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1, padding: spacing.md, color: colors.text, ...typography.body,
  },
  filterRow: { flexDirection: 'row', marginBottom: spacing.md, maxHeight: 36 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full,
    backgroundColor: colors.cardLight, marginRight: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  filterText: { ...typography.caption, color: colors.textSecondary },
  filterTextActive: { color: colors.accent, fontWeight: '600' },
  pickerList: { maxHeight: 300 },
  noResults: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
  pickerItem: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerItemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pickerIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.accentDim, justifyContent: 'center', alignItems: 'center',
  },
  pickerItemName: { ...typography.body, color: colors.text },
  pickerItemMeta: { ...typography.caption, color: colors.textSecondary },
  pickerClose: { marginTop: spacing.md, alignItems: 'center', padding: spacing.sm },
  cancelText: { ...typography.body, color: colors.danger },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.card, borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl, padding: spacing.xl, maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h2, color: colors.text, flex: 1 },
  modalScroll: { marginBottom: spacing.lg },
  modalSectionTitle: { ...typography.captionBold, color: colors.accent, marginTop: spacing.lg, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalBodyText: { ...typography.body, color: colors.text, lineHeight: 22 },
  muscleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryMuscleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.accentDim, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: colors.accent,
  },
  primaryMuscleText: { ...typography.caption, color: colors.accent, fontWeight: '600' },
  secondaryMuscleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.cardLight, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: 6, borderWidth: 1, borderColor: colors.border,
  },
  secondaryMuscleText: { ...typography.caption, color: colors.textSecondary },
  modalNoteItem: { backgroundColor: colors.cardLight, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  modalNoteText: { ...typography.body, color: colors.text },
  modalNoteTime: { ...typography.small, color: colors.textMuted, marginTop: 4 },
  modalDoneBtn: {
    backgroundColor: colors.accent, borderRadius: borderRadius.lg,
    padding: spacing.lg, alignItems: 'center', ...shadows.button,
  },
  modalDoneText: { ...typography.bodyBold, color: '#fff' },
});
