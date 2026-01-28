// Product classification types
export interface ClassificationResult {
  hsCode: string;
  hsCode6: string;
  description: string;
  confidence: number;
  productName?: string;
}

// Duty calculation types
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

// Glasses connection types
export type GlassesConnectionStatus =
  | 'disconnected'
  | 'searching'
  | 'connecting'
  | 'connected'
  | 'error';

export interface GlassesDevice {
  id: string;
  name: string;
  model: 'ray-ban-meta' | 'oakley-meta' | 'mock';
  batteryLevel?: number;
}

// Scan/capture types
export interface ScanSession {
  id: string;
  imageUri: string;
  imageBase64?: string;
  timestamp: Date;
  classification?: ClassificationResult;
  duty?: DutyResult;
  productValue?: number;
  status: 'capturing' | 'classifying' | 'calculating' | 'complete' | 'error';
  error?: string;
}

// API types
export interface ClassifyRequest {
  imageBase64: string;
  productName?: string;
}

export interface DutyRequest {
  hsCode: string;
  productValue: number;
  currency?: string;
  originCountry?: string;
}
