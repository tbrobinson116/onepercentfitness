import { create } from 'zustand';
import { ScanSession, GlassesDevice, GlassesConnectionStatus } from '../types';

interface AppState {
  // Glasses state
  glassesStatus: GlassesConnectionStatus;
  connectedDevice: GlassesDevice | null;
  setGlassesStatus: (status: GlassesConnectionStatus) => void;
  setConnectedDevice: (device: GlassesDevice | null) => void;

  // Current scan session
  currentScan: ScanSession | null;
  setCurrentScan: (scan: ScanSession | null) => void;
  updateCurrentScan: (updates: Partial<ScanSession>) => void;

  // Scan history
  scanHistory: ScanSession[];
  addToHistory: (scan: ScanSession) => void;
  clearHistory: () => void;

  // UI state
  showReadyPrompt: boolean;
  setShowReadyPrompt: (show: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Glasses state
  glassesStatus: 'disconnected',
  connectedDevice: null,
  setGlassesStatus: (status) => set({ glassesStatus: status }),
  setConnectedDevice: (device) => set({ connectedDevice: device }),

  // Current scan
  currentScan: null,
  setCurrentScan: (scan) => set({ currentScan: scan }),
  updateCurrentScan: (updates) => set((state) => ({
    currentScan: state.currentScan
      ? { ...state.currentScan, ...updates }
      : null,
  })),

  // History
  scanHistory: [],
  addToHistory: (scan) => set((state) => ({
    scanHistory: [scan, ...state.scanHistory].slice(0, 50), // Keep last 50
  })),
  clearHistory: () => set({ scanHistory: [] }),

  // UI
  showReadyPrompt: false,
  setShowReadyPrompt: (show) => set({ showReadyPrompt: show }),
}));
