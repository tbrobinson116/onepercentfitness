import type { AIProvider } from '../../types/index.js';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIGenerateOptions {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface AIProviderClient {
  generate(options: AIGenerateOptions): Promise<string>;
}

export function getDefaultProvider(): AIProvider {
  const env = process.env.AI_PROVIDER as AIProvider | undefined;
  if (env === 'openai' || env === 'anthropic') return env;
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'anthropic';
}
