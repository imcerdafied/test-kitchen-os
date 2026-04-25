import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LikeButton } from '@/components/LikeButton';
import { RecipeHeroImage } from '@/components/RecipeHeroImage';
import { Recipe } from '@/types';
import { Clock, ChefHat, Check, ArrowLeft, User } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: recipe } = await supabase
    .from('recipes')
    .select('name, description')
    .eq('id', id)
    .single();

  if (!recipe) return { title: 'Recipe Not Found' };
  return {
    title: `${recipe.name} — Test Kitchen OS`,
    description: recipe.description,
  };
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('recipes')
    .select('*, profiles(id, username, avatar_url)')
    .eq('id', id)
    .single();

  if (!data) notFound();
  const recipe = data as Recipe;

  return (
    <div className="min-h-screen" style={{ background: '#fdf8f3' }}>
      {/* Hero image */}
      <div className="relative w-full h-[280px] sm:h-[400px] overflow-hidden">
        <RecipeHeroImage recipe={recipe} />
        {/* Scrim overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 inline-flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-4 py-2.5 rounded-full transition-colors min-h-[44px]"
        >
          <ArrowLeft size={16} /> Back to feed
        </Link>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <h1
            className="text-3xl sm:text-5xl font-bold text-white drop-shadow-lg max-w-3xl"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            {recipe.name}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Description + like */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <p className="text-lg leading-relaxed" style={{ color: '#5a4a3a' }}>
            {recipe.description}
          </p>
          <LikeButton recipeId={recipe.id} initialLikes={recipe.likes_count} />
        </div>

        {/* Author row */}
        <Link
          href={`/profile/${recipe.user_id}`}
          className="inline-flex items-center gap-2 mb-8 group"
        >
          {recipe.profiles?.avatar_url ? (
            <Image
              src={recipe.profiles.avatar_url}
              alt=""
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#c4704b22' }}>
              <User size={14} style={{ color: '#c4704b' }} />
            </div>
          )}
          <span className="font-medium group-hover:opacity-70 transition-opacity" style={{ color: '#5a4a3a' }}>
            {recipe.profiles?.username || 'Anonymous'}
          </span>
          <span className="text-sm" style={{ color: '#9a8a7a' }}>
            {new Date(recipe.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </Link>

        {/* Meta badges row */}
        <div className="flex flex-wrap gap-3 mb-8">
          {recipe.prep_time && (
            <span
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: '#c4704b18', color: '#c4704b' }}
            >
              <Clock size={14} /> Prep: {recipe.prep_time}
            </span>
          )}
          {recipe.cook_time && (
            <span
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: '#c4704b18', color: '#c4704b' }}
            >
              <Clock size={14} /> Cook: {recipe.cook_time}
            </span>
          )}
          {recipe.nutritional_highlights?.map((h, i) => (
            <span
              key={i}
              className="inline-flex items-center px-3 py-2 rounded-full text-sm"
              style={{ background: '#e8dfd4', color: '#5a4a3a' }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Two-column layout: ingredients + instructions */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8">
          {/* Ingredients */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: '#e8dfd4' }}>
            <h3
              className="text-lg font-bold mb-4 flex items-center gap-2"
              style={{ color: '#c4704b', fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              <ChefHat size={20} /> Ingredients
            </h3>
            <ul className="space-y-3">
              {recipe.ingredients_list.map((ing, i) => (
                <li key={i} className="flex items-start gap-2.5" style={{ color: '#5a4a3a' }}>
                  <Check size={16} className="mt-0.5 shrink-0" style={{ color: '#c4704b' }} />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: '#e8dfd4' }}>
            <h3
              className="text-lg font-bold mb-4"
              style={{ color: '#c4704b', fontFamily: 'var(--font-playfair), Georgia, serif' }}
            >
              Instructions
            </h3>
            <ol className="space-y-5">
              {recipe.instructions.map((inst, i) => (
                <li key={i} className="flex gap-4" style={{ color: '#5a4a3a' }}>
                  <span
                    className="shrink-0 w-8 h-8 rounded-full text-white text-sm flex items-center justify-center font-semibold"
                    style={{ background: '#c4704b' }}
                  >
                    {i + 1}
                  </span>
                  <p className="pt-1 leading-relaxed">{inst}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Original ingredients input */}
        {recipe.ingredients_input && (
          <div className="mt-8 rounded-2xl p-5" style={{ background: '#e8dfd422' }}>
            <h3 className="text-sm font-medium mb-2 uppercase tracking-wide" style={{ color: '#9a8a7a' }}>
              Original Ingredients Input
            </h3>
            <p className="text-sm" style={{ color: '#7a6a5a' }}>{recipe.ingredients_input}</p>
          </div>
        )}
      </div>
    </div>
  );
}
