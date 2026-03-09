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
} from 'react-native';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography } from '../theme';
import type { Equipment } from '../types';

const EQUIPMENT_OPTIONS: { id: Equipment; label: string }[] = [
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbell', label: 'Dumbbells' },
  { id: 'cable', label: 'Cables' },
  { id: 'machine', label: 'Machines' },
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'kettlebell', label: 'Kettlebells' },
  { id: 'band', label: 'Bands' },
];

export function GenerateProgramScreen({ navigation }: any) {
  const { goals, measurements, bloodWork, addProgram } = useStore();
  const [loading, setLoading] = useState(false);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [duration, setDuration] = useState(60);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>(['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight']);
  const [injuries, setInjuries] = useState('');
  const [preferences, setPreferences] = useState('');

  const toggleEquipment = (eq: Equipment) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  };

  const generate = async () => {
    if (selectedEquipment.length === 0) {
      Alert.alert('Error', 'Select at least one equipment type');
      return;
    }

    setLoading(true);
    try {
      const program = await api.generateProgram({
        goals: goals.filter((g) => g.status === 'active'),
        measurements: measurements[0],
        bloodWork: bloodWork[0],
        experience,
        daysPerWeek,
        sessionDurationMinutes: duration,
        availableEquipment: selectedEquipment,
        injuries: injuries ? injuries.split(',').map((s) => s.trim()) : undefined,
        preferences: preferences || undefined,
      });
      addProgram(program);
      Alert.alert('Program Generated!', program.name, [
        { text: 'View', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate program. Make sure the API is running.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Generate AI Program</Text>
      </View>

      <Text style={styles.desc}>
        Our AI will create a personalized workout program based on your goals, body composition, and preferences.
      </Text>

      {/* Experience Level */}
      <Text style={styles.label}>Experience Level</Text>
      <View style={styles.optionRow}>
        {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.option, experience === level && styles.optionActive]}
            onPress={() => setExperience(level)}
          >
            <Text style={[styles.optionText, experience === level && styles.optionTextActive]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Days per Week */}
      <Text style={styles.label}>Days per Week</Text>
      <View style={styles.optionRow}>
        {[3, 4, 5, 6].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.option, daysPerWeek === d && styles.optionActive]}
            onPress={() => setDaysPerWeek(d)}
          >
            <Text style={[styles.optionText, daysPerWeek === d && styles.optionTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Session Duration */}
      <Text style={styles.label}>Session Duration (minutes)</Text>
      <View style={styles.optionRow}>
        {[30, 45, 60, 75, 90].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.option, duration === d && styles.optionActive]}
            onPress={() => setDuration(d)}
          >
            <Text style={[styles.optionText, duration === d && styles.optionTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Equipment */}
      <Text style={styles.label}>Available Equipment</Text>
      <View style={styles.equipmentGrid}>
        {EQUIPMENT_OPTIONS.map((eq) => (
          <TouchableOpacity
            key={eq.id}
            style={[styles.equipChip, selectedEquipment.includes(eq.id) && styles.equipChipActive]}
            onPress={() => toggleEquipment(eq.id)}
          >
            <Text style={[styles.equipText, selectedEquipment.includes(eq.id) && styles.equipTextActive]}>
              {eq.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Injuries */}
      <Text style={styles.label}>Injuries / Limitations</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., bad left knee, shoulder impingement"
        placeholderTextColor={colors.textSecondary}
        value={injuries}
        onChangeText={setInjuries}
      />

      {/* Preferences */}
      <Text style={styles.label}>Preferences / Notes</Text>
      <TextInput
        style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
        placeholder="e.g., prefer compound movements, like supersets, want to focus on arms"
        placeholderTextColor={colors.textSecondary}
        value={preferences}
        onChangeText={setPreferences}
        multiline
      />

      {/* Active Goals Info */}
      {goals.filter((g) => g.status === 'active').length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Your Active Goals</Text>
          {goals.filter((g) => g.status === 'active').map((g) => (
            <Text key={g.id} style={styles.infoItem}>• {g.title}</Text>
          ))}
          <Text style={styles.infoNote}>These will be factored into your program.</Text>
        </View>
      )}

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
        onPress={generate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.generateBtnText}>✨ Generate Program</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: { paddingTop: 44, marginBottom: 8 },
  backBtn: { ...typography.body, color: colors.accent, marginBottom: 8 },
  title: { ...typography.h1, color: colors.text },
  desc: { ...typography.body, color: colors.textSecondary, marginBottom: 24 },
  label: { ...typography.bodyBold, color: colors.text, marginBottom: 8, marginTop: 16 },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: { backgroundColor: colors.accent + '22', borderColor: colors.accent },
  optionText: { ...typography.body, color: colors.textSecondary },
  optionTextActive: { color: colors.accent, fontWeight: '600' },
  equipmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  equipChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipChipActive: { backgroundColor: colors.accent + '22', borderColor: colors.accent },
  equipText: { ...typography.caption, color: colors.textSecondary },
  equipTextActive: { color: colors.accent, fontWeight: '600' },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCard: {
    backgroundColor: colors.accent + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  infoTitle: { ...typography.bodyBold, color: colors.accent, marginBottom: 8 },
  infoItem: { ...typography.body, color: colors.text, marginBottom: 2 },
  infoNote: { ...typography.caption, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
  generateBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { ...typography.h3, color: colors.text },
});
