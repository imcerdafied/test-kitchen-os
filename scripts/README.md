# Seed Scripts

Populate the Test Kitchen OS database with 500 realistic recipes.

## Prerequisites

- `.env.local` configured with `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `OPENAI_API_KEY`
- Supabase database migrations applied
- `tsx` installed globally or via npx

## Usage

### Step 1: Create the seed user

```bash
npm run seed:user
```

Creates a bot user (`seedbot@testkitchenos.com` / "Test Kitchen") in Supabase Auth that all seeded recipes will be attributed to. Safe to run multiple times — skips if user already exists.

### Step 2: Seed recipes

```bash
npm run seed:recipes
```

Generates 500 recipes across 10 cuisine categories using GPT-4o and saves them to Supabase. Each recipe gets a food photo from Unsplash.

**What it does:**
- Calls GPT-4o in batches of 10 recipes (50 API calls total)
- Fetches an Unsplash photo for each recipe
- Saves everything to the `recipes` table
- Logs progress for each recipe
- Skips failures and continues

**Cuisine categories (≈50 recipes each):**
Mediterranean, Asian fusion, Mexican, Indian, Middle Eastern, American comfort (healthy), Japanese, Thai, Italian, West African

**Timing:** Expect ~15-20 minutes depending on API response times.

## Cost Estimate

- ~50 GPT-4o API calls × ~4K tokens each ≈ $2-5 in OpenAI credits
- Unsplash Source API is free (no key required)
