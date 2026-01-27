import axios from 'axios';
import {
  ClassifyRequest,
  ClassificationResult,
  DutyRequest,
  DutyResult
} from '../types';

// Configure base URL - change this to your backend URL
const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://your-production-api.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function classifyProduct(
  request: ClassifyRequest
): Promise<ClassificationResult> {
  const response = await api.post<ClassificationResult>(
    '/api/classify',
    request
  );
  return response.data;
}

export async function calculateDuty(
  request: DutyRequest
): Promise<DutyResult> {
  const response = await api.post<DutyResult>(
    '/api/duty',
    request
  );
  return response.data;
}

export async function classifyAndCalculate(
  imageBase64: string,
  productValue: number,
  productName?: string,
  originCountry: string = 'US'
): Promise<{ classification: ClassificationResult; duty: DutyResult }> {
  // First classify the product
  const classification = await classifyProduct({
    imageBase64,
    productName,
  });

  // Then calculate duty with the HS code
  const duty = await calculateDuty({
    hsCode: classification.hsCode,
    productValue,
    currency: 'EUR',
    originCountry,
  });

  return { classification, duty };
}

export default api;
