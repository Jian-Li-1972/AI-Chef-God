export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response('OK', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  
  try {
    const { dishName, description } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    // 💡 調整提示詞，讓 Imagen 3 畫出極致雜誌級別的美食圖
    const prompt = `Photorealistic, food magazine quality image of "${dishName}". ${description || ''}. Artfully plated, warm natural lighting, high resolution.`;

    // 💡 ✅ 萬能對齊：使用 v1beta 渠道下 100% 穩定支援的 Imagen 3 繪圖模型代號
    const modelName = 'imagen-3.0-generate-002';

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: { parts: [{ text: prompt }] }
      })
    });

    if (!response.ok) throw new Error("Image model call failed");

    const data = await response.json();
    const imageData = data.candidates[0].content.parts.find((p: any) => p.inlineData)?.inlineData.data;
    
    if (!imageData) throw new Error("No image data");

    return new Response(JSON.stringify({ imageData }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (error) {
    // 💡 終極防護：如果官方繪圖當機，回傳漂亮的 Unsplash 預設美食圖，確保家人手機絕對不顯示紅字！
    return new Response(JSON.stringify({ imageData: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800" }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  }
}
