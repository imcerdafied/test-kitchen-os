import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAI();
    const { recipeName, description } = await request.json();

    if (!recipeName) {
      return NextResponse.json({ error: 'No recipe name provided' }, { status: 400 });
    }

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Professional food photography of ${recipeName}. ${description || ''}. Beautiful plating on a ceramic dish, natural lighting from a window, shallow depth of field, rustic wooden table, fresh herbs as garnish, warm and inviting, editorial style, high-end restaurant quality. No text or watermarks.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
