'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Clock, ChefHat } from 'lucide-react';
import { Recipe } from '@/types';

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const timeAgo = getTimeAgo(new Date(recipe.created_at));

  return (
    <Link href={`/recipe/${recipe.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-cream-300/50 group-hover:border-green-300/50 group-hover:-translate-y-1">
        {/* Image */}
        <div className="aspect-[4/3] relative bg-cream-200 overflow-hidden">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat size={48} className="text-cream-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-green-900 text-lg leading-tight mb-1 group-hover:text-green-700 transition-colors">
            {recipe.name}
          </h3>
          <p className="text-sm text-green-700/70 line-clamp-2 mb-3">
            {recipe.description}
          </p>

          {/* Ingredients tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.ingredients_list.slice(0, 4).map((ing, i) => (
              <span
                key={i}
                className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full"
              >
                {ing.replace(/^[\d/.]+\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|pieces?|medium|large|small|cans?|bunch|head)s?\s*/i, '')}
              </span>
            ))}
            {recipe.ingredients_list.length > 4 && (
              <span className="text-xs text-green-600/60 px-1 py-0.5">
                +{recipe.ingredients_list.length - 4} more
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-green-700/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {recipe.prep_time}
              </span>
              <span className="flex items-center gap-1">
                <Heart size={12} />
                {recipe.likes_count}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {recipe.profiles?.avatar_url ? (
                <Image
                  src={recipe.profiles.avatar_url}
                  alt=""
                  width={18}
                  height={18}
                  className="rounded-full"
                />
              ) : (
                <div className="w-[18px] h-[18px] rounded-full bg-green-200 flex items-center justify-center text-[10px] font-medium text-green-700">
                  {recipe.profiles?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <span>{recipe.profiles?.username || 'Anonymous'}</span>
              <span>&middot;</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
