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

    // Key by animal label (cow/chicken/pig) so beef+dairy merge into one "cow" entry
    const animalKey = info.label;
    if (!byAnimal[animalKey]) {
      byAnimal[animalKey] = { count: 0, label: info.label, image: info.image, emoji: info.emoji };
    }
    byAnimal[animalKey].count += animals;
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

// CO2 facts based on lbs saved
export function CO2_FACTS(lbs) {
  const miles = (lbs / 0.9).toFixed(1);
  const phones = Math.round(lbs * 25);
  const balloons = Math.round(lbs * 8.5);
  const breaths = Math.round(lbs * 110);
  const bulbHours = Math.round(lbs * 15);
  const treeMinutes = Math.round(lbs * 45);
  const facts = [
    `That's like not driving ${miles} miles. Imagine that stretch of highway staying clean.`,
    `That much CO2 could fill ${balloons.toLocaleString()} party balloons with toxic gas. Not today.`,
    `A tree would need ${treeMinutes} minutes of photosynthesis to absorb this much CO2.`,
    `That's enough CO2 to charge a phone ${phones.toLocaleString()} times. Kept out of the sky instead.`,
    `You just prevented the equivalent of ${breaths.toLocaleString()} human breaths worth of CO2 from polluting the air.`,
    `That could've powered a lightbulb for ${bulbHours} hours. Instead, it stayed out of the atmosphere.`,
  ];
  return facts[Math.floor(Math.random() * facts.length)];
}

// Crop sets for rotation (gallons per unit)
export const CROP_SETS = [
  [
    { emoji: '🥬', name: 'heads of lettuce', calc: (gal) => Math.round(gal / 4) },
    { emoji: '🍅', name: 'tomato plants', calc: (gal) => Math.round(gal / 3.5) },
    { emoji: '🥔', name: 'lbs of potatoes', calc: (gal) => Math.round(gal / 25) },
  ],
  [
    { emoji: '🥕', name: 'lbs of carrots', calc: (gal) => Math.round(gal / 6.8) },
    { emoji: '🫑', name: 'bell peppers', calc: (gal) => Math.round(gal / 7) },
    { emoji: '🍓', name: 'pints of strawberries', calc: (gal) => Math.round(gal / 10) },
  ],
  [
    { emoji: '🌽', name: 'ears of corn', calc: (gal) => Math.round(gal / 10) },
    { emoji: '🥦', name: 'heads of broccoli', calc: (gal) => Math.round(gal / 5.5) },
    { emoji: '🍌', name: 'bananas', calc: (gal) => Math.round(gal / 2) },
  ],
  [
    { emoji: '🍇', name: 'bunches of grapes', calc: (gal) => Math.round(gal / 12) },
    { emoji: '🧅', name: 'onions', calc: (gal) => Math.round(gal / 5) },
    { emoji: '🥒', name: 'cucumbers', calc: (gal) => Math.round(gal / 4.5) },
  ],
  [
    { emoji: '🍑', name: 'peaches', calc: (gal) => Math.round(gal / 9) },
    { emoji: '🥜', name: 'oz of peanuts', calc: (gal) => Math.round(gal / 4.7) },
    { emoji: '🫘', name: 'lbs of beans', calc: (gal) => Math.round(gal / 14) },
  ],
];

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
  const totals = meals.reduce(
    (acc, m) => {
      acc.animals += (m.animals || 0);
      acc.co2 += (m.co2 || 0);
      acc.water += (m.water || 0);
      acc.count += 1;
      // Aggregate by animal type
      if (m.byAnimal) {
        for (const [type, data] of Object.entries(m.byAnimal)) {
          if (!acc.byAnimal[type]) {
            acc.byAnimal[type] = { count: 0, label: data.label, emoji: data.emoji };
          }
          acc.byAnimal[type].count += data.count || 0;
        }
      }
      return acc;
    },
    { animals: 0, co2: 0, water: 0, count: 0, byAnimal: {} }
  );
  return totals;
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
