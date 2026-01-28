import { Router, Request, Response } from 'express';
import {
  classifyProduct,
  getAvailableProviders,
  getABTestStats,
  ClassificationProvider,
} from '../services/classifier';

const router = Router();

interface ClassifyRequestBody {
  imageBase64: string;
  productName?: string;
  provider?: ClassificationProvider;
  abTestEnabled?: boolean;
}

/**
 * GET /api/classify/providers
 * List available classification providers
 */
router.get('/providers', (req: Request, res: Response) => {
  const providers = getAvailableProviders();
  return res.json({
    available: providers,
    configured: {
      zonos: providers.includes('zonos'),
      anthropic: providers.includes('anthropic'),
      openai: providers.includes('openai'),
    },
  });
});

/**
 * GET /api/classify/stats
 * Get A/B testing statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  const stats = getABTestStats();
  return res.json(stats);
});

/**
 * POST /api/classify
 * Classify a product image and return HS code
 *
 * Body:
 *   - imageBase64: Base64 encoded image
 *   - productName: Optional product description
 *   - provider: Optional provider selection ('zonos' | 'anthropic' | 'openai' | 'auto')
 *   - abTestEnabled: Enable A/B testing (default: true when provider is 'auto')
 */
router.post('/', async (req: Request<{}, {}, ClassifyRequestBody>, res: Response) => {
  try {
    const {
      imageBase64,
      productName,
      provider = 'auto',
      abTestEnabled,
    } = req.body;

    // Validate request
    if (!imageBase64) {
      return res.status(400).json({
        error: 'Missing required field: imageBase64',
      });
    }

    // Validate base64 image format
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    const isValidBase64 = base64Regex.test(imageBase64) ||
      /^[A-Za-z0-9+/]+=*$/.test(imageBase64.substring(0, 100));

    if (!isValidBase64 && imageBase64.length < 100) {
      return res.status(400).json({
        error: 'Invalid image format. Expected base64-encoded image.',
      });
    }

    // Validate provider if specified
    const validProviders: ClassificationProvider[] = ['zonos', 'anthropic', 'openai', 'auto'];
    if (provider && !validProviders.includes(provider)) {
      return res.status(400).json({
        error: `Invalid provider: ${provider}. Valid options: ${validProviders.join(', ')}`,
      });
    }

    console.log(`Classifying product: ${productName || 'unnamed'} (provider: ${provider})`);

    // Classify the product
    const result = await classifyProduct(imageBase64, productName, {
      provider,
      abTestEnabled: abTestEnabled ?? (provider === 'auto'),
    });

    console.log(`Classification result: ${result.hsCode} via ${result.provider} (${result.confidence * 100}% confidence, ${result.latencyMs}ms)`);

    return res.json(result);
  } catch (error) {
    console.error('Classification error:', error);
    return res.status(500).json({
      error: 'Failed to classify product',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
