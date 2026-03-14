import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { PressableScale, Card, ChipSelector, FadeInView } from '../components/ui';
import type { Equipment } from '../types';

const EQUIPMENT_OPTIONS: { id: Equipment; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'barbell', label: 'Barbell', icon: 'barbell-outline' },
  { id: 'dumbbell', label: 'Dumbbells', icon: 'fitness-outline' },
  { id: 'cable', label: 'Cables', icon: 'git-branch-outline' },
  { id: 'bodyweight', label: 'Bodyweight', icon: 'body-outline' },
  { id: 'kettlebell', label: 'Kettlebells', icon: 'ellipse-outline' },
  { id: 'band', label: 'Bands', icon: 'swap-horizontal-outline' },
];

const MACHINE_OPTIONS = [
  'Smith Machine', 'Leg Press', 'Leg Extension', 'Leg Curl',
  'Lat Pulldown', 'Chest Press Machine', 'Cable Crossover',
  'Pec Deck', 'Shoulder Press Machine', 'Seated Row Machine',
  'Hip Abductor/Adductor', 'Hack Squat',
];

export function GenerateProgramScreen({ navigation }: any) {
  const { goals, measurements, bloodWork, addProgram } = useStore();
  const [loading, setLoading] = useState(false);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [duration, setDuration] = useState(60);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>(['barbell', 'dumbbell', 'bodyweight']);
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [showMachines, setShowMachines] = useState(false);
  const [customEquipment, setCustomEquipment] = useState('');
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [injuries, setInjuries] = useState('');
  const [preferences, setPreferences] = useState('');

  const toggleEquipment = (eq: Equipment) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  };

  const toggleMachine = (machine: string) => {
    setSelectedMachines((prev) =>
      prev.includes(machine) ? prev.filter((m) => m !== machine) : [...prev, machine]
    );
  };

  const addCustomEquipment = () => {
    const item = customEquipment.trim();
    if (item && !customItems.includes(item)) {
      setCustomItems((prev) => [...prev, item]);
      setCustomEquipment('');
    }
  };

  const removeCustomItem = (item: string) => {
    setCustomItems((prev) => prev.filter((i) => i !== item));
  };

  const generate = async () => {
    if (selectedEquipment.length === 0 && selectedMachines.length === 0 && customItems.length === 0) {
      Alert.alert('Error', 'Select at least one equipment type');
      return;
    }

    setLoading(true);
    try {
      const equipmentNotes = [
        ...selectedMachines.map((m) => `Has access to: ${m}`),
        ...customItems.map((c) => `Has access to: ${c}`),
      ].join('. ');

      const fullPreferences = [preferences, equipmentNotes].filter(Boolean).join('. ');
      const allEquipment = [...selectedEquipment];
      if (selectedMachines.length > 0 && !allEquipment.includes('machine')) {
        allEquipment.push('machine');
      }

      const program = await api.generateProgram({
        goals: goals.filter((g) => g.status === 'active'),
        measurements: measurements[0],
        bloodWork: bloodWork[0],
        experience,
        daysPerWeek,
        sessionDurationMinutes: duration,
        availableEquipment: allEquipment,
        injuries: injuries ? injuries.split(',').map((s) => s.trim()) : undefined,
        preferences: fullPreferences || undefined,
      });
      addProgram(program);
      Alert.alert('Program Generated!', program.name, [
        { text: 'View', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to generate program. Make sure the API is running.');
    }
    setLoading(false);
  };

  const activeGoals = goals.filter((g) => g.status === 'active');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <FadeInView delay={0} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={24} color={colors.accent} />
            </View>
            <Text style={styles.title}>AI Program Builder</Text>
            <Text style={styles.desc}>
              Tell me about your setup and I'll design your perfect program.
            </Text>
          </View>
        </FadeInView>

        {/* AI Coach Bubble */}
        <FadeInView delay={100} style={styles.coachBubble}>
          <View style={styles.coachHeader}>
            <Ionicons name="sparkles" size={14} color={colors.accent} />
            <Text style={styles.coachLabel}>Coach</Text>
          </View>
          <Text style={styles.coachText}>
            Let's build your program. I'll need to know your experience, schedule, and equipment.
          </Text>
        </FadeInView>

        {/* Experience Level */}
        <FadeInView delay={200}>
          <Text style={styles.label}>
            <Ionicons name="trending-up" size={14} color={colors.accent} /> Experience Level
          </Text>
          <View style={styles.optionRow}>
            {([
              { key: 'beginner', label: 'Beginner', icon: 'leaf-outline' as const },
              { key: 'intermediate', label: 'Intermediate', icon: 'barbell-outline' as const },
              { key: 'advanced', label: 'Advanced', icon: 'trophy-outline' as const },
            ] as const).map((level) => (
              <PressableScale
                key={level.key}
                onPress={() => setExperience(level.key)}
                style={[styles.option, experience === level.key && styles.optionActive]}
              >
                <Ionicons
                  name={level.icon}
                  size={18}
                  color={experience === level.key ? colors.accent : colors.textSecondary}
                />
                <Text style={[styles.optionText, experience === level.key && styles.optionTextActive]}>
                  {level.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        </FadeInView>

        {/* Days per Week */}
        <FadeInView delay={300}>
          <Text style={styles.label}>
            <Ionicons name="calendar-outline" size={14} color={colors.accent} /> Days per Week
          </Text>
          <View style={styles.optionRow}>
            {[2, 3, 4, 5, 6].map((d) => (
              <PressableScale
                key={d}
                onPress={() => setDaysPerWeek(d)}
                style={[styles.numOption, daysPerWeek === d && styles.optionActive]}
              >
                <Text style={[styles.numText, daysPerWeek === d && styles.optionTextActive]}>{d}</Text>
              </PressableScale>
            ))}
          </View>
        </FadeInView>

        {/* Duration */}
        <FadeInView delay={400}>
          <Text style={styles.label}>
            <Ionicons name="time-outline" size={14} color={colors.accent} /> Session Duration
          </Text>
          <View style={styles.optionRow}>
            {[30, 45, 60, 75, 90].map((d) => (
              <PressableScale
                key={d}
                onPress={() => setDuration(d)}
                style={[styles.numOption, duration === d && styles.optionActive]}
              >
                <Text style={[styles.numText, duration === d && styles.optionTextActive]}>{d}m</Text>
              </PressableScale>
            ))}
          </View>
        </FadeInView>

        {/* Equipment */}
        <FadeInView delay={500}>
          <Text style={styles.label}>
            <Ionicons name="construct-outline" size={14} color={colors.accent} /> Equipment
          </Text>
          <View style={styles.equipGrid}>
            {EQUIPMENT_OPTIONS.map((eq) => (
              <PressableScale
                key={eq.id}
                onPress={() => toggleEquipment(eq.id)}
                style={[styles.equipChip, selectedEquipment.includes(eq.id) && styles.equipChipActive]}
              >
                <Ionicons
                  name={eq.icon}
                  size={16}
                  color={selectedEquipment.includes(eq.id) ? colors.accent : colors.textSecondary}
                />
                <Text style={[styles.equipText, selectedEquipment.includes(eq.id) && styles.equipTextActive]}>
                  {eq.label}
                </Text>
              </PressableScale>
            ))}
          </View>

          {/* Machines Toggle */}
          <TouchableOpacity style={styles.machineToggle} onPress={() => setShowMachines(!showMachines)}>
            <Ionicons
              name={showMachines ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color={colors.accent}
            />
            <Text style={styles.machineToggleText}>
              Specific Machines ({selectedMachines.length})
            </Text>
          </TouchableOpacity>

          {showMachines && (
            <View style={styles.equipGrid}>
              {MACHINE_OPTIONS.map((machine) => (
                <TouchableOpacity
                  key={machine}
                  style={[styles.equipChip, selectedMachines.includes(machine) && styles.equipChipActive]}
                  onPress={() => toggleMachine(machine)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.equipText, selectedMachines.includes(machine) && styles.equipTextActive]}>
                    {machine}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Custom Equipment */}
          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              placeholder="Other equipment..."
              placeholderTextColor={colors.textMuted}
              value={customEquipment}
              onChangeText={setCustomEquipment}
              onSubmitEditing={addCustomEquipment}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addCustomBtn} onPress={addCustomEquipment}>
              <Ionicons name="add" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          {customItems.length > 0 && (
            <View style={[styles.equipGrid, { marginTop: spacing.sm }]}>
              {customItems.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.equipChip, styles.equipChipActive]}
                  onPress={() => removeCustomItem(item)}
                >
                  <Text style={styles.equipTextActive}>{item}</Text>
                  <Ionicons name="close" size={14} color={colors.accent} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </FadeInView>

        {/* Injuries */}
        <FadeInView delay={600}>
          <Text style={styles.label}>
            <Ionicons name="medical-outline" size={14} color={colors.accent} /> Injuries / Limitations
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., bad left knee, shoulder impingement"
            placeholderTextColor={colors.textMuted}
            value={injuries}
            onChangeText={setInjuries}
          />
        </FadeInView>

        {/* Preferences */}
        <FadeInView delay={700}>
          <Text style={styles.label}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.accent} /> Preferences
          </Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="e.g., prefer compound movements, like supersets, want to focus on arms"
            placeholderTextColor={colors.textMuted}
            value={preferences}
            onChangeText={setPreferences}
            multiline
          />
        </FadeInView>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <FadeInView delay={800} style={styles.goalsCard}>
            <View style={styles.goalsHeader}>
              <Ionicons name="trophy-outline" size={16} color={colors.accent} />
              <Text style={styles.goalsTitle}>Your Active Goals</Text>
            </View>
            {activeGoals.map((g) => (
              <View key={g.id} style={styles.goalItem}>
                <Ionicons name="checkmark-circle" size={14} color={colors.secondary} />
                <Text style={styles.goalText}>{g.title}</Text>
              </View>
            ))}
            <Text style={styles.goalsNote}>These will be factored into your program.</Text>
          </FadeInView>
        )}

        {/* Generate Button */}
        <FadeInView delay={900}>
          <PressableScale
            onPress={generate}
            disabled={loading}
            style={[styles.generateBtn, loading && { opacity: 0.6 }]}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.text} />
                <Text style={styles.generateText}>Designing your program...</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <Ionicons name="sparkles" size={20} color={colors.text} />
                <Text style={styles.generateText}>Generate Program</Text>
              </View>
            )}
          </PressableScale>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { padding: spacing.lg, paddingBottom: 80 },
  header: { paddingTop: 44, marginBottom: spacing.lg },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerContent: { alignItems: 'center' },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.text, textAlign: 'center' },
  desc: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },

  coachBubble: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  coachLabel: { ...typography.captionBold, color: colors.accent },
  coachText: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },

  label: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  optionRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  numOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 48,
    alignItems: 'center',
  },
  optionActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  optionText: { ...typography.body, color: colors.textSecondary },
  optionTextActive: { color: colors.accentLight, fontWeight: '600' },
  numText: { ...typography.bodyBold, color: colors.textSecondary },

  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  equipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  equipChipActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  equipText: { ...typography.caption, color: colors.textSecondary },
  equipTextActive: { color: colors.accentLight, fontWeight: '600' },

  machineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  machineToggleText: { ...typography.body, color: colors.accent },

  customRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  customInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addCustomBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
  },

  input: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },

  goalsCard: {
    backgroundColor: colors.accentDim,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.accentSoft,
  },
  goalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  goalsTitle: { ...typography.bodyBold, color: colors.accent },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  goalText: { ...typography.body, color: colors.text },
  goalsNote: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm, fontStyle: 'italic' },

  generateBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.xxl,
    ...shadows.button,
  },
  generateText: { ...typography.h3, color: colors.text },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
