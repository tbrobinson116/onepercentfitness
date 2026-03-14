import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Card, PressableScale, SectionHeader, EmptyState, IconButton } from '../components/ui';
import type { BodyMeasurement, BloodWork, BloodWorkResult } from '../types';

const TABS = ['overview', 'measurements', 'bloodwork', 'settings'] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  measurements: 'Measurements',
  bloodwork: 'Blood Work',
  settings: 'Settings',
};

const TAB_ICONS: Record<Tab, keyof typeof Ionicons.glyphMap> = {
  overview: 'grid-outline',
  measurements: 'body-outline',
  bloodwork: 'analytics-outline',
  settings: 'settings-outline',
};

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

  const [tab, setTab] = useState<Tab>('overview');
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

  const userInitials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              {userInitials ? (
                <Text style={styles.avatarText}>{userInitials}</Text>
              ) : (
                <Ionicons name="person" size={24} color={colors.accentLight} />
              )}
            </View>
            <View>
              <Text style={styles.title}>
                {profile?.name || 'My Profile'}
              </Text>
              <Text style={styles.subtitle}>Track your progress</Text>
            </View>
          </View>
          <IconButton
            icon="settings-outline"
            size={24}
            color={colors.textSecondary}
            onPress={() => setTab('settings')}
            style={styles.settingsBtn}
          />
        </View>
      </View>

      {/* Pill Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <PressableScale
            key={t}
            style={[styles.tab, tab === t && styles.activeTab]}
            onPress={() => setTab(t)}
          >
            <Ionicons
              name={TAB_ICONS[t]}
              size={14}
              color={tab === t ? '#fff' : colors.textSecondary}
              style={{ marginRight: spacing.xs }}
            />
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {TAB_LABELS[t]}
            </Text>
          </PressableScale>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'overview' && (
          <>
            {/* Current Stats */}
            <SectionHeader title="CURRENT STATS" />
            <View style={styles.statsGrid}>
              <StatCard
                icon="scale-outline"
                label="Weight"
                value={latestMeasurement?.weightKg ? `${latestMeasurement.weightKg}` : '--'}
                unit="kg"
                color={colors.accent}
                delay={0}
              />
              <StatCard
                icon="water-outline"
                label="Body Fat"
                value={latestMeasurement?.bodyFatPercent ? `${latestMeasurement.bodyFatPercent}` : '--'}
                unit="%"
                color={colors.secondary}
                delay={50}
              />
              <StatCard
                icon="resize-outline"
                label="Height"
                value={profile?.heightCm ? `${profile.heightCm}` : '--'}
                unit="cm"
                color={colors.warning}
                delay={100}
              />
              <StatCard
                icon="barbell-outline"
                label="Muscle"
                value={latestMeasurement?.muscleMassKg ? `${latestMeasurement.muscleMassKg}` : '--'}
                unit="kg"
                color={colors.danger}
                delay={150}
              />
            </View>

            {/* Quick Actions */}
            <SectionHeader title="QUICK ACTIONS" />
            <Card
              onPress={() => setShowAddMeasurement(true)}
              entering={FadeInDown.duration(400).delay(200)}
              style={styles.actionCard}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: colors.accentDim }]}>
                <Ionicons name="body-outline" size={22} color={colors.accent} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Log Measurements</Text>
                <Text style={styles.actionDesc}>Weight, body fat, circumferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>

            <Card
              onPress={() => setShowAddBloodWork(true)}
              entering={FadeInDown.duration(400).delay(250)}
              style={styles.actionCard}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: colors.dangerDim }]}>
                <Ionicons name="water-outline" size={22} color={colors.danger} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Log Blood Work</Text>
                <Text style={styles.actionDesc}>Track your health markers</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>

            <Card
              onPress={() => navigation.navigate('ProgressPhotos')}
              entering={FadeInDown.duration(400).delay(300)}
              style={styles.actionCard}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#2d1f4e' }]}>
                <Ionicons name="camera-outline" size={22} color="#a78bfa" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Progress Photos</Text>
                <Text style={styles.actionDesc}>Track your visual transformation</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>

            {/* Recent Measurements */}
            {measurements.length > 0 && (
              <>
                <SectionHeader
                  title="RECENT MEASUREMENTS"
                  action="View All"
                  onAction={() => setTab('measurements')}
                />
                <Card entering={FadeInDown.duration(400).delay(300)}>
                  {measurements.slice(0, 5).map((m, index) => (
                    <View
                      key={m.id}
                      style={[
                        styles.recentRow,
                        index === Math.min(measurements.length - 1, 4) && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={styles.recentDateWrap}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.recentDate}>{m.date}</Text>
                      </View>
                      <Text style={styles.recentValue}>
                        {m.weightKg ? `${m.weightKg}kg` : ''}
                        {m.bodyFatPercent ? ` / ${m.bodyFatPercent}%` : ''}
                      </Text>
                    </View>
                  ))}
                </Card>
              </>
            )}
          </>
        )}

        {tab === 'measurements' && (
          <>
            <PressableScale
              style={styles.addBtn}
              onPress={() => setShowAddMeasurement(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: spacing.sm }} />
              <Text style={styles.addBtnText}>Add Measurement</Text>
            </PressableScale>

            {measurements.length === 0 ? (
              <EmptyState
                icon="body-outline"
                title="No measurements yet"
                subtitle="Start tracking your body measurements to monitor progress"
                actionLabel="Log First Measurement"
                onAction={() => setShowAddMeasurement(true)}
              />
            ) : (
              measurements.map((m, index) => (
                <Card
                  key={m.id}
                  entering={FadeInDown.duration(400).delay(index * 60)}
                >
                  <View style={styles.measurementHeader}>
                    <Ionicons name="calendar-outline" size={16} color={colors.accent} />
                    <Text style={styles.measurementDateHeader}>{m.date}</Text>
                  </View>
                  <View style={styles.measurementGrid}>
                    {m.weightKg != null && <MeasurementItem icon="scale-outline" label="Weight" value={`${m.weightKg} kg`} />}
                    {m.bodyFatPercent != null && <MeasurementItem icon="water-outline" label="Body Fat" value={`${m.bodyFatPercent}%`} />}
                    {m.chest != null && <MeasurementItem icon="resize-outline" label="Chest" value={`${m.chest} cm`} />}
                    {m.waist != null && <MeasurementItem icon="resize-outline" label="Waist" value={`${m.waist} cm`} />}
                    {m.hips != null && <MeasurementItem icon="resize-outline" label="Hips" value={`${m.hips} cm`} />}
                    {m.bicepLeft != null && <MeasurementItem icon="barbell-outline" label="Bicep L" value={`${m.bicepLeft} cm`} />}
                    {m.bicepRight != null && <MeasurementItem icon="barbell-outline" label="Bicep R" value={`${m.bicepRight} cm`} />}
                    {m.shoulders != null && <MeasurementItem icon="resize-outline" label="Shoulders" value={`${m.shoulders} cm`} />}
                    {m.thighLeft != null && <MeasurementItem icon="resize-outline" label="Thigh L" value={`${m.thighLeft} cm`} />}
                    {m.thighRight != null && <MeasurementItem icon="resize-outline" label="Thigh R" value={`${m.thighRight} cm`} />}
                  </View>
                  {m.notes && (
                    <View style={styles.notesWrap}>
                      <Ionicons name="chatbubble-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.notes}>{m.notes}</Text>
                    </View>
                  )}
                </Card>
              ))
            )}
          </>
        )}

        {tab === 'bloodwork' && (
          <>
            <PressableScale
              style={styles.addBtn}
              onPress={() => setShowAddBloodWork(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: spacing.sm }} />
              <Text style={styles.addBtnText}>Add Blood Work</Text>
            </PressableScale>

            <Card entering={FadeInDown.duration(400)} style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                <Text style={styles.infoText}>
                  Track key health markers like testosterone, vitamin D, cholesterol, thyroid,
                  iron, and more. The AI will factor these into your workout and nutrition recommendations.
                </Text>
              </View>
            </Card>

            {bloodWork.length === 0 ? (
              <EmptyState
                icon="analytics-outline"
                title="No blood work logged"
                subtitle="Log your lab results to get AI-powered health insights"
                actionLabel="Log Blood Work"
                onAction={() => setShowAddBloodWork(true)}
              />
            ) : (
              bloodWork.map((bw, index) => (
                <Card
                  key={bw.id}
                  entering={FadeInDown.duration(400).delay(index * 60)}
                >
                  <View style={styles.measurementHeader}>
                    <Ionicons name="calendar-outline" size={16} color={colors.accent} />
                    <Text style={styles.measurementDateHeader}>{bw.date}</Text>
                  </View>
                  {bw.labName && (
                    <View style={styles.labRow}>
                      <Ionicons name="business-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.labName}>{bw.labName}</Text>
                    </View>
                  )}
                  {bw.results.map((r, i) => (
                    <View
                      key={i}
                      style={[
                        styles.bloodWorkRow,
                        i === bw.results.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={styles.markerLeft}>
                        <Ionicons name="analytics-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.markerName}>{r.marker}</Text>
                      </View>
                      <View style={styles.markerRight}>
                        <Text
                          style={[
                            styles.markerValue,
                            r.status === 'low' && { color: colors.warning },
                            r.status === 'high' && { color: colors.danger },
                          ]}
                        >
                          {r.value} {r.unit}
                        </Text>
                        {r.status && r.status !== 'normal' && (
                          <View
                            style={[
                              styles.statusBadge,
                              r.status === 'low'
                                ? { backgroundColor: colors.warningDim }
                                : { backgroundColor: colors.dangerDim },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                r.status === 'low'
                                  ? { color: colors.warning }
                                  : { color: colors.danger },
                              ]}
                            >
                              {r.status.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        {r.status === 'normal' && (
                          <View style={[styles.statusBadge, { backgroundColor: colors.secondaryDim }]}>
                            <Text style={[styles.statusBadgeText, { color: colors.secondary }]}>
                              NORMAL
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </Card>
              ))
            )}
          </>
        )}

        {tab === 'settings' && (
          <>
            <SectionHeader title="MACRO TARGETS" />
            <Card entering={FadeInDown.duration(400)}>
              <SettingInput
                icon="flame-outline"
                label="Daily Calories"
                value={macroTargets.calories.toString()}
                onChange={(v) => setMacroTargets({ ...macroTargets, calories: Number(v) || 0 })}
              />
              <SettingInput
                icon="nutrition-outline"
                label="Protein (g)"
                value={macroTargets.proteinG.toString()}
                onChange={(v) => setMacroTargets({ ...macroTargets, proteinG: Number(v) || 0 })}
              />
              <SettingInput
                icon="leaf-outline"
                label="Carbs (g)"
                value={macroTargets.carbsG.toString()}
                onChange={(v) => setMacroTargets({ ...macroTargets, carbsG: Number(v) || 0 })}
              />
              <SettingInput
                icon="water-outline"
                label="Fat (g)"
                value={macroTargets.fatG.toString()}
                onChange={(v) => setMacroTargets({ ...macroTargets, fatG: Number(v) || 0 })}
                last
              />
            </Card>

            <SectionHeader title="PROFILE" />
            <Card entering={FadeInDown.duration(400).delay(60)}>
              <SettingInput
                icon="person-outline"
                label="Name"
                value={profile?.name ?? ''}
                onChange={(name) => {
                  if (profile) setProfile({ ...profile, name });
                }}
                numeric={false}
              />
              <SettingInput
                icon="resize-outline"
                label="Height (cm)"
                value={profile?.heightCm?.toString() ?? ''}
                onChange={(v) => {
                  if (profile) setProfile({ ...profile, heightCm: Number(v) || 0 });
                }}
                last
              />
            </Card>

            <SectionHeader title="DATA" />
            <Card entering={FadeInDown.duration(400).delay(120)}>
              <PressableScale
                style={styles.resetBtn}
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
                <Ionicons name="refresh-outline" size={18} color={colors.danger} style={{ marginRight: spacing.sm }} />
                <Text style={styles.resetText}>Reset App & Re-run Onboarding</Text>
              </PressableScale>
            </Card>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Measurement Modal */}
      <Modal visible={showAddMeasurement} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Log Measurements</Text>
                <IconButton
                  icon="close-circle-outline"
                  size={26}
                  color={colors.textSecondary}
                  onPress={() => setShowAddMeasurement(false)}
                  style={styles.modalClose}
                />
              </View>

              <MeasurementInput label="Weight (kg)" value={newMeasurement.weightKg?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, weightKg: Number(v) || undefined })} />
              <MeasurementInput label="Body Fat %" value={newMeasurement.bodyFatPercent?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, bodyFatPercent: Number(v) || undefined })} />
              <MeasurementInput label="Muscle Mass (kg)" value={newMeasurement.muscleMassKg?.toString() ?? ''} onChange={(v) => setNewMeasurement({ ...newMeasurement, muscleMassKg: Number(v) || undefined })} />

              <Text style={styles.modalSubTitle}>Circumferences (cm)</Text>
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
                placeholderTextColor={colors.textMuted}
                value={newMeasurement.notes ?? ''}
                onChangeText={(notes) => setNewMeasurement({ ...newMeasurement, notes })}
                multiline
              />

              <View style={styles.modalActions}>
                <PressableScale style={styles.cancelButton} onPress={() => setShowAddMeasurement(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </PressableScale>
                <PressableScale style={styles.saveButton} onPress={saveMeasurement}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: spacing.xs }} />
                  <Text style={styles.saveText}>Save</Text>
                </PressableScale>
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
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Log Blood Work</Text>
                <IconButton
                  icon="close-circle-outline"
                  size={26}
                  color={colors.textSecondary}
                  onPress={() => setShowAddBloodWork(false)}
                  style={styles.modalClose}
                />
              </View>

              <Text style={styles.inputLabel}>Lab Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Lab name (optional)"
                placeholderTextColor={colors.textMuted}
                value={newBloodWork.labName}
                onChangeText={(labName) => setNewBloodWork({ ...newBloodWork, labName })}
              />

              <Text style={styles.modalSubTitle}>Results</Text>
              {newBloodWork.results.map((r, i) => (
                <View key={i} style={styles.bloodWorkInputRow}>
                  <TextInput
                    style={[styles.input, { flex: 2 }]}
                    placeholder="Marker (e.g. Testosterone)"
                    placeholderTextColor={colors.textMuted}
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
                    placeholderTextColor={colors.textMuted}
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
                    placeholderTextColor={colors.textMuted}
                    value={r.unit}
                    onChangeText={(unit) => {
                      const results = [...newBloodWork.results];
                      results[i] = { ...results[i], unit };
                      setNewBloodWork({ ...newBloodWork, results });
                    }}
                  />
                </View>
              ))}

              <PressableScale style={styles.addRowBtn} onPress={addBloodWorkRow}>
                <Ionicons name="add-circle-outline" size={18} color={colors.accent} style={{ marginRight: spacing.xs }} />
                <Text style={styles.addRowText}>Add Marker</Text>
              </PressableScale>

              <View style={styles.modalActions}>
                <PressableScale style={styles.cancelButton} onPress={() => setShowAddBloodWork(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </PressableScale>
                <PressableScale style={styles.saveButton} onPress={saveBloodWork}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: spacing.xs }} />
                  <Text style={styles.saveText}>Save</Text>
                </PressableScale>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ---- Sub-components ----

function StatCard({
  icon,
  label,
  value,
  unit,
  color,
  delay = 0,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit: string;
  color: string;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      style={styles.statCard}
    >
      <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {value !== '--' && <Text style={styles.statUnit}>{unit}</Text>}
      </View>
    </Animated.View>
  );
}

function MeasurementItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.measurementItem}>
      <Ionicons name={icon} size={13} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
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
    <View style={half ? { flex: 1, marginHorizontal: spacing.xs } : undefined}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

function SettingInput({
  icon,
  label,
  value,
  onChange,
  numeric = true,
  last = false,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.settingRow, !last && styles.settingRowBorder]}>
      <View style={styles.settingLabelRow}>
        {icon && <Ionicons name={icon} size={16} color={colors.textMuted} style={{ marginRight: spacing.sm }} />}
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <TextInput
        style={styles.settingInput}
        keyboardType={numeric ? 'numeric' : 'default'}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

// ---- Styles ----

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarText: {
    ...typography.bodyBold,
    color: colors.accentLight,
    fontSize: 17,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Pill Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardLight,
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  tabText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '700',
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48.5%' as any,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardLight,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statUnit: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },

  // Action Cards
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  actionDesc: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Recent measurements
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentDate: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  recentValue: {
    ...typography.bodyBold,
    color: colors.text,
  },

  // Add Button
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.button,
  },
  addBtnText: {
    ...typography.bodyBold,
    color: '#fff',
  },

  // Measurements tab
  measurementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  measurementDateHeader: {
    ...typography.bodyBold,
    color: colors.accent,
    marginLeft: spacing.sm,
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  measurementItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  measurementItemLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  measurementItemValue: {
    ...typography.bodyBold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  notesWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notes: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginLeft: spacing.sm,
    flex: 1,
  },

  // Blood work tab
  infoCard: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accentSoft,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: spacing.sm,
    flex: 1,
  },
  labRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  labName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  bloodWorkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  markerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  markerName: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  markerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  markerValue: {
    ...typography.bodyBold,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    ...typography.smallBold,
  },

  // Settings tab
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text,
  },
  settingInput: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    width: 100,
    textAlign: 'center',
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Reset Button
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dangerDim,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  resetText: {
    ...typography.bodyBold,
    color: colors.danger,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
    marginTop: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },
  modalClose: {
    position: 'absolute',
    right: 0,
    top: spacing.lg,
  },
  modalSubTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.md + 2,
    color: colors.text,
    ...typography.body,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  bloodWorkInputRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  addRowText: {
    ...typography.bodyBold,
    color: colors.accent,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  saveText: {
    ...typography.bodyBold,
    color: '#fff',
  },
});
