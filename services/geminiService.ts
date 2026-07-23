

import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Recipe, Settings } from "../types";

// Fix: Initialize GoogleGenAI with named apiKey parameter using GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
      const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && i < maxRetries - 1) {
        console.warn(`Rate limit hit, retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  return await fn(); // Final attempt
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

  const textPart = {
    text: `Based on the ingredients in this image, generate 3 diverse recipe ideas. 
    Consider the following user preferences: "${prompt || 'no specific preferences'}".
    Please provide the response in ${settings.language} language.
    For each recipe, provide a dish name, a short description, a list of ingredients with quantities, and cooking steps.
    Also include an estimated cooking time, a difficulty level ('Easy', 'Medium', or 'Hard'), the cuisine category (e.g., 'Chinese (Sichuan)', 'Japanese', 'Thai', 'French', 'Italian'), and the number of servings (e.g., 2 or 4).`,
  };

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      },
    }));

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

export const generateDishImage = async (
  dishName: string,
  description: string
): Promise<string | null> => {
  const prompt = `Photorealistic, food magazine quality image of "${dishName}". ${description}. The dish is artfully plated on a ceramic plate, garnished with fresh herbs. Set against a slightly out-of-focus background of a rustic wooden table. The lighting is bright and natural, creating soft shadows that accentuate the texture of the food. The overall feel should be appetizing, high-end, and delicious.`;
  
  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
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
    }));

    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return part.inlineData.data;
        }
      }
    }
    return null;
  } catch (error: any) {
    const isQuotaError = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
    
    if (isQuotaError) {
        console.warn("Gemini API Quota Exceeded for dish image generation.");
        return 'QUOTA_EXCEEDED';
    }
    
    console.error("Error generating dish image:", error);
    return null;
  }
};
