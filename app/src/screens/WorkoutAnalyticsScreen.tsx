import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../services/store';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Card, SectionHeader, EmptyState } from '../components/ui';
import type { Workout, MuscleGroup } from '../types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ---- Types ----

interface ExerciseHistory {
  exerciseName: string;
  exerciseId: string;
  sessions: {
    date: string;
    bestWeight: number;
    bestVolume: number;
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    estimated1RM: number;
  }[];
}

interface OverloadSuggestion {
  exerciseName: string;
  type: 'increase_weight' | 'add_reps' | 'add_set' | 'deload';
  message: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

// ---- Helpers ----

const MUSCLE_GROUP_COLORS: Partial<Record<MuscleGroup, string>> = {
  chest: '#f87171',
  back: '#60a5fa',
  shoulders: '#fbbf24',
  biceps: '#a78bfa',
  triceps: '#34d399',
  quads: '#f472b6',
  hamstrings: '#fb923c',
  glutes: '#e879f9',
  calves: '#2dd4bf',
  abs: '#facc15',
  lats: '#38bdf8',
  traps: '#c084fc',
  forearms: '#a3e635',
  lower_back: '#f97316',
  full_body: colors.accent,
  cardio: colors.secondary,
};

function getMuscleColor(muscle: MuscleGroup): string {
  return MUSCLE_GROUP_COLORS[muscle] ?? colors.accent;
}

function formatMuscleGroup(muscle: string): string {
  return muscle
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Epley formula for estimated 1RM */
function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

function getAllWorkouts(workouts: Workout[], history: Workout[]): Workout[] {
  const seen = new Set<string>();
  const all: Workout[] = [];
  for (const w of [...workouts, ...history]) {
    if (!seen.has(w.id) && w.isCompleted) {
      seen.add(w.id);
      all.push(w);
    }
  }
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

// ---- Main Component ----

export function WorkoutAnalyticsScreen({ navigation }: any) {
  const { workouts, workoutHistory, weightUnit } = useStore();
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const allWorkouts = useMemo(() => getAllWorkouts(workouts, workoutHistory), [workouts, workoutHistory]);

  // ---- Summary Stats ----
  const summaryStats = useMemo(() => {
    const totalWorkouts = allWorkouts.length;

    const totalVolume = allWorkouts.reduce(
      (sum, w) =>
        sum +
        w.exercises.reduce(
          (exSum, ex) =>
            exSum +
            ex.sets
              .filter((s) => s.completed)
              .reduce((setSum, s) => setSum + (s.reps ?? 0) * (s.weight ?? 0), 0),
          0,
        ),
      0,
    );

    const totalDuration = allWorkouts.reduce((sum, w) => sum + (w.durationMinutes ?? 0), 0);
    const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

    // Workouts per week: look at date range
    let workoutsPerWeek = 0;
    if (totalWorkouts >= 2) {
      const firstDate = new Date(allWorkouts[0].date + 'T12:00:00');
      const lastDate = new Date(allWorkouts[allWorkouts.length - 1].date + 'T12:00:00');
      const weeks = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      workoutsPerWeek = Math.round((totalWorkouts / weeks) * 10) / 10;
    } else if (totalWorkouts === 1) {
      workoutsPerWeek = 1;
    }

    return { totalWorkouts, totalVolume, avgDuration, workoutsPerWeek };
  }, [allWorkouts]);

  // ---- Muscle Group Frequency ----
  const muscleFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const w of allWorkouts) {
      // Track unique muscle groups per workout to avoid double-counting
      const musclesInWorkout = new Set<string>();
      for (const ex of w.exercises) {
        if (ex.exercise?.primaryMuscle) {
          musclesInWorkout.add(ex.exercise.primaryMuscle);
        }
        if (ex.exercise?.secondaryMuscles) {
          for (const sm of ex.exercise.secondaryMuscles) {
            musclesInWorkout.add(sm);
          }
        }
      }
      for (const m of musclesInWorkout) {
        freq[m] = (freq[m] ?? 0) + 1;
      }
    }

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [allWorkouts]);

  const maxFrequency = muscleFrequency.length > 0 ? muscleFrequency[0][1] : 1;

  // ---- Exercise Progress ----
  const exerciseProgress = useMemo(() => {
    const byExercise: Record<string, ExerciseHistory> = {};

    for (const w of allWorkouts) {
      for (const ex of w.exercises) {
        const name = ex.exercise?.name ?? ex.exerciseId;
        const id = ex.exerciseId;
        if (!byExercise[id]) {
          byExercise[id] = { exerciseName: name, exerciseId: id, sessions: [] };
        }

        const completedSets = ex.sets.filter((s) => s.completed && !s.isWarmup);
        if (completedSets.length === 0) continue;

        let bestWeight = 0;
        let bestVolume = 0;
        let totalVolume = 0;
        let totalSets = completedSets.length;
        let totalReps = 0;
        let best1RM = 0;

        for (const s of completedSets) {
          const weight = s.weight ?? 0;
          const reps = s.reps ?? 0;
          const setVolume = weight * reps;

          if (weight > bestWeight) bestWeight = weight;
          if (setVolume > bestVolume) bestVolume = setVolume;
          totalVolume += setVolume;
          totalReps += reps;

          const e1rm = calculate1RM(weight, reps);
          if (e1rm > best1RM) best1RM = e1rm;
        }

        byExercise[id].sessions.push({
          date: w.date,
          bestWeight,
          bestVolume,
          totalVolume,
          totalSets,
          totalReps,
          estimated1RM: best1RM,
        });
      }
    }

    // Only return exercises with 2+ sessions
    return Object.values(byExercise)
      .filter((e) => e.sessions.length >= 2)
      .sort((a, b) => b.sessions.length - a.sessions.length);
  }, [allWorkouts]);

  // ---- Progressive Overload Suggestions ----
  const overloadSuggestions = useMemo(() => {
    const suggestions: OverloadSuggestion[] = [];

    for (const ex of exerciseProgress) {
      if (ex.sessions.length < 2) continue;

      const recent = ex.sessions[ex.sessions.length - 1];
      const previous = ex.sessions[ex.sessions.length - 2];

      // Check if volume has stalled (same or decreased for last session)
      const volumeChange = recent.totalVolume - previous.totalVolume;
      const weightChange = recent.bestWeight - previous.bestWeight;

      if (recent.totalVolume > previous.totalVolume * 1.1) {
        // Good progress, keep going
        continue;
      }

      if (weightChange === 0 && volumeChange <= 0) {
        // Stalled: suggest adding reps first
        if (recent.totalReps / recent.totalSets < 12) {
          suggestions.push({
            exerciseName: ex.exerciseName,
            type: 'add_reps',
            message: 'Add reps',
            detail: `You hit ${recent.bestWeight} ${weightUnit} for ${Math.round(recent.totalReps / recent.totalSets)} avg reps. Try for ${Math.round(recent.totalReps / recent.totalSets) + 1}-${Math.round(recent.totalReps / recent.totalSets) + 2} reps before increasing weight.`,
            icon: 'repeat-outline',
            color: colors.secondary,
          });
        } else {
          // Already high reps, suggest weight increase
          const increment = recent.bestWeight <= 50 ? 5 : 10;
          suggestions.push({
            exerciseName: ex.exerciseName,
            type: 'increase_weight',
            message: 'Increase weight',
            detail: `You're repping ${Math.round(recent.totalReps / recent.totalSets)} reps at ${recent.bestWeight} ${weightUnit}. Try ${recent.bestWeight + increment} ${weightUnit} for fewer reps.`,
            icon: 'trending-up',
            color: colors.accent,
          });
        }
      } else if (volumeChange < -previous.totalVolume * 0.15) {
        // Significant drop - suggest deload
        suggestions.push({
          exerciseName: ex.exerciseName,
          type: 'deload',
          message: 'Consider a deload',
          detail: `Volume dropped ${Math.abs(Math.round((volumeChange / previous.totalVolume) * 100))}% from last session. A deload week at 60-70% intensity may help recovery.`,
          icon: 'pause-circle-outline',
          color: colors.warning,
        });
      } else if (weightChange > 0 && recent.totalReps < previous.totalReps) {
        // Went heavier but fewer reps - consolidate
        suggestions.push({
          exerciseName: ex.exerciseName,
          type: 'add_reps',
          message: 'Build reps at new weight',
          detail: `Good job moving to ${recent.bestWeight} ${weightUnit}. Focus on matching your previous rep count of ${Math.round(previous.totalReps / previous.totalSets)} reps per set.`,
          icon: 'arrow-up-circle-outline',
          color: colors.gradientCool,
        });
      } else {
        // Default: add a set
        suggestions.push({
          exerciseName: ex.exerciseName,
          type: 'add_set',
          message: 'Add a working set',
          detail: `Try adding one more working set at ${recent.bestWeight} ${weightUnit} to increase total volume and drive progress.`,
          icon: 'add-circle-outline',
          color: colors.accentLight,
        });
      }
    }

    return suggestions.slice(0, 8);
  }, [exerciseProgress, weightUnit]);

  // ---- Toggle expanded exercise ----
  const toggleExercise = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedExercise((prev) => (prev === id ? null : id));
  };

