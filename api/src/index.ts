import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { apiKeyAuth, getApiKeyRoutes } from './middleware/apiAuth.js';
import workoutRoutes from './routes/workouts.js';
import nutritionRoutes from './routes/nutrition.js';
import goalRoutes from './routes/goals.js';
import profileRoutes from './routes/profile.js';
import exerciseRoutes from './routes/exercises.js';
import coachRoutes from './routes/coach.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API key authentication (validates key if present, allows unauthenticated for mobile)
app.use(apiKeyAuth);

// API key management
app.use('/api/auth', getApiKeyRoutes());

// Core routes
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/coach', coachRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'One Percent Fitness API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API documentation endpoint
app.get('/api', (_req, res) => {
  res.json({
    name: 'One Percent Fitness API',
    version: '1.0.0',
    description: 'AI-powered fitness, nutrition, and goal tracking platform',
    authentication: {
      method: 'API Key',
      header: 'X-API-Key: your_api_key',
      alternative: 'Authorization: Bearer your_api_key',
      management: '/api/auth/keys',
    },
    endpoints: {
      health: 'GET /health',
      workouts: {
        list: 'GET /api/workouts',
        create: 'POST /api/workouts',
        get: 'GET /api/workouts/:id',
        update: 'PUT /api/workouts/:id',
        delete: 'DELETE /api/workouts/:id',
        generateProgram: 'POST /api/workouts/programs/generate',
        listPrograms: 'GET /api/workouts/programs',
      },
      nutrition: {
        logDay: 'POST /api/nutrition/log',
        getDay: 'GET /api/nutrition/log/:date',
        generateMealPlan: 'POST /api/nutrition/meal-plans/generate',
        generateRecipe: 'POST /api/nutrition/recipes/generate',
        listRecipes: 'GET /api/nutrition/recipes',
        fridge: {
          list: 'GET /api/nutrition/fridge',
          add: 'POST /api/nutrition/fridge',
          update: 'PUT /api/nutrition/fridge/:id',
          delete: 'DELETE /api/nutrition/fridge/:id',
        },
      },
      goals: {
        list: 'GET /api/goals',
        create: 'POST /api/goals',
        get: 'GET /api/goals/:id',
        update: 'PUT /api/goals/:id',
        delete: 'DELETE /api/goals/:id',
      },
      profile: {
        get: 'GET /api/profile',
        update: 'PUT /api/profile',
        measurements: {
          list: 'GET /api/profile/measurements',
          add: 'POST /api/profile/measurements',
        },
        bloodWork: {
          list: 'GET /api/profile/blood-work',
          add: 'POST /api/profile/blood-work',
        },
      },
      exercises: {
        list: 'GET /api/exercises',
        get: 'GET /api/exercises/:id',
        search: 'GET /api/exercises?search=bench&muscle=chest&equipment=barbell',
      },
      auth: {
        createKey: 'POST /api/auth/keys',
        listKeys: 'GET /api/auth/keys',
        revokeKey: 'DELETE /api/auth/keys/:keyPrefix',
      },
    },
  });
});

app.listen(PORT, () => {
  console.log(`One Percent Fitness API running on port ${PORT}`);
  console.log(`AI Provider: ${process.env.AI_PROVIDER ?? 'anthropic (default)'}`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});

export default app;
