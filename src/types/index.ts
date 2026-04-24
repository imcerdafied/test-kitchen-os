export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  description: string;
  ingredients_input: string;
  ingredients_list: string[];
  instructions: string[];
  nutritional_highlights: string[];
  prep_time: string;
  cook_time: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
  profiles?: Profile;
}

export interface RecipeLike {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
}

export interface GeneratedRecipe {
  name: string;
  description: string;
  ingredients_list: string[];
  instructions: string[];
  nutritional_highlights: string[];
  prep_time: string;
  cook_time: string;
}
