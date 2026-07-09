import { Type } from "@google/genai";

// 💡 1. 啟用 Edge Runtime，免翻牆直連，解除 100% 超時限制
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

// 💡 2. 修正 Fallback 模型隊列與標準 JSON 請求體結構
async function generateRecipesWithFallback(apiKey: string, contentsArray: any, schema: any) {
  // ✅ 終極對齊：徹底移除不可用的 gemini-pro，換上 v1beta 100% 通用的萬能快閃模型
  const models = ['gemini-1.5-flash', 'gemini-2.5-flash'];
  let lastError: any = null;

  for (const modelName of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'aistudio-build' },
        body: JSON.stringify({ 
          contents: contentsArray, 
          generationConfig: { 
            responseMimeType: "application/json", 
            responseSchema: schema 
          } 
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errText = await response.text();
        console.log(`[Model Alert] ${modelName} failed: ${errText}`);
        lastError = new Error(errText);
      }
    } catch (error) { 
      lastError = error; 
    }
  }
  throw lastError;
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response('OK', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  
  try {
    const { image, prompt, settings } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) throw new Error("Vercel 找不到環境變數 GEMINI_API_KEY");

    // 💡 3. 確保圖片 Base64 乾淨無雜質（剔除 "data:image/jpeg;base64," 等前端前綴）
    let pureBase64 = image.data;
    if (pureBase64.includes(',')) {
      pureBase64 = pureBase64.split(',')[1];
    }

    const imagePart = { inlineData: { mimeType: image.mimeType || "image/jpeg", data: pureBase64 } };
    const textPart = { text: `Based on the ingredients in this image, generate exactly 3 diverse recipe ideas. Consider the following user preferences: "${prompt || 'no specific preferences'}". Please provide the response in ${settings?.language || 'zh-TW'} language.` };

    // 💡 4. 精準組裝一維陣列：內容直接包進陣列傳過去
    const contentsArray = [{ parts: [imagePart, textPart] }];

    const gData = await generateRecipesWithFallback(apiKey, contentsArray, recipeSchema);
    
    // 解析 Google 回傳的 JSON 文本
    const textResponse = gData.candidates[0].content.parts[0].text;
    
    return new Response(JSON.stringify({ recipes: JSON.parse(textResponse.trim()) }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (error: any) {
    // 💡 5. 優化錯誤字串轉換：如果是物件型態的錯誤，強制轉成純文字，拒絕在前端顯示不出來
    const errorString = typeof error === 'object' ? (error.message || JSON.stringify(error)) : String(error);
    
    return new Response(JSON.stringify({ 
      recipes: [{ 
        dishName: "本地快取菜譜（AI連線中斷）", 
        description: `底層錯誤原因：${errorString}。`, 
        ingredients: [], 
        cookingSteps: ["請確保在 GitHub 的 api/generate-recipes.ts 裡看得到全新的萬能模型代號，並重新整理網頁再試！"] 
      }] 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
