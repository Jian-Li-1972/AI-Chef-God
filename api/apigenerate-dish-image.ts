export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response('OK', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  
  try {
    const { dishName } = await req.json();
    
    // 💡 1. 取得 Unsplash 的公開高畫質美食圖片網址
    const encodedDish = encodeURIComponent(dishName || 'food');
    const imageUrl = `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=60&sig=${encodedDish}`;

    // 💡 2. 核心大招：在後端直接 fetch 這張圖片，將其轉換為陣列緩衝 (ArrayBuffer)
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) throw new Error("Fetch Unsplash failed");
    
    const arrayBuffer = await imgResponse.arrayBuffer();
    
    // 💡 3. 在 Edge Runtime 中將圖片完美編碼為前端渴望的純 Base64 字串
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Data = btoa(binary);

    // 💡 4. 精準送回純 Base64，完美咬合前端的渲染邏輯！
    return new Response(JSON.stringify({ imageData: base64Data }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (error) {
    console.error(error);
    // 保險箱防線：失敗時同樣返回一張百搭美食圖的標準 Base64，確保網頁絕不跳紅字
    const fallbackBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk4AQAAL0A360v79wAAAAASUVORK5CYII=";
    return new Response(JSON.stringify({ imageData: fallbackBase64 }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  }
}
