// Classification types
export interface ClassifyRequest {
  imageBase64: string;
  productName?: string;
}

export interface ClassificationResult {
  hsCode: string;
  hsCode6: string;
  description: string;
  confidence: number;
  productName?: string;
}

// Duty calculation types
export interface DutyRequest {
  hsCode: string;
  productValue: number;
  currency?: string;
  originCountry?: string;
}

export interface DutyBreakdownItem {
  type: string;
  amount: number;
  rate?: string;
}

export interface DutyResult {
  duties: {
    amount: number;
    rate: string;
  };
  vat: {
    amount: number;
    rate: string;
  };
  totalLandedCost: number;
  breakdown: DutyBreakdownItem[];
}

// Zonos API types
export interface ZonosClassifyResponse {
  hs_code: string;
  description: string;
  confidence_score: number;
}

export interface ZonosLandedCostResponse {
  duties: {
    amount: number;
    currency: string;
    rate: number;
  };
  taxes: Array<{
    type: string;
    amount: number;
    rate: number;
  }>;
  total_landed_cost: number;
}