  // ---- Empty state ----
  if (allWorkouts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout Analytics</Text>
          <View style={{ width: 40 }} />
        </View>
        <Card>
          <EmptyState
            icon="analytics-outline"
            title="No workout data yet"
            subtitle="Complete some workouts to see your analytics and progress"
            actionLabel="Start a Workout"
            onAction={() => navigation.navigate('Workouts')}
          />
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary Stats */}
      <View style={styles.sectionPadding}>
        <SectionHeader title="SUMMARY" />
        <View style={styles.statsGrid}>
          <StatCard
            icon="barbell-outline"
            label="Total Workouts"
            value={String(summaryStats.totalWorkouts)}
            color={colors.accent}
          />
          <StatCard
            icon="fitness-outline"
            label="Total Volume"
            value={formatVolume(summaryStats.totalVolume)}
            suffix={weightUnit}
            color={colors.secondary}
          />
          <StatCard
            icon="time-outline"
            label="Avg Duration"
            value={String(summaryStats.avgDuration)}
            suffix="min"
            color={colors.gradientCool}
          />
          <StatCard
            icon="calendar-outline"
            label="Per Week"
            value={String(summaryStats.workoutsPerWeek)}
            suffix="avg"
            color={colors.warning}
          />
        </View>
      </View>

      {/* Muscle Group Frequency */}
      {muscleFrequency.length > 0 && (
        <View style={styles.sectionPadding}>
          <SectionHeader title="MUSCLE GROUP FREQUENCY" />
          <Card>
            {muscleFrequency.map(([muscle, count], index) => (
              <View
                key={muscle}
                style={styles.barRow}
              >
                <Text style={styles.barLabel}>{formatMuscleGroup(muscle)}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max((count / maxFrequency) * 100, 8)}%`,
                        backgroundColor: getMuscleColor(muscle as MuscleGroup),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barCount}>{count}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Exercise Progress */}
      {exerciseProgress.length > 0 && (
        <View style={styles.sectionPadding}>
          <SectionHeader title="EXERCISE PROGRESS" />
          {exerciseProgress.slice(0, 10).map((ex, index) => {
            const isExpanded = expandedExercise === ex.exerciseId;
            const latestSession = ex.sessions[ex.sessions.length - 1];
            const firstSession = ex.sessions[0];
            const e1rmChange = latestSession.estimated1RM - firstSession.estimated1RM;

            return (
              <Card
                key={ex.exerciseId}
                onPress={() => toggleExercise(ex.exerciseId)}
              >
                {/* Exercise header row */}
                <View style={styles.exerciseRow}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                    <Text style={styles.exerciseMeta}>
                      {ex.sessions.length} sessions | Best: {latestSession.bestWeight} {weightUnit}
                    </Text>
                  </View>
                  <View style={styles.exerciseRight}>
                    {e1rmChange !== 0 && (
                      <View style={[styles.changeBadge, e1rmChange > 0 ? styles.changeBadgeUp : styles.changeBadgeDown]}>
                        <Ionicons
                          name={e1rmChange > 0 ? 'arrow-up' : 'arrow-down'}
                          size={12}
                          color={e1rmChange > 0 ? colors.success : colors.danger}
                        />
                        <Text style={[styles.changeText, e1rmChange > 0 ? styles.changeTextUp : styles.changeTextDown]}>
                          {Math.abs(e1rmChange)} {weightUnit}
                        </Text>
                      </View>
                    )}
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Expanded: mini chart + 1RM trend */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Weight over time chart */}
                    <Text style={styles.chartTitle}>Weight Over Time</Text>
                    <MiniLineChart
                      data={ex.sessions.map((s) => s.bestWeight)}
                      labels={ex.sessions.map((s) => s.date.slice(5))}
                      color={colors.accent}
                      unit={weightUnit}
                    />

                    {/* Estimated 1RM trend */}
                    <Text style={[styles.chartTitle, { marginTop: spacing.xl }]}>Estimated 1RM Trend</Text>
                    <MiniLineChart
                      data={ex.sessions.map((s) => s.estimated1RM)}
                      labels={ex.sessions.map((s) => s.date.slice(5))}
                      color={colors.secondary}
                      unit={weightUnit}
                    />

                    {/* Session details */}
                    <View style={styles.sessionDetails}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Latest 1RM</Text>
                        <Text style={styles.detailValue}>
                          {latestSession.estimated1RM} {weightUnit}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Total Volume</Text>
                        <Text style={styles.detailValue}>
                          {formatVolume(latestSession.totalVolume)} {weightUnit}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Sets x Reps</Text>
                        <Text style={styles.detailValue}>
                          {latestSession.totalSets} x {Math.round(latestSession.totalReps / latestSession.totalSets)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      {/* Progressive Overload Suggestions */}
      {overloadSuggestions.length > 0 && (
        <View style={styles.sectionPadding}>
          <SectionHeader title="PROGRESSIVE OVERLOAD" />
          {overloadSuggestions.map((suggestion, index) => (
            <Card
              key={`${suggestion.exerciseName}-${suggestion.type}`}
            >
              <View style={styles.suggestionRow}>
                <View style={[styles.suggestionIcon, { backgroundColor: suggestion.color + '20' }]}>
                  <Ionicons name={suggestion.icon} size={22} color={suggestion.color} />
                </View>
                <View style={styles.suggestionContent}>
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionExercise}>{suggestion.exerciseName}</Text>
                    <View style={[styles.suggestionTypeBadge, { backgroundColor: suggestion.color + '20' }]}>
                      <Text style={[styles.suggestionTypeText, { color: suggestion.color }]}>
                        {suggestion.message}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.suggestionDetail}>{suggestion.detail}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Bottom padding */}
      <View style={{ height: spacing.xxxl + spacing.lg }} />
    </ScrollView>
  );
}

// ---- Sub-components ----

function StatCard({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  suffix?: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {suffix && <Text style={styles.statSuffix}>{suffix}</Text>}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MiniLineChart({
  data,
  labels,
  color,
  unit,
}: {
  data: number[];
  labels: string[];
  color: string;
  unit: string;
}) {
  if (data.length === 0) return null;

  const CHART_HEIGHT = 120;
  const CHART_PADDING_TOP = 20;
  const CHART_PADDING_BOTTOM = 24;
  const usableHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Compute point positions
  const points = data.map((val, i) => ({
    x: data.length > 1 ? i / (data.length - 1) : 0.5,
    y: 1 - (val - min) / range,
    value: val,
    label: labels[i],
  }));

  return (
    <View style={styles.chartContainer}>
      {/* Y-axis labels */}
      <View style={styles.yAxisLabels}>
        <Text style={styles.yAxisLabel}>{max}</Text>
        <Text style={styles.yAxisLabel}>{Math.round((max + min) / 2)}</Text>
        <Text style={styles.yAxisLabel}>{min}</Text>
      </View>

      {/* Chart area */}
      <View style={[styles.chartArea, { height: CHART_HEIGHT }]}>
        {/* Grid lines */}
        <View style={[styles.gridLine, { top: CHART_PADDING_TOP }]} />
        <View style={[styles.gridLine, { top: CHART_PADDING_TOP + usableHeight / 2 }]} />
        <View style={[styles.gridLine, { top: CHART_PADDING_TOP + usableHeight }]} />

        {/* Line segments between points */}
        {points.map((point, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          const x1Pct = prev.x * 100;
          const x2Pct = point.x * 100;
          const y1 = CHART_PADDING_TOP + prev.y * usableHeight;
          const y2 = CHART_PADDING_TOP + point.y * usableHeight;

          // Approximate line with a thin View using rotation
          const dx = (x2Pct - x1Pct);
          const dy = y2 - y1;

          return (
            <View
              key={`line-${i}`}
              style={[
                styles.lineSegment,
                {
                  left: `${x1Pct}%`,
                  top: y1,
                  width: `${dx}%`,
                  height: 2,
                  backgroundColor: color,
                  // Use a pseudo-approach: we can't rotate proportional widths cleanly,
                  // so we render a horizontal colored bar and overlay dots
                },
              ]}
            />
          );
        })}

        {/* Data points */}
        {points.map((point, i) => {
          const y = CHART_PADDING_TOP + point.y * usableHeight;
          return (
            <View
              key={`dot-${i}`}
              style={[
                styles.dataPoint,
                {
                  left: `${point.x * 100}%`,
                  top: y - 5,
                  backgroundColor: color,
                },
              ]}
            >
              {/* Show value on first and last point */}
              {(i === 0 || i === points.length - 1) && (
                <View style={[styles.pointLabel, i === 0 ? styles.pointLabelLeft : styles.pointLabelRight]}>
                  <Text style={styles.pointLabelText}>{point.value}</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          {points.map((point, i) => {
            // Show first, last, and middle labels to avoid overcrowding
            const showLabel = i === 0 || i === points.length - 1 || (points.length > 4 && i === Math.floor(points.length / 2));
            if (!showLabel) return <View key={`xlabel-${i}`} style={{ flex: 1 }} />;
            return (
              <Text
                key={`xlabel-${i}`}
                style={[
                  styles.xAxisLabel,
                  {
                    left: `${point.x * 100}%`,
                    position: 'absolute',
                    transform: [{ translateX: -16 }],
                  },
                ]}
              >
                {point.label}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ---- Formatting helpers ----

function formatVolume(volume: number): string {
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return String(Math.round(volume));
}

// ---- Styles ----

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: spacing.xxxl + spacing.lg,
  },
  sectionPadding: {
    paddingHorizontal: spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.cardElevated,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },

  // Summary Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardLight,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statSuffix: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  // Muscle Group Frequency Bars
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  barLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 80,
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.full,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  barCount: {
    ...typography.captionBold,
    color: colors.text,
    width: 28,
    textAlign: 'right',
  },

  // Exercise Progress
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  exerciseName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  exerciseMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  exerciseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  changeBadgeUp: {
    backgroundColor: colors.secondaryDim,
  },
  changeBadgeDown: {
    backgroundColor: colors.dangerDim,
  },
  changeText: {
    ...typography.smallBold,
    marginLeft: 2,
  },
  changeTextUp: {
    color: colors.success,
  },
  changeTextDown: {
    color: colors.danger,
  },

  // Expanded exercise content
  expandedContent: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chartTitle: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  detailValue: {
    ...typography.bodyBold,
    color: colors.text,
  },

  // Mini Line Chart
  chartContainer: {
    flexDirection: 'row',
  },
  yAxisLabels: {
    width: 36,
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 24,
  },
  yAxisLabel: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    marginLeft: spacing.sm,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  lineSegment: {
    position: 'absolute',
    borderRadius: 1,
    opacity: 0.6,
  },
  dataPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    borderWidth: 2,
    borderColor: colors.card,
    zIndex: 2,
  },
  pointLabel: {
    position: 'absolute',
    top: -20,
    backgroundColor: colors.cardLight,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  pointLabelLeft: {
    left: -4,
  },
  pointLabelRight: {
    right: -4,
  },
  pointLabelText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '700',
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    flexDirection: 'row',
  },
  xAxisLabel: {
    ...typography.small,
    color: colors.textMuted,
  },

  // Progressive Overload Suggestions
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  suggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  suggestionExercise: {
    ...typography.bodyBold,
    color: colors.text,
  },
  suggestionTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  suggestionTypeText: {
    ...typography.smallBold,
  },
  suggestionDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
