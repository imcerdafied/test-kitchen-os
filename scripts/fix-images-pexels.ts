/**
 * Fix recipe images using Pexels API.
 *
 * Replaces broken/missing image_url values in Supabase with high-quality
 * Pexels food photos. Requires PEXELS_API_KEY in .env.local.
 *
 * Usage:
 *   npx tsx scripts/fix-images-pexels.ts
 *   npx tsx scripts/fix-images-pexels.ts --dry-run   # preview without updating
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

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
const pexelsKey = process.env.PEXELS_API_KEY;

if (!pexelsKey) {
  console.error(
    "Error: PEXELS_API_KEY is not set in .env.local\n" +
      "Get a free key at https://www.pexels.com/api/new/ and add it to .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DRY_RUN = process.argv.includes("--dry-run");
const DELAY_MS = 250; // respect Pexels rate limit (200 req/hr)
const BATCH_SIZE = 50;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPexelsImage(recipeName: string): Promise<string | null> {
  // Build a food-focused search query from the recipe name
  const keywords = recipeName
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .join(" ");

  const query = encodeURIComponent(`${keywords || recipeName} food`);
  const randomPage = Math.floor(Math.random() * 50) + 1;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=1&page=${randomPage}`,
      {
        headers: { Authorization: pexelsKey! },
      }
    );

    if (!res.ok) {
      console.warn(`  Pexels API returned ${res.status} for "${recipeName}"`);
      return null;
    }

    const data = await res.json();
    const photo = data.photos?.[0];
    return photo?.src?.large || null;
  } catch (err) {
    console.warn(
      `  Pexels fetch failed for "${recipeName}": ${(err as Error).message}`
    );
    return null;
  }
}

async function main() {
  console.log("=== Fix Recipe Images with Pexels ===\n");
  if (DRY_RUN) console.log("DRY RUN — no updates will be written\n");

  let offset = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  while (true) {
    // Fetch recipes that have broken or missing images
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select("id, name, image_url")
      .or("image_url.is.null,image_url.like.%source.unsplash.com%")
      .range(offset, offset + BATCH_SIZE - 1)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(`Database query failed: ${error.message}`);
      process.exit(1);
    }

    if (!recipes || recipes.length === 0) break;

    console.log(
      `Processing batch of ${recipes.length} recipes (offset ${offset})...\n`
    );

    for (const recipe of recipes) {
      console.log(`[${recipe.id}] "${recipe.name}"`);
      console.log(`  Current: ${recipe.image_url || "(null)"}`);

      const newUrl = await fetchPexelsImage(recipe.name);

      if (!newUrl) {
        console.log("  -> No Pexels result, skipping");
        totalSkipped++;
        await delay(DELAY_MS);
        continue;
      }

      console.log(`  -> ${newUrl}`);

      if (!DRY_RUN) {
        const { error: updateErr } = await supabase
          .from("recipes")
          .update({ image_url: newUrl })
          .eq("id", recipe.id);

        if (updateErr) {
          console.log(`  -> UPDATE FAILED: ${updateErr.message}`);
          totalFailed++;
        } else {
          console.log("  -> Updated");
          totalUpdated++;
        }
      } else {
        console.log("  -> Would update (dry run)");
        totalUpdated++;
      }

      await delay(DELAY_MS);
    }

    offset += recipes.length;
  }

  console.log("\n=== Summary ===");
  console.log(`  Updated: ${totalUpdated}`);
  console.log(`  Skipped: ${totalSkipped}`);
  console.log(`  Failed:  ${totalFailed}`);
  if (DRY_RUN) console.log("  (dry run — no actual changes made)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
