import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useGlassesConnection } from '../hooks/useGlassesConnection';
import { useAppStore } from '../store/appStore';

interface HomeScreenProps {
  navigation: any;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const {
    status,
    device,
    availableDevices,
    isConnected,
    isSearching,
    search,
    connect,
    disconnect,
  } = useGlassesConnection();

  const { setShowReadyPrompt } = useAppStore();

  // When glasses connect, show the "ready to scan" prompt
  useEffect(() => {
    if (isConnected) {
      setShowReadyPrompt(true);
    }
  }, [isConnected, setShowReadyPrompt]);

  const handleStartScan = () => {
    navigation.navigate('Scan');
  };

  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#34C759';
      case 'connecting':
      case 'searching': return '#FF9500';
      case 'error': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return `Connected to ${device?.name}`;
      case 'connecting': return 'Connecting...';
      case 'searching': return 'Searching for glasses...';
      case 'error': return 'Connection error';
      default: return 'Not connected';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>DutySnap</Text>
            <Text style={styles.subtitle}>Scan items, know your duties</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Glasses Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        {!isConnected ? (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={search}
            disabled={isSearching}
          >
            <Text style={styles.connectButtonText}>
              {isSearching ? 'Searching...' : 'Find Glasses'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.connectButton, styles.disconnectButton]}
            onPress={disconnect}
          >
            <Text style={styles.connectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        )}

        {/* Show available devices */}
        {availableDevices.length > 0 && !isConnected && (
          <View style={styles.deviceList}>
            {availableDevices.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={styles.deviceItem}
                onPress={() => connect(d)}
              >
                <Text style={styles.deviceName}>{d.name}</Text>
                {d.batteryLevel && (
                  <Text style={styles.deviceBattery}>{d.batteryLevel}%</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Main Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.scanButton, !isConnected && styles.scanButtonAlt]}
          onPress={handleStartScan}
        >
          <Text style={styles.scanButtonIcon}>📸</Text>
          <Text style={styles.scanButtonText}>
            {isConnected ? 'Scan with Glasses' : 'Scan Item'}
          </Text>
          <Text style={styles.scanButtonHint}>
            {isConnected
              ? 'Look at an item and tap to capture'
              : 'Use camera or pick from gallery'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={handleViewHistory}
        >
          <Text style={styles.historyButtonText}>View History</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Tips */}
      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>How it works</Text>
        <Text style={styles.tip}>1. Point at an item</Text>
        <Text style={styles.tip}>2. Capture image</Text>
        <Text style={styles.tip}>3. Get HS code + duty rate</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    marginTop: 4,
  },
  statusCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 17,
    color: '#000',
    flex: 1,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  disconnectButton: {
    backgroundColor: '#8E8E93',
  },
  connectButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  deviceList: {
    marginTop: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    marginTop: 8,
  },
  deviceName: {
    fontSize: 17,
    color: '#007AFF',
  },
  deviceBattery: {
    fontSize: 15,
    color: '#8E8E93',
  },
  actions: {
    paddingHorizontal: 20,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  scanButtonAlt: {
    backgroundColor: '#34C759',
  },
  scanButtonIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '600',
  },
  scanButtonHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    marginTop: 6,
  },
  historyButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  tips: {
    marginTop: 'auto',
    padding: 20,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tip: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 6,
  },
});
