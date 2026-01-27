import { useState, useCallback } from 'react';
import { DutyResult } from '../types';
import {
  classifyAndCalculate,
  ClassificationResultWithProvider,
} from '../services/api';
import { useAppStore } from '../store/appStore';

interface UseClassificationReturn {
  classification: ClassificationResultWithProvider | null;
  duty: DutyResult | null;
  isLoading: boolean;
  error: string | null;
  classify: (
    imageBase64: string,
    productValue: number,
    productName?: string
  ) => Promise<void>;
  reset: () => void;
}

export function useClassification(): UseClassificationReturn {
  const [classification, setClassification] =
    useState<ClassificationResultWithProvider | null>(null);
  const [duty, setDuty] = useState<DutyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get provider settings from store
  const { classificationProvider, abTestEnabled } = useAppStore();

  const classify = useCallback(
    async (imageBase64: string, productValue: number, productName?: string) => {
      setIsLoading(true);
      setError(null);
      setClassification(null);
      setDuty(null);

      try {
        const result = await classifyAndCalculate(
          imageBase64,
          productValue,
          productName,
          'US', // Default origin country
          {
            provider: classificationProvider,
            abTestEnabled:
              classificationProvider === 'auto' ? abTestEnabled : false,
          }
        );
        setClassification(result.classification);
        setDuty(result.duty);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Classification failed';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [classificationProvider, abTestEnabled]
  );

  const reset = useCallback(() => {
    setClassification(null);
    setDuty(null);
    setError(null);
  }, []);

  return {
    classification,
    duty,
    isLoading,
    error,
    classify,
    reset,
  };
}
