import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAI();
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a food ingredient identifier. Given an image of a fridge, pantry, or food items, identify all visible ingredients. Return ONLY a JSON array of ingredient names as strings. Be specific (e.g., "red bell pepper" not just "pepper"). Do not include non-food items.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: image, detail: 'high' },
            },
            {
              type: 'text',
              text: 'What food ingredients can you see in this image? Return only a JSON array of strings.',
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '[]';
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const ingredients: string[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ ingredients });
  } catch (error) {
    console.error('Ingredient identification error:', error);
    return NextResponse.json(
      { error: 'Failed to identify ingredients' },
      { status: 500 }
    );
  }
}
