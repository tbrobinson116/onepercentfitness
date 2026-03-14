import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Card, PressableScale, SectionHeader, EmptyState, ProgressRing } from '../components/ui';
import type { FitnessGoal, GoalType } from '../types';

const GOAL_TYPE_ICONS: Record<GoalType, keyof typeof Ionicons.glyphMap> = {
  strength: 'barbell',
  physique: 'body',
  weight: 'scale',
  endurance: 'walk',
  custom: 'flag',
};

const GOAL_TYPES: { type: GoalType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'strength', label: 'Strength', icon: 'barbell' },
  { type: 'physique', label: 'Physique', icon: 'body' },
  { type: 'weight', label: 'Weight', icon: 'scale' },
  { type: 'endurance', label: 'Endurance', icon: 'walk' },
  { type: 'custom', label: 'Custom', icon: 'flag' },
];

const POPULAR_GOALS = [
  { title: '1000 lb Club', desc: 'Squat + Bench + Deadlift = 1000 lbs', type: 'strength' as GoalType },
  { title: '20 Pull-Ups', desc: 'Consecutive strict pull-ups', type: 'strength' as GoalType },
  { title: 'Bench 250 lbs', desc: 'One-rep max bench press', type: 'strength' as GoalType },
  { title: '10% Body Fat', desc: 'Lean physique goal', type: 'physique' as GoalType },
];

