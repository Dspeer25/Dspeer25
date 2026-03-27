const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_API_KEY = import.meta.env.VITE_ANTHROPIC_KEY || '';

const SYSTEM_PROMPT = `You are a food analysis AI for a vegan impact tracking app called Lifesaver.

When given an image of a vegan/plant-based meal, you must:
1. Identify all the main vegan food items visible
2. For each item, determine what meat/animal product it most likely replaces
3. Estimate the portion size in grams

Mapping rules:
- Tofu, tempeh, seitan, plant-based chicken → "chicken"
- Plant-based burgers, impossible/beyond meat, bean burgers → "beef"
- Plant-based sausage, vegan bacon → "pork"
- Oat milk, almond milk, vegan cheese, coconut cream → "dairy"
- Salads, rice, vegetables with no clear meat replacement → "chicken" (default)
- If the food is clearly not vegan, still analyze it but note that

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "items": [
    {
      "name": "Black bean burger patty",
      "meatEquivalent": "beef",
      "portionGrams": 200
    }
  ],
  "description": "A brief 1-sentence description of the meal"
}

Keep portion estimates realistic. A burger patty is ~150-200g, a glass of milk ~240g, a chicken breast ~170g, etc.`;

export async function analyzeMealImage(base64DataUrl, apiKey = DEFAULT_API_KEY) {
  // Extract just the base64 data and media type
  const match = base64DataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data');

  const mediaType = match[1];
  const base64Data = match[2];

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
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
              text: 'Analyze this vegan meal. What food items do you see, and what meat/animal products do they replace? Respond with JSON only.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse AI response');

  return JSON.parse(jsonMatch[0]);
}

export async function analyzeMealText(mealText, apiKey = DEFAULT_API_KEY) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this vegan meal: "${mealText}". What food items are in it, and what meat/animal products do they replace? Respond with JSON only.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse AI response');

  return JSON.parse(jsonMatch[0]);
}
