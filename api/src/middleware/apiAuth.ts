import { Request, Response, NextFunction, Router } from 'express';

/**
 * API Key authentication middleware for external/third-party access.
 *
 * Subscribers get an API key they can use to access all endpoints programmatically,
 * enabling agentic AI tools, custom integrations, and third-party apps to use
 * the One Percent Fitness platform.
 *
 * API keys are passed via the `X-API-Key` header or `Authorization: Bearer <key>`.
 */

// In-memory key store (swap for DB in production)
const apiKeys = new Map<string, ApiKeyRecord>();

export interface ApiKeyRecord {
  key: string;
  userId: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  rateLimit: number; // requests per minute
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

// Rate limiting state
const rateLimitState = new Map<string, { count: number; resetAt: number }>();

// Seed a dev key for testing
apiKeys.set('dev-test-key-123', {
  key: 'dev-test-key-123',
  userId: 'dev-user',
  name: 'Development Key',
  tier: 'pro',
  rateLimit: 60,
  createdAt: new Date().toISOString(),
  isActive: true,
});

export function extractApiKey(req: Request): string | null {
  // Check X-API-Key header
  const apiKey = req.headers['x-api-key'] as string | undefined;
  if (apiKey) return apiKey;

  // Check Authorization: Bearer header
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7);
  }

  return null;
}

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const key = extractApiKey(req);

  // If no key provided, allow request (internal/mobile app access)
  // In production, you'd want to distinguish internal vs external requests
  if (!key) {
    next();
    return;
  }

  const record = apiKeys.get(key);
  if (!record) {
    res.status(401).json({
      error: 'Invalid API key',
      message: 'Provide a valid API key via X-API-Key header or Authorization: Bearer header',
    });
    return;
  }

  if (!record.isActive) {
    res.status(403).json({ error: 'API key is deactivated' });
    return;
  }

  // Rate limiting
  const now = Date.now();
  const state = rateLimitState.get(key) ?? { count: 0, resetAt: now + 60000 };

  if (now > state.resetAt) {
    state.count = 0;
    state.resetAt = now + 60000;
  }

  state.count++;
  rateLimitState.set(key, state);

  if (state.count > record.rateLimit) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((state.resetAt - now) / 1000),
    });
    return;
  }

  // Update last used
  record.lastUsedAt = new Date().toISOString();

  // Attach user info to request
  (req as any).apiUser = {
    userId: record.userId,
    tier: record.tier,
  };

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', record.rateLimit.toString());
  res.setHeader('X-RateLimit-Remaining', (record.rateLimit - state.count).toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(state.resetAt / 1000).toString());

  next();
}

// --- API Key Management Routes ---

export function getApiKeyRoutes() {
  const router = Router();

  // Create a new API key
  router.post('/keys', (req: Request, res: Response) => {
    const { name, tier = 'free' } = req.body;

    const key = `opf_${generateKey()}`;
    const record: ApiKeyRecord = {
      key,
      userId: (req as any).apiUser?.userId ?? 'default',
      name: name ?? 'API Key',
      tier,
      rateLimit: tier === 'enterprise' ? 600 : tier === 'pro' ? 60 : 10,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    apiKeys.set(key, record);

    res.status(201).json({
      key,
      name: record.name,
      tier: record.tier,
      rateLimit: record.rateLimit,
      message: 'Store this key securely. It will not be shown again.',
    });
  });

  // List keys (redacted)
  router.get('/keys', (_req: Request, res: Response) => {
    const keys = Array.from(apiKeys.values()).map((k) => ({
      keyPreview: `${k.key.slice(0, 8)}...${k.key.slice(-4)}`,
      name: k.name,
      tier: k.tier,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      isActive: k.isActive,
    }));
    res.json(keys);
  });

  // Revoke a key
  router.delete('/keys/:keyPrefix', (req: Request, res: Response) => {
    const prefix = req.params.keyPrefix as string;
    for (const [key, record] of apiKeys.entries()) {
      if (key.startsWith(prefix)) {
        record.isActive = false;
        res.json({ message: 'Key revoked' });
        return;
      }
    }
    res.status(404).json({ error: 'Key not found' });
  });

  return router;
}

function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
