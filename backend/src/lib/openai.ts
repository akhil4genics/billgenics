import { EBillCategory } from '../models/Bill';

interface ParsedReceipt {
  storeName: string;
  storeABN?: string;
  storeAddress?: string;
  date: string;
  category: EBillCategory;
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string;
}

export async function parseReceiptImage(base64Image: string): Promise<ParsedReceipt> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a receipt parser. Extract structured data from receipt images. Return ONLY valid JSON with this exact structure:
{
  "storeName": "string",
  "storeABN": "string or null",
  "storeAddress": "string or null",
  "date": "YYYY-MM-DD",
  "category": "one of: grocery, electronics, telephone, dining, transport, health, utilities, entertainment, clothing, other",
  "items": [{"name": "string", "quantity": number, "unitPrice": number, "total": number}],
  "subtotal": number,
  "tax": number,
  "total": number,
  "paymentMethod": "string or null"
}
Use your best judgment to categorize the receipt. If you cannot determine a value, use reasonable defaults. All monetary values should be numbers (not strings). If you cannot read certain items clearly, do your best to approximate.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please parse this receipt image and extract all information.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenAI');
  }

  // Extract JSON from the response (handle markdown code blocks)
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

  const parsed = JSON.parse(jsonStr) as ParsedReceipt;

  // Validate category is a valid enum value
  const validCategories = Object.values(EBillCategory);
  if (!validCategories.includes(parsed.category)) {
    parsed.category = EBillCategory.OTHER;
  }

  return parsed;
}
