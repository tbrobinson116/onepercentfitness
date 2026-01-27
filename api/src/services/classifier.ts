import { classifyWithZonos, ZonosClassificationResult } from './zonos';
import { classifyWithAnthropic, AnthropicClassificationResult } from './anthropic';
import { classifyWithOpenAI, OpenAIClassificationResult } from './openai';

export type ClassificationProvider = 'zonos' | 'anthropic' | 'openai' | 'auto';

export type ClassificationResult =
  | ZonosClassificationResult
  | AnthropicClassificationResult
  | OpenAIClassificationResult;

export interface ClassificationOptions {
  provider?: ClassificationProvider;
  abTestEnabled?: boolean;
  abTestWeights?: {
    zonos?: number;
    anthropic?: number;
    openai?: number;
  };
}

// Track A/B test results for analysis
interface ABTestLog {
  timestamp: Date;
  provider: string;
  hsCode: string;
  confidence: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}

const abTestLogs: ABTestLog[] = [];

/**
 * Get available providers based on configured API keys
 */
export function getAvailableProviders(): ClassificationProvider[] {
  const available: ClassificationProvider[] = [];

  if (process.env.ZONOS_API_KEY) {
    available.push('zonos');
  }
  if (process.env.ANTHROPIC_API_KEY) {
    available.push('anthropic');
  }
  if (process.env.OPENAI_API_KEY) {
    available.push('openai');
  }

  return available;
}

/**
 * Select provider based on A/B test weights
 */
function selectProviderForABTest(weights: {
  zonos?: number;
  anthropic?: number;
  openai?: number;
}): ClassificationProvider {
  const available = getAvailableProviders();

  if (available.length === 0) {
    throw new Error('No classification providers configured');
  }

  // Default weights - equal distribution
  const defaultWeights = {
    zonos: 0.33,
    anthropic: 0.33,
    openai: 0.34,
  };

  const mergedWeights = { ...defaultWeights, ...weights };

  // Filter to only available providers and normalize weights
  const availableWeights: { provider: ClassificationProvider; weight: number }[] = [];
  let totalWeight = 0;

  for (const provider of available) {
    if (provider === 'auto') continue; // Skip 'auto' in weight lookup
    const weight = mergedWeights[provider as keyof typeof mergedWeights] || 0;
    if (weight > 0) {
      availableWeights.push({ provider, weight });
      totalWeight += weight;
    }
  }

  if (availableWeights.length === 0 || totalWeight === 0) {
    return available[0];
  }

  // Random selection based on weights
  const random = Math.random() * totalWeight;
  let cumulative = 0;

  for (const { provider, weight } of availableWeights) {
    cumulative += weight;
    if (random <= cumulative) {
      return provider;
    }
  }

  return availableWeights[availableWeights.length - 1].provider;
}

/**
 * Main classification function with A/B testing support
 */
export async function classifyProduct(
  imageBase64: string,
  productName?: string,
  options: ClassificationOptions = {}
): Promise<ClassificationResult & { latencyMs: number }> {
  const {
    provider: requestedProvider = 'auto',
    abTestEnabled = true,
    abTestWeights = {},
  } = options;

  // Determine which provider to use
  let provider: ClassificationProvider;

  if (requestedProvider === 'auto') {
    if (abTestEnabled) {
      provider = selectProviderForABTest(abTestWeights);
    } else {
      // Default priority: Zonos > Anthropic > OpenAI
      const available = getAvailableProviders();
      provider = available[0] || 'zonos';
    }
  } else {
    provider = requestedProvider;
  }

  const startTime = Date.now();
  let result: ClassificationResult;
  let success = true;
  let error: string | undefined;

  try {
    switch (provider) {
      case 'zonos':
        result = await classifyWithZonos(imageBase64, productName);
        break;
      case 'anthropic':
        result = await classifyWithAnthropic(imageBase64, productName);
        break;
      case 'openai':
        result = await classifyWithOpenAI(imageBase64, productName);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (err) {
    success = false;
    error = err instanceof Error ? err.message : 'Unknown error';

    // Fallback to another provider if the selected one fails
    const available = getAvailableProviders().filter(p => p !== provider);
    if (available.length > 0) {
      console.log(`Provider ${provider} failed, falling back to ${available[0]}`);
      return classifyProduct(imageBase64, productName, {
        ...options,
        provider: available[0],
        abTestEnabled: false,
      });
    }

    throw err;
  }

  const latencyMs = Date.now() - startTime;

  // Log for A/B test analysis
  abTestLogs.push({
    timestamp: new Date(),
    provider,
    hsCode: result.hsCode,
    confidence: result.confidence,
    latencyMs,
    success,
    error,
  });

  // Keep only last 1000 logs
  if (abTestLogs.length > 1000) {
    abTestLogs.shift();
  }

  return {
    ...result,
    latencyMs,
  };
}

/**
 * Get A/B test statistics
 */
export function getABTestStats() {
  const stats: Record<string, {
    count: number;
    successRate: number;
    avgConfidence: number;
    avgLatencyMs: number;
  }> = {};

  for (const log of abTestLogs) {
    if (!stats[log.provider]) {
      stats[log.provider] = {
        count: 0,
        successRate: 0,
        avgConfidence: 0,
        avgLatencyMs: 0,
      };
    }

    const s = stats[log.provider];
    s.count++;
    s.successRate = (s.successRate * (s.count - 1) + (log.success ? 1 : 0)) / s.count;
    s.avgConfidence = (s.avgConfidence * (s.count - 1) + log.confidence) / s.count;
    s.avgLatencyMs = (s.avgLatencyMs * (s.count - 1) + log.latencyMs) / s.count;
  }

  return {
    totalClassifications: abTestLogs.length,
    byProvider: stats,
    recentLogs: abTestLogs.slice(-10),
  };
}
