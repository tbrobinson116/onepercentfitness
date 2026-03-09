import type { AIProvider } from '../../types/index.js';
import type { AIProviderClient } from './provider.js';
import { getDefaultProvider } from './provider.js';
import { AnthropicClient } from './anthropic.js';
import { OpenAIClient } from './openai.js';

export type { AIProviderClient, AIGenerateOptions, AIMessage } from './provider.js';

const clients = new Map<AIProvider, AIProviderClient>();

export function getAIClient(provider?: AIProvider): AIProviderClient {
  const p = provider ?? getDefaultProvider();

  if (!clients.has(p)) {
    if (p === 'anthropic') {
      clients.set(p, new AnthropicClient());
    } else {
      clients.set(p, new OpenAIClient());
    }
  }

  return clients.get(p)!;
}
