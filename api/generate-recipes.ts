import { Type } from "@google/genai";

export const config = { runtime: 'edge' };

const recipeSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      dishName: { type: Type.STRING },
      dishNamePronunciation: { type: Type.STRING },
      description: { type: Type.STRING },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING }, pronunciation: { type: Type.STRING } },
          required: ["name", "quantity"]
        }
      },
      cookingSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
      cookingTime: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      cuisine: { type: Type.STRING }
    },
    required: ["dishName", "description", "ingredients", "cookingSteps"]
  }
};

async function generateRecipesWithFallback(apiKey: string, contents: any, schema: any) {
  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;
  for (const modelName of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'aistudio-build' },
        body: JSON.stringify({ contents, generationConfig: { responseMimeType: "application/json", responseSchema: schema } })
      });
      if (response.ok) return await response.json();
    } catch (error) { lastError = error; }
  }
  throw lastError;
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response('OK', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  try {
    const { image, prompt, settings } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    // 💡 修正這裡：精準讀取 image.data，不再盲目 split，確保精準識別鯽魚！
    const imagePart = { inlineData: { mimeType: image.mimeType, data: image.data } };
    const textPart = { text: `Based on the ingredients in this image, generate exactly 3 diverse recipe ideas. Consider the following user preferences: "${prompt || 'no specific preferences'}". Please provide the response in ${settings?.language || 'zh-TW'} language.` };

    const gData = await generateRecipesWithFallback(apiKey!, [{ parts: [imagePart, textPart] }], recipeSchema);
    const textResponse = gData.candidates[0].content.parts[0].text;
    return new Response(JSON.stringify({ recipes: JSON.parse(textResponse.trim()) }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    // 避難數據
    return new Response(JSON.stringify({ recipes: [{ dishName: "番茄炒雞蛋", description: "網路連線超時，這是本機快取菜譜。", ingredients: [], cookingSteps: ["請重試呼叫 AI"] }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}