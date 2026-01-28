import { useState, useEffect, useCallback } from 'react';
import * as metaGlasses from '../services/metaGlasses';
import {
  GlassesState,
  GlassesDevice,
  ConnectionStatus,
} from '../services/metaGlasses';

interface UseGlassesConnectionReturn {
  status: ConnectionStatus;
  device: GlassesDevice | null;
  availableDevices: GlassesDevice[];
  batteryLevel: number;
  isSearching: boolean;
  isConnected: boolean;
  isUsingRealSDK: boolean;
  search: () => Promise<void>;
  connect: (device: GlassesDevice) => Promise<boolean>;
  disconnect: () => Promise<void>;
  error: string | null;
}

export function useGlassesConnection(): UseGlassesConnectionReturn {
  const [state, setState] = useState<GlassesState>(metaGlasses.getState());
  const [availableDevices, setAvailableDevices] = useState<GlassesDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to state changes from the glasses service
    const unsubscribe = metaGlasses.subscribeToState((newState) => {
      setState(newState);

      // Clear error when successfully connected
      if (newState.status === 'connected') {
        setError(null);
      }
    });

    return unsubscribe;
  }, []);

  const search = useCallback(async () => {
    setError(null);
    try {
      const devices = await metaGlasses.searchForDevices();
      setAvailableDevices(devices);

      if (devices.length === 0) {
        setError('No glasses found. Make sure your glasses are turned on and nearby.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search for glasses';
      setError(message);
      setAvailableDevices([]);
    }
  }, []);

  const connect = useCallback(async (targetDevice: GlassesDevice): Promise<boolean> => {
    setError(null);
    try {
      const success = await metaGlasses.connect(targetDevice);
      if (!success) {
        setError('Failed to connect to glasses. Please try again.');
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await metaGlasses.disconnect();
      setAvailableDevices([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Disconnect failed';
      setError(message);
    }
  }, []);

  return {
    status: state.status,
    device: state.device,
    availableDevices,
    batteryLevel: state.batteryLevel,
    isSearching: state.status === 'searching',
    isConnected: state.isConnected,
    isUsingRealSDK: metaGlasses.isUsingRealSDK(),
    search,
    connect,
    disconnect,
    error,
  };
}
