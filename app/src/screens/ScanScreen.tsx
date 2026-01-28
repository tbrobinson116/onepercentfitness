import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useImageCapture } from '../hooks/useImageCapture';
import { useClassification } from '../hooks/useClassification';
import { useGlassesConnection } from '../hooks/useGlassesConnection';

interface ScanScreenProps {
  navigation: any;
}

export function ScanScreen({ navigation }: ScanScreenProps) {
  const { isConnected } = useGlassesConnection();
  const {
    imageUri,
    imageBase64,
    isCapturing,
    captureFromGlasses,
    pickFromGallery,
    takeWithCamera,
    clearImage,
    error: captureError,
  } = useImageCapture();

  const {
    classification,
    duty,
    isLoading,
    error: classifyError,
    classify,
    reset,
  } = useClassification();

  const [productValue, setProductValue] = useState('');
  const [productName, setProductName] = useState('');

  const handleCapture = async () => {
    if (isConnected) {
      await captureFromGlasses();
    } else {
      // Show options
      Alert.alert(
        'Capture Image',
        'How would you like to get the image?',
        [
          { text: 'Take Photo', onPress: takeWithCamera },
          { text: 'Choose from Gallery', onPress: pickFromGallery },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleClassify = async () => {
    if (!imageBase64) {
      Alert.alert('No Image', 'Please capture or select an image first');
      return;
    }

    const value = parseFloat(productValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Invalid Value', 'Please enter a valid product value');
      return;
    }

    await classify(imageBase64, value, productName || undefined);
  };

  const handleNewScan = () => {
    clearImage();
    reset();
    setProductValue('');
    setProductName('');
  };

  const handleViewResults = () => {
    if (classification && duty) {
      navigation.navigate('Results', { classification, duty, imageUri });
    }
  };

  const error = captureError || classifyError;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Image Preview */}
          <View style={styles.imageContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderIcon}>📷</Text>
                <Text style={styles.placeholderText}>
                  {isConnected
                    ? 'Tap below to capture with your glasses'
                    : 'Tap below to capture or select an image'}
                </Text>
              </View>
            )}
          </View>

          {/* Capture Button */}
          {!imageUri && (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Text style={styles.captureButtonIcon}>
                    {isConnected ? '👓' : '📸'}
                  </Text>
                  <Text style={styles.captureButtonText}>
                    {isConnected ? 'Capture with Glasses' : 'Capture Image'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Product Details Form */}
          {imageUri && !classification && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Product Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product Value (EUR) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 150.00"
                  value={productValue}
                  onChangeText={setProductValue}
                  keyboardType="decimal-pad"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product Name (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Leather sneakers"
                  value={productName}
                  onChangeText={setProductName}
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.classifyButton, isLoading && styles.buttonDisabled]}
                onPress={handleClassify}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContent}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={styles.classifyButtonText}>Classifying...</Text>
                  </View>
                ) : (
                  <Text style={styles.classifyButtonText}>
                    Get Duty Rate
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleNewScan}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Start Over</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Results Preview */}
          {classification && duty && (
            <View style={styles.resultsPreview}>
              <Text style={styles.resultsTitle}>Classification Complete!</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>HS Code</Text>
                <Text style={styles.resultValue}>{classification.hsCode}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Landed Cost</Text>
                <Text style={styles.resultValueLarge}>
                  €{duty.totalLandedCost.toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={handleViewResults}
              >
                <Text style={styles.viewDetailsButtonText}>
                  View Full Breakdown
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.newScanButton}
                onPress={handleNewScan}
              >
                <Text style={styles.newScanButtonText}>Scan Another Item</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleNewScan}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  imageContainer: {
    aspectRatio: 4 / 3,
    backgroundColor: '#E5E5EA',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
  },
  captureButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 14,
    gap: 10,
  },
  captureButtonIcon: {
    fontSize: 24,
  },
  captureButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 14,
    fontSize: 17,
    color: '#000',
  },
  classifyButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  classifyButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 17,
  },
  resultsPreview: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  resultLabel: {
    fontSize: 17,
    color: '#8E8E93',
  },
  resultValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  resultValueLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  viewDetailsButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  viewDetailsButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  newScanButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  newScanButtonText: {
    color: '#007AFF',
    fontSize: 17,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
