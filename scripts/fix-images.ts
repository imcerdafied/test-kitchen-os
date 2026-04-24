import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load env vars from .env.local
function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env.local");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Curated Unsplash food photo IDs — high quality, appetizing food photography
// Each entry: [photo-id, category keywords]
const FOOD_PHOTOS: [string, string[]][] = [
  // Chicken / poultry
  ["1604908176997-125f25cc6f3d", ["chicken", "poultry", "turkey", "duck"]],
  ["1598103442097-8b74df5680bf", ["chicken", "poultry", "wings"]],
  ["1588168333986-5078d3ae3976", ["chicken", "roasted"]],
  // Beef / meat
  ["1546964124-0cce460f38ef", ["beef", "steak", "meat"]],
  ["1558030006-450675393462", ["beef", "burger"]],
  ["1529692236671-f1f6cf9683ba", ["meat", "lamb", "pork"]],
  // Fish / seafood
  ["1467003909585-2f8a72700288", ["fish", "salmon", "seafood", "cod", "bass"]],
  ["1519708227418-b869ee69c752", ["seafood", "shrimp", "prawn"]],
  ["1580476262798-bddd9f4b7369", ["fish", "tuna", "seared"]],
  // Pasta / noodles
  ["1551183053-bf91a1d81141", ["pasta", "spaghetti", "noodle", "penne", "orzo"]],
  ["1563379926898-05f4575a45d8", ["pasta", "linguine", "fettuccine"]],
  ["1612929633738-8b44f8e17f2c", ["ramen", "noodle", "pho"]],
  // Rice / grain bowls
  ["1512058564366-18510be2db87", ["rice", "risotto", "grain", "faro"]],
  ["1543339308-75a27c3d2058", ["bowl", "rice", "quinoa"]],
  ["1547592180-85f173990554", ["bowl", "grain", "buddha"]],
  // Salad / vegetables
  ["1512621776951-a57141f2eefd", ["salad", "vegetable", "greens"]],
  ["1540420773420-3366772f4999", ["salad", "arugula", "spinach"]],
  ["1607532941433-304659e8198a", ["salad", "fresh"]],
  // Soup / stew
  ["1547592166-23ac45744acd", ["soup", "stew", "broth", "chowder"]],
  ["1603105037880-880cd4bf4455", ["soup", "lentil", "bean"]],
  ["1534938665831-8ef75c2cef24", ["soup", "tomato", "bisque"]],
  // Curry / Indian / Asian
  ["1565557623262-b51c2513a641", ["curry", "indian", "masala", "tikka", "dal"]],
  ["1585937421612-70a008356fbe", ["curry", "thai", "coconut"]],
  ["1455619452474-d2be8b1e70cd", ["asian", "stir", "wok"]],
  // Mexican / Latin
  ["1565299585323-38d6b0865b47", ["taco", "mexican", "burrito", "enchilada"]],
  ["1551504734-5ee1c4a1479b", ["taco", "tortilla"]],
  ["1564767609342-620cb19b2357", ["mexican", "guacamole", "salsa"]],
  // Mediterranean
  ["1540914124281-342587941389", ["mediterranean", "hummus", "falafel"]],
  ["1576021182211-cd6ac23f8c71", ["mediterranean", "greek", "olive"]],
  ["1505253468034-514d2507d914", ["middle eastern", "kebab", "shawarma"]],
  // Pizza / flatbread
  ["1565299624946-b28f40a0ae38", ["pizza", "flatbread", "crostini"]],
  ["1571407970349-bc81e7e96d47", ["pizza", "dough"]],
  // Breakfast
  ["1525351484163-7529414344d8", ["breakfast", "pancake", "waffle", "french toast"]],
  ["1482049016530-d981e8ae2b4c", ["breakfast", "egg", "omelette", "frittata"]],
  ["1484723091996-f832860991c1", ["breakfast", "yogurt", "parfait", "granola"]],
  // Dessert / sweet
  ["1488477181946-6428a0291777", ["dessert", "cake", "sweet", "pudding"]],
  ["1551024506-0bccd828d307", ["dessert", "chocolate"]],
  ["1495147466023-ac5c588e2e94", ["fruit", "berry", "pear", "fig"]],
  // Bread / baked
  ["1509440159596-0249088772ff", ["bread", "toast", "baked", "stuffed"]],
  ["1555507036-ab1f4038024a", ["bread", "sourdough"]],
  // Vegetables / plant-based
  ["1543362906-acfc16c67564", ["vegetarian", "eggplant", "cauliflower", "tofu"]],
  ["1540420773420-3366772f4999", ["vegetable", "roasted"]],
  ["1574484284002-952d92456975", ["vegan", "plant", "bean", "chickpea", "lentil"]],
  // Drinks / smoothie
  ["1505252585461-04db1eb84625", ["smoothie", "drink", "juice"]],
  // General appetizing food
  ["1476224203421-9ac39bcb3327", ["food", "plate", "dinner"]],
  ["1504674900247-0877df9cc836", ["food", "cooking", "kitchen"]],
  ["1490645935967-10de6ba17061", ["food", "appetizer", "snack"]],
  ["1493770348161-369560ae357d", ["food", "fresh", "healthy"]],
  ["1498837167922-ddd27525d352", ["food", "colorful", "wrap"]],
  ["1567306226416-28f0efdc88ce", ["food", "gourmet", "plated"]],
];

function extractKeywords(recipeName: string): string[] {
  return recipeName
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function findBestPhoto(recipeName: string, index: number): string {
  const keywords = extractKeywords(recipeName);

  // Score each photo by keyword overlap
  let bestScore = -1;
  let bestId = FOOD_PHOTOS[0][0];

  for (const [photoId, tags] of FOOD_PHOTOS) {
    let score = 0;
    for (const keyword of keywords) {
      for (const tag of tags) {
        if (tag.includes(keyword) || keyword.includes(tag)) {
          score += 2;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = photoId;
    }
  }

  // If no match, use index to cycle through photos for variety
  if (bestScore === 0) {
    bestId = FOOD_PHOTOS[index % FOOD_PHOTOS.length][0];
  }

  return `https://images.unsplash.com/photo-${bestId}?w=800&h=600&fit=crop&auto=format&q=80`;
}

async function main() {
  console.log("=== Fix Recipe Images ===\n");

  // Fetch recipes with broken or missing images
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, name, image_url")
    .or("image_url.is.null,image_url.like.%source.unsplash.com%");

  if (error) {
    console.error("Failed to fetch recipes:", error.message);
    process.exit(1);
  }

  if (!recipes || recipes.length === 0) {
    console.log("No recipes need fixing!");
    return;
  }

  console.log(`Found ${recipes.length} recipes to fix.\n`);

  let fixed = 0;
  let failed = 0;

  // Process in batches of 50 for faster updates
  const BATCH_SIZE = 50;
  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);
    const updates = batch.map((recipe, batchIdx) => {
      const imageUrl = findBestPhoto(recipe.name, i + batchIdx);
      return { id: recipe.id, name: recipe.name, imageUrl };
    });

    // Update each recipe in the batch
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("recipes")
        .update({ image_url: update.imageUrl })
        .eq("id", update.id);

      if (updateError) {
        console.error(`  Failed: "${update.name}": ${updateError.message}`);
        failed++;
      } else {
        fixed++;
        const num = i + updates.indexOf(update) + 1;
        console.log(
          `Fixing image ${num}/${recipes.length}: ${update.name} → ${update.imageUrl.slice(0, 70)}...`
        );
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Fixed: ${fixed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${recipes.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
