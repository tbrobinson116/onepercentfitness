import axios from 'axios';
import {
  ClassificationResult,
  DutyResult,
  ZonosClassifyResponse,
  ZonosLandedCostResponse,
} from '../types';

const ZONOS_API_KEY = process.env.ZONOS_API_KEY;
const ZONOS_BASE_URL = 'https://api.zonos.com';

// For MVP/demo: Use mock data when Zonos API key is not configured
const USE_MOCK = !ZONOS_API_KEY || ZONOS_API_KEY === 'your_zonos_api_key';

// Mock classification data for common product categories
const MOCK_CLASSIFICATIONS: Record<string, ClassificationResult> = {
  default: {
    hsCode: '6403.99.0000',
    hsCode6: '6403.99',
    description: 'Footwear with outer soles of rubber, plastics, leather or composition leather and uppers of leather',
    confidence: 0.87,
  },
  shoe: {
    hsCode: '6403.99.0000',
    hsCode6: '6403.99',
    description: 'Footwear with outer soles of rubber, plastics, leather or composition leather and uppers of leather',
    confidence: 0.92,
  },
  watch: {
    hsCode: '9102.11.0000',
    hsCode6: '9102.11',
    description: 'Wrist watches, electrically operated, with mechanical display only',
    confidence: 0.89,
  },
  bag: {
    hsCode: '4202.21.0000',
    hsCode6: '4202.21',
    description: 'Handbags with outer surface of leather or composition leather',
    confidence: 0.91,
  },
  electronics: {
    hsCode: '8471.30.0000',
    hsCode6: '8471.30',
    description: 'Portable automatic data processing machines, weighing not more than 10 kg',
    confidence: 0.88,
  },
  clothing: {
    hsCode: '6109.10.0000',
    hsCode6: '6109.10',
    description: 'T-shirts, singlets and other vests, of cotton, knitted or crocheted',
    confidence: 0.85,
  },
};

// French duty rates for common HS codes
const FRENCH_DUTY_RATES: Record<string, number> = {
  '6403': 0.08,    // Footwear - 8%
  '9102': 0.045,   // Watches - 4.5%
  '4202': 0.03,    // Bags - 3%
  '8471': 0.0,     // Computers - 0%
  '6109': 0.12,    // T-shirts - 12%
  'default': 0.05, // Default 5%
};

const FRENCH_VAT_RATE = 0.20; // 20% standard VAT

/**
 * Classify a product image and return HS code
 */
export async function classifyProduct(
  imageBase64: string,
  productName?: string
): Promise<ClassificationResult> {
  if (USE_MOCK) {
    return getMockClassification(productName);
  }

  try {
    const response = await axios.post<ZonosClassifyResponse>(
      `${ZONOS_BASE_URL}/v1/classify`,
      {
        image: imageBase64,
        description: productName,
        ship_to_country: 'FR',
      },
      {
        headers: {
          'Authorization': `Bearer ${ZONOS_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;
    return {
      hsCode: data.hs_code,
      hsCode6: data.hs_code.substring(0, 7), // First 6 digits + dot
      description: data.description,
      confidence: data.confidence_score,
      productName,
    };
  } catch (error) {
    console.error('Zonos classification error:', error);
    // Fall back to mock on error
    return getMockClassification(productName);
  }
}

/**
 * Calculate French import duties and VAT
 */
export async function calculateDuty(
  hsCode: string,
  productValue: number,
  currency: string = 'EUR',
  originCountry: string = 'US'
): Promise<DutyResult> {
  if (USE_MOCK) {
    return getMockDutyCalculation(hsCode, productValue);
  }

  try {
    const response = await axios.post<ZonosLandedCostResponse>(
      `${ZONOS_BASE_URL}/v1/landed-cost`,
      {
        hs_code: hsCode,
        value: productValue,
        currency: currency,
        origin_country: originCountry,
        destination_country: 'FR',
      },
      {
        headers: {
          'Authorization': `Bearer ${ZONOS_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;
    const vatTax = data.taxes.find(t => t.type === 'VAT') || { amount: 0, rate: 0.20 };

    return {
      duties: {
        amount: data.duties.amount,
        rate: `${(data.duties.rate * 100).toFixed(1)}%`,
      },
      vat: {
        amount: vatTax.amount,
        rate: `${(vatTax.rate * 100).toFixed(0)}%`,
      },
      totalLandedCost: data.total_landed_cost,
      breakdown: [
        { type: 'Product Value', amount: productValue },
        { type: 'Customs Duty', amount: data.duties.amount, rate: `${(data.duties.rate * 100).toFixed(1)}%` },
        { type: 'VAT', amount: vatTax.amount, rate: `${(vatTax.rate * 100).toFixed(0)}%` },
      ],
    };
  } catch (error) {
    console.error('Zonos landed cost error:', error);
    // Fall back to mock on error
    return getMockDutyCalculation(hsCode, productValue);
  }
}

/**
 * Get mock classification based on product name keywords
 */
function getMockClassification(productName?: string): ClassificationResult {
  if (!productName) {
    return MOCK_CLASSIFICATIONS.default;
  }

  const lowerName = productName.toLowerCase();

  if (lowerName.includes('shoe') || lowerName.includes('sneaker') || lowerName.includes('boot')) {
    return { ...MOCK_CLASSIFICATIONS.shoe, productName };
  }
  if (lowerName.includes('watch')) {
    return { ...MOCK_CLASSIFICATIONS.watch, productName };
  }
  if (lowerName.includes('bag') || lowerName.includes('purse') || lowerName.includes('handbag')) {
    return { ...MOCK_CLASSIFICATIONS.bag, productName };
  }
  if (lowerName.includes('laptop') || lowerName.includes('computer') || lowerName.includes('phone') || lowerName.includes('tablet')) {
    return { ...MOCK_CLASSIFICATIONS.electronics, productName };
  }
  if (lowerName.includes('shirt') || lowerName.includes('dress') || lowerName.includes('pants') || lowerName.includes('jacket')) {
    return { ...MOCK_CLASSIFICATIONS.clothing, productName };
  }

  // Add some randomness to simulate real classification
  const classifications = Object.values(MOCK_CLASSIFICATIONS);
  const randomIndex = Math.floor(Math.random() * classifications.length);
  return { ...classifications[randomIndex], productName };
}

/**
 * Get mock duty calculation
 */
function getMockDutyCalculation(hsCode: string, productValue: number): DutyResult {
  // Get the first 4 digits to find duty rate
  const hsPrefix = hsCode.substring(0, 4);
  const dutyRate = FRENCH_DUTY_RATES[hsPrefix] ?? FRENCH_DUTY_RATES.default;

  const dutyAmount = productValue * dutyRate;
  // VAT is calculated on product value + duty
  const vatBase = productValue + dutyAmount;
  const vatAmount = vatBase * FRENCH_VAT_RATE;
  const totalLandedCost = productValue + dutyAmount + vatAmount;

  return {
    duties: {
      amount: Math.round(dutyAmount * 100) / 100,
      rate: `${(dutyRate * 100).toFixed(1)}%`,
    },
    vat: {
      amount: Math.round(vatAmount * 100) / 100,
      rate: '20%',
    },
    totalLandedCost: Math.round(totalLandedCost * 100) / 100,
    breakdown: [
      { type: 'Product Value', amount: productValue },
      { type: 'Customs Duty', amount: Math.round(dutyAmount * 100) / 100, rate: `${(dutyRate * 100).toFixed(1)}%` },
      { type: 'VAT', amount: Math.round(vatAmount * 100) / 100, rate: '20%' },
    ],
  };
}
