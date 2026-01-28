import Anthropic from '@anthropic-ai/sdk';

const CLASSIFICATION_PROMPT = `You are an expert customs classification specialist. Analyze the product image and provide:

1. The most accurate HS (Harmonized System) code for this product
2. A brief description suitable for customs declaration
3. Your confidence level (0-1)

Focus on:
- Material composition (leather, textile, plastic, metal, etc.)
- Product category (footwear, apparel, electronics, etc.)
- Specific features that affect classification

Respond in JSON format:
{
  "hsCode": "XXXX.XX.XXXX",
  "hsCode6": "XXXX.XX",
  "description": "Brief customs description",
  "confidence": 0.XX,
  "reasoning": "Brief explanation of classification logic"
}`;

export interface AnthropicClassificationResult {
  hsCode: string;
  hsCode6: string;
  description: string;
  confidence: number;
  reasoning?: string;
  provider: 'anthropic';
}

export async function classifyWithAnthropic(
  imageBase64: string,
  productName?: string
): Promise<AnthropicClassificationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey });

  // Extract base64 data and media type
  const base64Match = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
  let base64Data = imageBase64;

  if (base64Match) {
    const format = base64Match[1].toLowerCase();
    if (format === 'png') mediaType = 'image/png';
    else if (format === 'gif') mediaType = 'image/gif';
    else if (format === 'webp') mediaType = 'image/webp';
    base64Data = base64Match[2];
  }

  const userMessage = productName
    ? `Classify this product for customs/import purposes. Additional context: "${productName}"`
    : 'Classify this product for customs/import purposes.';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: `${CLASSIFICATION_PROMPT}\n\n${userMessage}`,
          },
        ],
      },
    ],
  });

  // Extract text response
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Anthropic');
  }

  // Parse JSON from response
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse classification response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    hsCode: parsed.hsCode || '9999.99.9999',
    hsCode6: parsed.hsCode6 || parsed.hsCode?.substring(0, 7) || '9999.99',
    description: parsed.description || 'Unclassified product',
    confidence: parsed.confidence || 0.5,
    reasoning: parsed.reasoning,
    provider: 'anthropic',
  };
}
