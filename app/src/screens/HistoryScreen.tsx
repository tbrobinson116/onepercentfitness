import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { ScanSession } from '../types';

interface HistoryScreenProps {
  navigation: any;
}

export function HistoryScreen({ navigation }: HistoryScreenProps) {
  const { scanHistory, clearHistory } = useAppStore();

  const handleItemPress = (item: ScanSession) => {
    if (item.classification && item.duty) {
      navigation.navigate('Results', {
        classification: item.classification,
        duty: item.duty,
        imageUri: item.imageUri,
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const renderItem = ({ item }: { item: ScanSession }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleItemPress(item)}
      disabled={!item.classification}
    >
      {item.imageUri && (
        <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      )}
      <View style={styles.itemContent}>
        {item.classification ? (
          <>
            <Text style={styles.hsCode}>{item.classification.hsCode}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.classification.description}
            </Text>
          </>
        ) : (
          <Text style={styles.noClassification}>Classification pending</Text>
        )}
        <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
      </View>
      {item.duty && (
        <View style={styles.dutyBadge}>
          <Text style={styles.dutyAmount}>
            €{item.duty.totalLandedCost.toFixed(0)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No scans yet</Text>
      <Text style={styles.emptyText}>
        Scan an item to see it appear here
      </Text>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scan')}
      >
        <Text style={styles.scanButtonText}>Start Scanning</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {scanHistory.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {scanHistory.length} {scanHistory.length === 1 ? 'scan' : 'scans'}
          </Text>
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={scanHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          scanHistory.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  clearButton: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  hsCode: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    color: '#000',
    marginBottom: 4,
  },
  noClassification: {
    fontSize: 15,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
  },
  dutyBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  dutyAmount: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
