'use client';

import { useState } from 'react';

interface CollageItem {
  imageUrl: string;
  recipeName: string;
  ingredients: string[];
  keyword: string;
}

const collageItems: CollageItem[] = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
    recipeName: 'Lemon Herb Salmon',
    ingredients: ['Salmon', 'Lemon', 'Dill'],
    keyword: 'salmon',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
    recipeName: 'Mediterranean Bowl',
    ingredients: ['Quinoa', 'Chickpeas', 'Cucumber'],
    keyword: 'bowl',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80',
    recipeName: 'Mushroom Risotto',
    ingredients: ['Arborio Rice', 'Mushrooms', 'Parmesan'],
    keyword: 'risotto',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80',
    recipeName: 'Green Goddess Salad',
    ingredients: ['Kale', 'Avocado', 'Tahini'],
    keyword: 'salad',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&q=80',
    recipeName: 'Shakshuka',
    ingredients: ['Eggs', 'Tomatoes', 'Harissa'],
    keyword: 'shakshuka',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1529059997568-3d847b1154f0?w=600&q=80',
    recipeName: 'Miso Glazed Eggplant',
    ingredients: ['Eggplant', 'Miso', 'Ginger'],
    keyword: 'eggplant',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
    recipeName: 'Spicy Lentil Soup',
    ingredients: ['Lentils', 'Cumin', 'Coconut Milk'],
    keyword: 'soup',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&q=80',
    recipeName: 'Zucchini Fritters',
    ingredients: ['Zucchini', 'Feta', 'Herbs'],
    keyword: 'fritters',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    recipeName: 'Rustic Flatbread',
    ingredients: ['Sourdough', 'Mozzarella', 'Basil'],
    keyword: 'flatbread',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=80',
    recipeName: 'Street Tacos',
    ingredients: ['Corn Tortillas', 'Cilantro', 'Lime'],
    keyword: 'tacos',
  },
];

export function HeroCollage() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="hero-masonry">
      {collageItems.map((item, index) => (
        <div
          key={item.keyword}
          className="hero-masonry-item"
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.recipeName}
            loading={index < 4 ? 'eager' : 'lazy'}
          />
          <div
            className={`hero-masonry-overlay ${hoveredIndex === index ? 'hero-masonry-overlay--active' : ''}`}
          >
            <h3>{item.recipeName}</h3>
            <div className="hero-masonry-ingredients">
              {item.ingredients.map((ing) => (
                <span key={ing}>{ing}</span>
              ))}
            </div>
            <p className="hero-masonry-cta">View Recipe &rarr;</p>
          </div>
        </div>
      ))}
    </div>
  );
}
