import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography } from '../theme';
import type { FridgeItem } from '../types';

const CATEGORIES = ['protein', 'dairy', 'vegetable', 'fruit', 'grain', 'condiment', 'other'] as const;

export function FridgeManagerScreen({ navigation }: any) {
  const { fridgeItems, addFridgeItem, removeFridgeItem, setFridgeItems, addRecipe, macroTargets } = useStore();
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: '', category: 'other' as string });
  const [generatingRecipe, setGeneratingRecipe] = useState(false);

  const addItem = async () => {
    if (!newItem.name.trim()) {
      Alert.alert('Error', 'Enter an item name');
      return;
    }

    const item: Partial<FridgeItem> = {
      name: newItem.name,
      quantity: Number(newItem.quantity) || undefined,
      unit: newItem.unit || undefined,
      category: newItem.category as FridgeItem['category'],
    };

    try {
      const saved = await api.addFridgeItem(item);
      addFridgeItem(saved);
    } catch {
      addFridgeItem({ ...item, id: Date.now().toString() } as FridgeItem);
    }

    setNewItem({ name: '', quantity: '', unit: '', category: 'other' });
  };

  const deleteItem = async (id: string) => {
    try { await api.deleteFridgeItem(id); } catch { /* offline */ }
    removeFridgeItem(id);
  };

  const generateRecipe = async () => {
    if (fridgeItems.length === 0) {
      Alert.alert('Error', 'Add some items to your fridge first');
      return;
    }

    setGeneratingRecipe(true);
    try {
      const recipe = await api.generateRecipe({
        fridgeItems,
        macroTargets: {
          calories: Math.round(macroTargets.calories / 3),
          proteinG: Math.round(macroTargets.proteinG / 3),
        },
      });
      addRecipe(recipe);
      Alert.alert('Recipe Generated!', recipe.name, [
        { text: 'View', onPress: () => navigation.navigate('Nutrition') },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to generate recipe. Make sure the API is running.');
    }
    setGeneratingRecipe(false);
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = fridgeItems.filter((i) => i.category === cat);
    if (items.length) acc.push({ category: cat, items });
    return acc;
  }, [] as { category: string; items: FridgeItem[] }[]);

  // Items without a category
  const uncategorized = fridgeItems.filter((i) => !i.category || !CATEGORIES.includes(i.category as typeof CATEGORIES[number]));
  if (uncategorized.length) {
    grouped.push({ category: 'other', items: uncategorized });
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Fridge</Text>
      </View>

      {/* Add Item */}
      <View style={styles.addSection}>
        <TextInput
          style={styles.nameInput}
          placeholder="Add item (e.g., chicken breast)"
          placeholderTextColor={colors.textSecondary}
          value={newItem.name}
          onChangeText={(name) => setNewItem({ ...newItem, name })}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <View style={styles.addRow}>
          <TextInput
            style={styles.qtyInput}
            placeholder="Qty"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={newItem.quantity}
            onChangeText={(quantity) => setNewItem({ ...newItem, quantity })}
          />
          <TextInput
            style={styles.unitInput}
            placeholder="Unit"
            placeholderTextColor={colors.textSecondary}
            value={newItem.unit}
            onChangeText={(unit) => setNewItem({ ...newItem, unit })}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addItem}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Category selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, newItem.category === cat && styles.categoryActive]}
              onPress={() => setNewItem({ ...newItem, category: cat })}
            >
              <Text style={[styles.categoryText, newItem.category === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Generate Recipe Button */}
      <TouchableOpacity
        style={[styles.generateBtn, generatingRecipe && styles.generateBtnDisabled]}
        onPress={generateRecipe}
        disabled={generatingRecipe}
      >
        {generatingRecipe ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <Text style={styles.generateIcon}>🧑‍🍳</Text>
            <Text style={styles.generateText}>Generate Recipe from These Items</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Fridge Contents */}
      {fridgeItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🧊</Text>
          <Text style={styles.emptyText}>Your fridge is empty</Text>
          <Text style={styles.emptySubtext}>Add items above to get started</Text>
        </View>
      ) : (
        grouped.map((group) => (
          <View key={group.category} style={styles.groupCard}>
            <Text style={styles.groupTitle}>
              {group.category.charAt(0).toUpperCase() + group.category.slice(1)}
            </Text>
            {group.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>
                  {item.quantity ? `${item.quantity} ${item.unit ?? ''}` : ''}
                </Text>
                <TouchableOpacity onPress={() => deleteItem(item.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: { paddingTop: 44, marginBottom: 16 },
  backBtn: { ...typography.body, color: colors.accent, marginBottom: 8 },
  title: { ...typography.h1, color: colors.text },
  addSection: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  nameInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  addRow: { flexDirection: 'row', gap: 8 },
  qtyInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addBtnText: { ...typography.bodyBold, color: colors.text },
  categoryRow: { marginTop: 8 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.inputBg,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryActive: { backgroundColor: colors.accent + '22', borderColor: colors.accent },
  categoryText: { ...typography.small, color: colors.textSecondary },
  categoryTextActive: { color: colors.accent },
  generateBtn: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateIcon: { fontSize: 24, marginRight: 8 },
  generateText: { ...typography.bodyBold, color: colors.accent },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptySubtext: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  groupCard: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8 },
  groupTitle: { ...typography.bodyBold, color: colors.accent, marginBottom: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: { ...typography.body, color: colors.text, flex: 1 },
  itemQty: { ...typography.caption, color: colors.textSecondary, marginRight: 8 },
  deleteBtn: { ...typography.body, color: colors.danger, padding: 4 },
});
