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

// Extract a specific food keyword from a recipe name
function extractKeyword(name: string): string {
  const lower = name.toLowerCase();

  // Common food words to look for (ordered by specificity)
  const foodTerms = [
    // Proteins
    "chicken", "salmon", "shrimp", "beef", "lamb", "pork", "tofu", "tuna",
    "turkey", "duck", "cod", "tilapia", "mahi", "halibut", "scallop",
    "prawn", "crab", "lobster", "sausage", "meatball",
    // Dishes
    "risotto", "pasta", "ramen", "pho", "curry", "stew", "soup", "chowder",
    "tacos", "taco", "burrito", "enchilada", "pizza", "flatbread",
    "salad", "bowl", "wrap", "sandwich", "burger",
    "pancake", "waffle", "omelette", "frittata",
    "pie", "cake", "pudding", "mousse",
    // Vegetables / grains
    "mushroom", "cauliflower", "eggplant", "broccoli", "squash", "zucchini",
    "sweet potato", "kale", "spinach", "avocado", "artichoke",
    "quinoa", "farro", "couscous", "rice", "lentil", "chickpea",
    // Flavor profiles
    "teriyaki", "tikka", "masala", "miso", "harissa", "chimichurri",
    "pesto", "marinara", "alfredo", "coconut", "ginger", "turmeric",
  ];

  // Find matching food terms
  const matches: string[] = [];
  for (const term of foodTerms) {
    if (lower.includes(term)) {
      matches.push(term);
      if (matches.length >= 2) break;
    }
  }

  if (matches.length > 0) {
    return matches.join(" ") + " dish";
  }

  // Fallback: take the most "food-like" words from the name
  const stopWords = new Set([
    "with", "and", "the", "in", "on", "a", "of", "style", "inspired",
    "roasted", "grilled", "baked", "seared", "pan", "fried", "braised",
    "slow", "cooked", "fresh", "crispy", "spicy", "creamy", "warm",
    "cold", "light", "hearty", "classic", "traditional", "homemade",
  ]);

  const words = lower.replace(/[^a-z\s]/g, "").split(/\s+/).filter(
    (w) => w.length > 2 && !stopWords.has(w)
  );

  return (words.slice(0, 3).join(" ") || "healthy food") + " dish";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== Fix Recipe Images v2 ===\n");

  // Fetch all 500 recipes
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, name, image_url")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch recipes:", error.message);
    process.exit(1);
  }

  if (!recipes || recipes.length === 0) {
    console.log("No recipes found!");
    return;
  }

  console.log(`Found ${recipes.length} recipes to update.\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const keyword = extractKeyword(recipe.name);

    try {
      // Fetch Unsplash source URL with redirect:follow to get stable resolved URL
      const unsplashUrl = `https://source.unsplash.com/800x600/?food,${encodeURIComponent(keyword)}&sig=${i}`;
      const res = await fetch(unsplashUrl, { redirect: "follow" });
      const resolvedUrl = res.url;

      // Update in Supabase
      const { error: updateError } = await supabase
        .from("recipes")
        .update({ image_url: resolvedUrl })
        .eq("id", recipe.id);

      if (updateError) {
        console.error(`  FAIL ${i + 1}/${recipes.length}: ${recipe.name} — ${updateError.message}`);
        failed++;
      } else {
        updated++;
        console.log(`${i + 1}/${recipes.length}: ${recipe.name}`);
      }
    } catch (err: any) {
      console.error(`  FAIL ${i + 1}/${recipes.length}: ${recipe.name} — ${err.message}`);
      failed++;
    }

    // 150ms delay between each
    await sleep(150);
  }

  console.log(`\n=== Done ===`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${recipes.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
