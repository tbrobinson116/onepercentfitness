const API_BASE = 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Profile & Measurements
  getProfile: () => request<any>('/profile'),
  updateProfile: (data: any) => request<any>('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getMeasurements: () => request<any[]>('/profile/measurements'),
  addMeasurement: (data: any) => request<any>('/profile/measurements', { method: 'POST', body: JSON.stringify(data) }),
  deleteMeasurement: (id: string) => request<void>(`/profile/measurements/${id}`, { method: 'DELETE' }),
  getBloodWork: () => request<any[]>('/profile/blood-work'),
  addBloodWork: (data: any) => request<any>('/profile/blood-work', { method: 'POST', body: JSON.stringify(data) }),

  // Goals
  getGoals: () => request<any[]>('/goals'),
  createGoal: (data: any) => request<any>('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id: string, data: any) => request<any>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGoal: (id: string) => request<void>(`/goals/${id}`, { method: 'DELETE' }),

  // Workouts
  getWorkouts: () => request<any[]>('/workouts'),
  getWorkout: (id: string) => request<any>(`/workouts/${id}`),
  saveWorkout: (data: any) => request<any>('/workouts', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkout: (id: string, data: any) => request<any>(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorkout: (id: string) => request<void>(`/workouts/${id}`, { method: 'DELETE' }),

  // Workout Programs (AI)
  generateProgram: (data: any) => request<any>('/workouts/programs/generate', { method: 'POST', body: JSON.stringify(data) }),
  getPrograms: () => request<any[]>('/workouts/programs'),
  getProgram: (id: string) => request<any>(`/workouts/programs/${id}`),

  // Nutrition
  getNutritionDay: (date: string) => request<any>(`/nutrition/log/${date}`),
  saveNutritionDay: (data: any) => request<any>('/nutrition/log', { method: 'POST', body: JSON.stringify(data) }),

  // Meal Plans (AI)
  generateMealPlan: (data: any) => request<any>('/nutrition/meal-plans/generate', { method: 'POST', body: JSON.stringify(data) }),
  getMealPlans: () => request<any[]>('/nutrition/meal-plans'),

  // Recipes (AI)
  generateRecipe: (data: any) => request<any>('/nutrition/recipes/generate', { method: 'POST', body: JSON.stringify(data) }),
  getRecipes: () => request<any[]>('/nutrition/recipes'),
  getRecipe: (id: string) => request<any>(`/nutrition/recipes/${id}`),

  // Fridge
  getFridgeItems: () => request<any[]>('/nutrition/fridge'),
  addFridgeItem: (data: any) => request<any>('/nutrition/fridge', { method: 'POST', body: JSON.stringify(data) }),
  updateFridgeItem: (id: string, data: any) => request<any>(`/nutrition/fridge/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFridgeItem: (id: string) => request<void>(`/nutrition/fridge/${id}`, { method: 'DELETE' }),

  // Exercises
  getExercises: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/exercises${query}`);
  },
  getExercise: (id: string) => request<any>(`/exercises/${id}`),
};
