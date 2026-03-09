import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography } from '../theme';
import type { Meal, FoodEntry, MacroTotals, MealType } from '../types';

const MEAL_TYPES: { type: MealType; label: string; icon: string }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { type: 'lunch', label: 'Lunch', icon: '☀️' },
  { type: 'dinner', label: 'Dinner', icon: '🌙' },
  { type: 'snack', label: 'Snack', icon: '🍎' },
  { type: 'pre_workout', label: 'Pre-Workout', icon: '⚡' },
  { type: 'post_workout', label: 'Post-Workout', icon: '💪' },
];

export function NutritionScreen({ navigation }: any) {
  const {
    todayNutrition,
    macroTargets,
    setTodayNutrition,
    fridgeItems,
    setFridgeItems,
    recipes,
    setRecipes,
  } = useStore();
  const [tab, setTab] = useState<'today' | 'recipes' | 'fridge'>('today');
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [newFood, setNewFood] = useState({
    name: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    servingSize: '1',
    servingUnit: 'serving',
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [nutrition, fridgeData, recipesData] = await Promise.all([
        api.getNutritionDay(today),
        api.getFridgeItems(),
        api.getRecipes(),
      ]);
      setTodayNutrition(nutrition);
      setFridgeItems(fridgeData);
      setRecipes(recipesData);
    } catch { /* offline */ }
  };

  const totals = todayNutrition?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  const meals = todayNutrition?.meals ?? [];

  const macroPercent = (current: number, target: number) =>
    Math.min(Math.round((current / target) * 100), 100);

  const addFoodToMeal = async () => {
    if (!newFood.name.trim()) {
      Alert.alert('Error', 'Enter a food name');
      return;
    }

    const food: FoodEntry = {
      id: Date.now().toString(),
      name: newFood.name,
      servingSize: Number(newFood.servingSize) || 1,
      servingUnit: newFood.servingUnit,
      quantity: 1,
      macros: {
        calories: Number(newFood.calories) || 0,
        proteinG: Number(newFood.proteinG) || 0,
        carbsG: Number(newFood.carbsG) || 0,
        fatG: Number(newFood.fatG) || 0,
        fiberG: 0,
      },
    };

    const existingMealIndex = meals.findIndex((m) => m.type === selectedMealType);
    let updatedMeals: Meal[];

    if (existingMealIndex >= 0) {
      updatedMeals = meals.map((m, i) => {
        if (i !== existingMealIndex) return m;
        const foods = [...m.foods, food];
        return {
          ...m,
          foods,
          totals: sumMacros(foods.map((f) => f.macros)),
        };
      });
    } else {
      updatedMeals = [
        ...meals,
        {
          id: Date.now().toString(),
          type: selectedMealType,
          name: MEAL_TYPES.find((t) => t.type === selectedMealType)?.label,
          foods: [food],
          totals: food.macros,
        },
      ];
    }

    const allFoods = updatedMeals.flatMap((m) => m.foods);
    const newTotals = sumMacros(allFoods.map((f) => f.macros));

    const updated = {
      ...todayNutrition,
      id: todayNutrition?.id ?? Date.now().toString(),
      date: today,
      meals: updatedMeals,
      totals: newTotals,
      waterMl: todayNutrition?.waterMl ?? 0,
      targets: macroTargets,
    };

    setTodayNutrition(updated);
    try { await api.saveNutritionDay(updated); } catch { /* offline */ }

    setShowAddFood(false);
    setNewFood({ name: '', calories: '', proteinG: '', carbsG: '', fatG: '', servingSize: '1', servingUnit: 'serving' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition</Text>
        <TouchableOpacity
          style={styles.aiBtn}
          onPress={() => navigation.navigate('GenerateMealPlan')}
        >
          <Text style={styles.aiBtnText}>✨ AI Meal Plan</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['today', 'recipes', 'fridge'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.activeTab]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {tab === 'today' && (
          <>
            {/* Macro Summary Ring */}
            <View style={styles.macroCard}>
              <View style={styles.macroMain}>
                <Text style={styles.calorieValue}>{totals.calories}</Text>
                <Text style={styles.calorieLabel}>/ {macroTargets.calories} cal</Text>
              </View>
              <View style={styles.macroRow}>
                <MacroBar
                  label="Protein"
                  current={totals.proteinG}
                  target={macroTargets.proteinG}
                  unit="g"
                  color={colors.accent}
                />
                <MacroBar
                  label="Carbs"
                  current={totals.carbsG}
                  target={macroTargets.carbsG}
                  unit="g"
                  color={colors.secondary}
                />
                <MacroBar
                  label="Fat"
                  current={totals.fatG}
                  target={macroTargets.fatG}
                  unit="g"
                  color={colors.warning}
                />
              </View>
            </View>

            {/* Meals */}
            {MEAL_TYPES.map((mealType) => {
              const meal = meals.find((m) => m.type === mealType.type);
              return (
                <View key={mealType.type} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealIcon}>{mealType.icon}</Text>
                    <Text style={styles.mealLabel}>{mealType.label}</Text>
                    {meal && (
                      <Text style={styles.mealCalories}>{meal.totals.calories} cal</Text>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedMealType(mealType.type);
                        setShowAddFood(true);
                      }}
                    >
                      <Text style={styles.addFoodBtn}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                  {meal?.foods.map((food, i) => (
                    <View key={i} style={styles.foodRow}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      <Text style={styles.foodMacros}>
                        {food.macros.calories} cal · {food.macros.proteinG}p · {food.macros.carbsG}c · {food.macros.fatG}f
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </>
        )}

        {tab === 'recipes' && (
          <>
            <TouchableOpacity
              style={styles.generateRecipeCard}
              onPress={() => navigation.navigate('FridgeManager')}
            >
              <Text style={styles.generateIcon}>🧑‍🍳</Text>
              <Text style={styles.generateTitle}>Generate Recipe from Fridge</Text>
              <Text style={styles.generateDesc}>
                Tell us what's in your fridge and AI will create a macro-optimized recipe
              </Text>
            </TouchableOpacity>

            {recipes.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No recipes yet</Text>
                <Text style={styles.emptySubtext}>Generate your first recipe above!</Text>
              </View>
            ) : (
              recipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
                >
                  <Text style={styles.recipeName}>{recipe.name}</Text>
                  <Text style={styles.recipeDesc}>{recipe.description}</Text>
                  <View style={styles.recipeMeta}>
                    <Text style={styles.recipeMetaText}>
                      {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
                    </Text>
                    <Text style={styles.recipeMetaDot}>·</Text>
                    <Text style={styles.recipeMetaText}>{recipe.servings} servings</Text>
                    <Text style={styles.recipeMetaDot}>·</Text>
                    <Text style={styles.recipeMetaText}>
                      {recipe.macrosPerServing.proteinG}g protein
                    </Text>
                  </View>
                  <View style={styles.tagRow}>
                    {recipe.tags.slice(0, 3).map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {tab === 'fridge' && (
          <>
            <TouchableOpacity
              style={styles.manageFridgeBtn}
              onPress={() => navigation.navigate('FridgeManager')}
            >
              <Text style={styles.manageFridgeText}>🧊 Manage Fridge Items</Text>
            </TouchableOpacity>

            {fridgeItems.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Your fridge is empty</Text>
                <Text style={styles.emptySubtext}>Add items to get recipe recommendations</Text>
              </View>
            ) : (
              fridgeItems.map((item) => (
                <View key={item.id} style={styles.fridgeItem}>
                  <Text style={styles.fridgeItemName}>{item.name}</Text>
                  <Text style={styles.fridgeItemQty}>
                    {item.quantity ? `${item.quantity} ${item.unit ?? ''}` : ''}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Add Food Modal */}
      <Modal visible={showAddFood} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Add to {MEAL_TYPES.find((t) => t.type === selectedMealType)?.label}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Food name"
              placeholderTextColor={colors.textSecondary}
              value={newFood.name}
              onChangeText={(name) => setNewFood({ ...newFood, name })}
            />

            <View style={styles.macroInputRow}>
              <View style={styles.macroInput}>
                <Text style={styles.macroInputLabel}>Calories</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={newFood.calories}
                  onChangeText={(calories) => setNewFood({ ...newFood, calories })}
                />
              </View>
              <View style={styles.macroInput}>
                <Text style={styles.macroInputLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={newFood.proteinG}
                  onChangeText={(proteinG) => setNewFood({ ...newFood, proteinG })}
                />
              </View>
            </View>

            <View style={styles.macroInputRow}>
              <View style={styles.macroInput}>
                <Text style={styles.macroInputLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={newFood.carbsG}
                  onChangeText={(carbsG) => setNewFood({ ...newFood, carbsG })}
                />
              </View>
              <View style={styles.macroInput}>
                <Text style={styles.macroInputLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={newFood.fatG}
                  onChangeText={(fatG) => setNewFood({ ...newFood, fatG })}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddFood(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={addFoodToMeal}>
                <Text style={styles.saveText}>Add Food</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MacroBar({
  label,
  current,
  target,
  unit,
  color,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <View style={macroStyles.container}>
      <Text style={macroStyles.label}>{label}</Text>
      <View style={macroStyles.bar}>
        <View style={[macroStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={macroStyles.value}>
        {current}/{target}{unit}
      </Text>
    </View>
  );
}

function sumMacros(macros: MacroTotals[]): MacroTotals {
  return macros.reduce(
    (sum, m) => ({
      calories: sum.calories + m.calories,
      proteinG: sum.proteinG + m.proteinG,
      carbsG: sum.carbsG + m.carbsG,
      fatG: sum.fatG + m.fatG,
      fiberG: sum.fiberG + m.fiberG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  );
}

const macroStyles = StyleSheet.create({
  container: { flex: 1, marginHorizontal: 4 },
  label: { ...typography.small, color: colors.textSecondary, marginBottom: 4, textAlign: 'center' },
  bar: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  value: { ...typography.small, color: colors.text, marginTop: 4, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  title: { ...typography.h1, color: colors.text },
  aiBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  aiBtnText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTab: { backgroundColor: colors.accent },
  tabText: { ...typography.body, color: colors.textSecondary },
  activeTabText: { color: colors.text, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  macroCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  macroMain: { alignItems: 'center', marginBottom: 16 },
  calorieValue: { ...typography.h1, color: colors.text, fontSize: 36 },
  calorieLabel: { ...typography.body, color: colors.textSecondary },
  macroRow: { flexDirection: 'row' },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: { fontSize: 20, marginRight: 8 },
  mealLabel: { ...typography.bodyBold, color: colors.text, flex: 1 },
  mealCalories: { ...typography.caption, color: colors.textSecondary, marginRight: 8 },
  addFoodBtn: { ...typography.body, color: colors.accent },
  foodRow: {
    paddingVertical: 6,
    paddingLeft: 28,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  foodName: { ...typography.body, color: colors.text },
  foodMacros: { ...typography.small, color: colors.textSecondary },
  generateRecipeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  generateIcon: { fontSize: 40, marginBottom: 8 },
  generateTitle: { ...typography.h3, color: colors.text },
  generateDesc: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  recipeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  recipeName: { ...typography.bodyBold, color: colors.text },
  recipeDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  recipeMeta: { flexDirection: 'row', marginTop: 8 },
  recipeMetaText: { ...typography.small, color: colors.accent },
  recipeMetaDot: { ...typography.small, color: colors.textSecondary, marginHorizontal: 4 },
  tagRow: { flexDirection: 'row', marginTop: 8 },
  tag: {
    backgroundColor: colors.accent + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  tagText: { ...typography.small, color: colors.accent },
  manageFridgeBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  manageFridgeText: { ...typography.bodyBold, color: colors.accent },
  fridgeItem: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fridgeItemName: { ...typography.body, color: colors.text },
  fridgeItemQty: { ...typography.caption, color: colors.textSecondary },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptySubtext: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: { ...typography.h2, color: colors.text, marginBottom: 16 },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    ...typography.body,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  macroInputRow: { flexDirection: 'row', gap: 8 },
  macroInput: { flex: 1 },
  macroInputLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  modalActions: { flexDirection: 'row', marginTop: 8, gap: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
  },
  cancelBtnText: { ...typography.bodyBold, color: colors.textSecondary },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  saveText: { ...typography.bodyBold, color: colors.text },
});
