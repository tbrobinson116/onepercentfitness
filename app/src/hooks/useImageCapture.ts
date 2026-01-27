import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as glassesService from '../services/glasses';

interface UseImageCaptureReturn {
  imageUri: string | null;
  imageBase64: string | null;
  isCapturing: boolean;
  captureFromGlasses: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  takeWithCamera: () => Promise<void>;
  clearImage: () => void;
  error: string | null;
}

export function useImageCapture(): UseImageCaptureReturn {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureFromGlasses = useCallback(async () => {
    setIsCapturing(true);
    setError(null);
    try {
      const photo = await glassesService.capturePhoto();
      if (photo) {
        setImageUri(photo);
        // In real implementation, convert to base64
        setImageBase64(photo);
      } else {
        // Mock mode - fall back to camera
        await takeWithCamera();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture from glasses');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    setIsCapturing(true);
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Permission to access gallery was denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pick image');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const takeWithCamera = useCallback(async () => {
    setIsCapturing(true);
    setError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Permission to access camera was denied');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    setImageUri(null);
    setImageBase64(null);
    setError(null);
  }, []);

  return {
    imageUri,
    imageBase64,
    isCapturing,
    captureFromGlasses,
    pickFromGallery,
    takeWithCamera,
    clearImage,
    error,
  };
}
