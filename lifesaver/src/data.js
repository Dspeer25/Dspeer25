export const IMPACT = {
  beef: { animals: 0.005, co2: 6.5, water: 660, emoji: '🐄', label: 'cows' },
  chicken: { animals: 0.04, co2: 2.5, water: 125, emoji: '🐔', label: 'chickens' },
  pork: { animals: 0.01, co2: 3.5, water: 300, emoji: '🐖', label: 'pigs' },
  dairy: { animals: 0.005, co2: 3.2, water: 400, emoji: '🐄', label: 'cows' },
};

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

export const HEADERS = [
  "Yeah… this could've been worse.",
  "Solid choice.",
  "Factory farms hate this.",
  "Not bad at all.",
  "The planet thanks you.",
];

export const FLAVOR_LINES = [
  "One less animal getting screwed over.",
  "Factory farms lost a tiny round.",
  "Not bad. Keep stacking these.",
  "Small win. They add up.",
  "Another meal, another life spared.",
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
      animals: acc.animals + m.animals,
      co2: acc.co2 + m.co2,
      water: acc.water + m.water,
      count: acc.count + 1,
    }),
    { animals: 0, co2: 0, water: 0, count: 0 }
  );
}
