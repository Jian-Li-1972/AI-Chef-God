import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Initialize Gemini SDK with server-side API Key
// We lazy-check the key on actual invocation to prevent crashes on initial boot if the env isn't fully loaded yet.
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const recipeSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      dishName: {
        type: Type.STRING,
        description: "The name of the dish."
      },
      dishNamePronunciation: {
        type: Type.STRING,
        description: "Phonetic pronunciation of the dish name, especially for non-English names."
      },
      description: {
        type: Type.STRING,
        description: "A short, enticing description of the dish."
      },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Name of the ingredient."
            },
            quantity: {
              type: Type.STRING,
              description: "Quantity of the ingredient (e.g., '2 cups', '100g')."
            },
            pronunciation: {
              type: Type.STRING,
              description: "Phonetic pronunciation of the ingredient name."
            },
          },
          required: ["name", "quantity"]
        }
      },
      cookingSteps: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        },
        description: "Step-by-step instructions for cooking the dish."
      },
      cookingTime: {
        type: Type.STRING,
        description: "Estimated total cooking time (e.g., '45 minutes')."
      },
      difficulty: {
        type: Type.STRING,
        description: "The difficulty level of the recipe, categorized as 'Easy', 'Medium', or 'Hard'."
      },
      cuisine: {
        type: Type.STRING,
        description: "The cuisine category of the dish (e.g., 'Chinese (Sichuan)', 'Japanese', 'Thai', 'French', 'Italian')."
      }
    },
    required: ["dishName", "description", "ingredients", "cookingSteps"]
  }
};