export function GoalsScreen({ navigation }: any) {
  const { goals, addGoal, updateGoal, removeGoal } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: 'strength' as GoalType,
    title: '',
    description: '',
    exercise: '',
    targetValue: '',
    targetUnit: 'lbs',
    targetWeightKg: '',
    targetBodyFatPercent: '',
    currentPhotoUri: '',
    goalImageUri: '',
  });

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const pickImage = async (field: 'currentPhotoUri' | 'goalImageUri', goalId?: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (goalId) {
        updateGoal(goalId, { [field]: uri });
      } else {
        setNewGoal({ ...newGoal, [field]: uri });
      }
    }
  };

  const takePhoto = async (field: 'currentPhotoUri' | 'goalImageUri', goalId?: string) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (goalId) {
        updateGoal(goalId, { [field]: uri });
      } else {
        setNewGoal({ ...newGoal, [field]: uri });
      }
    }
  };

  const showImageOptions = (field: 'currentPhotoUri' | 'goalImageUri', goalId?: string) => {
    Alert.alert(
      field === 'currentPhotoUri' ? 'Current Photo' : 'Goal / Inspiration Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => takePhoto(field, goalId) },
        { text: 'Choose from Library', onPress: () => pickImage(field, goalId) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    const goal: Partial<FitnessGoal> = {
      type: newGoal.type,
      title: newGoal.title,
      description: newGoal.description || undefined,
      status: 'active',
      progressPercent: 0,
      currentPhotoUri: newGoal.currentPhotoUri || undefined,
      goalImageUri: newGoal.goalImageUri || undefined,
    };

    if (newGoal.type === 'strength') {
      goal.exercise = newGoal.exercise || undefined;
      goal.targetValue = newGoal.targetValue ? Number(newGoal.targetValue) : undefined;
      goal.targetUnit = newGoal.targetUnit;
      goal.currentValue = 0;
    } else if (newGoal.type === 'weight') {
      goal.targetWeightKg = newGoal.targetWeightKg ? Number(newGoal.targetWeightKg) : undefined;
      goal.targetBodyFatPercent = newGoal.targetBodyFatPercent
        ? Number(newGoal.targetBodyFatPercent)
        : undefined;
    }

    try {
      const created = await api.createGoal(goal);
      addGoal(created);
    } catch {
      addGoal({ ...goal, id: Date.now().toString(), createdAt: new Date().toISOString(), progressPercent: 0 } as FitnessGoal);
    }

    setShowAddModal(false);
    setNewGoal({
      type: 'strength',
      title: '',
      description: '',
      exercise: '',
      targetValue: '',
      targetUnit: 'lbs',
      targetWeightKg: '',
      targetBodyFatPercent: '',
      currentPhotoUri: '',
      goalImageUri: '',
    });
  };

  const handleDeleteGoal = (id: string) => {
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await api.deleteGoal(id); } catch { /* offline */ }
          removeGoal(id);
        },
      },
    ]);
  };

  const getGoalIcon = (type: GoalType): keyof typeof Ionicons.glyphMap =>
    GOAL_TYPE_ICONS[type] ?? 'flag';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="trophy" size={28} color={colors.accent} />
            <Text style={styles.title}>Goals</Text>
          </View>
          <PressableScale onPress={() => setShowAddModal(true)} style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={20} color={colors.text} />
            <Text style={styles.addButtonText}>Add Goal</Text>
          </PressableScale>
        </View>

        {/* Active Goals */}
        <View style={styles.sectionContainer}>
          <SectionHeader title={`ACTIVE GOALS (${activeGoals.length})`} />

          {activeGoals.length === 0 ? (
            <EmptyState
              icon="flag-outline"
              title="No active goals"
              subtitle='Set a goal like "Bench 250 lbs" or "Hit the 1000 lb club"'
              actionLabel="Create Goal"
              onAction={() => setShowAddModal(true)}
            />
          ) : (
            activeGoals.map((goal, index) => (
              <Card
                key={goal.id}
                style={styles.goalCard}
              >
                <View style={styles.goalHeader}>
                  <View style={styles.goalIconContainer}>
                    <Ionicons
                      name={getGoalIcon(goal.type)}
                      size={22}
                      color={colors.accent}
                    />
                  </View>
                  <View style={styles.goalTitleSection}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    {goal.description && (
                      <Text style={styles.goalDescription}>{goal.description}</Text>
                    )}
                  </View>
                  <ProgressRing
                    progress={goal.progressPercent / 100}
                    size={44}
                    strokeWidth={4}
                    color={colors.accent}
                  >
                    <Text style={styles.ringPercent}>{goal.progressPercent}%</Text>
                  </ProgressRing>
                </View>

                {/* Strength metric */}
                {goal.type === 'strength' && goal.targetValue && (
                  <View style={styles.goalMetric}>
                    <Text style={styles.metricCurrent}>{goal.currentValue ?? 0}</Text>
                    <Text style={styles.metricSeparator}>/</Text>
                    <Text style={styles.metricTarget}>
                      {goal.targetValue} {goal.targetUnit}
                    </Text>
                  </View>
                )}

                {/* Photo Comparison */}
                {(goal.currentPhotoUri || goal.goalImageUri) && (
                  <View style={styles.photoRow}>
                    {goal.currentPhotoUri ? (
                      <PressableScale
                        style={styles.photoContainer}
                        onPress={() => showImageOptions('currentPhotoUri', goal.id)}
                      >
                        <Image source={{ uri: goal.currentPhotoUri }} style={styles.goalPhoto} />
                        <Text style={styles.photoLabel}>Current</Text>
                      </PressableScale>
                    ) : (
                      <PressableScale
                        style={styles.photoPlaceholder}
                        onPress={() => showImageOptions('currentPhotoUri', goal.id)}
                      >
                        <Ionicons name="camera-outline" size={24} color={colors.accent} />
                        <Text style={styles.photoPlaceholderText}>Current</Text>
                      </PressableScale>
                    )}
                    {goal.goalImageUri ? (
                      <PressableScale
                        style={styles.photoContainer}
                        onPress={() => showImageOptions('goalImageUri', goal.id)}
                      >
                        <Image source={{ uri: goal.goalImageUri }} style={styles.goalPhoto} />
                        <Text style={styles.photoLabel}>Goal</Text>
                      </PressableScale>
                    ) : (
                      <PressableScale
                        style={styles.photoPlaceholder}
                        onPress={() => showImageOptions('goalImageUri', goal.id)}
                      >
                        <Ionicons name="camera-outline" size={24} color={colors.accent} />
                        <Text style={styles.photoPlaceholderText}>Goal</Text>
                      </PressableScale>
                    )}
                  </View>
                )}

                {/* Photo placeholders for physique/weight goals without photos */}
                {!goal.currentPhotoUri && !goal.goalImageUri && (goal.type === 'physique' || goal.type === 'weight') && (
                  <View style={styles.photoRow}>
                    <PressableScale
                      style={styles.photoPlaceholder}
                      onPress={() => showImageOptions('currentPhotoUri', goal.id)}
                    >
                      <Ionicons name="camera-outline" size={24} color={colors.accent} />
                      <Text style={styles.photoPlaceholderText}>Current</Text>
                    </PressableScale>
                    <PressableScale
                      style={styles.photoPlaceholder}
                      onPress={() => showImageOptions('goalImageUri', goal.id)}
                    >
                      <Ionicons name="camera-outline" size={24} color={colors.accent} />
                      <Text style={styles.photoPlaceholderText}>Goal</Text>
                    </PressableScale>
                  </View>
                )}

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${goal.progressPercent}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>{goal.progressPercent}%</Text>
                </View>

                {/* Delete button */}
                <PressableScale
                  onPress={() => handleDeleteGoal(goal.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </PressableScale>
              </Card>
            ))
          )}
        </View>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.sectionContainer}>
            <SectionHeader title={`COMPLETED (${completedGoals.length})`} />
            {completedGoals.map((goal, index) => (
              <Card
                key={goal.id}
                style={styles.completedCard}
              >
                <View style={styles.completedRow}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.secondary} />
                  <Text style={styles.completedTitle}>{goal.title}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Popular Goals */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="POPULAR GOALS" />
          <View style={styles.popularGrid}>
            {POPULAR_GOALS.map((suggestion, i) => (
              <PressableScale
                key={i}
                style={styles.popularGoal}
                onPress={() => {
                  setNewGoal({ ...newGoal, type: suggestion.type, title: suggestion.title, description: suggestion.desc });
                  setShowAddModal(true);
                }}
              >
                <View style={styles.popularHeader}>
                  <Ionicons name="sparkles" size={16} color={colors.accent} />
                  <Text style={styles.popularTitle}>{suggestion.title}</Text>
                </View>
                <Text style={styles.popularDesc}>{suggestion.desc}</Text>
              </PressableScale>
            ))}
          </View>
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={styles.modal}>
              {/* Modal handle */}
              <View style={styles.modalHandle} />

              <Text style={styles.modalTitle}>New Goal</Text>

              {/* Goal Type Selector - styled chips */}
              <View style={styles.chipRow}>
                {GOAL_TYPES.map((gt) => {
                  const isActive = newGoal.type === gt.type;
                  return (
                    <PressableScale
                      key={gt.type}
                      style={[styles.typeChip, isActive && styles.typeChipActive]}
                      onPress={() => setNewGoal({ ...newGoal, type: gt.type })}
                    >
                      <Ionicons
                        name={gt.icon}
                        size={16}
                        color={isActive ? colors.accentLight : colors.textSecondary}
                      />
                      <Text style={[styles.typeLabel, isActive && styles.typeLabelActive]}>
                        {gt.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Goal title (e.g., Bench 250 lbs)"
                placeholderTextColor={colors.textMuted}
                value={newGoal.title}
                onChangeText={(title) => setNewGoal({ ...newGoal, title })}
              />

              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textMuted}
                value={newGoal.description}
                onChangeText={(description) => setNewGoal({ ...newGoal, description })}
                multiline
              />

              {newGoal.type === 'strength' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Exercise (e.g., Bench Press)"
                    placeholderTextColor={colors.textMuted}
                    value={newGoal.exercise}
                    onChangeText={(exercise) => setNewGoal({ ...newGoal, exercise })}
                  />
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Target value"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={newGoal.targetValue}
                      onChangeText={(targetValue) => setNewGoal({ ...newGoal, targetValue })}
                    />
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Unit (lbs, kg, reps)"
                      placeholderTextColor={colors.textMuted}
                      value={newGoal.targetUnit}
                      onChangeText={(targetUnit) => setNewGoal({ ...newGoal, targetUnit })}
                    />
                  </View>
                </>
              )}

              {newGoal.type === 'weight' && (
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Target weight (kg)"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={newGoal.targetWeightKg}
                    onChangeText={(targetWeightKg) => setNewGoal({ ...newGoal, targetWeightKg })}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Target BF%"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={newGoal.targetBodyFatPercent}
                    onChangeText={(targetBodyFatPercent) =>
                      setNewGoal({ ...newGoal, targetBodyFatPercent })
                    }
                  />
                </View>
              )}

              {/* Photo Upload Section */}
              {(newGoal.type === 'physique' || newGoal.type === 'weight') && (
                <>
                  <Text style={styles.photoSectionTitle}>Progress Photos</Text>
                  <View style={styles.photoRow}>
                    <PressableScale
                      style={newGoal.currentPhotoUri ? styles.photoContainer : styles.photoPlaceholder}
                      onPress={() => showImageOptions('currentPhotoUri')}
                    >
                      {newGoal.currentPhotoUri ? (
                        <>
                          <Image source={{ uri: newGoal.currentPhotoUri }} style={styles.goalPhoto} />
                          <Text style={styles.photoLabel}>Current</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={28} color={colors.accent} />
                          <Text style={styles.photoPlaceholderText}>Current Photo</Text>
                        </>
                      )}
                    </PressableScale>
                    <PressableScale
                      style={newGoal.goalImageUri ? styles.photoContainer : styles.photoPlaceholder}
                      onPress={() => showImageOptions('goalImageUri')}
                    >
                      {newGoal.goalImageUri ? (
                        <>
                          <Image source={{ uri: newGoal.goalImageUri }} style={styles.goalPhoto} />
                          <Text style={styles.photoLabel}>Goal</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={28} color={colors.accent} />
                          <Text style={styles.photoPlaceholderText}>Goal / Inspiration</Text>
                        </>
                      )}
                    </PressableScale>
                  </View>
                </>
              )}

              <View style={styles.modalActions}>
                <PressableScale
                  style={styles.cancelButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </PressableScale>
                <PressableScale style={styles.saveButton} onPress={handleAddGoal}>
                  <Ionicons name="add-circle" size={18} color={colors.text} style={{ marginRight: spacing.xs }} />
                  <Text style={styles.saveText}>Add Goal</Text>
                </PressableScale>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    ...shadows.button,
  },
  addButtonText: {
    ...typography.captionBold,
    color: colors.text,
  },

  // Sections
  sectionContainer: {
    paddingHorizontal: spacing.xxl,
  },

  // Goal card
  goalCard: {
    position: 'relative' as const,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  goalTitleSection: {
    flex: 1,
    marginRight: spacing.md,
  },
  goalTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  goalDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ringPercent: {
    ...typography.small,
    color: colors.text,
  },

  // Strength metric
  goalMetric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
    paddingLeft: 52,
  },
  metricCurrent: {
    ...typography.h2,
    color: colors.accent,
  },
  metricSeparator: {
    ...typography.body,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },
  metricTarget: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Photos
  photoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  photoContainer: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  goalPhoto: {
    width: '100%',
    height: 140,
    borderRadius: borderRadius.md,
  },
  photoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  photoPlaceholder: {
    flex: 1,
    height: 110,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardLight,
    gap: spacing.sm,
  },
  photoPlaceholderText: {
    ...typography.caption,
    color: colors.accent,
  },
  photoSectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },

  // Progress bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressText: {
    ...typography.captionBold,
    color: colors.accent,
    width: 36,
    textAlign: 'right',
  },

  // Delete button
  deleteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.dangerDim,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Completed goals
  completedCard: {
    opacity: 0.7,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  completedTitle: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },

  // Popular goals
  popularGrid: {
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  popularGoal: {
    backgroundColor: colors.cardLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  popularTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  popularDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xxl,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xl,
  },

  // Chip type selector
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  typeLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  typeLabelActive: {
    color: colors.accentLight,
  },

  // Inputs
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: 14,
    color: colors.text,
    ...typography.body,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },

  // Modal actions
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  saveText: {
    ...typography.bodyBold,
    color: colors.text,
  },
});
