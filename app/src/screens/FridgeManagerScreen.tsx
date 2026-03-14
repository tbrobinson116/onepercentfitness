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
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { PressableScale, Card, EmptyState } from '../components/ui';
import type { FridgeItem } from '../types';

const CATEGORIES = ['protein', 'dairy', 'vegetable', 'fruit', 'grain', 'condiment', 'other'] as const;

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  protein: 'fish-outline',
  dairy: 'water-outline',
  vegetable: 'leaf-outline',
  fruit: 'nutrition-outline',
  grain: 'grid-outline',
  condiment: 'flask-outline',
  other: 'cube-outline',
};

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

  const uncategorized = fridgeItems.filter((i) => !i.category || !CATEGORIES.includes(i.category as typeof CATEGORIES[number]));
  if (uncategorized.length) {
    grouped.push({ category: 'other', items: uncategorized });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Ionicons name="snow-outline" size={24} color={colors.accent} />
          <Text style={styles.title}>My Fridge</Text>
        </View>
      </Animated.View>

      {/* Add Item */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.addSection}>
        <TextInput
          style={styles.nameInput}
          placeholder="Add item (e.g., chicken breast)"
          placeholderTextColor={colors.textMuted}
          value={newItem.name}
          onChangeText={(name) => setNewItem({ ...newItem, name })}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <View style={styles.addRow}>
          <TextInput
            style={styles.smallInput}
            placeholder="Qty"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={newItem.quantity}
            onChangeText={(quantity) => setNewItem({ ...newItem, quantity })}
          />
          <TextInput
            style={styles.smallInput}
            placeholder="Unit"
            placeholderTextColor={colors.textMuted}
            value={newItem.unit}
            onChangeText={(unit) => setNewItem({ ...newItem, unit })}
          />
          <PressableScale onPress={addItem} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={colors.text} />
          </PressableScale>
        </View>

        {/* Category selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, newItem.category === cat && styles.categoryActive]}
              onPress={() => setNewItem({ ...newItem, category: cat })}
              activeOpacity={0.7}
            >
              <Ionicons
                name={CATEGORY_ICONS[cat]}
                size={14}
                color={newItem.category === cat ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.categoryText, newItem.category === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Generate Recipe Button */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <PressableScale
          onPress={generateRecipe}
          disabled={generatingRecipe}
          style={[styles.generateBtn, generatingRecipe && { opacity: 0.6 }]}
        >
          {generatingRecipe ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <>
              <View style={styles.generateIcon}>
                <Ionicons name="sparkles" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.generateTitle}>Generate Recipe</Text>
                <Text style={styles.generateDesc}>AI creates a meal from your ingredients</Text>
              </View>
            </>
          )}
        </PressableScale>
      </Animated.View>

      {/* Fridge Contents */}
      {fridgeItems.length === 0 ? (
        <EmptyState
          icon="snow-outline"
          title="Your fridge is empty"
          subtitle="Add items above to get started with AI recipes"
        />
      ) : (
        grouped.map((group, i) => (
          <Animated.View
            key={group.category}
            entering={FadeInDown.delay(300 + i * 100).duration(400)}
            style={styles.groupCard}
          >
            <View style={styles.groupHeader}>
              <Ionicons
                name={CATEGORY_ICONS[group.category] || 'cube-outline'}
                size={16}
                color={colors.accent}
              />
              <Text style={styles.groupTitle}>
                {group.category.charAt(0).toUpperCase() + group.category.slice(1)}
              </Text>
              <Text style={styles.groupCount}>{group.items.length}</Text>
            </View>
            {group.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>
                  {item.quantity ? `${item.quantity} ${item.unit ?? ''}` : ''}
                </Text>
                <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteBtn}>
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </Animated.View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  header: { paddingTop: 44, marginBottom: spacing.lg },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: { ...typography.h1, color: colors.text },

  addSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nameInput: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  smallInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
  },
  categoryRow: { marginTop: spacing.md },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.inputBg,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  categoryText: { ...typography.small, color: colors.textSecondary },
  categoryTextActive: { color: colors.accent, fontWeight: '600' },

  generateBtn: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    gap: spacing.md,
  },
  generateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateTitle: { ...typography.bodyBold, color: colors.text },
  generateDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  groupCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  groupTitle: { ...typography.bodyBold, color: colors.accent, flex: 1 },
  groupCount: {
    ...typography.smallBold,
    color: colors.textMuted,
    backgroundColor: colors.cardLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemName: { ...typography.body, color: colors.text, flex: 1 },
  itemQty: { ...typography.caption, color: colors.textSecondary, marginRight: spacing.sm },
  deleteBtn: { padding: spacing.xs },
});
