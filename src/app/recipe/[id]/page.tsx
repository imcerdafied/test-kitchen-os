import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LikeButton } from '@/components/LikeButton';
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-green-700/60 hover:text-green-800 text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to feed
      </Link>

      {/* Image */}
      {recipe.image_url && (
        <div className="rounded-2xl overflow-hidden mb-8 shadow-lg">
          <Image
            src={recipe.image_url}
            alt={recipe.name}
            width={800}
            height={600}
            className="w-full object-cover max-h-[500px]"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-green-900">
          {recipe.name}
        </h1>
        <LikeButton recipeId={recipe.id} initialLikes={recipe.likes_count} />
      </div>

      <p className="text-lg text-green-700/70 mb-6">{recipe.description}</p>

      {/* Author */}
      <Link
        href={`/profile/${recipe.user_id}`}
        className="inline-flex items-center gap-2 mb-6 group"
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
          <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
            <User size={14} className="text-green-700" />
          </div>
        )}
        <span className="text-green-800 font-medium group-hover:text-green-600 transition-colors">
          {recipe.profiles?.username || 'Anonymous'}
        </span>
        <span className="text-green-700/40 text-sm">
          {new Date(recipe.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </Link>

      {/* Time badges */}
      <div className="flex flex-wrap gap-3 mb-8">
        <span className="inline-flex items-center gap-1.5 bg-cream-200 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
          <Clock size={14} /> Prep: {recipe.prep_time}
        </span>
        <span className="inline-flex items-center gap-1.5 bg-cream-200 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
          <Clock size={14} /> Cook: {recipe.cook_time}
        </span>
      </div>

      {/* Nutritional highlights */}
      {recipe.nutritional_highlights && recipe.nutritional_highlights.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-green-800 mb-2 uppercase tracking-wide">
            Nutritional Highlights
          </h3>
          <div className="flex flex-wrap gap-2">
            {recipe.nutritional_highlights.map((h, i) => (
              <span
                key={i}
                className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Original ingredients input */}
      {recipe.ingredients_input && (
        <div className="bg-cream-200/50 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-medium text-green-800 mb-2 uppercase tracking-wide">
            Original Ingredients Input
          </h3>
          <p className="text-green-700/80 text-sm">{recipe.ingredients_input}</p>
        </div>
      )}

      {/* Ingredients */}
      <div className="bg-white rounded-2xl border border-cream-300/50 p-6 mb-6">
        <h3 className="font-semibold text-green-900 text-lg mb-4 flex items-center gap-2">
          <ChefHat size={20} /> Ingredients
        </h3>
        <ul className="space-y-2.5">
          {recipe.ingredients_list.map((ing, i) => (
            <li key={i} className="flex items-start gap-2.5 text-green-800">
              <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
              {ing}
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl border border-cream-300/50 p-6">
        <h3 className="font-semibold text-green-900 text-lg mb-4">
          Instructions
        </h3>
        <ol className="space-y-5">
          {recipe.instructions.map((inst, i) => (
            <li key={i} className="flex gap-4 text-green-800">
              <span className="shrink-0 w-8 h-8 rounded-full bg-green-700 text-white text-sm flex items-center justify-center font-semibold">
                {i + 1}
              </span>
              <p className="pt-1 leading-relaxed">{inst}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
