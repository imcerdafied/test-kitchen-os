'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Recipe } from '@/types';
import { RecipeCard } from './RecipeCard';
import { Search } from 'lucide-react';

const CUISINES = [
  'All',
  'Mediterranean',
  'Asian',
  'Mexican',
  'Indian',
  'Middle Eastern',
  'American',
  'Japanese',
  'Thai',
  'Italian',
  'West African',
];

const PAGE_SIZE = 100;

export function RecipeFeed({ initialRecipes }: { initialRecipes: Recipe[] }) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialRecipes.length === PAGE_SIZE);

  const filtered = useMemo(() => {
    let result = recipes;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.ingredients_list.some((i) => i.toLowerCase().includes(q)) ||
          r.nutritional_highlights.some((n) => n.toLowerCase().includes(q))
      );
    }

    if (cuisine !== 'All') {
      const c = cuisine.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(c) ||
          r.description.toLowerCase().includes(c)
      );
    }

    return result;
  }, [recipes, search, cuisine]);

  async function loadMore() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .range(recipes.length, recipes.length + PAGE_SIZE - 1);

    if (data && data.length > 0) {
      setRecipes((prev) => [...prev, ...(data as Recipe[])]);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  }

  return (
    <div>
      {/* Search bar section */}
      <section className="pt-10 pb-6 px-4 sm:px-6 text-center">
        <h1
          className="text-2xl sm:text-3xl font-bold text-foreground mb-2"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          What is in your kitchen?
        </h1>
        <p className="text-sm text-warm-gray mb-5">
          Healthy recipes from what you already have. Less waste, more flavor.
        </p>

        <div className="max-w-2xl mx-auto mb-4 relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray"
          />
          <input
            type="text"
            placeholder="Search recipes, ingredients, or cuisine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-full border border-cream-300 bg-white text-foreground placeholder:text-warm-gray focus:outline-none focus:ring-2 focus:ring-herb/30 focus:border-herb text-[16px] shadow-sm"
          />
        </div>

        {/* Cuisine pills */}
        <div className="max-w-3xl mx-auto flex overflow-x-auto sm:flex-wrap sm:justify-center gap-2 mb-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {CUISINES.map((c) => (
            <button
              key={c}
              onClick={() => setCuisine(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                cuisine === c
                  ? 'bg-foreground text-white'
                  : 'bg-cream-200 text-warm-gray hover:bg-cream-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="text-xs sm:text-sm text-warm-gray mt-3">
          {filtered.length} recipe{filtered.length !== 1 ? 's' : ''}
        </p>
      </section>

      {/* Masonry grid */}
      <section className="px-3 sm:px-4 lg:px-6 pb-12">
        <div className="masonry-grid max-w-[1600px] mx-auto">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-warm-gray py-20 text-lg">
            No recipes match your search.
          </p>
        )}

        {hasMore && !search && cuisine === 'All' && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-8 py-3 rounded-full bg-foreground text-white font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load more recipes'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
