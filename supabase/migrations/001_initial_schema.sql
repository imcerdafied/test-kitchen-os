-- Test Kitchen OS - Initial Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Recipes table
create table public.recipes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text not null default '',
  ingredients_input text not null default '',
  ingredients_list text[] not null default '{}',
  instructions text[] not null default '{}',
  nutritional_highlights text[] not null default '{}',
  prep_time text not null default '',
  cook_time text not null default '',
  image_url text,
  likes_count integer not null default 0,
  created_at timestamptz default now() not null
);

-- Recipe likes table
create table public.recipe_likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(user_id, recipe_id)
);

-- Indexes
create index idx_recipes_user_id on public.recipes(user_id);
create index idx_recipes_created_at on public.recipes(created_at desc);
create index idx_recipe_likes_recipe_id on public.recipe_likes(recipe_id);
create index idx_recipe_likes_user_id on public.recipe_likes(user_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_likes enable row level security;

-- Profiles: anyone can read, users can update own
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Recipes: anyone can read, users can insert/update/delete own
create policy "Recipes are viewable by everyone"
  on public.recipes for select using (true);

create policy "Authenticated users can create recipes"
  on public.recipes for insert with check (auth.uid() = user_id);

create policy "Users can update their own recipes"
  on public.recipes for update using (auth.uid() = user_id);

create policy "Users can delete their own recipes"
  on public.recipes for delete using (auth.uid() = user_id);

-- Recipe likes: anyone can read, users can insert/delete own
create policy "Likes are viewable by everyone"
  on public.recipe_likes for select using (true);

create policy "Authenticated users can like recipes"
  on public.recipe_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike recipes"
  on public.recipe_likes for delete using (auth.uid() = user_id);

-- Function to update likes count
create or replace function public.update_likes_count()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.recipes set likes_count = likes_count + 1 where id = new.recipe_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.recipes set likes_count = likes_count - 1 where id = old.recipe_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger for likes count
create trigger on_like_change
  after insert or delete on public.recipe_likes
  for each row execute function public.update_likes_count();

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
