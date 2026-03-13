import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography } from '../theme';
import type { BodyMeasurement, BloodWork, BloodWorkResult } from '../types';

export function ProfileScreen({ navigation }: any) {
  const {
    profile,
    measurements,
    bloodWork,
    setProfile,
    addMeasurement,
    setMeasurements,
    addBloodWork,
    setBloodWork,
    macroTargets,
    setMacroTargets,
  } = useStore();

  const [tab, setTab] = useState<'overview' | 'measurements' | 'bloodwork' | 'settings'>('overview');
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [showAddBloodWork, setShowAddBloodWork] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState<Partial<BodyMeasurement>>({});
  const [newBloodWork, setNewBloodWork] = useState<{
    labName: string;
    results: { marker: string; value: string; unit: string }[];
  }>({ labName: '', results: [{ marker: '', value: '', unit: '' }] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileData, measurementsData, bloodWorkData] = await Promise.all([
        api.getProfile(),
        api.getMeasurements(),
        api.getBloodWork(),
      ]);
      setProfile(profileData);
      setMeasurements(measurementsData);
      setBloodWork(bloodWorkData);
    } catch { /* offline */ }
  };

  const latestMeasurement = measurements[0];

  const saveMeasurement = async () => {
    const measurement: Partial<BodyMeasurement> = {
      ...newMeasurement,
      date: new Date().toISOString().split('T')[0],
    };
    try {
      const saved = await api.addMeasurement(measurement);
      addMeasurement(saved);
    } catch {
      addMeasurement({ ...measurement, id: Date.now().toString() } as BodyMeasurement);
    }
    setShowAddMeasurement(false);
    setNewMeasurement({});
  };

  const saveBloodWork = async () => {
    const record: Partial<BloodWork> = {
      date: new Date().toISOString().split('T')[0],
      labName: newBloodWork.labName || undefined,
      results: newBloodWork.results
        .filter((r) => r.marker.trim())
        .map((r) => ({
          marker: r.marker,
          value: Number(r.value) || 0,
          unit: r.unit || 'mg/dL',
        })),
    };
    try {
      const saved = await api.addBloodWork(record);
      addBloodWork(saved);
    } catch {
      addBloodWork({ ...record, id: Date.now().toString() } as BloodWork);
    }
    setShowAddBloodWork(false);
    setNewBloodWork({ labName: '', results: [{ marker: '', value: '', unit: '' }] });
  };

  const addBloodWorkRow = () => {
    setNewBloodWork({
      ...newBloodWork,
      results: [...newBloodWork.results, { marker: '', value: '', unit: '' }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.title}>My Profile</Text>
          <TouchableOpacity
            onPress={() => setTab('settings')}
            style={{ backgroundColor: colors.accent, borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>S</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['overview', 'measurements', 'bloodwork', 'settings'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.activeTab]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t === 'bloodwork' ? 'Blood Work' : t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {tab === 'overview' && (
          <>
            {/* Current Stats */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Current Stats</Text>
              <View style={styles.statsGrid}>
                <StatBox label="Weight" value={latestMeasurement?.weightKg ? `${latestMeasurement.weightKg} kg` : '--'} />
                <StatBox label="Body Fat" value={latestMeasurement?.bodyFatPercent ? `${latestMeasurement.bodyFatPercent}%` : '--'} />
                <StatBox label="Height" value={profile?.heightCm ? `${profile.heightCm} cm` : '--'} />
                <StatBox label="Muscle Mass" value={latestMeasurement?.muscleMassKg ? `${latestMeasurement.muscleMassKg} kg` : '--'} />
              </View>
            </View>

            {/* Quick Actions */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setShowAddMeasurement(true)}
            >
              <Text style={styles.actionIcon}>📏</Text>
              <View>
                <Text style={styles.actionTitle}>Log Measurements</Text>
                <Text style={styles.actionDesc}>Weight, body fat, circumferences</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setShowAddBloodWork(true)}
            >
              <Text style={styles.actionIcon}>🩸</Text>
              <View>
                <Text style={styles.actionTitle}>Log Blood Work</Text>
                <Text style={styles.actionDesc}>Track your health markers</Text>
              </View>
            </TouchableOpacity>

            {/* Recent Measurements */}
            {measurements.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Recent Measurements</Text>
                {measurements.slice(0, 5).map((m) => (
                  <View key={m.id} style={styles.measurementRow}>
                    <Text style={styles.measurementDate}>{m.date}</Text>
                    <Text style={styles.measurementValue}>
                      {m.weightKg ? `${m.weightKg}kg` : ''}
                      {m.bodyFatPercent ? ` · ${m.bodyFatPercent}%` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {tab === 'measurements' && (
          <>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddMeasurement(true)}
            >
              <Text style={styles.addBtnText}>+ Add Measurement</Text>
            </TouchableOpacity>

            {measurements.map((m) => (
              <View key={m.id} style={styles.card}>
                <Text style={styles.measurementDateHeader}>{m.date}</Text>
                <View style={styles.measurementGrid}>
                  {m.weightKg && <MeasurementItem label="Weight" value={`${m.weightKg} kg`} />}
                  {m.bodyFatPercent && <MeasurementItem label="Body Fat" value={`${m.bodyFatPercent}%`} />}
                  {m.chest && <MeasurementItem label="Chest" value={`${m.chest} cm`} />}
                  {m.waist && <MeasurementItem label="Waist" value={`${m.waist} cm`} />}
                  {m.hips && <MeasurementItem label="Hips" value={`${m.hips} cm`} />}
                  {m.bicepLeft && <MeasurementItem label="Bicep L" value={`${m.bicepLeft} cm`} />}
                  {m.bicepRight && <MeasurementItem label="Bicep R" value={`${m.bicepRight} cm`} />}
                  {m.shoulders && <MeasurementItem label="Shoulders" value={`${m.shoulders} cm`} />}
                  {m.thighLeft && <MeasurementItem label="Thigh L" value={`${m.thighLeft} cm`} />}
                  {m.thighRight && <MeasurementItem label="Thigh R" value={`${m.thighRight} cm`} />}
                </View>
                {m.notes && <Text style={styles.notes}>{m.notes}</Text>}
              </View>
            ))}
          </>
        )}

        {tab === 'bloodwork' && (
          <>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddBloodWork(true)}
            >
              <Text style={styles.addBtnText}>+ Add Blood Work</Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Track key health markers like testosterone, vitamin D, cholesterol, thyroid,
                iron, and more. The AI will factor these into your workout and nutrition recommendations.
              </Text>
            </View>

            {bloodWork.map((bw) => (
              <View key={bw.id} style={styles.card}>
                <Text style={styles.measurementDateHeader}>{bw.date}</Text>
                {bw.labName && <Text style={styles.labName}>{bw.labName}</Text>}
                {bw.results.map((r, i) => (
                  <View key={i} style={styles.bloodWorkRow}>
                    <Text style={styles.markerName}>{r.marker}</Text>
                    <Text style={[styles.markerValue, r.status === 'low' && styles.lowValue, r.status === 'high' && styles.highValue]}>
                      {r.value} {r.unit}
                    </Text>
                    {r.status && r.status !== 'normal' && (
                      <Text style={[styles.statusBadge, r.status === 'low' ? styles.lowBadge : styles.highBadge]}>
                        {r.status.toUpperCase()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {tab === 'settings' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Macro Targets</Text>
              <SettingInput
                label="Daily Calories"
                value={macroTargets.calories.toString()}
                onChange={(v) => setMacroTargets({ ...macroTargets, calories: Number(v) || 0 })}
              />
              <SettingInput
                label="Protein (g)"
                value={macroTargets.proteinG.toString()}
                onChange={(v) => setMacroTargets({ ...macroTargets, proteinG: Number(v) || 0 })}
              />
              <SettingInput
                label="Carbs (g)"
                value={macroTargets.carbsG.toString()}
                onChange={(v) => setMacroTargets({ ...macroTargets, carbsG: Number(v) || 0 })}
              />
              <SettingInput
                label="Fat (g)"
                value={macroTargets.fatG.toString()}
                onChange={(v) => setMacroTargets({ ...macroTargets, fatG: Number(v) || 0 })}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Profile</Text>
              <SettingInput
                label="Name"
                value={profile?.name ?? ''}
                onChange={(name) => {
                  if (profile) setProfile({ ...profile, name });
                }}
                numeric={false}
              />
              <SettingInput
                label="Height (cm)"
                value={profile?.heightCm?.toString() ?? ''}
                onChange={(v) => {
                  if (profile) setProfile({ ...profile, heightCm: Number(v) || 0 });
                }}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Data</Text>
              <TouchableOpacity
                style={{ backgroundColor: colors.danger, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 }}
                onPress={() => {
                  Alert.alert(
                    'Reset App',
                    'This will clear all data and restart onboarding. Are you sure?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reset Everything',
                        style: 'destructive',
                        onPress: async () => {
                          await AsyncStorage.clear();
                          useStore.getState().setOnboarded(false);
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Reset App & Re-run Onboarding</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Measurement Modal */}
      <Modal visible={showAddMeasurement} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Log Measurements</Text>

              <MeasurementInput label="Weight (kg)" value={newMeasurement.weightKg?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, weightKg: Number(v) || undefined })} />
              <MeasurementInput label="Body Fat %" value={newMeasurement.bodyFatPercent?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, bodyFatPercent: Number(v) || undefined })} />
              <MeasurementInput label="Muscle Mass (kg)" value={newMeasurement.muscleMassKg?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, muscleMassKg: Number(v) || undefined })} />

              <Text style={styles.subTitle}>Circumferences (cm)</Text>
              <View style={styles.inputRow}>
                <MeasurementInput label="Chest" value={newMeasurement.chest?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, chest: Number(v) || undefined })} half />
                <MeasurementInput label="Waist" value={newMeasurement.waist?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, waist: Number(v) || undefined })} half />
              </View>
              <View style={styles.inputRow}>
                <MeasurementInput label="Hips" value={newMeasurement.hips?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, hips: Number(v) || undefined })} half />
                <MeasurementInput label="Shoulders" value={newMeasurement.shoulders?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, shoulders: Number(v) || undefined })} half />
              </View>
              <View style={styles.inputRow}>
                <MeasurementInput label="Bicep L" value={newMeasurement.bicepLeft?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, bicepLeft: Number(v) || undefined })} half />
                <MeasurementInput label="Bicep R" value={newMeasurement.bicepRight?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, bicepRight: Number(v) || undefined })} half />
              </View>
              <View style={styles.inputRow}>
                <MeasurementInput label="Thigh L" value={newMeasurement.thighLeft?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, thighLeft: Number(v) || undefined })} half />
                <MeasurementInput label="Thigh R" value={newMeasurement.thighRight?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, thighRight: Number(v) || undefined })} half />
              </View>

              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                placeholder="Notes (optional)"
                placeholderTextColor={colors.textSecondary}
                value={newMeasurement.notes ?? ''}
                onChangeText={(notes) => setNewMeasurement({ ...newMeasurement, notes })}
                multiline
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddMeasurement(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={saveMeasurement}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Blood Work Modal */}
      <Modal visible={showAddBloodWork} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Log Blood Work</Text>

              <TextInput
                style={styles.input}
                placeholder="Lab name (optional)"
                placeholderTextColor={colors.textSecondary}
                value={newBloodWork.labName}
                onChangeText={(labName) => setNewBloodWork({ ...newBloodWork, labName })}
              />

              <Text style={styles.subTitle}>Results</Text>
              {newBloodWork.results.map((r, i) => (
                <View key={i} style={styles.bloodWorkInputRow}>
                  <TextInput
                    style={[styles.input, { flex: 2 }]}
                    placeholder="Marker (e.g. Testosterone)"
                    placeholderTextColor={colors.textSecondary}
                    value={r.marker}
                    onChangeText={(marker) => {
                      const results = [...newBloodWork.results];
                      results[i] = { ...results[i], marker };
                      setNewBloodWork({ ...newBloodWork, results });
                    }}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Value"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={r.value}
                    onChangeText={(value) => {
                      const results = [...newBloodWork.results];
                      results[i] = { ...results[i], value };
                      setNewBloodWork({ ...newBloodWork, results });
                    }}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Unit"
                    placeholderTextColor={colors.textSecondary}
                    value={r.unit}
                    onChangeText={(unit) => {
                      const results = [...newBloodWork.results];
                      results[i] = { ...results[i], unit };
                      setNewBloodWork({ ...newBloodWork, results });
                    }}
                  />
                </View>
              ))}

              <TouchableOpacity style={styles.addRowBtn} onPress={addBloodWorkRow}>
                <Text style={styles.addRowText}>+ Add Marker</Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddBloodWork(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={saveBloodWork}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MeasurementItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.measurementItem}>
      <Text style={styles.measurementItemLabel}>{label}</Text>
      <Text style={styles.measurementItemValue}>{value}</Text>
    </View>
  );
}

function MeasurementInput({
  label,
  value,
  onChange,
  half,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  half?: boolean;
}) {
  return (
    <View style={half ? { flex: 1, marginHorizontal: 4 } : undefined}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

function SettingInput({
  label,
  value,
  onChange,
  numeric = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <TextInput
        style={styles.settingInput}
        keyboardType={numeric ? 'numeric' : 'default'}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={colors.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 60 },
  title: { ...typography.h1, color: colors.text },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTab: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  activeTabText: { color: '#fff', fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statBox: {
    width: '50%',
    paddingVertical: 8,
  },
  statValue: { ...typography.h2, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: { fontSize: 28, marginRight: 12 },
  actionTitle: { ...typography.bodyBold, color: colors.text },
  actionDesc: { ...typography.caption, color: colors.textSecondary },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  measurementDate: { ...typography.body, color: colors.textSecondary },
  measurementValue: { ...typography.body, color: colors.text },
  measurementDateHeader: { ...typography.bodyBold, color: colors.accent, marginBottom: 8 },
  measurementGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  measurementItem: { width: '50%', paddingVertical: 4 },
  measurementItemLabel: { ...typography.caption, color: colors.textSecondary },
  measurementItemValue: { ...typography.body, color: colors.text },
  notes: { ...typography.caption, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtnText: { ...typography.bodyBold, color: colors.text },
  infoCard: {
    backgroundColor: colors.accent + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  infoText: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  labName: { ...typography.caption, color: colors.textSecondary, marginBottom: 8 },
  bloodWorkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  markerName: { ...typography.body, color: colors.text, flex: 1 },
  markerValue: { ...typography.body, color: colors.text, marginRight: 8 },
  lowValue: { color: colors.warning },
  highValue: { color: colors.danger },
  statusBadge: { ...typography.small, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  lowBadge: { backgroundColor: colors.warning + '22', color: colors.warning },
  highBadge: { backgroundColor: colors.danger + '22', color: colors.danger },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: { ...typography.body, color: colors.text, flex: 1 },
  settingInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    padding: 10,
    width: 100,
    textAlign: 'center',
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    marginTop: 80,
  },
  modalTitle: { ...typography.h2, color: colors.text, marginBottom: 16 },
  subTitle: { ...typography.bodyBold, color: colors.textSecondary, marginTop: 8, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    ...typography.body,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  inputRow: { flexDirection: 'row', marginHorizontal: -4 },
  bloodWorkInputRow: { flexDirection: 'row', gap: 4 },
  addRowBtn: { alignItems: 'center', paddingVertical: 8 },
  addRowText: { ...typography.body, color: colors.accent },
  modalActions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
  },
  cancelBtnText: { ...typography.bodyBold, color: colors.textSecondary },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  saveText: { ...typography.bodyBold, color: colors.text },
});
