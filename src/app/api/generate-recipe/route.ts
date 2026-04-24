import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAI();
    const { ingredients } = await request.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a world-class nutritionist and chef. Create a single healthy recipe using the provided ingredients. Guidelines:
- Prioritize whole foods, Mediterranean-style cooking
- Low glycemic, high protein where possible
- Keep it practical and delicious
- You may include common pantry staples (salt, pepper, olive oil, garlic, etc.) even if not listed

Return ONLY valid JSON with this exact structure:
{
  "name": "Recipe Name",
  "description": "A 1-2 sentence appetizing description",
  "ingredients_list": ["1 cup ingredient", "2 tbsp ingredient"],
  "instructions": ["Step 1 text", "Step 2 text"],
  "nutritional_highlights": ["High in protein", "Rich in fiber"],
  "prep_time": "15 min",
  "cook_time": "25 min"
}`,
        },
        {
          role: 'user',
          content: `Create a healthy recipe using these ingredients: ${ingredients.join(', ')}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse recipe' }, { status: 500 });
    }

    const recipe = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Recipe generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    );
  }
}
