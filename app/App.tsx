import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Step 1: Can we render ANYTHING?
function Bare() {
  return (
    <View style={bare.root}>
      <StatusBar style="light" />
      <Text style={bare.msg}>BARE RENDER OK</Text>
    </View>
  );
}

const bare = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' },
  msg: { color: '#00ff88', fontSize: 28, fontWeight: '700' },
});

// Step 2: Can we import our navigation stack?
let AppNavigator: React.ComponentType | null = null;
let SafeAreaProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
let importError: string | null = null;

try {
  // Dynamic-style but actually static imports assigned in try/catch
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nav = require('./src/navigation/AppNavigator');
  AppNavigator = nav.AppNavigator;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sac = require('react-native-safe-area-context');
  SafeAreaProvider = sac.SafeAreaProvider;
} catch (e: any) {
  importError = e.message + '\n' + (e.stack || '');
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message + '\n' + error.stack };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Render Error</Text>
          <Text style={styles.errorText}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [phase, setPhase] = useState<'bare' | 'full'>('bare');

  useEffect(() => {
    // Show bare screen for 1s so you can confirm rendering works,
    // then try the full app
    const t = setTimeout(() => setPhase('full'), 1000);
    return () => clearTimeout(t);
  }, []);

  // Phase 1: prove rendering works
  if (phase === 'bare') {
    return <Bare />;
  }

  // Phase 2: if imports failed, show the error
  if (importError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Import Error</Text>
        <Text style={styles.errorText}>{importError}</Text>
      </View>
    );
  }

  // Phase 3: render full app
  if (AppNavigator && SafeAreaProvider) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  // Fallback — should never reach here
  return <Bare />;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorText: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'left',
  },
});
