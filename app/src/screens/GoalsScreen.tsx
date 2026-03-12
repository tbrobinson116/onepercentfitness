import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography } from '../theme';
import type { FitnessGoal, GoalType } from '../types';

const GOAL_TYPES: { type: GoalType; label: string; icon: string }[] = [
  { type: 'strength', label: 'Strength', icon: '🏋️' },
  { type: 'physique', label: 'Physique', icon: '💪' },
  { type: 'weight', label: 'Weight', icon: '⚖️' },
  { type: 'endurance', label: 'Endurance', icon: '🏃' },
  { type: 'custom', label: 'Custom', icon: '🎯' },
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

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Goals</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addButtonText}>+ Add Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Active Goals */}
        <Text style={styles.sectionTitle}>Active Goals ({activeGoals.length})</Text>
        {activeGoals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active goals</Text>
            <Text style={styles.emptySubtext}>
              Set a goal like "Bench 250 lbs" or "Hit the 1000 lb club"
            </Text>
          </View>
        ) : (
          activeGoals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={styles.goalCard}
              onLongPress={() => handleDeleteGoal(goal.id)}
            >
              <View style={styles.goalHeader}>
                <Text style={styles.goalIcon}>
                  {GOAL_TYPES.find((t) => t.type === goal.type)?.icon ?? '🎯'}
                </Text>
                <View style={styles.goalTitleSection}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  {goal.description && (
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                  )}
                </View>
              </View>

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
                    <TouchableOpacity
                      style={styles.photoContainer}
                      onPress={() => showImageOptions('currentPhotoUri', goal.id)}
                    >
                      <Image source={{ uri: goal.currentPhotoUri }} style={styles.goalPhoto} />
                      <Text style={styles.photoLabel}>Current</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.photoPlaceholder}
                      onPress={() => showImageOptions('currentPhotoUri', goal.id)}
                    >
                      <Text style={styles.photoPlaceholderText}>+ Current</Text>
                    </TouchableOpacity>
                  )}
                  {goal.goalImageUri ? (
                    <TouchableOpacity
                      style={styles.photoContainer}
                      onPress={() => showImageOptions('goalImageUri', goal.id)}
                    >
                      <Image source={{ uri: goal.goalImageUri }} style={styles.goalPhoto} />
                      <Text style={styles.photoLabel}>Goal</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.photoPlaceholder}
                      onPress={() => showImageOptions('goalImageUri', goal.id)}
                    >
                      <Text style={styles.photoPlaceholderText}>+ Goal</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Add photos button for physique/weight goals without photos */}
              {!goal.currentPhotoUri && !goal.goalImageUri && (goal.type === 'physique' || goal.type === 'weight') && (
                <View style={styles.photoRow}>
                  <TouchableOpacity
                    style={styles.photoPlaceholder}
                    onPress={() => showImageOptions('currentPhotoUri', goal.id)}
                  >
                    <Text style={styles.photoPlaceholderText}>+ Current Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoPlaceholder}
                    onPress={() => showImageOptions('goalImageUri', goal.id)}
                  >
                    <Text style={styles.photoPlaceholderText}>+ Goal Photo</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${goal.progressPercent}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>{goal.progressPercent}%</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed ({completedGoals.length})</Text>
            {completedGoals.map((goal) => (
              <View key={goal.id} style={[styles.goalCard, styles.completedCard]}>
                <Text style={styles.goalTitle}>✅ {goal.title}</Text>
              </View>
            ))}
          </>
        )}

        {/* Popular Goals Section */}
        <Text style={styles.sectionTitle}>Popular Goals</Text>
        <View style={styles.popularGoals}>
          {[
            { title: '1000 lb Club', desc: 'Squat + Bench + Deadlift = 1000 lbs', type: 'strength' as GoalType },
            { title: '20 Pull-Ups', desc: 'Consecutive strict pull-ups', type: 'strength' as GoalType },
            { title: 'Bench 250 lbs', desc: 'One-rep max bench press', type: 'strength' as GoalType },
            { title: '10% Body Fat', desc: 'Lean physique goal', type: 'physique' as GoalType },
          ].map((suggestion, i) => (
            <TouchableOpacity
              key={i}
              style={styles.popularGoal}
              onPress={() => {
                setNewGoal({ ...newGoal, type: suggestion.type, title: suggestion.title, description: suggestion.desc });
                setShowAddModal(true);
              }}
            >
              <Text style={styles.popularTitle}>{suggestion.title}</Text>
              <Text style={styles.popularDesc}>{suggestion.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>New Goal</Text>

              {/* Goal Type Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
                {GOAL_TYPES.map((gt) => (
                  <TouchableOpacity
                    key={gt.type}
                    style={[styles.typeChip, newGoal.type === gt.type && styles.typeChipActive]}
                    onPress={() => setNewGoal({ ...newGoal, type: gt.type })}
                  >
                    <Text style={styles.typeIcon}>{gt.icon}</Text>
                    <Text
                      style={[styles.typeLabel, newGoal.type === gt.type && styles.typeLabelActive]}
                    >
                      {gt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.input}
                placeholder="Goal title (e.g., Bench 250 lbs)"
                placeholderTextColor={colors.textSecondary}
                value={newGoal.title}
                onChangeText={(title) => setNewGoal({ ...newGoal, title })}
              />

              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textSecondary}
                value={newGoal.description}
                onChangeText={(description) => setNewGoal({ ...newGoal, description })}
                multiline
              />

              {newGoal.type === 'strength' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Exercise (e.g., Bench Press)"
                    placeholderTextColor={colors.textSecondary}
                    value={newGoal.exercise}
                    onChangeText={(exercise) => setNewGoal({ ...newGoal, exercise })}
                  />
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Target value"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={newGoal.targetValue}
                      onChangeText={(targetValue) => setNewGoal({ ...newGoal, targetValue })}
                    />
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Unit (lbs, kg, reps)"
                      placeholderTextColor={colors.textSecondary}
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
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={newGoal.targetWeightKg}
                    onChangeText={(targetWeightKg) => setNewGoal({ ...newGoal, targetWeightKg })}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Target BF%"
                    placeholderTextColor={colors.textSecondary}
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
                    <TouchableOpacity
                      style={newGoal.currentPhotoUri ? styles.photoContainer : styles.photoPlaceholder}
                      onPress={() => showImageOptions('currentPhotoUri')}
                    >
                      {newGoal.currentPhotoUri ? (
                        <>
                          <Image source={{ uri: newGoal.currentPhotoUri }} style={styles.goalPhoto} />
                          <Text style={styles.photoLabel}>Current</Text>
                        </>
                      ) : (
                        <Text style={styles.photoPlaceholderText}>+ Current Photo</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={newGoal.goalImageUri ? styles.photoContainer : styles.photoPlaceholder}
                      onPress={() => showImageOptions('goalImageUri')}
                    >
                      {newGoal.goalImageUri ? (
                        <>
                          <Image source={{ uri: newGoal.goalImageUri }} style={styles.goalPhoto} />
                          <Text style={styles.photoLabel}>Goal</Text>
                        </>
                      ) : (
                        <Text style={styles.photoPlaceholderText}>+ Goal / Inspiration</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddGoal}>
                  <Text style={styles.saveText}>Add Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
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
  addButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { ...typography.bodyBold, color: colors.text },
  sectionTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptySubtext: { ...typography.caption, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  goalCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  completedCard: { opacity: 0.6 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  goalIcon: { fontSize: 24, marginRight: 12 },
  goalTitleSection: { flex: 1 },
  goalTitle: { ...typography.bodyBold, color: colors.text },
  goalDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  goalMetric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  metricCurrent: { ...typography.h2, color: colors.accent },
  metricSeparator: { ...typography.body, color: colors.textSecondary, marginHorizontal: 4 },
  metricTarget: { ...typography.body, color: colors.textSecondary },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  photoContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  goalPhoto: {
    width: '100%',
    height: 140,
    borderRadius: 12,
  },
  photoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  photoPlaceholder: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
  },
  photoPlaceholderText: {
    ...typography.caption,
    color: colors.accent,
  },
  photoSectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  progressText: { ...typography.caption, color: colors.accent, width: 36, textAlign: 'right' },
  popularGoals: { paddingHorizontal: 16, marginBottom: 32 },
  popularGoal: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  popularTitle: { ...typography.bodyBold, color: colors.text },
  popularDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: { ...typography.h2, color: colors.text, marginBottom: 16 },
  typeRow: { flexDirection: 'row', marginBottom: 16 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { borderColor: colors.accent, backgroundColor: colors.accent + '22' },
  typeIcon: { fontSize: 16, marginRight: 4 },
  typeLabel: { ...typography.caption, color: colors.textSecondary },
  typeLabelActive: { color: colors.accent },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    ...typography.body,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multilineInput: { minHeight: 60, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  modalActions: { flexDirection: 'row', marginTop: 8, gap: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
  },
  cancelText: { ...typography.bodyBold, color: colors.textSecondary },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  saveText: { ...typography.bodyBold, color: colors.text },
});
