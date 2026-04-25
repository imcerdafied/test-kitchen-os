const FOODISH_CATEGORIES = [
  'biryani',
  'burger',
  'butter-chicken',
  'dessert',
  'dosa',
  'idly',
  'pasta',
  'pizza',
  'rice',
  'samosa',
] as const;

type FoodishCategory = (typeof FOODISH_CATEGORIES)[number];

const KEYWORD_MAP: Record<string, FoodishCategory> = {
  pasta: 'pasta',
  spaghetti: 'pasta',
  linguine: 'pasta',
  penne: 'pasta',
  fettuccine: 'pasta',
  noodle: 'pasta',
  pizza: 'pizza',
  flatbread: 'pizza',
  burger: 'burger',
  sandwich: 'burger',
  wrap: 'burger',
  rice: 'rice',
  risotto: 'rice',
  pilaf: 'rice',
  fried_rice: 'rice',
  biryani: 'biryani',
  curry: 'butter-chicken',
  chicken: 'butter-chicken',
  tikka: 'butter-chicken',
  masala: 'butter-chicken',
  dessert: 'dessert',
  cake: 'dessert',
  cookie: 'dessert',
  brownie: 'dessert',
  pudding: 'dessert',
  sweet: 'dessert',
  chocolate: 'dessert',
  dosa: 'dosa',
  crepe: 'dosa',
  idli: 'idly',
  samosa: 'samosa',
};

function matchCategory(recipeName: string): FoodishCategory {
  const lower = recipeName.toLowerCase();
  for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  // Deterministic fallback based on recipe name hash
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = (hash * 31 + lower.charCodeAt(i)) | 0;
  }
  return FOODISH_CATEGORIES[Math.abs(hash) % FOODISH_CATEGORIES.length];
}

/**
 * Returns a deterministic Foodish image URL for a recipe name.
 * Uses the random endpoint scoped to a food category.
 */
export function getFoodishUrl(recipeName: string): string {
  const category = matchCategory(recipeName);
  // Use the category-specific random endpoint
  return `https://foodish-api.com/images/${category}/${category}${(Math.abs(hashCode(recipeName)) % 30) + 1}.jpg`;
}

/**
 * Fetches a random Foodish image URL via the API (for server-side use).
 */
export async function fetchFoodishUrl(recipeName: string): Promise<string> {
  const category = matchCategory(recipeName);
  try {
    const res = await fetch(
      `https://foodish-api.com/api/images/${category}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return data.image || getFoodishUrl(recipeName);
  } catch {
    return getFoodishUrl(recipeName);
  }
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return hash;
}
