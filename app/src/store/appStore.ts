import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanSession } from '../types';
import { ConnectionStatus, GlassesDevice } from '../services/metaGlasses';

export type ClassificationProvider = 'auto' | 'zonos' | 'anthropic' | 'openai';

interface AppState {
  // Glasses state
  glassesStatus: ConnectionStatus;
  connectedDevice: GlassesDevice | null;
  setGlassesStatus: (status: ConnectionStatus) => void;
  setConnectedDevice: (device: GlassesDevice | null) => void;

  // Current scan session
  currentScan: ScanSession | null;
  setCurrentScan: (scan: ScanSession | null) => void;
  updateCurrentScan: (updates: Partial<ScanSession>) => void;

  // Scan history
  scanHistory: ScanSession[];
  addToHistory: (scan: ScanSession) => void;
  clearHistory: () => void;

  // Classification settings
  classificationProvider: ClassificationProvider;
  setClassificationProvider: (provider: ClassificationProvider) => void;
  abTestEnabled: boolean;
  setABTestEnabled: (enabled: boolean) => void;

  // UI state
  showReadyPrompt: boolean;
  setShowReadyPrompt: (show: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Glasses state
      glassesStatus: 'disconnected',
      connectedDevice: null,
      setGlassesStatus: (status) => set({ glassesStatus: status }),
      setConnectedDevice: (device) => set({ connectedDevice: device }),

      // Current scan
      currentScan: null,
      setCurrentScan: (scan) => set({ currentScan: scan }),
      updateCurrentScan: (updates) =>
        set((state) => ({
          currentScan: state.currentScan
            ? { ...state.currentScan, ...updates }
            : null,
        })),

      // History
      scanHistory: [],
      addToHistory: (scan) =>
        set((state) => ({
          scanHistory: [scan, ...state.scanHistory].slice(0, 50), // Keep last 50
        })),
      clearHistory: () => set({ scanHistory: [] }),

      // Classification settings
      classificationProvider: 'auto',
      setClassificationProvider: (provider) =>
        set({ classificationProvider: provider }),
      abTestEnabled: true,
      setABTestEnabled: (enabled) => set({ abTestEnabled: enabled }),

      // UI
      showReadyPrompt: false,
      setShowReadyPrompt: (show) => set({ showReadyPrompt: show }),
    }),
    {
      name: 'dutysnap-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        scanHistory: state.scanHistory,
        classificationProvider: state.classificationProvider,
        abTestEnabled: state.abTestEnabled,
      }),
    }
  )
);
