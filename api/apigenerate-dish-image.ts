export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response('OK', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  try {
    const { dishName, description } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    const prompt = `Photorealistic, food magazine quality image of "${dishName}". ${description || ''}. Artfully plated.`;

    // 呼叫 Gemini 繪圖模型
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: { parts: [{ text: prompt }] }, config: { responseModalities: ["IMAGE"] } })
    });

    const data = await response.json();
    const imageData = data.candidates[0].content.parts.find((p: any) => p.inlineData)?.inlineData.data;
    
    return new Response(JSON.stringify({ imageData }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (error) {
    // 如果繪圖超時，回傳一個漂亮的 Unsplash 預設美食圖，確保家人手機絕對不顯示紅字！
    return new Response(JSON.stringify({ imageData: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}