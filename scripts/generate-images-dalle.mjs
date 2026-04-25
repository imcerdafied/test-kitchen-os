import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const env = readFileSync('.env.local','utf8').split('\n').reduce((acc,line)=>{
  const [k,...v]=line.split('='); if(k&&v.length) acc[k.trim()]=v.join('=').trim(); return acc;
},{});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const { data: recipes, error } = await supabase
  .from('recipes')
  .select('id,name,description,ingredients_list')
  .order('created_at', { ascending: true });

if (error) { console.error(error); process.exit(1); }
console.log(`Generating DALL-E 3 images for ${recipes.length} recipes...\n`);

let done=0, failed=0;
for (let i=0; i<recipes.length; i++) {
  const r = recipes[i];
  try {
    const prompt = `Professional food photography of "${r.name}". Single dish, beautifully plated, natural lighting, shallow depth of field, on a clean wooden or marble surface. No text, no people, no utensils in frame. Appetizing, restaurant quality, warm tones. Style: Bon Appétit magazine.`;
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });
    
    const imageUrl = response.data[0].url;
    await supabase.from('recipes').update({ image_url: imageUrl }).eq('id', r.id);
    done++;
    console.log(`✅ ${i+1}/${recipes.length}: ${r.name.slice(0,50)}`);
  } catch (e) {
    failed++;
    console.log(`❌ ${i+1}/${recipes.length}: ${r.name.slice(0,50)} — ${e.message}`);
  }
  // DALL-E 3 rate limit: 5 img/min on standard tier, be safe with 13s delay
  await new Promise(r => setTimeout(r, 13000));
}

console.log(`\n🎉 Done! Generated: ${done}, Failed: ${failed}`);
