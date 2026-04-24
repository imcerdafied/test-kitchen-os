import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { RecipeCard } from '@/components/RecipeCard';
import { Logo } from '@/components/Logo';
import { Recipe } from '@/types';
import { ArrowRight, Camera, Mic, Type } from 'lucide-react';

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
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-900 via-green-800 to-green-700 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-green-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-300 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
          <div className="max-w-2xl">
            <div className="mb-6 opacity-80">
              <Logo size="lg" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 [&>span]:text-green-300">
              Turn your ingredients into{' '}
              <span>healthy, delicious</span> recipes
            </h1>
            <p className="text-lg sm:text-xl text-green-100/80 mb-8 max-w-lg">
              Snap a photo of your fridge, speak your ingredients, or type them
              in. Our AI creates beautiful, nutritious recipes you can share.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 bg-white text-green-900 px-6 py-3 rounded-full font-semibold hover:bg-cream-200 transition-colors"
              >
                Create a Recipe <ArrowRight size={18} />
              </Link>
            </div>

            {/* Input method badges */}
            <div className="flex flex-wrap gap-4 mt-10 text-sm text-green-200/70">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-700/50 rounded-lg">
                  <Camera size={16} />
                </div>
                Photo upload
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-700/50 rounded-lg">
                  <Mic size={16} />
                </div>
                Voice input
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-700/50 rounded-lg">
                  <Type size={16} />
                </div>
                Text input
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Feed */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-green-900">
              Community Recipes
            </h2>
            <p className="text-green-700/60 mt-1">
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
          <div className="text-center py-20 bg-white rounded-2xl border border-cream-300/50">
            <div className="text-6xl mb-4">🧪</div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">
              No recipes yet
            </h3>
            <p className="text-green-700/60 mb-6">
              Be the first to create a recipe!
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-800 transition-colors"
            >
              Create Recipe <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
