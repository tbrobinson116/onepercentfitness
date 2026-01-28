import { Router, Request, Response } from 'express';
import { calculateDuty } from '../services/zonos';
import { DutyRequest } from '../types';

const router = Router();

/**
 * POST /api/duty
 * Calculate import duties and taxes for France
 */
router.post('/', async (req: Request<{}, {}, DutyRequest>, res: Response) => {
  try {
    const { hsCode, productValue, currency = 'EUR', originCountry = 'US' } = req.body;

    // Validate request
    if (!hsCode) {
      return res.status(400).json({
        error: 'Missing required field: hsCode',
      });
    }

    if (productValue === undefined || productValue === null) {
      return res.status(400).json({
        error: 'Missing required field: productValue',
      });
    }

    if (typeof productValue !== 'number' || productValue <= 0) {
      return res.status(400).json({
        error: 'productValue must be a positive number',
      });
    }

    // Validate HS code format (should be at least 6 digits)
    const hsCodeDigits = hsCode.replace(/\./g, '');
    if (hsCodeDigits.length < 6 || !/^\d+$/.test(hsCodeDigits)) {
      return res.status(400).json({
        error: 'Invalid HS code format. Expected at least 6 digits.',
      });
    }

    console.log(`Calculating duty for HS ${hsCode}, value: ${productValue} ${currency}`);

    // Calculate duty
    const result = await calculateDuty(hsCode, productValue, currency, originCountry);

    console.log(`Duty result: Total landed cost ${result.totalLandedCost} ${currency}`);

    return res.json(result);
  } catch (error) {
    console.error('Duty calculation error:', error);
    return res.status(500).json({
      error: 'Failed to calculate duty',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
