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

export function HomeScreen({ navigation }: any) {
  const { goals, workouts, todayNutrition, macroTargets, profile } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayWorkout = workouts.find((w) => w.date === today);
  const activeGoals = goals.filter((g) => g.status === 'active');

  const caloriesConsumed = todayNutrition?.totals.calories ?? 0;
  const proteinConsumed = todayNutrition?.totals.proteinG ?? 0;
  const calorieTarget = macroTargets.calories;
  const proteinTarget = macroTargets.proteinG;

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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Welcome back{profile?.name ? `, ${profile.name}` : ''}
        </Text>
        <Text style={styles.subtitle}>1% better every day</Text>
      </View>

      {/* Today's Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Progress</Text>
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
              {todayWorkout.isCompleted ? ' - Completed' : ' - Tap to start'}
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
