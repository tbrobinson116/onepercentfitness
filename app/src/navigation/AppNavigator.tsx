import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '../theme';

import { HomeScreen } from '../screens/HomeScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { WorkoutsScreen } from '../screens/WorkoutsScreen';
import { ActiveWorkoutScreen } from '../screens/ActiveWorkoutScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { GenerateProgramScreen } from '../screens/GenerateProgramScreen';
import { FridgeManagerScreen } from '../screens/FridgeManagerScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Workouts: '💪',
    Nutrition: '🍽️',
    Goals: '🎯',
    Profile: '👤',
  };
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '📱'}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarLabelStyle: { fontSize: 11 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Workouts" component={WorkoutsScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="ActiveWorkout"
          component={ActiveWorkoutScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="GenerateProgram" component={GenerateProgramScreen} />
        <Stack.Screen name="FridgeManager" component={FridgeManagerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
