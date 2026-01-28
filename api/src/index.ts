import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import classifyRoutes from './routes/classify';
import dutyRoutes from './routes/duty';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for base64 images

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'DutySnap API',
    version: '1.0.0',
    endpoints: {
      'POST /api/classify': 'Classify a product image and return HS code',
      'POST /api/duty': 'Calculate import duties and taxes for France',
    },
  });
});

// Routes
app.use('/api/classify', classifyRoutes);
app.use('/api/duty', dutyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧾 DutySnap API Server                                  ║
║                                                           ║
║   Server running on http://localhost:${PORT}               ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST /api/classify - Classify product images          ║
║   • POST /api/duty     - Calculate French duties/VAT      ║
║                                                           ║
║   Mode: ${process.env.ZONOS_API_KEY ? 'Live (Zonos API)' : 'Mock (Demo data)'}                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
