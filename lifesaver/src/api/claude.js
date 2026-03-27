const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Try env var first (baked in at build time), then localStorage
function getEffectiveApiKey() {
  const envKey = import.meta.env.VITE_ANTHROPIC_KEY || '';
  const storedKey = localStorage.getItem('lifesaver_api_key') || '';
  // If env key exists and localStorage is empty, auto-save it
  if (envKey && !storedKey) {
    localStorage.setItem('lifesaver_api_key', envKey);
  }
  return envKey || storedKey;
}

const SYSTEM_PROMPT = `You are an expert food analyst for Lifesaver, a vegan impact tracking app.

IMPORTANT: If the image does NOT contain food, or you cannot clearly identify food items, respond with:
{"error": "not_food"}
Do NOT guess or make up items. Only analyze images that clearly show food.

Your job: Look at a meal (photo or description), identify every plant-based item, and figure out what animal protein it replaces — as if someone had ordered the non-vegan version instead.

Be specific and detailed. Don't just say "tofu" — say "Crispy pan-fried tofu strips (~150g)". Estimate portion sizes by looking at the plate, bowl size, and relative proportions.

For each item, decide what meat it most closely replaces:
- Tofu, tempeh, seitan, plant chicken, cauliflower wings → "chicken"
- Plant burgers, beyond/impossible, bean patties, lentil loaf → "beef"
- Plant sausage, coconut bacon, mushroom pulled "pork" → "pork"
- Oat/almond/soy milk, cashew cheese, coconut yogurt → "dairy"
- Mixed veggie dishes, grain bowls, salads → "chicken" (default, as the most common protein swap)

Write a vivid 1-2 sentence description of the meal that sounds appetizing and acknowledges what the person chose.

You MUST respond with ONLY valid JSON:
{
  "items": [
    {
      "name": "Crispy tofu stir-fry with vegetables",
      "meatEquivalent": "chicken",
      "portionGrams": 180
    }
  ],
  "description": "A colorful stir-fry bowl loaded with crispy golden tofu, snap peas, and bell peppers over jasmine rice — a hearty swap for the chicken version."
}

Portion reference: burger patty ~170g, chicken breast ~170g, glass of milk ~240g, cheese slice ~28g, steak ~225g, bowl of food ~300-400g total protein portion.`;

export async function analyzeMealImage(base64DataUrl, apiKey) {
  apiKey = apiKey || getEffectiveApiKey();
  if (!apiKey) throw new Error('No API key found. Add one in Settings (gear icon).');
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

  const parsed = JSON.parse(jsonMatch[0]);
  if (parsed.error === 'not_food') {
    throw new Error('NOT_FOOD');
  }
  return parsed;
}

export async function analyzeMealText(mealText, apiKey) {
  apiKey = apiKey || getEffectiveApiKey();
  if (!apiKey) throw new Error('No API key found. Add one in Settings (gear icon).');
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
