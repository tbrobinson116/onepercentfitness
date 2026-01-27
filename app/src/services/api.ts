import axios from 'axios';
import {
  ClassifyRequest,
  ClassificationResult,
  DutyRequest,
  DutyResult,
} from '../types';

export type ClassificationProvider = 'auto' | 'zonos' | 'anthropic' | 'openai';

// Configure base URL - change this to your backend URL
const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://your-production-api.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased for AI classification
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ClassifyOptions {
  provider?: ClassificationProvider;
  abTestEnabled?: boolean;
}

export interface ClassificationResultWithProvider extends ClassificationResult {
  provider?: string;
  latencyMs?: number;
}

export async function classifyProduct(
  request: ClassifyRequest,
  options?: ClassifyOptions
): Promise<ClassificationResultWithProvider> {
  const response = await api.post<ClassificationResultWithProvider>('/api/classify', {
    ...request,
    provider: options?.provider,
    abTestEnabled: options?.abTestEnabled,
  });
  return response.data;
}

export async function calculateDuty(request: DutyRequest): Promise<DutyResult> {
  const response = await api.post<DutyResult>('/api/duty', request);
  return response.data;
}

export interface ClassifyAndCalculateResult {
  classification: ClassificationResultWithProvider;
  duty: DutyResult;
}

export async function classifyAndCalculate(
  imageBase64: string,
  productValue: number,
  productName?: string,
  originCountry: string = 'US',
  options?: ClassifyOptions
): Promise<ClassifyAndCalculateResult> {
  // First classify the product
  const classification = await classifyProduct(
    {
      imageBase64,
      productName,
    },
    options
  );

  // Then calculate duty with the HS code
  const duty = await calculateDuty({
    hsCode: classification.hsCode,
    productValue,
    currency: 'EUR',
    originCountry,
  });

  return { classification, duty };
}

export interface ProviderInfo {
  available: ClassificationProvider[];
  configured: {
    zonos: boolean;
    anthropic: boolean;
    openai: boolean;
  };
}

export async function getAvailableProviders(): Promise<ProviderInfo> {
  const response = await api.get<ProviderInfo>('/api/classify/providers');
  return response.data;
}

export interface ABTestStats {
  totalClassifications: number;
  byProvider: Record<
    string,
    {
      count: number;
      successRate: number;
      avgConfidence: number;
      avgLatencyMs: number;
    }
  >;
}

export async function getABTestStats(): Promise<ABTestStats> {
  const response = await api.get<ABTestStats>('/api/classify/stats');
  return response.data;
}

export default api;
