import { useState, useEffect, useCallback } from 'react';
import { GlassesConnectionStatus, GlassesDevice } from '../types';
import * as glassesService from '../services/glasses';

interface UseGlassesConnectionReturn {
  status: GlassesConnectionStatus;
  device: GlassesDevice | null;
  availableDevices: GlassesDevice[];
  isSearching: boolean;
  isConnected: boolean;
  search: () => Promise<void>;
  connect: (device: GlassesDevice) => Promise<boolean>;
  disconnect: () => Promise<void>;
  error: string | null;
}

export function useGlassesConnection(): UseGlassesConnectionReturn {
  const [status, setStatus] = useState<GlassesConnectionStatus>('disconnected');
  const [device, setDevice] = useState<GlassesDevice | null>(null);
  const [availableDevices, setAvailableDevices] = useState<GlassesDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = glassesService.addStatusListener((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'connected') {
        setDevice(glassesService.getConnectedDevice());
      } else if (newStatus === 'disconnected') {
        setDevice(null);
      }
    });

    // Get initial status
    setStatus(glassesService.getConnectionStatus());
    setDevice(glassesService.getConnectedDevice());

    return unsubscribe;
  }, []);

  const search = useCallback(async () => {
    setError(null);
    try {
      const devices = await glassesService.searchForGlasses();
      setAvailableDevices(devices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search for glasses');
    }
  }, []);

  const connect = useCallback(async (targetDevice: GlassesDevice): Promise<boolean> => {
    setError(null);
    try {
      const success = await glassesService.connectToGlasses(targetDevice);
      if (success) {
        setDevice(targetDevice);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    await glassesService.disconnectGlasses();
    setDevice(null);
  }, []);

  return {
    status,
    device,
    availableDevices,
    isSearching: status === 'searching',
    isConnected: status === 'connected',
    search,
    connect,
    disconnect,
    error,
  };
}
