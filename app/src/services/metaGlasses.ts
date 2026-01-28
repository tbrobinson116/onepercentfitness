/**
 * Meta Ray-Ban Glasses SDK Integration
 *
 * This service provides integration with the Meta Wearables Device Access Toolkit.
 * It supports both real glasses connection and mock mode for development.
 *
 * Real SDK setup requires:
 * - iOS: CocoaPods with meta-wearables-dat-ios
 * - Android: Gradle dependency meta-wearables-dat-android
 *
 * @see https://developers.meta.com/wearables/
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// Types for glasses interaction
export type ConnectionStatus =
  | 'disconnected'
  | 'searching'
  | 'connecting'
  | 'connected'
  | 'error';

export interface GlassesDevice {
  id: string;
  name: string;
  model: 'rayban-meta-gen1' | 'rayban-meta-gen2' | 'oakley-hstn' | 'mock';
  batteryLevel: number;
  firmwareVersion?: string;
}

export interface CaptureResult {
  success: boolean;
  imageBase64?: string;
  timestamp: Date;
  error?: string;
}

export interface GlassesState {
  isConnected: boolean;
  device: GlassesDevice | null;
  batteryLevel: number;
  status: ConnectionStatus;
}

// Check if native module is available
const MetaGlassesModule = NativeModules.MetaGlassesModule;
const hasNativeModule = !!MetaGlassesModule;

// Event emitter for native events
let eventEmitter: NativeEventEmitter | null = null;
if (hasNativeModule) {
  eventEmitter = new NativeEventEmitter(MetaGlassesModule);
}

// State management
let currentState: GlassesState = {
  isConnected: false,
  device: null,
  batteryLevel: 0,
  status: 'disconnected',
};

type StateListener = (state: GlassesState) => void;
const stateListeners: Set<StateListener> = new Set();

function notifyStateChange(newState: Partial<GlassesState>) {
  currentState = { ...currentState, ...newState };
  stateListeners.forEach(listener => listener(currentState));
}

/**
 * Subscribe to glasses state changes
 */
export function subscribeToState(listener: StateListener): () => void {
  stateListeners.add(listener);
  // Immediately notify with current state
  listener(currentState);
  return () => stateListeners.delete(listener);
}

/**
 * Get current glasses state
 */
export function getState(): GlassesState {
  return currentState;
}

/**
 * Check if using real SDK or mock mode
 */
export function isUsingRealSDK(): boolean {
  return hasNativeModule;
}

/**
 * Initialize the glasses service
 * Sets up native event listeners if SDK is available
 */
export function initialize(): void {
  if (hasNativeModule && eventEmitter) {
    // Listen for native SDK events
    eventEmitter.addListener('onConnectionStatusChanged', (status: ConnectionStatus) => {
      notifyStateChange({ status, isConnected: status === 'connected' });
    });

    eventEmitter.addListener('onDeviceConnected', (device: GlassesDevice) => {
      notifyStateChange({
        device,
        isConnected: true,
        status: 'connected',
        batteryLevel: device.batteryLevel,
      });
    });

    eventEmitter.addListener('onDeviceDisconnected', () => {
      notifyStateChange({
        device: null,
        isConnected: false,
        status: 'disconnected',
        batteryLevel: 0,
      });
    });

    eventEmitter.addListener('onBatteryLevelChanged', (level: number) => {
      notifyStateChange({ batteryLevel: level });
    });

    eventEmitter.addListener('onError', (error: { message: string }) => {
      console.error('Meta Glasses Error:', error.message);
      notifyStateChange({ status: 'error' });
    });

    console.log('Meta Glasses SDK initialized (native mode)');
  } else {
    console.log('Meta Glasses SDK initialized (mock mode)');
  }
}

/**
 * Search for available glasses devices
 */