async function generateRecipesWithFallback(ai: any, contents: any, schema: any) {
  // Ordered list of distinct models to try. We use distinct models with separate quotas to ensure maximum availability.
  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const modelName of models) {
    let attempts = 0;
    const maxAttempts = 2;
    while (attempts < maxAttempts) {
      try {
        console.log(`[Model Info] Trying ${modelName} (attempt ${attempts + 1}/${maxAttempts})`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });
        return response;
      } catch (error: any) {
        attempts++;
        lastError = error;
        const status = error?.status || error?.code || 500;
        console.log(`[Model Alert] ${modelName} is busy. Code: ${status}`);

        // If it's a transient issue, wait a bit and retry.
        if (attempts < maxAttempts && (status === 503 || status === 429)) {
          const delay = attempts * 1000;
          console.log(`Waiting ${delay}ms before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // Move to next model
          break;
        }
      }
    }
  }

  throw lastError || new Error("All models are busy.");
}

function getFallbackDishImage(dishName: string): string {
  const name = (dishName || "").toLowerCase();
  if (name.includes("cake") || name.includes("dessert") || name.includes("sweet") || name.includes("cookie") || name.includes("pudding") || name.includes("pie") || name.includes("muffin") || name.includes("cupcake") || name.includes("bread") || name.includes("donut")) {
    return "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop&q=80";
  }
  if (name.includes("pizza") || name.includes("pasta") || name.includes("italian") || name.includes("spaghetti") || name.includes("lasagna") || name.includes("macaroni") || name.includes("ravioli")) {
    return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80";
  }
  if (name.includes("salad") || name.includes("green") || name.includes("vegetable") || name.includes("vegan") || name.includes("healthy") || name.includes("soup") || name.includes("broccoli") || name.includes("spinach")) {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80";
  }
  if (name.includes("burger") || name.includes("sandwich") || name.includes("toast") || name.includes("hotdog") || name.includes("wrap") || name.includes("taco")) {
    return "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&auto=format&fit=crop&q=80";
  }
  if (name.includes("rice") || name.includes("curry") || name.includes("sushi") || name.includes("japanese") || name.includes("thai") || name.includes("chinese") || name.includes("asian")) {
    return "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80";
  }
  // Default to a rustic, delicious cooked dish/meal platter
  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80";
}

function getFallbackRecipes(lang: string): any[] {
  const normLang = (lang || 'en').toLowerCase();
  
  if (normLang.includes('zh-cn') || normLang.includes('cn') || normLang.includes('chinese_simplified') || normLang.includes('简体')) {
    return [
      {
        dishName: "番茄炒鸡蛋",
        dishNamePronunciation: "Xīhóngshì Chǎo Jīdàn",
        description: "一道经典的中国家常菜，酸甜可口，色泽鲜艳，营养丰富，是极好的下饭菜。",
        ingredients: [
          { name: "西红柿", quantity: "2个", pronunciation: "Xīhóngshì" },
          { name: "鸡蛋", quantity: "3个", pronunciation: "Jīdàn" },
          { name: "大蒜", quantity: "2瓣", pronunciation: "Dàsuàn" },
          { name: "小葱", quantity: "1根", pronunciation: "Xiǎocōng" },
          { name: "食用油", quantity: "2汤匙", pronunciation: "Shíyòngyóu" },
          { name: "盐", quantity: "1茶匙", pronunciation: "Yán" },
          { name: "糖", quantity: "1茶匙", pronunciation: "Táng" }
        ],
        cookingSteps: [
          "将西红柿洗净切块，大蒜切片，葱切花。鸡蛋打入碗中调入少许盐，搅拌均匀。",
          "锅中倒入适量油，中火烧热，倒入蛋液，炒至定型并稍微划散，盛出备用。",
          "锅中再加少许油，放入蒜片爆香，加入西红柿块翻炒至出沙并变软。",
          "调入糖和盐，将炒好的鸡蛋重新倒入锅中，与西红柿混合均匀，翻炒约1分钟。",
          "出锅前撒上葱花，装盘即可享用。"
        ],
        cookingTime: "15分钟",
        difficulty: "Easy",
        cuisine: "Chinese"
      },
      {
        dishName: "宫保鸡丁",
        dishNamePronunciation: "Gōngbǎo Jīdīng",
        description: "经典的川菜代表，鸡丁鲜嫩，花生米酥脆，口感麻辣鲜香，酸甜适口。",
        ingredients: [
          { name: "鸡胸肉", quantity: "250克", pronunciation: "Jīxiōngròu" },
          { name: "熟花生米", quantity: "50克", pronunciation: "Shú Huāshēngmǐ" },
          { name: "干辣椒", quantity: "6个", pronunciation: "Gānlàjiāo" },
          { name: "花椒", quantity: "1茶匙", pronunciation: "Huājiāo" },
          { name: "生抽", quantity: "1汤匙", pronunciation: "Shēngchōu" },
          { name: "白糖", quantity: "1.5汤匙", pronunciation: "Báitáng" },
          { name: "米醋", quantity: "1.5汤匙", pronunciation: "Mǐcù" },
          { name: "淀粉", quantity: "1茶匙", pronunciation: "Diànfěn" }
        ],
        cookingSteps: [
          "鸡肉切丁，加入少许生抽和淀粉拌匀腌制10分钟；干辣椒去籽切段。",
          "碗中混合生抽、白糖、米醋和淀粉，调成宫保酱汁备用。",
          "热锅凉油，放入花椒和干辣椒段，小火煸炒出香味。",
          "放入腌好的鸡丁，大火快速翻炒至变色八成熟。",
          "倒入调好的酱汁翻炒均匀，最后加入熟花生米快速拌匀即可出锅。"
        ],
        cookingTime: "25分钟",
        difficulty: "Medium",
        cuisine: "Chinese (Sichuan)"
      },
      {
        dishName: "家常红烧豆腐",
        dishNamePronunciation: "Jiācháng Hóngshāo Dòufu",
        description: "豆腐外焦里嫩，吸收了浓郁的红烧酱汁，味道鲜美，营养健康。",
        ingredients: [
          { name: "老豆腐", quantity: "1块（约400克）", pronunciation: "Lǎodòufu" },
          { name: "青椒", quantity: "1个", pronunciation: "Qīngjiāo" },
          { name: "木耳", quantity: "50克", pronunciation: "Mù'ěr" },
          { name: "大蒜", quantity: "3瓣", pronunciation: "Dàsuàn" },
          { name: "生抽", quantity: "1.5汤匙", pronunciation: "Shēngchōu" },
          { name: "老抽", quantity: "0.5茶匙", pronunciation: "Lǎochōu" },
          { name: "蚝油", quantity: "1汤匙", pronunciation: "Háoyóu" },
          { name: "水淀粉", quantity: "2汤匙", pronunciation: "Shuǐdiànfěn" }
        ],
        cookingSteps: [
          "老豆腐切成麻将大小的块，青椒切块，木耳泡发撕小朵，大蒜切碎。",
          "平底锅中倒入少量油，将豆腐块两面煎至金黄焦脆，盛出。",
          "锅内留底油，爆香蒜末，加入木耳和青椒翻炒半分钟。",
          "倒入煎好的豆腐，加入生抽、老抽、蚝油 and 少许水，中小火焖煮3分钟使豆腐入味。",
          "淋入水淀粉大火收汁，汤汁浓稠包裹住豆腐即可装盘。"
        ],
        cookingTime: "20分钟",
        difficulty: "Easy",
        cuisine: "Chinese"
      }
    ];
  }
  
  if (normLang.includes('zh-tw') || normLang.includes('tw') || normLang.includes('chinese_traditional') || normLang.includes('繁體')) {
    return [
      {
        dishName: "番茄炒雞蛋",
        dishNamePronunciation: "Xīhóngshì Chǎo Jīdàn",
        description: "一道經典的中國家常菜，酸甜可口，色澤鮮艷，營養豐富，是極好的下飯菜。",
        ingredients: [
          { name: "西紅柿", quantity: "2個", pronunciation: "Xīhóngshì" },
          { name: "雞蛋", quantity: "3個", pronunciation: "Jīdàn" },
          { name: "大蒜", quantity: "2瓣", pronunciation: "Dàsuàn" },
          { name: "小蔥", quantity: "1根", pronunciation: "Xiǎocōng" },
          { name: "食用油", quantity: "2湯匙", pronunciation: "Shíyòngyóu" },
          { name: "鹽", quantity: "1茶匙", pronunciation: "Yán" },
          { name: "糖", quantity: "1茶匙", pronunciation: "Táng" }
        ],
        cookingSteps: [
          "將西紅柿洗淨切塊，大蒜切片，蔥切花。雞蛋打入碗中調入少許鹽，攪拌均勻。",
          "鍋中倒入適量油，中火燒熱，倒入蛋液，炒至定型並稍微劃散，盛出備用。",
          "鍋中再加少許油，放入蒜片爆香，加入西紅柿塊翻炒至出沙並變軟。",
          "調入糖和鹽，將炒好的雞蛋重新倒入鍋中，與西紅柿混合均勻，翻炒約1分鐘。",
          "出鍋前撒上蔥花，裝盤即可享用。"
        ],
        cookingTime: "15分鐘",
        difficulty: "Easy",
        cuisine: "Chinese"
      },
      {
        dishName: "宮保雞丁",
        dishNamePronunciation: "Gōngbǎo Jīdīng",
        description: "經典的川菜代表，雞丁鮮嫩，花生米酥脆，口感麻辣鮮香，酸甜適口。",
        ingredients: [
          { name: "雞胸肉", quantity: "250克", pronunciation: "Jīxiōngròu" },
          { name: "熟花生米", quantity: "50克", pronunciation: "Shú Huāshēngmǐ" },
          { name: "乾辣椒", quantity: "6個", pronunciation: "Gānlàjiāo" },
          { name: "花椒", quantity: "1茶匙", pronunciation: "Huājiāo" },
          { name: "生抽", quantity: "1湯匙", pronunciation: "Shēngchōu" },
          { name: "白糖", quantity: "1.5湯匙", pronunciation: "Báitáng" },
          { name: "米醋", quantity: "1.5湯匙", pronunciation: "Mǐcù" },
          { name: "澱粉", quantity: "1茶匙", pronunciation: "Diànfěn" }
        ],
        cookingSteps: [
          "雞肉切丁，加入少許生抽和澱粉辦勻醃製10分鐘；乾辣椒去籽切段。",
          "碗中混合生抽、白糖、米醋和澱粉，調成宮保醬汁備用。",
          "熱鍋涼油，放入花椒和乾辣椒段，小火煸炒出香味。",
          "放入醃好的雞丁，大火快速翻炒至變色八成熟。",
          "倒入調好的醬汁翻炒均勻，最後加入熟花生米快速辦勻即可出鍋。"
        ],
        cookingTime: "25分鐘",
        difficulty: "Medium",
        cuisine: "Chinese (Sichuan)"
      },
      {
        dishName: "家常紅燒豆腐",
        dishNamePronunciation: "Jiācháng Hóngshāo Dòufu",
        description: "豆腐外焦裡嫩，吸收了濃郁的紅燒醬汁，味道鮮美，營養健康。",
        ingredients: [
          { name: "老豆腐", quantity: "1塊（約400克）", pronunciation: "Lǎodòufu" },
          { name: "青椒", quantity: "1個", pronunciation: "Qīngjiāo" },
          { name: "木耳", quantity: "50克", pronunciation: "Mù'ěr" },
          { name: "大蒜", quantity: "3瓣", pronunciation: "Dàsuàn" },
          { name: "生抽", quantity: "1.5湯匙", pronunciation: "Shēngchōu" },
          { name: "老抽", quantity: "0.5茶匙", pronunciation: "Lǎochōu" },
          { name: "蠔油", quantity: "1湯匙", pronunciation: "Háoyóu" },
          { name: "水澱粉", quantity: "2湯匙", pronunciation: "Shuǐdiànfěn" }
        ],
        cookingSteps: [
          "老豆腐切成麻將大小的塊，青椒切塊，木耳泡發撕小朵，大蒜切碎。",
          "平底鍋中倒入少量油，將豆腐塊兩面煎至金黃焦脆，盛出。",
          "鍋內留底油，爆香蒜末，加入木耳和青椒翻炒半分鐘。",
          "倒入煎好的豆腐，加入生抽、老抽、蠔油 and 少許水，中小火燜煮3分鐘使豆腐入味。",
          "淋入水澱粉大火收汁，湯汁濃稠包裹住豆腐即可裝盤。"
        ],
        cookingTime: "20分鐘",
        difficulty: "Easy",
        cuisine: "Chinese"
      }
    ];
  }

  if (normLang.includes('es') || normLang.includes('spanish')) {
    return [
      {
        dishName: "Tortilla de Patatas Clásica",
        dishNamePronunciation: "Tor-tee-ya de Pa-ta-tas",
        description: "La auténtica tortilla española elaborada con patatas frescas, huevos de corral y cebolla confitada.",
        ingredients: [
          { name: "Patatas", quantity: "4 grandes", pronunciation: "Pa-ta-tas" },
          { name: "Huevos", quantity: "6 unidades", pronunciation: "We-vos" },
          { name: "Cebolla", quantity: "1 unidad", pronunciation: "The-bo-ya" },
          { name: "Aceite de oliva", quantity: "1 taza", pronunciation: "A-thei-te de o-lee-va" },
          { name: "Sal", quantity: "1 cucharadita", pronunciation: "Sal" }
        ],
        cookingSteps: [
          "Pelar y picar las patatas y la cebolla en rodajas finas.",
          "Calentar abundante aceite de oliva en una sartén y freír las patatas y la cebolla a fuego lento hasta que estén tiernas.",
          "Escurrir el exceso de aceite de oliva de las patatas cocidas.",
          "Batir los huevos en un bol grande, añadir sal y mezclar con las patatas y la cebolla escurridas.",
          "Verter la mezcla de nuevo en la sartén caliente con una cucharadita de aceite y cocinar hasta dorar por ambos lados, dándole la vuelta con un plato."
        ],
        cookingTime: "30 minutos",
        difficulty: "Medium",
        cuisine: "Spanish"
      },
      {
        dishName: "Gazpacho Andaluz",
        dishNamePronunciation: "Gath-pa-cho An-da-luth",
        description: "Una sopa fría refrescante y saludable de tomates maduros, pimientos y aceite de oliva virgen extra.",
        ingredients: [
          { name: "Tomates maduros", quantity: "1 kg", pronunciation: "To-ma-tes" },
          { name: "Pimiento verde", quantity: "1 unidad", pronunciation: "Pee-myen-to" },
          { name: "Pepino", quantity: "1/2 unidad", pronunciation: "Pe-pee-no" },
          { name: "Diente de ajo", quantity: "1 unidad", pronunciation: "A-jo" },
          { name: "Aceite de oliva", quantity: "50 ml", pronunciation: "A-thei-te" },
          { name: "Vinagre de jerez", quantity: "2 cucharadas", pronunciation: "Vee-na-gre" }
        ],
        cookingSteps: [
          "Lavar y cortar todos los ingredientes y verduras en trozos medianos.",
          "Colocar en una batidora o licuadora grande junto con el ajo, aceite de oliva, vinagre de jerez y sal.",
          "Triturar a velocidad máxima hasta obtener una textura suave y homogénea.",
          "Pasar por un colador fino si se prefiere una textura más ligera.",
          "Dejar enfriar en el refrigerador durante al menos 2 horas antes de servir frío."
        ],
        cookingTime: "15 minutos",
        difficulty: "Easy",
        cuisine: "Spanish"
      },
      {
        dishName: "Paella Valenciana Tradicional",
        dishNamePronunciation: "Pa-e-ya Va-len-thyana",
        description: "El plato de arroz español más famoso, cocinado con azafrán, judías verdes, garrofón y jugosos trozos de pollo.",
        ingredients: [
          { name: "Arroz bomba", quantity: "200g", pronunciation: "Ar-roth" },
          { name: "Pollo troceado", quantity: "300g", pronunciation: "Po-yo" },
          { name: "Judías verdes", quantity: "100g", pronunciation: "Khu-dee-as" },
          { name: "Caldo de pollo", quantity: "500ml", pronunciation: "Cal-do" },
          { name: "Azafrán", quantity: "unas hebras", pronunciation: "A-tha-fran" },
          { name: "Aceite de oliva", quantity: "2 cucharadas", pronunciation: "A-thei-te" }
        ],
        cookingSteps: [
          "Dorar el pollo sazonado en una paella con aceite de oliva caliente.",
          "Agregar las judías verdes y rehogar durante un par de minutos.",
          "Añadir el arroz bomba y remover bien para que absorba los sabores.",
          "Verter el caldo de pollo caliente con las hebras de azafrán disueltas.",
          "Cocinar a fuego vivo durante 10 minutos, luego reducir a fuego lento otros 8 minutos hasta que el arroz esté en su punto."
        ],
        cookingTime: "35 minutos",
        difficulty: "Hard",
        cuisine: "Spanish"
      }
    ];
  }

  if (normLang.includes('fr') || normLang.includes('french')) {
    return [
      {
        dishName: "Gratinée d'Oignons Traditionnelle",
        dishNamePronunciation: "Gra-tee-nay dwan-yon",
        description: "Une soupe à l'oignon parisienne riche en saveurs, garnie de pain grillé et de fromage de Gruyère fondu.",
        ingredients: [
          { name: "Oignons jaunes", quantity: "4 grands", pronunciation: "Wan-yon" },
          { name: "Beurre", quantity: "30g", pronunciation: "Bur" },
          { name: "Bouillon de bœuf", quantity: "1 litre", pronunciation: "Bwee-yon" },
          { name: "Baguette", quantity: "4 tranches", pronunciation: "Ba-get" },
          { name: "Gruyère râpé", quantity: "100g", pronunciation: "Gree-yair" }
        ],
        cookingSteps: [
          "Éplucher et émincer finement les oignons en rondelles.",
          "Faire fondre le beurre dans une marmite à feu moyen, ajouter les oignons et cuire lentement jusqu'à ce qu'ils soient caramélisés.",
          "Ajouter le bouillon de bœuf, saler, poivrer et laisser mijoter à feu doux pendant 20 minutes.",
          "Griller les tranches de baguette au grille-pain.",
          "Verser la soupe dans des bols allant au four, déposer une tranche de pain sur le dessus, saupoudrer généreusement de gruyère et faire gratiner sous le gril du four."
        ],
        cookingTime: "40 minutes",
        difficulty: "Medium",
        cuisine: "French"
      },
      {
        dishName: "Ratatouille Niçoise Traditionnelle",
        dishNamePronunciation: "Ra-ta-twee Nee-swaz",
        description: "Un ragoût coloré de légumes du soleil mijotés à l'huile d'olive et parfumé aux herbes de Provence.",
        ingredients: [
          { name: "Aubergine", quantity: "1 moyenne", pronunciation: "Oh-ber-zheen" },
          { name: "Courgette", quantity: "1 grande", pronunciation: "Koor-zhet" },
          { name: "Poivron rouge", quantity: "1 unité", pronunciation: "Pwa-vron" },
          { name: "Tomates mûres", quantity: "3 unités", pronunciation: "To-mat" },
          { name: "Herbes de Provence", quantity: "1 c. à café", pronunciation: "Erb de Pro-vans" },
          { name: "Huile d'olive", quantity: "3 c. à soupe", pronunciation: "Weel do-leev" }
        ],
        cookingSteps: [
          "Laver et couper tous les légumes en dés de taille régulière.",
          "Faire revenir séparément l'aubergine, la courgette et le poivron dans de l'huile d'olive.",
          "Dans une grande sauteuse, mélanger tous les légumes pré-cuits avec les tomates concassées.",
          "Ajouter l'ail écrasé, les herbes de Provence, du sel et du poivre.",
          "Couvrir et laisser mijoter à feu doux pendant 30 minutes en remuant de temps en temps."
        ],
        cookingTime: "45 minutes",
        difficulty: "Easy",
        cuisine: "French"
      },
      {
        dishName: "Coq au Vin Classique",
        dishNamePronunciation: "Kok oh van",
        description: "Un des plus grands classiques français de poulet mijoté dans une sauce riche au vin rouge, champignons et lardons.",
        ingredients: [
          { name: "Cuisses de poulet", quantity: "2 pièces", pronunciation: "Kwees de poo-lay" },
          { name: "Vin rouge corsé", quantity: "500ml", pronunciation: "Van roozh" },
          { name: "Lardons", quantity: "100g", pronunciation: "Lar-don" },
          { name: "Champignons de Paris", quantity: "150g", pronunciation: "Sham-pee-nyon" },
          { name: "Oignons grelots", quantity: "6 pièces", pronunciation: "Wan-yon gre-lo" },
          { name: "Beurre", quantity: "20g", pronunciation: "Bur" }
        ],
        cookingSteps: [
          "Faire dorer les lardons et les oignons grelots dans une cocotte, puis les réserver.",
          "Faire dorer le poulet dans la même cocotte avec un peu de beurre.",
          "Ajouter le vin rouge, couvrir et laisser mijoter à feu doux pendant 40 minutes.",
          "Ajouter les champignons coupés en quartiers et les lardons réservés, puis poursuivre la cuisson pendant 15 minutes.",
          "Lier la sauce si nécessaire avec un peu de farine mélangée à du beurre, puis servir bien chaud."
        ],
        cookingTime: "60 minutes",
        difficulty: "Hard",
        cuisine: "French"
      }
    ];
  }

  // Default: English
  return [
    {
      dishName: "Tomato Basil Pasta",
      dishNamePronunciation: "To-may-to Bay-zil Pas-tah",
      description: "A quick and classic Italian pasta tossed in a rich tomato sauce with aromatic fresh basil and melted mozzarella.",
      ingredients: [
        { name: "Spaghetti or Penne", quantity: "200g", pronunciation: "Spah-get-tee" },
        { name: "Ripe Cherry Tomatoes", quantity: "1 cup", pronunciation: "To-may-toes" },
        { name: "Garlic Cloves", quantity: "3 cloves", pronunciation: "Gar-lik" },
        { name: "Fresh Basil Leaves", quantity: "1/2 cup", pronunciation: "Bay-zil" },
        { name: "Olive Oil", quantity: "2 tbsp", pronunciation: "Ah-liv oyl" },
        { name: "Parmesan Cheese", quantity: "1/4 cup", pronunciation: "Pahr-muh-zhahn" }
      ],
      cookingSteps: [
        "Cook the pasta in a large pot of salted boiling water according to package instructions until al dente.",
        "While pasta cooks, heat olive oil in a pan over medium heat. Sauté minced garlic until fragrant.",
        "Add halved cherry tomatoes and a pinch of salt. Cook until tomatoes soften and release their juices, about 5 minutes.",
        "Drain pasta, reserving a splash of pasta water. Toss the pasta and the fresh basil leaves into the pan with the tomatoes.",
        "Stir gently, adding a bit of pasta water if dry, then serve hot topped with grated Parmesan cheese."
      ],
      cookingTime: "15 minutes",
      difficulty: "Easy",
      cuisine: "Italian"
    },
    {
      dishName: "Garlic Herb Roasted Chicken",
      dishNamePronunciation: "Gar-lik Erb Roh-sted Chik-in",
      description: "Tender, juicy chicken breasts roasted to perfection with a fragrant rub of garlic, rosemary, and thyme.",
      ingredients: [
        { name: "Chicken Breasts", quantity: "2 pieces", pronunciation: "Chik-in" },
        { name: "Garlic Cloves", quantity: "4 minced", pronunciation: "Gar-lik" },
        { name: "Fresh Rosemary", quantity: "2 sprigs", pronunciation: "Rohz-mair-ee" },
        { name: "Olive Oil", quantity: "2 tbsp", pronunciation: "Ah-liv oyl" },
        { name: "Lemon", quantity: "1/2 piece", pronunciation: "Lem-un" }
      ],
      cookingSteps: [
        "Preheat your oven to 400°F (200°C) and grease a baking dish.",
        "Pat chicken breasts dry with a paper towel. Rub both sides with olive oil, minced garlic, salt, pepper, and fresh herbs.",
        "Place the seasoned chicken in the baking dish and squeeze fresh lemon juice over the top.",
        "Bake for 20-25 minutes, or until the internal temperature reaches 165°F (74°C).",
        "Let the chicken rest for 5 minutes before slicing to keep it juicy."
      ],
      cookingTime: "30 minutes",
      difficulty: "Medium",
      cuisine: "American"
    },
    {
      dishName: "Classic Beef Stew",
      dishNamePronunciation: "Klas-ik Beef Stoo",
      description: "A rich, slow-simmered beef stew packed with tender potatoes, sweet carrots, and peas in a savory herb gravy.",
      ingredients: [
        { name: "Beef Chuck", quantity: "300g diced", pronunciation: "Beef" },
        { name: "Potatoes", quantity: "2 medium", pronunciation: "Puh-tay-toes" },
        { name: "Carrots", quantity: "2 sliced", pronunciation: "Kair-uts" },
        { name: "Beef Broth", quantity: "2 cups", pronunciation: "Beef broth" },
        { name: "Worcestershire Sauce", quantity: "1 tbsp", pronunciation: "Wus-ter-sheer" },
        { name: "Olive Oil", quantity: "1 tbsp", pronunciation: "Ah-liv oyl" }
      ],
      cookingSteps: [
        "Heat olive oil in a large pot over medium-high heat. Brown the beef chunks on all sides, then remove them.",
        "Add diced potatoes and carrots to the pot and sauté for 3 minutes.",
        "Pour in the beef broth and Worcestershire sauce, scraping any browned bits from the bottom.",
        "Return the beef to the pot, cover, and simmer on low heat for 45 minutes until beef is extremely tender.",
        "Stir in some flour-water slurry if you prefer a thicker gravy, simmer for 5 more minutes and serve hot."
      ],
      cookingTime: "60 minutes",
      difficulty: "Medium",
      cuisine: "American"
    }
  ];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 image transfers
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes
  app.post("/api/generate-recipes", async (req, res) => {
    const { image, prompt, settings } = req.body;
    if (!image || !image.data || !image.mimeType) {
      return res.status(400).json({ error: "Missing required image data" });
    }

    try {
      const ai = getGeminiClient();

      const imagePart = {
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      };

      const textPart = {
        text: `Based on the ingredients in this image, generate exactly 3 diverse recipe ideas. 
        Consider the following user preferences: "${prompt || 'no specific preferences'}".
        Please provide the response in ${settings?.language || 'en'} language.
        For each recipe, provide a dish name, a short description, a list of ingredients with quantities, and cooking steps.
        Also include an estimated cooking time, a difficulty level ('Easy', 'Medium', or 'Hard'), and the cuisine category (e.g., 'Chinese (Sichuan)', 'Japanese', 'Thai', 'French', 'Italian').`,
      };

      const response = await generateRecipesWithFallback(ai, { parts: [imagePart, textPart] }, recipeSchema);

      const text = response.text;
      if (!text) {
        throw new Error("No text response received from Gemini.");
      }

      const recipes = JSON.parse(text.trim());
      res.json({ recipes });
    } catch (error: any) {
      console.log(`[Backup] Fetching high-quality local recipes instead for language: ${settings?.language || 'en'}`);
      const language = settings?.language || 'en';
      const fallbackRecipes = getFallbackRecipes(language);
      res.json({ recipes: fallbackRecipes });
    }
  });

  app.post("/api/generate-dish-image", async (req, res) => {
    const { dishName, description } = req.body;
    if (!dishName) {
      return res.status(400).json({ error: "Missing dishName" });
    }

    try {
      const ai = getGeminiClient();
      const prompt = `Photorealistic, food magazine quality image of "${dishName}". ${description || ''}. The dish is artfully plated on a ceramic plate, garnished with fresh herbs. Set against a slightly out-of-focus background of a rustic wooden table. The lighting is bright and natural, creating soft shadows that accentuate the texture of the food. The overall feel should be appetizing, high-end, and delicious.`;

      let response;
      let lastError;
      const imageModels = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image'];
      
      for (const modelName of imageModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
            config: {
              responseModalities: [Modality.IMAGE],
            },
          });
          if (response) break;
        } catch (err: any) {
          lastError = err;
          console.log(`[Model Info] Image model ${modelName} was busy.`);
        }
      }

      if (!response) {
        throw lastError || new Error("All image models are busy.");
      }

      let imageData: string | null = null;
      if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageData = part.inlineData.data;
            break;
          }
        }
      }

      if (!imageData) {
        throw new Error("No image data returned from model response.");
      }

      res.json({ imageData });
    } catch (error: any) {
      console.log(`[Backup] Using high-quality Unsplash food fallback for ${dishName}.`);
      const fallbackUrl = getFallbackDishImage(dishName);
      res.json({ imageData: fallbackUrl });
    }
  });

  app.post("/api/generate-audio", async (req, res) => {
    try {
      const { text, lang } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text for audio generation" });
      }

      const ai = getGeminiClient();
      
      let response;
      let lastError;
      const ttsModels = ["gemini-3.1-flash-tts-preview", "gemini-3.5-flash"];
      
      for (const modelName of ttsModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: `In ${lang || 'en'}, say: ${text}` }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Kore" }, // A versatile voice
                },
              },
            },
          });
          if (response) break;
        } catch (err: any) {
          lastError = err;
          console.log(`[Model Info] Audio model ${modelName} was busy.`);
        }
      }

      if (!response) {
        throw lastError || new Error("All audio models are busy.");
      }

      let base64Audio: string | null = null;
      if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Audio = part.inlineData.data;
            break;
          }
        }
      }

      if (!base64Audio) {
        throw new Error("No audio data received from Gemini API.");
      }

      res.json({ base64Audio });
    } catch (error: any) {
      console.log(`[Backup] No audio generation available: ${error?.message || error}`);
      res.status(500).json({ error: error.message || "Audio is currently busy." });
    }
  });

  // Vite middleware for development vs static asset serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
