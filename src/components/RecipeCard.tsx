'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { Recipe } from '@/types';

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link href={`/recipe/${recipe.id}`} className="masonry-card group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        {/* Image — natural aspect ratio */}
        <div className="relative overflow-hidden">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.name}
              width={600}
              height={400}
              className="w-full h-auto object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div
              className="w-full aspect-[4/3]"
              style={{
                background:
                  'linear-gradient(135deg, var(--terracotta) 0%, var(--cream-300) 100%)',
              }}
            />
          )}
        </div>

        {/* Content */}
        <div className="p-3.5">
          <h3
            className="font-bold text-foreground text-[0.95rem] leading-snug mb-1.5"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            {recipe.name}
          </h3>

          <div className="flex items-center gap-3 text-xs text-warm-gray mb-2">
            {recipe.prep_time && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {recipe.prep_time}
              </span>
            )}
            {recipe.cook_time && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {recipe.cook_time}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {recipe.ingredients_list.slice(0, 3).map((ing, i) => (
              <span
                key={i}
                className="text-[0.65rem] bg-cream-200 text-warm-gray px-2 py-0.5 rounded-full"
              >
                {ing.replace(
                  /^[\d/.]+\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l|cloves?|pieces?|medium|large|small|cans?|bunch|head)s?\s*/i,
                  ''
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
