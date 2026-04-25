import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAI();
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful kitchen assistant. Analyze this fridge/pantry photo. Return a JSON object with two arrays:
1. "ingredients": list of ingredients you can see (for recipe generation). Be specific (e.g., "red bell pepper" not just "pepper").
2. "checkThese": list of items that may be expired, going bad, or should be used soon. Each item should be an object with "item" (string) and "reason" (string) — include the visual reason (e.g., "wilted leaves", "brown spots", "past printed date", "discolored edges").

Return ONLY valid JSON, no markdown formatting.
Example: {"ingredients": ["eggs", "whole milk", "cheddar cheese"], "checkThese": [{"item": "spinach", "reason": "wilted and yellowing leaves"}]}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageBase64, detail: 'high' },
            },
            {
              type: 'text',
              text: 'Analyze this fridge/pantry photo. Identify all ingredients and flag anything that looks like it may be expiring or going bad.',
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '{}';
    // Extract JSON from response (strip markdown fences if present)
    const jsonStr = content
      .replace(/^```(?:json)?\s*/, '')
      .replace(/\s*```$/, '');
    const result = JSON.parse(jsonStr);

    return NextResponse.json({
      ingredients: result.ingredients || [],
      checkThese: result.checkThese || [],
    });
  } catch (error) {
    console.error('Fridge analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze fridge photo' },
      { status: 500 }
    );
  }
}
