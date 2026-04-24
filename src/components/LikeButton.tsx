'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function LikeButton({
  recipeId,
  initialLikes,
}: {
  recipeId: string;
  initialLikes: number;
}) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkIfLiked();
  }, []);

  async function checkIfLiked() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('recipe_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .maybeSingle();

    if (data) setLiked(true);
  }

  async function toggleLike() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    if (liked) {
      await supabase
        .from('recipe_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);
      setLiked(false);
      setLikesCount((c) => c - 1);
    } else {
      await supabase
        .from('recipe_likes')
        .insert({ user_id: user.id, recipe_id: recipeId });
      setLiked(true);
      setLikesCount((c) => c + 1);
    }

    setLoading(false);
  }

  return (
    <button
      onClick={toggleLike}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
        liked
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-cream-200 text-green-700 hover:bg-cream-300'
      }`}
    >
      <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
      {likesCount}
    </button>
  );
}
