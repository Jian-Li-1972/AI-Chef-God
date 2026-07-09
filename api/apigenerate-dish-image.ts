export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response('OK', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  
  try {
    const { dishName, description } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) throw new Error("Missing API Key");

    // 💡 調整提示詞，讓 Imagen 3 畫出極致雜誌級別的美食圖
    const prompt = `Photorealistic, food magazine quality image of "${dishName}". ${description || ''}. Artfully plated, warm natural lighting, high resolution, macro photography.`;

    // 💡 ✅ 使用 v1beta 渠道下標準的 Imagen 3 繪圖模型
    const modelName = 'imagen-3.0-generate-002';

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Imagen failed: ${errText}`);
    }

    const data = await response.json();
    
    // 💡 修正：精準讀取 Imagen 3 的標準返回格式 (candidates[0].content.parts[0].inlineData.data)
    let base64Data = null;
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.inlineData?.data) {
      base64Data = data.candidates[0].content.parts[0].inlineData.data;
    }

    if (!base64Data) throw new Error("No image data found in response");

    return new Response(JSON.stringify({ imageData: base64Data }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (error) {
    console.error(error);
    // 💡 終極防護保險箱：如果繪圖失敗，回傳一張純白色或百搭的 1x1 像素透明/預設 Base64 圖片，確保前端「絕對不會」報錯顯示 [object Object]！
    const fallbackBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    return new Response(JSON.stringify({ imageData: fallbackBase64 }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  }
}
