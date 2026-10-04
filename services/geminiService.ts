import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, Settings } from "../types";

// 安全讀取環境變量，優先讀取 Vite 前端注入變量，次選 process.env，嚴格杜絕寫死字串
const API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
  (typeof import.meta !== "undefined" && import.meta.env?.GEMINI_API_KEY) ||
  (typeof process !== "undefined" && process.env?.VITE_GEMINI_API_KEY) ||
  (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) ||
  "";

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
        },
        servings: {
          type: Type.INTEGER,
          description: "The number of servings the recipe makes (e.g., 2, 4)."
        }
      },
      required: ["dishName", "description", "ingredients", "cookingSteps", "servings"]
    }
};

// 修正為官方標準最新快速模型
const PRIMARY_MODEL = 'gemini-2.5-flash';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const is503 =
        error?.message?.includes('503') ||
        error?.status === 503 ||
        error?.message?.includes('UNAVAILABLE') ||
        error?.message?.includes('overloaded');
      const isRateLimit =
        error?.message?.includes('429') ||
        error?.status === 429 ||
        error?.message?.includes('RESOURCE_EXHAUSTED');

      if ((is503 || isRateLimit) && i < maxRetries - 1) {
        console.warn(`Transient 503/429 error on ${PRIMARY_MODEL}, retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await sleep(delay);
        delay *= 2; // Exponential backoff: 1s, 2s, 4s
        continue;
      }
      throw error;
    }
  }
  return await fn();
}

export const generateRecipesFromImage = async (
  image: { mimeType: string; data: string },
  prompt: string,
  settings: Settings
): Promise<Recipe[]> => {
  const imagePart = {
    inlineData: {
      mimeType: image.mimeType,
      data: image.data,
    },
  };

  const languageNames: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'zh-CN': 'Simplified Chinese',
    'zh-TW': 'Traditional Chinese',
    'th': 'Thai',
    'ru': 'Russian',
  };
  const targetLanguage = languageNames[settings.language] || 'English';

  const textPart = {
    text: `Based on the ingredients in this image, generate 3 diverse recipe ideas. 
    Consider the following user preferences: "${prompt || 'no specific preferences'}".
    Please provide the response entirely in ${targetLanguage} language (including dish name, description, ingredients, and cooking steps).
    For each recipe, provide a dish name, a short description, a list of ingredients with quantities, and cooking steps.
    Also include an estimated cooking time, a difficulty level ('Easy', 'Medium', or 'Hard'), the cuisine category (e.g., 'Chinese (Sichuan)', 'Japanese', 'Thai', 'French', 'Italian', 'Russian'), and the number of servings (e.g., 2 or 4).`,
  };

  try {
    const response = await retryWithBackoff(() =>
      ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: recipeSchema,
        },
      })
    );

    const jsonStr = response.text?.trim();
    if (!jsonStr) {
      throw new Error("Empty response from Gemini API.");
    }
    const recipes = JSON.parse(jsonStr);
    return recipes as Recipe[];
  } catch (error) {
    console.error("Error generating recipes:", error);
    throw new Error("Failed to generate recipes from Gemini API.");
  }
};

export const generateRecipesByDishName = async (
  dishName: string,
  prompt: string,
  settings: Settings,
  style?: string
): Promise<Recipe[]> => {
  const languageNames: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'zh-CN': 'Simplified Chinese',
    'zh-TW': 'Traditional Chinese',
    'th': 'Thai',
    'ru': 'Russian',
  };
  const targetLanguage = languageNames[settings.language] || 'English';

  const styleContext = style && style !== 'all' ? `Style preference: ${style}.` : '';

  const textPart = {
    text: `You are a world-class master chef. Generate 2 to 3 distinct, authentic and delicious recipes for the dish: "${dishName}".
    ${styleContext}
    User specific preferences: "${prompt || 'authentic and delicious'}".
    Provide varied approaches (e.g. Authentic Classic version, Quick Weeknight/Home-style version, or Chef's Signature twist) for this dish.
    Please provide the response entirely in ${targetLanguage} language (including dish name, description, ingredients, and cooking steps).
    For each recipe, provide:
    - dishName: The specific title of the dish variation (e.g. Classic ${dishName}, Quick Home-style ${dishName}, etc.).
    - dishNamePronunciation: Phonetic pronunciation of the dish name.
    - description: A short, appetizing description explaining the flavor profile and texture.
    - ingredients: Complete list of ingredients with precise quantities and phonetic pronunciation.
    - cookingSteps: Step-by-step instructions with key culinary techniques, heat control, and tips.
    - cookingTime: Estimated total time (e.g., '25 minutes', '45 minutes').
    - difficulty: Difficulty level ('Easy', 'Medium', or 'Hard').
    - cuisine: Cuisine category (e.g., 'Chinese (Sichuan)', 'Italian', 'Thai', 'French', etc.).
    - servings: Number of servings (e.g., 2, 4).`,
  };

  try {
    const response = await retryWithBackoff(() =>
      ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: { parts: [textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: recipeSchema,
        },
      })
    );

    const jsonStr = response.text?.trim();
    if (!jsonStr) {
      throw new Error("Empty response from Gemini API.");
    }
    const recipes = JSON.parse(jsonStr);
    return recipes as Recipe[];
  } catch (error) {
    console.error("Error generating recipes by dish name:", error);
    throw new Error("Failed to generate recipes from Gemini API.");
  }
};

interface ImageTask {
  dishName: string;
  description: string;
  resolve: (value: string | null) => void;
  reject: (reason?: any) => void;
}

export class RecipeImageQueue {
  private queue: ImageTask[] = [];
  private isProcessing: boolean = false;
  private lastRequestEndTime: number = 0;
  private readonly intervalMs: number = 2000;

  public enqueue(dishName: string, description: string): Promise<string | null> {
    return new Promise<string | null>((resolve, reject) => {
      this.queue.push({ dishName, description, resolve, reject });
      this.processQueue();
    });
  }

  public clear(): void {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        task.resolve(null);
      }
    }
  }

  public getPendingCount(): number {
    return this.queue.length;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const task = this.queue.shift();
        if (!task) break;

        if (this.lastRequestEndTime > 0) {
          const elapsed = Date.now() - this.lastRequestEndTime;
          if (elapsed < this.intervalMs) {
            await sleep(this.intervalMs - elapsed);
          }
        }

        try {
          const result = await this.generateWithAutoRetry(task.dishName, task.description, 2);
          task.resolve(result);
        } catch (err) {
          console.error(`[RecipeImageQueue] Unexpected error generating image for "${task.dishName}":`, err);
          task.resolve(null);
        } finally {
          this.lastRequestEndTime = Date.now();
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async generateWithAutoRetry(
    dishName: string,
    description: string,
    maxRetries: number = 2
  ): Promise<string | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        let englishPrompt = `${dishName}, authentic cuisine, food photography`;
        try {
          const transRes = await ai.models.generateContent({
            model: PRIMARY_MODEL,
            contents: `Translate and describe this dish for a photorealistic food image generator. Dish: "${dishName}", Description: "${description}". Output ONLY a concise English image prompt describing the cooked dish appearance, color, sauce, and plating in under 30 words. Do not include markdown or quotes.`,
          });
          if (transRes.text) {
            englishPrompt = transRes.text.trim();
          }
        } catch (e) {
          console.warn(`[RecipeImageQueue] Translation fallback for "${dishName}":`, e);
        }

        const seed = Math.floor(Math.random() * 100000);
        const fullPrompt = encodeURIComponent(`delicious appetizing ${englishPrompt}, professional culinary photography, high resolution, food magazine, 8k, close up`);
        const imageUrl = `https://image.pollinations.ai/prompt/${fullPrompt}?width=640&height=480&nologo=true&seed=${seed}`;

        const res = await fetch(imageUrl);
        if (!res.ok) {
          throw new Error(`Image service responded with status ${res.status}`);
        }
        const blob = await res.blob();
        if (!blob || blob.size === 0) {
          throw new Error("Empty image blob received");
        }
        const base64 = await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = (reader.result as string)?.split(',')[1];
            resolve(result || null);
          };
          reader.onerror = () => {
            resolve(null);
          };
          reader.readAsDataURL(blob);
        });

        if (base64) {
          return base64;
        }
        throw new Error("Failed to convert image to base64");
      } catch (error) {
        console.warn(`[RecipeImageQueue] Error generating dish image for "${dishName}" (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
        if (attempt < maxRetries) {
          await sleep(1500);
        }
      }
    }
    return null;
  }
}

export const recipeImageQueue = new RecipeImageQueue();

export const generateRecipeImage = async (
  dishName: string, 
  description: string,
  _retries: number = 2
): Promise<string | null> => {
  return recipeImageQueue.enqueue(dishName, description);
};

export const generateDishImage = generateRecipeImage;

export const generateRecipeImagesSequentially = async (
  recipesList: { dishName: string; description: string }[],
  onImageGenerated?: (dishName: string, imageBase64: string | null) => void,
  _delayMs: number = 2000
): Promise<Record<string, string | null>> => {
  const results: Record<string, string | null> = {};
  for (let i = 0; i < recipesList.length; i++) {
    const item = recipesList[i];
    const base64 = await generateRecipeImage(item.dishName, item.description);
    results[item.dishName] = base64;
    if (onImageGenerated) {
      onImageGenerated(item.dishName, base64);
    }
  }
  return results;
};

export const generateDishImagesSequentially = generateRecipeImagesSequentially;
export const generateRecipeImages = generateRecipeImagesSequentially;