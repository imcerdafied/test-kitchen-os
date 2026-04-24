import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const openai = new OpenAI({ apiKey: openaiKey });

const SEED_EMAIL = "seedbot@testkitchenos.com";
const BATCH_SIZE = 10;
const TOTAL_RECIPES = 500;
const DELAY_MS = 100;

const CUISINE_CATEGORIES = [
  "Mediterranean",
  "Asian fusion",
  "Mexican",
  "Indian",
  "Middle Eastern",
  "American comfort (healthy)",
  "Japanese",
  "Thai",
  "Italian",
  "West African",
];

interface GeneratedRecipe {
  name: string;
  description: string;
  ingredients_list: string[];
  instructions: string[];
  nutritional_highlights: string[];
  prep_time: string;
  cook_time: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function getSeedUserId(): Promise<string> {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) throw new Error(`Failed to list users: ${error.message}`);

  const seedUser = users.users.find((u) => u.email === SEED_EMAIL);
  if (!seedUser) {
    throw new Error(
      `Seed user not found. Run "npm run seed:user" first.`
    );
  }
  return seedUser.id;
}

async function generateRecipeBatch(
  cuisine: string,
  batchIndex: number
): Promise<GeneratedRecipe[]> {
  const prompt = `Generate exactly ${BATCH_SIZE} unique, healthy ${cuisine} recipes. Each recipe should be realistic, delicious, and emphasize whole foods and balanced nutrition.

Return a JSON array of ${BATCH_SIZE} recipe objects. Each object must have:
- "name": string (creative, appetizing name)
- "description": string (2-3 sentences describing the dish)
- "ingredients_list": string[] (each ingredient with quantity, e.g. "2 cups quinoa")
- "instructions": string[] (step-by-step cooking instructions, 4-8 steps)
- "nutritional_highlights": string[] (3-5 highlights like "High in protein", "Rich in omega-3")
- "prep_time": string (e.g. "15 minutes")
- "cook_time": string (e.g. "30 minutes")

Make each recipe unique and varied within the ${cuisine} cuisine. Include a mix of:
- Breakfast, lunch, dinner, and snack options
- Various protein sources (plant-based and animal-based)
- Different cooking methods (grilled, baked, raw, steamed, etc.)

Batch ${batchIndex + 1} — make these distinct from typical/common recipes. Be creative!

Return ONLY the JSON array, no markdown formatting or code blocks.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty response from OpenAI");

  // Strip markdown code fences if present
  const jsonStr = content.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");

  try {
    const recipes = JSON.parse(jsonStr);
    if (!Array.isArray(recipes)) throw new Error("Response is not an array");
    return recipes;
  } catch (e) {
    throw new Error(`Failed to parse recipes JSON: ${(e as Error).message}`);
  }
}

async function getUnsplashImageUrl(recipeName: string): Promise<string | null> {
  try {
    // Build a search keyword from the recipe name
    const keywords = recipeName
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 3)
      .join(",");

    const searchTerm = keywords || "healthy food";
    const url = `https://source.unsplash.com/800x600/?${encodeURIComponent(searchTerm)},food`;

    // Follow the redirect to get the actual image URL
    const response = await fetch(url, { redirect: "follow" });
    if (response.ok) {
      return response.url;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveRecipe(
  recipe: GeneratedRecipe,
  userId: string,
  imageUrl: string | null
): Promise<boolean> {
  const { error } = await supabase.from("recipes").insert({
    user_id: userId,
    name: recipe.name,
    description: recipe.description,
    ingredients_input: recipe.ingredients_list.join(", "),
    ingredients_list: recipe.ingredients_list,
    instructions: recipe.instructions,
    nutritional_highlights: recipe.nutritional_highlights,
    prep_time: recipe.prep_time,
    cook_time: recipe.cook_time,
    image_url: imageUrl,
  });

  if (error) {
    console.error(`  Failed to save "${recipe.name}": ${error.message}`);
    return false;
  }
  return true;
}

async function main() {
  console.log("=== Test Kitchen OS — Recipe Seeder ===\n");

  // Get seed user
  console.log("Looking up seed user...");
  const userId = await getSeedUserId();
  console.log(`Seed user ID: ${userId}\n`);

  let totalSaved = 0;
  let totalFailed = 0;
  let recipeNumber = 0;

  // 50 batches × 10 recipes = 500 total
  // 5 batches per cuisine × 10 cuisines = 50 batches
  const batchesPerCuisine = Math.ceil(
    TOTAL_RECIPES / BATCH_SIZE / CUISINE_CATEGORIES.length
  );

  for (let cuisineIdx = 0; cuisineIdx < CUISINE_CATEGORIES.length; cuisineIdx++) {
    const cuisine = CUISINE_CATEGORIES[cuisineIdx];
    console.log(`\n--- ${cuisine} (${batchesPerCuisine} batches) ---\n`);

    for (let batchIdx = 0; batchIdx < batchesPerCuisine; batchIdx++) {
      const batchNum =
        cuisineIdx * batchesPerCuisine + batchIdx + 1;
      const totalBatches = CUISINE_CATEGORIES.length * batchesPerCuisine;

      console.log(
        `Generating batch ${batchNum}/${totalBatches} (${cuisine} #${batchIdx + 1})...`
      );

      let recipes: GeneratedRecipe[];
      try {
        recipes = await generateRecipeBatch(cuisine, batchIdx);
      } catch (err) {
        console.error(
          `  Batch generation failed: ${(err as Error).message}`
        );
        totalFailed += BATCH_SIZE;
        recipeNumber += BATCH_SIZE;
        continue;
      }

      for (const recipe of recipes) {
        recipeNumber++;
        console.log(
          `Seeding recipe ${recipeNumber}/${TOTAL_RECIPES}: ${recipe.name}...`
        );

        // Fetch image
        const imageUrl = await getUnsplashImageUrl(recipe.name);

        // Save to database
        const saved = await saveRecipe(recipe, userId, imageUrl);
        if (saved) {
          totalSaved++;
        } else {
          totalFailed++;
        }

        // Rate limit
        await delay(DELAY_MS);
      }
    }
  }

  console.log(`\n=== Seeding Complete ===`);
  console.log(`  Saved: ${totalSaved}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log(`  Total: ${totalSaved + totalFailed}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
