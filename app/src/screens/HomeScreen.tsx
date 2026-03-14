import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { ProgressRing, Card, PressableScale, SectionHeader, EmptyState, FadeInView } from '../components/ui';

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
  const carbsConsumed = todayNutrition?.totals.carbsG ?? 0;
  const fatConsumed = todayNutrition?.totals.fatG ?? 0;
  const calorieTarget = macroTargets.calories;
  const proteinTarget = macroTargets.proteinG;
  const carbsTarget = macroTargets.carbsG;
  const fatTarget = macroTargets.fatG;

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
    if (workoutDays.has(dateStr)) {
      streak++;
      streakDate.setDate(streakDate.getDate() - 1);
    } else if (dateStr === today) {
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

  const greeting = getGreeting();

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function getInitials(): string {
    const name = profile?.name || '';
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }

  function getMotivationalSubtitle(): string {
    if (streak >= 7) return 'Unstoppable. Keep the streak alive.';
    if (streak >= 3) return `${streak}-day streak. Momentum is building.`;
    if (thisWeekCount > 0) return '1% better every day.';
    return 'Today is a great day to start.';
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Hero Header */}
      <FadeInView delay={0} style={styles.hero}>
        <View style={styles.heroContent}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.greeting}>
              {greeting}{profile?.name ? ',' : ''}
            </Text>
            {profile?.name ? (
              <Text style={styles.heroName}>{profile.name}</Text>
            ) : null}
            <Text style={styles.motivationalSubtitle}>{getMotivationalSubtitle()}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
        </View>
        {/* Streak pill */}
        {streak > 0 && (
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={14} color={colors.warning} />
            <Text style={styles.streakPillText}>{streak} day streak</Text>
          </View>
        )}
      </FadeInView>

      {/* Weekly Activity */}
      <View style={styles.sectionPadding}>
        <SectionHeader title="WEEKLY ACTIVITY" />
        <Card>
          <View style={styles.weeklyHeader}>
            <View>
              <Text style={styles.weeklyCount}>
                {thisWeekCount} workout{thisWeekCount !== 1 ? 's' : ''}
              </Text>
            </View>
            {weeklyVolume > 0 && (
              <View style={styles.volumeBadge}>
                <Ionicons name="trending-up" size={14} color={colors.accent} style={{ marginRight: spacing.xs }} />
                <Text style={styles.volumeValue}>{(weeklyVolume / 1000).toFixed(1)}k</Text>
                <Text style={styles.volumeLabel}> lbs</Text>
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
                    {didWorkout ? (
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
      </View>

      {/* Nutrition Progress */}
      <View style={styles.sectionPadding}>
        <SectionHeader title="TODAY'S NUTRITION" />
        <Card>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <ProgressRing
                progress={calorieTarget > 0 ? caloriesConsumed / calorieTarget : 0}
                size={64}
                strokeWidth={5}
                color={colors.accent}
              >
                <Text style={styles.macroRingValue}>{caloriesConsumed}</Text>
              </ProgressRing>
              <Text style={styles.macroLabel}>Calories</Text>
              <Text style={styles.macroTarget}>/ {calorieTarget}</Text>
            </View>
            <View style={styles.macroItem}>
              <ProgressRing
                progress={proteinTarget > 0 ? proteinConsumed / proteinTarget : 0}
                size={64}
                strokeWidth={5}
                color={colors.secondary}
              >
                <Text style={styles.macroRingValue}>{proteinConsumed}</Text>
              </ProgressRing>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroTarget}>/ {proteinTarget}g</Text>
            </View>
            <View style={styles.macroItem}>
              <ProgressRing
                progress={carbsTarget > 0 ? carbsConsumed / carbsTarget : 0}
                size={64}
                strokeWidth={5}
                color={colors.gradientCool}
              >
                <Text style={styles.macroRingValue}>{carbsConsumed}</Text>
              </ProgressRing>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroTarget}>/ {carbsTarget}g</Text>
            </View>
            <View style={styles.macroItem}>
              <ProgressRing
                progress={fatTarget > 0 ? fatConsumed / fatTarget : 0}
                size={64}
                strokeWidth={5}
                color={colors.gradientWarm}
              >
                <Text style={styles.macroRingValue}>{fatConsumed}</Text>
              </ProgressRing>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroTarget}>/ {fatTarget}g</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Today's Workout */}
      <View style={styles.sectionPadding}>
        <SectionHeader title="TODAY'S WORKOUT" />
        <Card
          onPress={() => navigation.navigate('Workouts')}
        >
          {todayWorkout ? (
            <View style={styles.workoutCardContent}>
              <View style={styles.workoutIconContainer}>
                <Ionicons name="barbell-outline" size={28} color={colors.accent} />
              </View>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{todayWorkout.name}</Text>
                <Text style={styles.workoutDetail}>
                  {todayWorkout.exercises.length} exercises
                  {todayWorkout.isCompleted ? ' — Completed' : ''}
                </Text>
              </View>
              {todayWorkout.isCompleted ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              ) : (
                <View style={styles.startButton}>
                  <Ionicons name="play" size={16} color="#fff" />
                  <Text style={styles.startButtonText}>Start</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.workoutCardContent}>
              <View style={styles.workoutIconContainer}>
                <Ionicons name="barbell-outline" size={28} color={colors.textMuted} />
              </View>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutNameEmpty}>No workout scheduled</Text>
                <Text style={styles.workoutDetail}>Tap to start or generate a program</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          )}
        </Card>
      </View>

      {/* Active Goals */}
      <View style={styles.sectionPadding}>
        <SectionHeader
          title="ACTIVE GOALS"
          action="See All"
          onAction={() => navigation.navigate('Goals')}
        />
        {activeGoals.length > 0 ? (
          activeGoals.slice(0, 3).map((goal, index) => (
            <Card
              key={goal.id}
            >
              <View style={styles.goalRow}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalType}>{goal.type}</Text>
                </View>
                <View style={styles.goalProgress}>
                  <ProgressRing
                    progress={(goal.progressPercent ?? 0) / 100}
                    size={44}
                    strokeWidth={4}
                    color={colors.accent}
                  >
                    <Text style={styles.goalPercent}>{goal.progressPercent}%</Text>
                  </ProgressRing>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Card>
            <EmptyState
              icon="flag-outline"
              title="No goals set yet"
              subtitle="Set your first goal to track your progress"
              actionLabel="Set a Goal"
              onAction={() => navigation.navigate('Goals')}
            />
          </Card>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionPadding}>
        <SectionHeader title="QUICK ACTIONS" />
        <FadeInView delay={600} style={styles.quickActions}>
          <PressableScale
            onPress={() => navigation.navigate('Workouts')}
            style={styles.quickActionTile}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: colors.accentDim }]}>
              <Ionicons name="barbell-outline" size={28} color={colors.accent} />
            </View>
            <Text style={styles.quickActionText}>Start{'\n'}Workout</Text>
          </PressableScale>
          <PressableScale
            onPress={() => navigation.navigate('Nutrition')}
            style={styles.quickActionTile}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: colors.secondaryDim }]}>
              <Ionicons name="restaurant-outline" size={28} color={colors.secondary} />
            </View>
            <Text style={styles.quickActionText}>Log{'\n'}Meal</Text>
          </PressableScale>
          <PressableScale
            onPress={() => navigation.navigate('Profile')}
            style={styles.quickActionTile}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: colors.warningDim }]}>
              <Ionicons name="body-outline" size={28} color={colors.warning} />
            </View>
            <Text style={styles.quickActionText}>Log{'\n'}Metrics</Text>
          </PressableScale>
        </FadeInView>
        <FadeInView delay={700} style={styles.quickActions}>
          <PressableScale
            onPress={() => navigation.navigate('WorkoutAnalytics')}
            style={styles.quickActionTile}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: '#1a2a3a' }]}>
              <Ionicons name="analytics-outline" size={28} color="#45B7D1" />
            </View>
            <Text style={styles.quickActionText}>Workout{'\n'}Analytics</Text>
          </PressableScale>
          <PressableScale
            onPress={() => navigation.navigate('ProgressPhotos')}
            style={styles.quickActionTile}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: '#2d1f4e' }]}>
              <Ionicons name="camera-outline" size={28} color="#a78bfa" />
            </View>
            <Text style={styles.quickActionText}>Progress{'\n'}Photos</Text>
          </PressableScale>
          <PressableScale
            onPress={() => navigation.navigate('FridgeManager')}
            style={styles.quickActionTile}
          >
            <View style={[styles.quickActionIconBg, { backgroundColor: '#1a3a2a' }]}>
              <Ionicons name="leaf-outline" size={28} color="#82E0AA" />
            </View>
            <Text style={styles.quickActionText}>Fridge{'\n'}Manager</Text>
          </PressableScale>
        </FadeInView>
      </View>
    </ScrollView>
  );
}

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

  // Hero Header
  hero: {
    paddingHorizontal: spacing.xxl,
    paddingTop: 64,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.cardElevated,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTextBlock: {
    flex: 1,
    marginRight: spacing.lg,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
  },
  heroName: {
    ...typography.hero,
    color: colors.text,
    marginTop: spacing.xs,
  },
  motivationalSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  avatarText: {
    ...typography.bodyBold,
    color: colors.accent,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.warningDim,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
  streakPillText: {
    ...typography.captionBold,
    color: colors.warning,
    marginLeft: spacing.xs,
  },

  // Weekly Activity
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  weeklyCount: {
    ...typography.h3,
    color: colors.text,
  },
  volumeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentDim,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  volumeValue: {
    ...typography.captionBold,
    color: colors.accent,
  },
  volumeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  dayLabelToday: {
    color: colors.accent,
    fontWeight: '700',
  },
  dayDot: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayDotActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  dayDotToday: {
    borderColor: colors.accent,
  },

  // Nutrition Macro Rings
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroRingValue: {
    ...typography.smallBold,
    color: colors.text,
  },
  macroLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  macroTarget: {
    ...typography.small,
    color: colors.textMuted,
  },

  // Today's Workout
  workoutCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    ...typography.h3,
    color: colors.text,
  },
  workoutNameEmpty: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  workoutDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    ...shadows.button,
  },
  startButtonText: {
    ...typography.captionBold,
    color: '#fff',
    marginLeft: spacing.xs,
  },

  // Goals
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
    marginRight: spacing.lg,
  },
  goalTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  goalType: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  goalProgress: {
    alignItems: 'center',
  },
  goalPercent: {
    ...typography.small,
    color: colors.accent,
    fontWeight: '700',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  quickActionTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardLight,
  },
  quickActionIconBg: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  quickActionText: {
    ...typography.captionBold,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 18,
  },
});
