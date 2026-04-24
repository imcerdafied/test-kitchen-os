import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { RecipeCard } from '@/components/RecipeCard';
import { HeroCollage } from '@/components/HeroCollage';
import { Recipe } from '@/types';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*, profiles(id, username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(30);

  return (
    <div>
      {/* Hero — masonry photo collage */}
      <section className="relative overflow-hidden" style={{ minHeight: '75vh' }}>
        {/* Masonry background */}
        <div className="absolute inset-0">
          <HeroCollage />
        </div>

        {/* Center overlay with headline */}
        <div className="hero-center-overlay">
          <div className="hero-scrim">
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-white"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              Turn your ingredients into{' '}
              <span className="text-terracotta-light">healthy, delicious</span>{' '}
              recipes
            </h1>
            <p className="text-base sm:text-lg text-white/75 mb-6 max-w-md mx-auto">
              Snap a photo, speak your ingredients, or type them in. Our AI
              creates beautiful, nutritious recipes you can share.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-terracotta text-white px-7 py-3 rounded-full font-semibold hover:bg-terracotta-light transition-colors text-base"
            >
              Create a Recipe <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Community Feed */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-foreground"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              Community Recipes
            </h2>
            <p className="text-warm-gray mt-1">
              Fresh from the test kitchen
            </p>
          </div>
        </div>

        {recipes && recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(recipes as Recipe[]).map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl border border-cream-300" style={{ background: 'var(--cream-200)' }}>
            <div className="text-6xl mb-4">🧪</div>
            <h3
              className="text-xl font-semibold text-foreground mb-2"
              style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              No recipes yet
            </h3>
            <p className="text-warm-gray mb-6">
              Be the first to create a recipe!
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-terracotta text-white px-6 py-3 rounded-full font-semibold hover:bg-terracotta-light transition-colors"
            >
              Create Recipe <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
