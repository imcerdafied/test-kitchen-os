# Test Kitchen OS

A community recipe app where users input ingredients (via photo, voice, or text), get healthy AI-generated recipes with AI-generated food images, and share them in a community feed.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — dark green + cream palette
- **Supabase** — auth, database, storage
- **OpenAI API** — GPT-4o (recipe generation + ingredient recognition) + DALL-E 3 (food images)
- **Vercel** — deployment target

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd test-kitchen-os
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration SQL in your Supabase SQL editor:
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy and paste into the SQL editor
   - Click "Run"
3. Enable **Google OAuth** (optional):
   - Go to Authentication → Providers → Google
   - Add your Google OAuth client ID and secret
   - Set the redirect URL to `http://localhost:3000/auth/callback`

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings → API
- `OPENAI_API_KEY` — from [platform.openai.com](https://platform.openai.com)

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **3 ingredient input methods**: photo upload (GPT-4o vision), voice (Web Speech API), text
- **AI recipe generation**: healthy, Mediterranean-style, low glycemic, high protein
- **AI food image generation**: DALL-E 3 professional food photography
- **Community feed**: browse, like, and save recipes
- **Auth**: email/password + Google OAuth via Supabase
- **Profiles**: view user profiles and their recipes

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page + community recipe feed |
| `/create` | Create recipe (ingredient input → AI generation) |
| `/recipe/[id]` | Full recipe detail page |
| `/profile/[id]` | User profile + their recipes |
| `/auth` | Login / signup |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/identify-ingredients` | POST | GPT-4o vision ingredient identification |
| `/api/generate-recipe` | POST | GPT-4o recipe generation |
| `/api/generate-image` | POST | DALL-E 3 food image generation |

## Deployment

Deploy to Vercel:

```bash
npx vercel
```

Set the same environment variables in your Vercel project settings.

## License

MIT
