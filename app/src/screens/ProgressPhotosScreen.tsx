import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography } from '../theme';
import { useStore } from '../services/store';
import type { ProgressPhoto, PhotoPose } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - 48 - 12) / 3; // 3 columns with gaps

const POSES: { key: PhotoPose; label: string; icon: string }[] = [
  { key: 'front', label: 'Front', icon: 'person' },
  { key: 'side', label: 'Side', icon: 'person-outline' },
  { key: 'back', label: 'Back', icon: 'body' },
  { key: 'custom', label: 'Other', icon: 'camera' },
];

export function ProgressPhotosScreen({ navigation }: any) {
  const progressPhotos = useStore((s) => s.progressPhotos);
  const addProgressPhoto = useStore((s) => s.addProgressPhoto);
  const removeProgressPhoto = useStore((s) => s.removeProgressPhoto);
  const measurements = useStore((s) => s.measurements);
  const [selectedPose, setSelectedPose] = useState<PhotoPose | 'all'>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [viewingPhoto, setViewingPhoto] = useState<ProgressPhoto | null>(null);

  const filteredPhotos = selectedPose === 'all'
    ? progressPhotos
    : progressPhotos.filter((p) => p.pose === selectedPose);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take progress photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      promptForDetails(result.assets[0].uri);
    }
  }, []);

  const pickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      promptForDetails(result.assets[0].uri);
    }
  }, []);

  const promptForDetails = (uri: string) => {
    Alert.alert('Photo Pose', 'What pose is this photo?', [
      ...POSES.map((pose) => ({
        text: pose.label,
        onPress: () => {
          const latestMeasurement = measurements[0];
          const photo: ProgressPhoto = {
            id: `photo-${Date.now()}`,
            uri,
            date: new Date().toISOString().split('T')[0],
            pose: pose.key,
            bodyWeight: latestMeasurement?.weightKg,
            bodyFatPercent: latestMeasurement?.bodyFatPercent,
          };
          addProgressPhoto(photo);
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePhotoPress = (photo: ProgressPhoto) => {
    if (compareMode) {
      setSelectedPhotos((prev) => {
        if (prev.includes(photo.id)) return prev.filter((id) => id !== photo.id);
        if (prev.length >= 2) return [prev[1], photo.id];
        return [...prev, photo.id];
      });
    } else {
      setViewingPhoto(photo);
    }
  };

  const handleDelete = (photo: ProgressPhoto) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this progress photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeProgressPhoto(photo.id);
          setViewingPhoto(null);
        },
      },
    ]);
  };

  const comparePhotos = selectedPhotos.length === 2
    ? selectedPhotos.map((id) => progressPhotos.find((p) => p.id === id)!).filter(Boolean)
    : [];

  // Full-screen photo viewer
  if (viewingPhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.viewerHeader}>
          <TouchableOpacity onPress={() => setViewingPhoto(null)}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.viewerDate}>{viewingPhoto.date}</Text>
          <TouchableOpacity onPress={() => handleDelete(viewingPhoto)}>
            <Ionicons name="trash-outline" size={24} color={colors.danger} />
          </TouchableOpacity>
        </View>
        <Image source={{ uri: viewingPhoto.uri }} style={styles.fullImage} resizeMode="contain" />
        <View style={styles.viewerInfo}>
          <View style={styles.viewerBadge}>
            <Text style={styles.viewerBadgeText}>{viewingPhoto.pose}</Text>
          </View>
          {viewingPhoto.bodyWeight != null && (
            <Text style={styles.viewerStat}>
              {viewingPhoto.bodyWeight.toFixed(1)} kg
            </Text>
          )}
          {viewingPhoto.bodyFatPercent != null && (
            <Text style={styles.viewerStat}>
              {viewingPhoto.bodyFatPercent.toFixed(1)}% BF
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Compare mode view
  if (compareMode && comparePhotos.length === 2) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setCompareMode(false); setSelectedPhotos([]); }}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Compare</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.compareContainer}>
          {comparePhotos.map((photo, idx) => (
            <View key={photo.id} style={styles.compareItem}>
              <Image source={{ uri: photo.uri }} style={styles.compareImage} resizeMode="cover" />
              <Text style={styles.compareDate}>{photo.date}</Text>
              {photo.bodyWeight != null && (
                <Text style={styles.compareStat}>{photo.bodyWeight.toFixed(1)} kg</Text>
              )}
            </View>
          ))}
        </View>
        {comparePhotos[0].bodyWeight != null && comparePhotos[1].bodyWeight != null && (
          <View style={styles.compareDiff}>
            <Text style={styles.compareDiffText}>
              Weight change: {(comparePhotos[1].bodyWeight! - comparePhotos[0].bodyWeight!).toFixed(1)} kg
            </Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Progress Photos</Text>
        <TouchableOpacity onPress={() => { setCompareMode(!compareMode); setSelectedPhotos([]); }}>
          <Ionicons
            name={compareMode ? 'close' : 'git-compare-outline'}
            size={24}
            color={compareMode ? colors.danger : colors.accent}
          />
        </TouchableOpacity>
      </View>

      {/* Pose filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, selectedPose === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedPose('all')}
        >
          <Text style={[styles.filterText, selectedPose === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {POSES.map((pose) => (
          <TouchableOpacity
            key={pose.key}
            style={[styles.filterChip, selectedPose === pose.key && styles.filterChipActive]}
            onPress={() => setSelectedPose(pose.key)}
          >
            <Text style={[styles.filterText, selectedPose === pose.key && styles.filterTextActive]}>
              {pose.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {compareMode && (
        <View style={styles.compareHint}>
          <Ionicons name="information-circle" size={16} color={colors.accent} />
          <Text style={styles.compareHintText}>
            Select 2 photos to compare ({selectedPhotos.length}/2)
          </Text>
        </View>
      )}

      {filteredPhotos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No progress photos yet</Text>
          <Text style={styles.emptySubtitle}>
            Take photos regularly to track your transformation
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPhotos}
          numColumns={3}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.photoCard,
                compareMode && selectedPhotos.includes(item.id) && styles.photoCardSelected,
              ]}
              onPress={() => handlePhotoPress(item)}
              onLongPress={() => handleDelete(item)}
            >
              <Image source={{ uri: item.uri }} style={styles.photoImage} resizeMode="cover" />
              <View style={styles.photoOverlay}>
                <Text style={styles.photoDate}>{item.date.slice(5)}</Text>
              </View>
              {compareMode && selectedPhotos.includes(item.id) && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add photo buttons */}
      <View style={styles.addButtons}>
        <TouchableOpacity style={styles.addButton} onPress={takePhoto}>
          <Ionicons name="camera" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.addButton, styles.addButtonSecondary]} onPress={pickPhoto}>
          <Ionicons name="images" size={24} color={colors.accent} />
          <Text style={[styles.addButtonText, { color: colors.accent }]}>Gallery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { ...typography.title, color: colors.text },
  filterRow: { paddingHorizontal: 16, marginBottom: 8, flexGrow: 0 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  filterText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  filterTextActive: { color: colors.accent },
  compareHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  compareHintText: { color: colors.accent, fontSize: 13 },
  grid: { paddingHorizontal: 16, paddingBottom: 100 },
  gridRow: { gap: 6, marginBottom: 6 },
  photoCard: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.33,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  photoCardSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  photoImage: { width: '100%', height: '100%' },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  photoDate: { color: '#fff', fontSize: 11, fontWeight: '600' },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  addButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonSecondary: {
    backgroundColor: colors.accentDim,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Viewer
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  viewerDate: { ...typography.subtitle, color: colors.text },
  fullImage: { flex: 1, width: '100%' },
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  viewerBadge: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewerBadgeText: { color: colors.accent, fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  viewerStat: { color: colors.textSecondary, fontSize: 14 },
  // Compare
  compareContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 4,
  },
  compareItem: { flex: 1, alignItems: 'center' },
  compareImage: { width: '100%', height: '100%', borderRadius: 8 },
  compareDate: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 8 },
  compareStat: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  compareDiff: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  compareDiffText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
});
