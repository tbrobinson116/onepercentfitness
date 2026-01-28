import { GlassesConnectionStatus, GlassesDevice } from '../types';

// Mock implementation for glasses connection
// In production, this would use the Meta Wearables SDK

let mockConnectionStatus: GlassesConnectionStatus = 'disconnected';
let mockDevice: GlassesDevice | null = null;

const MOCK_DEVICE: GlassesDevice = {
  id: 'mock-device-001',
  name: 'Ray-Ban Meta (Mock)',
  model: 'mock',
  batteryLevel: 85,
};

type StatusListener = (status: GlassesConnectionStatus) => void;
const statusListeners: StatusListener[] = [];

export function addStatusListener(listener: StatusListener): () => void {
  statusListeners.push(listener);
  return () => {
    const index = statusListeners.indexOf(listener);
    if (index > -1) statusListeners.splice(index, 1);
  };
}

function notifyStatusChange(status: GlassesConnectionStatus): void {
  mockConnectionStatus = status;
  statusListeners.forEach(listener => listener(status));
}

export async function searchForGlasses(): Promise<GlassesDevice[]> {
  notifyStatusChange('searching');

  // Simulate search delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  notifyStatusChange('disconnected');

  // Return mock device for testing
  return [MOCK_DEVICE];
}

export async function connectToGlasses(device: GlassesDevice): Promise<boolean> {
  notifyStatusChange('connecting');

  // Simulate connection delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  mockDevice = device;
  notifyStatusChange('connected');

  return true;
}

export async function disconnectGlasses(): Promise<void> {
  mockDevice = null;
  notifyStatusChange('disconnected');
}

export function getConnectionStatus(): GlassesConnectionStatus {
  return mockConnectionStatus;
}

export function getConnectedDevice(): GlassesDevice | null {
  return mockDevice;
}

export async function capturePhoto(): Promise<string | null> {
  if (mockConnectionStatus !== 'connected') {
    throw new Error('Glasses not connected');
  }

  // In mock mode, we return null to signal that we should use the image picker
  // In production with real glasses, this would capture from the glasses camera
  return null;
}

export function isConnected(): boolean {
  return mockConnectionStatus === 'connected';
}
