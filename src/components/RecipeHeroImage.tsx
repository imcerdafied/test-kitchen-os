'use client';

import { useState } from 'react';
import { Recipe } from '@/types';
import { getFoodishUrl } from '@/lib/foodish';

export function RecipeHeroImage({ recipe }: { recipe: Recipe }) {
  const isUnreliable =
    !recipe.image_url || recipe.image_url.includes('source.unsplash.com');
  const [src, setSrc] = useState(
    isUnreliable ? getFoodishUrl(recipe.name) : recipe.image_url!
  );
  const [errored, setErrored] = useState(false);

  return (
    <img
      src={src}
      alt={recipe.name}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => {
        if (!errored) {
          setErrored(true);
          setSrc(getFoodishUrl(recipe.name));
        }
      }}
    />
  );
}
