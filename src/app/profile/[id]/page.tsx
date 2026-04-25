import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { RecipeCard } from '@/components/RecipeCard';
import { Recipe, Profile } from '@/types';
import { User, ChefHat, Calendar } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', id)
    .single();

  if (!profile) return { title: 'User Not Found' };
  return { title: `${profile.username} | Test Kitchen OS` };
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!profile) notFound();
  const p = profile as Profile;

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*, profiles(id, username, avatar_url)')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Profile header */}
      <div className="flex items-center gap-5 mb-10">
        {p.avatar_url ? (
          <Image
            src={p.avatar_url}
            alt={p.username}
            width={80}
            height={80}
            className="rounded-full border-2 border-cream-300"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-green-200 flex items-center justify-center border-2 border-cream-300">
            <User size={32} className="text-green-700" />
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900">
            {p.username}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-green-700/60">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              Joined{' '}
              {new Date(p.created_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <ChefHat size={14} />
              {recipes?.length || 0} recipes
            </span>
          </div>
        </div>
      </div>

      {/* User recipes */}
      <h2 className="text-xl font-semibold text-green-900 mb-6">Recipes</h2>
      {recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(recipes as Recipe[]).map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-cream-300/50">
          <ChefHat size={48} className="mx-auto text-cream-400 mb-3" />
          <p className="text-green-700/60">No recipes created yet</p>
        </div>
      )}
    </div>
  );
}
