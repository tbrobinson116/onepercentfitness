import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useAppStore, ClassificationProvider } from '../store/appStore';
import { useGlassesConnection } from '../hooks/useGlassesConnection';

const PROVIDERS: { id: ClassificationProvider; name: string; description: string }[] = [
  {
    id: 'auto',
    name: 'Auto (A/B Test)',
    description: 'Automatically selects and tests different providers',
  },
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    description: 'Uses Claude vision for classification',
  },
  {
    id: 'openai',
    name: 'GPT-4 (OpenAI)',
    description: 'Uses GPT-4 vision for classification',
  },
  {
    id: 'zonos',
    name: 'Zonos',
    description: 'Specialized customs classification API',
  },
];

export function SettingsScreen() {
  const {
    classificationProvider,
    setClassificationProvider,
    abTestEnabled,
    setABTestEnabled,
    scanHistory,
    clearHistory,
  } = useAppStore();

  const { isConnected, device, isUsingRealSDK, disconnect } = useGlassesConnection();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Glasses Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GLASSES</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isConnected ? '#34C759' : '#8E8E93' },
                  ]}
                />
                <Text style={styles.statusText}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>

            {device && (
              <View style={styles.row}>
                <Text style={styles.label}>Device</Text>
                <Text style={styles.value}>{device.name}</Text>
              </View>
            )}

            <View style={styles.row}>
              <Text style={styles.label}>SDK Mode</Text>
              <Text style={styles.value}>
                {isUsingRealSDK ? 'Native SDK' : 'Mock Mode'}
              </Text>
            </View>

            {isConnected && (
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={disconnect}
              >
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Classification Provider Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLASSIFICATION PROVIDER</Text>

          <View style={styles.card}>
            {PROVIDERS.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerOption,
                  classificationProvider === provider.id &&
                    styles.providerOptionSelected,
                ]}
                onPress={() => setClassificationProvider(provider.id)}
              >
                <View style={styles.providerContent}>
                  <Text
                    style={[
                      styles.providerName,
                      classificationProvider === provider.id &&
                        styles.providerNameSelected,
                    ]}
                  >
                    {provider.name}
                  </Text>
                  <Text style={styles.providerDescription}>
                    {provider.description}
                  </Text>
                </View>
                {classificationProvider === provider.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* A/B Testing Section */}
        {classificationProvider === 'auto' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>A/B TESTING</Text>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.switchContent}>
                  <Text style={styles.label}>Enable A/B Testing</Text>
                  <Text style={styles.sublabel}>
                    Randomly test different providers to compare accuracy
                  </Text>
                </View>
                <Switch
                  value={abTestEnabled}
                  onValueChange={setABTestEnabled}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Scan History</Text>
              <Text style={styles.value}>{scanHistory.length} scans</Text>
            </View>

            {scanHistory.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearHistory}
              >
                <Text style={styles.clearButtonText}>Clear History</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Version</Text>
              <Text style={styles.value}>1.0.0</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>App</Text>
              <Text style={styles.value}>DutySnap</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  label: {
    fontSize: 17,
    color: '#000',
  },
  sublabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  value: {
    fontSize: 17,
    color: '#8E8E93',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  switchContent: {
    flex: 1,
    marginRight: 12,
  },
  providerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  providerOptionSelected: {
    backgroundColor: '#F0F7FF',
  },
  providerContent: {
    flex: 1,
  },
  providerName: {
    fontSize: 17,
    color: '#000',
    marginBottom: 4,
  },
  providerNameSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  providerDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  checkmark: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 12,
  },
  disconnectButton: {
    padding: 16,
    alignItems: 'center',
  },
  disconnectButtonText: {
    fontSize: 17,
    color: '#FF3B30',
  },
  clearButton: {
    padding: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 17,
    color: '#FF3B30',
  },
});
