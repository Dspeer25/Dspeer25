// Impact per standard meal portion (~200g)
export const IMPACT = {
  beef: { animals: 0.005, co2: 6.5, water: 660, emoji: '🐄', label: 'cow', image: 'cow' },
  chicken: { animals: 0.04, co2: 2.5, water: 125, emoji: '🐔', label: 'chicken', image: 'chicken' },
  pork: { animals: 0.01, co2: 3.5, water: 300, emoji: '🐖', label: 'pig', image: 'pig' },
  dairy: { animals: 0.005, co2: 3.2, water: 400, emoji: '🐄', label: 'cow', image: 'cow' },
};

// Impact per gram (derived from above / 200g)
export const IMPACT_PER_GRAM = {
  beef:    { animals: 0.000025, co2: 0.0325, water: 3.3 },
  chicken: { animals: 0.0004,   co2: 0.0125, water: 0.625 },
  pork:    { animals: 0.00005,  co2: 0.0175, water: 1.5 },
  dairy:   { animals: 0.000025, co2: 0.016,  water: 2.0 },
};

// Keyword matching fallback
const BEEF_KEYWORDS = ['burger', 'steak', 'beef', 'brisket', 'ribs', 'meatball', 'ground meat', 'roast'];
const PORK_KEYWORDS = ['pork', 'bacon', 'ham', 'sausage', 'pepperoni', 'salami', 'bratwurst'];
const DAIRY_KEYWORDS = ['cheese', 'milk', 'yogurt', 'cream', 'butter', 'ice cream', 'latte', 'cappuccino'];

export function inferMeatType(meal) {
  const lower = meal.toLowerCase();
  if (BEEF_KEYWORDS.some(k => lower.includes(k))) return 'beef';
  if (PORK_KEYWORDS.some(k => lower.includes(k))) return 'pork';
  if (DAIRY_KEYWORDS.some(k => lower.includes(k))) return 'dairy';
  return 'chicken';
}

export function calculateImpactFromItems(items) {
  const byAnimal = {};
  let totalCo2 = 0;
  let totalWater = 0;

  for (const item of items) {
    const type = item.meatEquivalent || 'chicken';
    const grams = item.portionGrams || 200;
    const rates = IMPACT_PER_GRAM[type] || IMPACT_PER_GRAM.chicken;
    const info = IMPACT[type] || IMPACT.chicken;

    const animals = rates.animals * grams;
    totalCo2 += rates.co2 * grams;
    totalWater += rates.water * grams;

    if (!byAnimal[type]) {
      byAnimal[type] = { count: 0, label: info.label, image: info.image, emoji: info.emoji };
    }
    byAnimal[type].count += animals;
  }

  return { byAnimal, co2: totalCo2, water: totalWater };
}

export const HEADERS = [
  "Yeah… this could've been worse.",
  "Solid choice.",
  "Factory farms hate this.",
  "Not bad at all.",
  "The planet just caught a break.",
  "One less nightmare for them.",
];

export const FLAVOR_LINES = [
  "One less animal getting screwed over.",
  "Factory farms lost a tiny round.",
  "Not bad. Keep stacking these.",
  "Small win. They add up.",
  "Another meal, another life spared.",
  "This is what change looks like.",
];

export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function loadMeals() {
  try {
    return JSON.parse(localStorage.getItem('lifesaver_meals') || '[]');
  } catch {
    return [];
  }
}

export function saveMeal(entry) {
  const meals = loadMeals();
  meals.push(entry);
  localStorage.setItem('lifesaver_meals', JSON.stringify(meals));
}

export function getTotals() {
  const meals = loadMeals();
  return meals.reduce(
    (acc, m) => ({
      animals: acc.animals + (m.animals || 0),
      co2: acc.co2 + (m.co2 || 0),
      water: acc.water + (m.water || 0),
      count: acc.count + 1,
    }),
    { animals: 0, co2: 0, water: 0, count: 0 }
  );
}

export function getApiKey() {
  return localStorage.getItem('lifesaver_api_key') || '';
}

export function setApiKey(key) {
  localStorage.setItem('lifesaver_api_key', key);
}

// Resize image for API (max 1024px, returns base64)
export function resizeImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1024;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = (h / w) * maxDim; w = maxDim; }
          else { w = (w / h) * maxDim; h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
