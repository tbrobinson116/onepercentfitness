import Anthropic from '@anthropic-ai/sdk';
import type { AIProviderClient, AIGenerateOptions } from './provider.js';

export class AnthropicClient implements AIProviderClient {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generate(options: AIGenerateOptions): Promise<string> {
    const systemMsg = options.messages.find(m => m.role === 'system');
    const userMessages = options.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      system: systemMsg?.content ?? '',
      messages: userMessages,
    });

    const textBlock = response.content.find(b => b.type === 'text');
    return textBlock?.text ?? '';
  }
}
