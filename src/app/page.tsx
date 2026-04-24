import { createClient } from '@/lib/supabase/server';
import { RecipeFeed } from '@/components/RecipeFeed';
import { Recipe } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return <RecipeFeed initialRecipes={(recipes as Recipe[]) || []} />;
}
