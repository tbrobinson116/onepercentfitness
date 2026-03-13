import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography } from '../theme';

// Get day of week index (0 = Monday)
function getDayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7;
}

// Get the last 7 days as date strings
function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HomeScreen({ navigation }: any) {
  const { goals, workouts, workoutHistory, todayNutrition, macroTargets, profile, onboardingData } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayWorkout = workouts.find((w) => w.date === today);
  const activeGoals = goals.filter((g) => g.status === 'active');

  const caloriesConsumed = todayNutrition?.totals.calories ?? 0;
  const proteinConsumed = todayNutrition?.totals.proteinG ?? 0;
  const calorieTarget = macroTargets.calories;
  const proteinTarget = macroTargets.proteinG;

  // Weekly streak calculation
  const last7 = getLast7Days();
  const allWorkouts = [...workouts, ...workoutHistory];
  const workoutDays = new Set(allWorkouts.filter((w) => w.isCompleted).map((w) => w.date));
  const thisWeekCount = last7.filter((d) => workoutDays.has(d)).length;

  // Calculate current streak
  let streak = 0;
  const streakDate = new Date();
  while (true) {
    const dateStr = streakDate.toISOString().split('T')[0];
    // Check if any workout completed on this day
    if (workoutDays.has(dateStr)) {
      streak++;
      streakDate.setDate(streakDate.getDate() - 1);
    } else if (dateStr === today) {
      // Today doesn't count against streak if not done yet
      streakDate.setDate(streakDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Total volume this week (sets * reps * weight)
  const weeklyVolume = allWorkouts
    .filter((w) => w.isCompleted && last7.includes(w.date))
    .reduce((total, w) =>
      total + w.exercises.reduce((exTotal, ex) =>
        exTotal + ex.sets.filter((s) => s.completed).reduce((setTotal, s) =>
          setTotal + (s.reps ?? 0) * (s.weight ?? 0), 0
        ), 0
      ), 0
    );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [goalsData, workoutsData, nutritionData] = await Promise.all([
        api.getGoals(),
        api.getWorkouts(),
        api.getNutritionDay(today),
      ]);
      useStore.getState().setGoals(goalsData);
      useStore.getState().setWorkouts(workoutsData);
      useStore.getState().setTodayNutrition(nutritionData);
    } catch {
      // Offline mode - use local data
    }
    setRefreshing(false);
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const userName = profile?.name || onboardingData?.fitnessGoal ? '' : '';
  const greeting = getGreeting();

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {greeting}{profile?.name ? `, ${profile.name}` : ''}
        </Text>
        <Text style={styles.subtitle}>1% better every day</Text>
      </View>

      {/* Weekly Streak */}
      <View style={styles.card}>
        <View style={styles.streakHeader}>
          <View>
            <Text style={styles.cardTitle}>This Week</Text>
            <Text style={styles.streakCount}>
              {thisWeekCount} workout{thisWeekCount !== 1 ? 's' : ''}
              {streak > 1 ? ` · ${streak} day streak` : ''}
            </Text>
          </View>
          {weeklyVolume > 0 && (
            <View style={styles.volumeBadge}>
              <Text style={styles.volumeValue}>{(weeklyVolume / 1000).toFixed(1)}k</Text>
              <Text style={styles.volumeLabel}>lbs vol</Text>
            </View>
          )}
        </View>
        <View style={styles.weekDots}>
          {last7.map((date, i) => {
            const isToday = date === today;
            const didWorkout = workoutDays.has(date);
            const dayIndex = getDayOfWeek(new Date(date + 'T12:00:00'));
            return (
              <View key={date} style={styles.dayColumn}>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                  {DAY_LABELS[dayIndex]}
                </Text>
                <View style={[
                  styles.dayDot,
                  didWorkout && styles.dayDotActive,
                  isToday && !didWorkout && styles.dayDotToday,
                ]}>
                  {didWorkout && <Text style={styles.dayCheck}>✓</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Today's Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Nutrition</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{caloriesConsumed}</Text>
            <Text style={styles.statLabel}>/ {calorieTarget} cal</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min((caloriesConsumed / calorieTarget) * 100, 100)}%` },
                ]}
              />
            </View>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{proteinConsumed}g</Text>
            <Text style={styles.statLabel}>/ {proteinTarget}g protein</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  styles.proteinFill,
                  { width: `${Math.min((proteinConsumed / proteinTarget) * 100, 100)}%` },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Today's Workout */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Workouts')}
      >
        <Text style={styles.cardTitle}>Workout</Text>
        {todayWorkout ? (
          <View>
            <Text style={styles.workoutName}>{todayWorkout.name}</Text>
            <Text style={styles.workoutDetail}>
              {todayWorkout.exercises.length} exercises
              {todayWorkout.isCompleted ? ' — Completed ✓' : ' — Tap to start'}
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.emptyText}>No workout scheduled today</Text>
            <Text style={styles.actionText}>Tap to start a workout or generate a program</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Active Goals */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Active Goals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {activeGoals.length > 0 ? (
          activeGoals.slice(0, 3).map((goal) => (
            <View key={goal.id} style={styles.goalRow}>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalType}>{goal.type}</Text>
              </View>
              <View style={styles.goalProgress}>
                <Text style={styles.goalPercent}>{goal.progressPercent}%</Text>
                <View style={styles.miniProgress}>
                  <View
                    style={[styles.miniProgressFill, { width: `${goal.progressPercent}%` }]}
                  />
                </View>
              </View>
            </View>
          ))
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
            <Text style={styles.emptyText}>No goals set yet</Text>
            <Text style={styles.actionText}>Tap to set your first goal</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('Workouts')}
        >
          <Text style={styles.quickActionIcon}>💪</Text>
          <Text style={styles.quickActionText}>Start Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('Nutrition')}
        >
          <Text style={styles.quickActionIcon}>🍽️</Text>
          <Text style={styles.quickActionText}>Log Meal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.quickActionIcon}>📏</Text>
          <Text style={styles.quickActionText}>Log Metrics</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 60 },
  greeting: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: 12 },
  seeAll: { ...typography.body, color: colors.accent },

  // Weekly Streak
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streakCount: { ...typography.caption, color: colors.accent, marginTop: -8, marginBottom: 12 },
  volumeBadge: {
    backgroundColor: colors.accent + '18',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  volumeValue: { ...typography.bodyBold, color: colors.accent },
  volumeLabel: { ...typography.small, color: colors.textSecondary },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: { alignItems: 'center', flex: 1 },
  dayLabel: { ...typography.small, color: colors.textSecondary, marginBottom: 6 },
  dayLabelToday: { color: colors.accent, fontWeight: '700' },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayDotActive: { backgroundColor: colors.success, borderColor: colors.success },
  dayDotToday: { borderColor: colors.accent },
  dayCheck: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, marginRight: 12 },
  statValue: { ...typography.h2, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 8 },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  proteinFill: { backgroundColor: colors.secondary },

  workoutName: { ...typography.h3, color: colors.text },
  workoutDetail: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  actionText: { ...typography.caption, color: colors.accent, marginTop: 4 },

  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  goalInfo: { flex: 1 },
  goalTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  goalType: { ...typography.caption, color: colors.textSecondary },
  goalProgress: { alignItems: 'flex-end', width: 80 },
  goalPercent: { ...typography.body, color: colors.accent, fontWeight: '600' },
  miniProgress: {
    width: 60,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  miniProgressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },

  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickActionIcon: { fontSize: 28, marginBottom: 8 },
  quickActionText: { ...typography.caption, color: colors.text, textAlign: 'center' },
});
