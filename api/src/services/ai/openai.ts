import OpenAI from 'openai';
import type { AIProviderClient, AIGenerateOptions } from './provider.js';

export class OpenAIClient implements AIProviderClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generate(options: AIGenerateOptions): Promise<string> {
    const messages = options.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      messages,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
