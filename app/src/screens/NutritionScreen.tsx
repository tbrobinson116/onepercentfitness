import React, { useEffect, useState, useMemo } from 'react';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../services/store';
import { api } from '../services/api';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Card, PressableScale, MacroRing, SectionHeader, EmptyState } from '../components/ui';
import type { Meal, FoodEntry, MacroTotals, MealType } from '../types';

const MEAL_TYPES: { type: MealType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { type: 'lunch', label: 'Lunch', icon: 'partly-sunny-outline' },
  { type: 'dinner', label: 'Dinner', icon: 'moon-outline' },
  { type: 'snack', label: 'Snack', icon: 'cafe-outline' },
  { type: 'pre_workout', label: 'Pre-Workout', icon: 'flash-outline' },
  { type: 'post_workout', label: 'Post-Workout', icon: 'barbell-outline' },
];

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];

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

  // Determine which meal sections to show:
  // meals that have entries + the next empty meal as a suggestion
  const visibleMealTypes = useMemo(() => {
    const filledTypes = new Set(meals.map((m) => m.type));
    const nextEmpty = MEAL_ORDER.find((t) => !filledTypes.has(t));
    const visible = MEAL_TYPES.filter(
      (mt) => filledTypes.has(mt.type) || mt.type === nextEmpty
    );
    return visible;
  }, [meals]);

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

  const tabs = [
    { key: 'today' as const, label: 'Today', icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap },
    { key: 'recipes' as const, label: 'Recipes', icon: 'restaurant-outline' as keyof typeof Ionicons.glyphMap },
    { key: 'fridge' as const, label: 'Fridge', icon: 'snow-outline' as keyof typeof Ionicons.glyphMap },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition</Text>
        <PressableScale
          onPress={() => navigation.navigate('GenerateMealPlan')}
          style={styles.aiBtn}
        >
          <Ionicons name="sparkles-outline" size={16} color={colors.text} />
          <Text style={styles.aiBtnText}>AI Meal Plan</Text>
        </PressableScale>
      </View>

      {/* Tab Pills */}
      <View style={styles.tabs}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.activeTab]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={t.icon}
              size={15}
              color={tab === t.key ? colors.text : colors.textMuted}
              style={{ marginRight: spacing.xs }}
            />
            <Text style={[styles.tabText, tab === t.key && styles.activeTabText]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'today' && (
          <>
            {/* Macro Summary Rings */}
            <Animated.View entering={FadeInDown.duration(400).delay(50)}>
              <Card style={styles.macroCard}>
                <View style={styles.macroRingRow}>
                  <MacroRing
                    label="Calories"
                    current={totals.calories}
                    target={macroTargets.calories}
                    unit=""
                    color={colors.accent}
                    size={72}
                  />
                  <MacroRing
                    label="Protein"
                    current={totals.proteinG}
                    target={macroTargets.proteinG}
                    unit="g"
                    color={colors.secondary}
                    size={72}
                  />
                  <MacroRing
                    label="Carbs"
                    current={totals.carbsG}
                    target={macroTargets.carbsG}
                    unit="g"
                    color={colors.gradientCool}
                    size={72}
                  />
                  <MacroRing
                    label="Fat"
                    current={totals.fatG}
                    target={macroTargets.fatG}
                    unit="g"
                    color={colors.warning}
                    size={72}
                  />
                </View>
              </Card>
            </Animated.View>

            {/* Meal Sections */}
            <SectionHeader title="MEALS" />

            {visibleMealTypes.map((mealType, index) => {
              const meal = meals.find((m) => m.type === mealType.type);
              const hasFoods = meal && meal.foods.length > 0;
              return (
                <Animated.View
                  key={mealType.type}
                  entering={FadeInDown.duration(350).delay(100 + index * 60)}
                >
                  <Card style={hasFoods ? styles.mealCard : styles.mealCardEmpty}>
                    <View style={styles.mealHeader}>
                      <View style={[styles.mealIconWrap, hasFoods && styles.mealIconWrapFilled]}>
                        <Ionicons
                          name={mealType.icon}
                          size={18}
                          color={hasFoods ? colors.accent : colors.textMuted}
                        />
                      </View>
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealLabel}>{mealType.label}</Text>
                        {hasFoods && (
                          <Text style={styles.mealCalories}>{meal.totals.calories} cal</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.addFoodBtn}
                        onPress={() => {
                          setSelectedMealType(mealType.type);
                          setShowAddFood(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
                      </TouchableOpacity>
                    </View>

                    {meal?.foods.map((food, i) => (
                      <View key={i} style={styles.foodRow}>
                        <View style={styles.foodDot} />
                        <View style={styles.foodDetails}>
                          <Text style={styles.foodName}>{food.name}</Text>
                          <Text style={styles.foodMacros}>
                            {food.macros.calories} cal{' '}
                            <Text style={{ color: colors.secondary }}>{food.macros.proteinG}p</Text>
                            {' '}<Text style={{ color: colors.gradientCool }}>{food.macros.carbsG}c</Text>
                            {' '}<Text style={{ color: colors.warning }}>{food.macros.fatG}f</Text>
                          </Text>
                        </View>
                      </View>
                    ))}

                    {!hasFoods && (
                      <Text style={styles.mealSuggestionText}>Tap + to log your {mealType.label.toLowerCase()}</Text>
                    )}
                  </Card>
                </Animated.View>
              );
            })}
          </>
        )}

        {tab === 'recipes' && (
          <>
            {/* Generate Recipe CTA */}
            <Animated.View entering={FadeInDown.duration(400).delay(50)}>
              <Card
                style={styles.generateCard}
                onPress={() => navigation.navigate('FridgeManager')}
              >
                <View style={styles.generateIconWrap}>
                  <Ionicons name="restaurant-outline" size={28} color={colors.accent} />
                </View>
                <Text style={styles.generateTitle}>Generate Recipe from Fridge</Text>
                <Text style={styles.generateDesc}>
                  Tell us what's in your fridge and AI will create a macro-optimized recipe
                </Text>
              </Card>
            </Animated.View>

            {recipes.length === 0 ? (
              <EmptyState
                icon="book-outline"
                title="No recipes yet"
                subtitle="Generate your first recipe above!"
              />
            ) : (
              <>
                <SectionHeader title="YOUR RECIPES" />
                {recipes.map((recipe, index) => (
                  <Animated.View
                    key={recipe.id}
                    entering={FadeInDown.duration(350).delay(100 + index * 60)}
                  >
                    <Card
                      onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
                    >
                      <View style={styles.recipeHeader}>
                        <View style={styles.recipeIconWrap}>
                          <Ionicons name="restaurant-outline" size={18} color={colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recipeName}>{recipe.name}</Text>
                          <Text style={styles.recipeDesc} numberOfLines={2}>
                            {recipe.description}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.recipeMeta}>
                        <View style={styles.recipeMetaItem}>
                          <Ionicons name="time-outline" size={13} color={colors.accent} />
                          <Text style={styles.recipeMetaText}>
                            {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
                          </Text>
                        </View>
                        <View style={styles.recipeMetaDot} />
                        <View style={styles.recipeMetaItem}>
                          <Ionicons name="people-outline" size={13} color={colors.accent} />
                          <Text style={styles.recipeMetaText}>{recipe.servings} servings</Text>
                        </View>
                        <View style={styles.recipeMetaDot} />
                        <View style={styles.recipeMetaItem}>
                          <Ionicons name="fitness-outline" size={13} color={colors.secondary} />
                          <Text style={[styles.recipeMetaText, { color: colors.secondary }]}>
                            {recipe.macrosPerServing.proteinG}g protein
                          </Text>
                        </View>
                      </View>
                      {recipe.tags.length > 0 && (
                        <View style={styles.tagRow}>
                          {recipe.tags.slice(0, 3).map((tag) => (
                            <View key={tag} style={styles.tag}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </Card>
                  </Animated.View>
                ))}
              </>
            )}
          </>
        )}

        {tab === 'fridge' && (
          <>
            <Animated.View entering={FadeInDown.duration(400).delay(50)}>
              <PressableScale
                onPress={() => navigation.navigate('FridgeManager')}
                style={styles.manageFridgeBtn}
              >
                <Ionicons name="snow-outline" size={20} color={colors.accent} />
                <Text style={styles.manageFridgeText}>Manage Fridge Items</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </PressableScale>
            </Animated.View>

            {fridgeItems.length === 0 ? (
              <EmptyState
                icon="nutrition-outline"
                title="Your fridge is empty"
                subtitle="Add items to get recipe recommendations"
                actionLabel="Add Items"
                onAction={() => navigation.navigate('FridgeManager')}
              />
            ) : (
              <>
                <SectionHeader title={`${fridgeItems.length} ITEMS`} />
                {fridgeItems.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.duration(300).delay(80 + index * 40)}
                  >
                    <Card style={styles.fridgeItem}>
                      <View style={styles.fridgeItemLeft}>
                        <Ionicons name="cube-outline" size={18} color={colors.textSecondary} />
                        <Text style={styles.fridgeItemName}>{item.name}</Text>
                      </View>
                      {item.quantity ? (
                        <Text style={styles.fridgeItemQty}>
                          {item.quantity} {item.unit ?? ''}
                        </Text>
                      ) : null}
                    </Card>
                  </Animated.View>
                ))}
              </>
            )}
          </>
        )}

        {/* Bottom spacer */}
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Add Food Modal */}
      <Modal visible={showAddFood} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />

            <View style={styles.modalTitleRow}>
              <Ionicons
                name={MEAL_TYPES.find((t) => t.type === selectedMealType)?.icon ?? 'restaurant-outline'}
                size={22}
                color={colors.accent}
              />
              <Text style={styles.modalTitle}>
                Add to {MEAL_TYPES.find((t) => t.type === selectedMealType)?.label}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Food name"
              placeholderTextColor={colors.textMuted}
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
                  placeholderTextColor={colors.textMuted}
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
                  placeholderTextColor={colors.textMuted}
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
                  placeholderTextColor={colors.textMuted}
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
                  placeholderTextColor={colors.textMuted}
                  value={newFood.fatG}
                  onChangeText={(fatG) => setNewFood({ ...newFood, fatG })}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <PressableScale
                style={styles.cancelButton}
                onPress={() => setShowAddFood(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </PressableScale>
              <PressableScale style={styles.saveButton} onPress={addFoodToMeal}>
                <Ionicons name="add-circle-outline" size={18} color={colors.text} style={{ marginRight: spacing.xs }} />
                <Text style={styles.saveText}>Add Food</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    ...shadows.button,
  },
  aiBtnText: {
    ...typography.captionBold,
    color: colors.text,
  },

  // Tab Pills
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTab: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accentSoft,
  },
  tabText: {
    ...typography.captionBold,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.text,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // Macro Summary Card
  macroCard: {
    paddingVertical: spacing.xl,
  },
  macroRingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },

  // Meal Cards
  mealCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  mealCardEmpty: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    opacity: 0.65,
    borderStyle: 'dashed',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  mealIconWrapFilled: {
    backgroundColor: colors.accentDim,
  },
  mealInfo: {
    flex: 1,
  },
  mealLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  mealCalories: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addFoodBtn: {
    padding: spacing.xs,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginLeft: 18,
    paddingLeft: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  foodDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
    marginRight: spacing.md,
  },
  foodDetails: {
    flex: 1,
  },
  foodName: {
    ...typography.body,
    color: colors.text,
  },
  foodMacros: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mealSuggestionText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginLeft: 48,
  },

  // Generate Recipe Card
  generateCard: {
    alignItems: 'center',
    borderColor: colors.accentSoft,
    borderStyle: 'dashed',
  },
  generateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  generateTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  generateDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Recipe Cards
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recipeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  recipeName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  recipeDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  recipeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaText: {
    ...typography.small,
    color: colors.accent,
  },
  recipeMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
    marginHorizontal: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  tagText: {
    ...typography.small,
    color: colors.accentLight,
  },

  // Fridge
  manageFridgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.cardLight,
  },
  manageFridgeText: {
    ...typography.bodyBold,
    color: colors.accent,
    flex: 1,
  },
  fridgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  fridgeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  fridgeItemName: {
    ...typography.body,
    color: colors.text,
  },
  fridgeItemQty: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xxl,
    paddingTop: spacing.md,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    color: colors.text,
    ...typography.body,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  macroInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroInput: {
    flex: 1,
  },
  macroInputLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  saveText: {
    ...typography.bodyBold,
    color: colors.text,
  },
});
