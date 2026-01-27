import { Router, Request, Response } from 'express';
import { classifyProduct } from '../services/zonos';
import { ClassifyRequest } from '../types';

const router = Router();

/**
 * POST /api/classify
 * Classify a product image and return HS code
 */
router.post('/', async (req: Request<{}, {}, ClassifyRequest>, res: Response) => {
  try {
    const { imageBase64, productName } = req.body;

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

    console.log(`Classifying product: ${productName || 'unnamed'}`);

    // Classify the product
    const result = await classifyProduct(imageBase64, productName);

    console.log(`Classification result: ${result.hsCode} (${result.confidence * 100}% confidence)`);

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
