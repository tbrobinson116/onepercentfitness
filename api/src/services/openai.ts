import OpenAI from 'openai';

const CLASSIFICATION_PROMPT = `You are an expert customs classification specialist. Analyze the product image and provide:

1. The most accurate HS (Harmonized System) code for this product
2. A brief description suitable for customs declaration
3. Your confidence level (0-1)

Focus on:
- Material composition (leather, textile, plastic, metal, etc.)
- Product category (footwear, apparel, electronics, etc.)
- Specific features that affect classification

Respond in JSON format only:
{
  "hsCode": "XXXX.XX.XXXX",
  "hsCode6": "XXXX.XX",
  "description": "Brief customs description",
  "confidence": 0.XX,
  "reasoning": "Brief explanation of classification logic"
}`;

export interface OpenAIClassificationResult {
  hsCode: string;
  hsCode6: string;
  description: string;
  confidence: number;
  reasoning?: string;
  provider: 'openai';
}

export async function classifyWithOpenAI(
  imageBase64: string,
  productName?: string
): Promise<OpenAIClassificationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const client = new OpenAI({ apiKey });

  // Ensure proper data URL format
  let imageUrl = imageBase64;
  if (!imageBase64.startsWith('data:image/')) {
    imageUrl = `data:image/jpeg;base64,${imageBase64}`;
  }

  const userMessage = productName
    ? `Classify this product for customs/import purposes. Additional context: "${productName}"`
    : 'Classify this product for customs/import purposes.';

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: CLASSIFICATION_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: userMessage,
          },
        ],
      },
    ],
  });

  const textContent = response.choices[0]?.message?.content;
  if (!textContent) {
    throw new Error('No response from OpenAI');
  }

  // Parse JSON from response
  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
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
    provider: 'openai',
  };
}
