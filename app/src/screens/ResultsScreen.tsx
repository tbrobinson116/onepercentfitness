import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { ClassificationResult, DutyResult } from '../types';

interface ResultsScreenProps {
  route: {
    params: {
      classification: ClassificationResult;
      duty: DutyResult;
      imageUri?: string;
    };
  };
  navigation: any;
}

export function ResultsScreen({ route, navigation }: ResultsScreenProps) {
  const { classification, duty, imageUri } = route.params;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `DutySnap Classification:\n\nHS Code: ${classification.hsCode}\nProduct: ${classification.description}\n\nDuty: ${duty.duties.rate} (€${duty.duties.amount.toFixed(2)})\nVAT: ${duty.vat.rate} (€${duty.vat.amount.toFixed(2)})\n\nTotal Landed Cost: €${duty.totalLandedCost.toFixed(2)}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleNewScan = () => {
    navigation.navigate('Scan');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.productImage} />
        )}

        {/* Classification Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Classification</Text>

          <View style={styles.hsCodeContainer}>
            <Text style={styles.hsCodeLabel}>HS Code</Text>
            <Text style={styles.hsCode}>{classification.hsCode}</Text>
          </View>

          <Text style={styles.description}>{classification.description}</Text>

          {classification.confidence && (
            <View style={styles.confidenceContainer}>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    { width: `${classification.confidence * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>
                {Math.round(classification.confidence * 100)}% confidence
              </Text>
            </View>
          )}
        </View>

        {/* Duty Breakdown Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Duty & Tax Breakdown</Text>

          {duty.breakdown.map((item, index) => (
            <View key={index} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{item.type}</Text>
              <Text style={styles.breakdownValue}>
                €{item.amount.toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Landed Cost</Text>
            <Text style={styles.totalValue}>
              €{duty.totalLandedCost.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Rate Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rate Details</Text>

          <View style={styles.rateRow}>
            <View style={styles.rateItem}>
              <Text style={styles.rateValue}>{duty.duties.rate}</Text>
              <Text style={styles.rateLabel}>Customs Duty</Text>
            </View>
            <View style={styles.rateDivider} />
            <View style={styles.rateItem}>
              <Text style={styles.rateValue}>{duty.vat.rate}</Text>
              <Text style={styles.rateLabel}>VAT</Text>
            </View>
          </View>

          <Text style={styles.rateNote}>
            Rates based on import to France from origin country
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>Share Results</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.newScanButton} onPress={handleNewScan}>
            <Text style={styles.newScanButtonText}>Scan Another Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 20,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  hsCodeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 16,
  },
  hsCodeLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  hsCode: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  description: {
    fontSize: 17,
    color: '#000',
    lineHeight: 24,
  },
  confidenceContainer: {
    marginTop: 16,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  breakdownLabel: {
    fontSize: 17,
    color: '#000',
  },
  breakdownValue: {
    fontSize: 17,
    color: '#000',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  rateItem: {
    flex: 1,
    alignItems: 'center',
  },
  rateDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E5E5EA',
  },
  rateValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  rateLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  rateNote: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
  },
  actions: {
    marginTop: 8,
    gap: 12,
  },
  shareButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  newScanButton: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  newScanButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