export async function searchForDevices(): Promise<GlassesDevice[]> {
  notifyStateChange({ status: 'searching' });

  if (hasNativeModule) {
    try {
      const devices = await MetaGlassesModule.searchForDevices();
      notifyStateChange({ status: 'disconnected' });
      return devices;
    } catch (error) {
      console.error('Search error:', error);
      notifyStateChange({ status: 'error' });
      return [];
    }
  }

  // Mock mode: simulate search delay and return mock device
  await new Promise(resolve => setTimeout(resolve, 2000));
  notifyStateChange({ status: 'disconnected' });

  return [
    {
      id: 'mock-rayban-001',
      name: 'Ray-Ban Meta (Mock)',
      model: 'mock',
      batteryLevel: 85,
    },
  ];
}

/**
 * Connect to a glasses device
 */
export async function connect(device: GlassesDevice): Promise<boolean> {
  notifyStateChange({ status: 'connecting' });

  if (hasNativeModule) {
    try {
      const success = await MetaGlassesModule.connect(device.id);
      if (success) {
        notifyStateChange({
          device,
          isConnected: true,
          status: 'connected',
          batteryLevel: device.batteryLevel,
        });
      } else {
        notifyStateChange({ status: 'error' });
      }
      return success;
    } catch (error) {
      console.error('Connection error:', error);
      notifyStateChange({ status: 'error' });
      return false;
    }
  }

  // Mock mode: simulate connection delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  notifyStateChange({
    device,
    isConnected: true,
    status: 'connected',
    batteryLevel: device.batteryLevel,
  });
  return true;
}

/**
 * Disconnect from current glasses
 */
export async function disconnect(): Promise<void> {
  if (hasNativeModule) {
    try {
      await MetaGlassesModule.disconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  notifyStateChange({
    device: null,
    isConnected: false,
    status: 'disconnected',
    batteryLevel: 0,
  });
}

/**
 * Capture a photo using the glasses camera
 *
 * In mock mode, returns null to signal that the app should use
 * the device camera or image picker instead.
 */
export async function capturePhoto(): Promise<CaptureResult> {
  if (!currentState.isConnected) {
    return {
      success: false,
      timestamp: new Date(),
      error: 'Glasses not connected',
    };
  }

  if (hasNativeModule) {
    try {
      const imageBase64 = await MetaGlassesModule.capturePhoto({
        format: 'jpeg',
        quality: 0.85,
      });

      return {
        success: true,
        imageBase64,
        timestamp: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Capture failed';
      return {
        success: false,
        timestamp: new Date(),
        error: message,
      };
    }
  }

  // Mock mode: signal that we should use fallback capture
  return {
    success: false,
    timestamp: new Date(),
    error: 'MOCK_MODE_USE_FALLBACK',
  };
}

/**
 * Request the glasses to capture and immediately process
 * This is useful for "look and scan" workflow
 */
export async function captureAndProcess(
  onImageCaptured: (imageBase64: string) => void
): Promise<void> {
  const result = await capturePhoto();

  if (result.success && result.imageBase64) {
    onImageCaptured(result.imageBase64);
  } else if (result.error === 'MOCK_MODE_USE_FALLBACK') {
    // Signal to use camera/gallery
    throw new Error('USE_FALLBACK_CAPTURE');
  } else {
    throw new Error(result.error || 'Capture failed');
  }
}

/**
 * Enable voice trigger for capture
 * Allows user to say "scan this" or similar to trigger capture
 */
export async function enableVoiceTrigger(
  onTriggered: () => void
): Promise<() => void> {
  if (hasNativeModule) {
    const subscription = eventEmitter?.addListener('onVoiceTrigger', () => {
      onTriggered();
    });

    await MetaGlassesModule.enableVoiceTrigger(['scan this', 'classify this', 'what is this']);

    return () => {
      subscription?.remove();
      MetaGlassesModule.disableVoiceTrigger();
    };
  }

  // Mock mode: no voice trigger support
  console.log('Voice trigger not available in mock mode');
  return () => {};
}

/**
 * Get glasses battery level
 */
export async function getBatteryLevel(): Promise<number> {
  if (hasNativeModule && currentState.isConnected) {
    try {
      const level = await MetaGlassesModule.getBatteryLevel();
      notifyStateChange({ batteryLevel: level });
      return level;
    } catch (error) {
      console.error('Battery check error:', error);
    }
  }

  return currentState.batteryLevel;
}

// Auto-initialize on import
initialize();
