import { Recipe, Settings } from "../types";

export const generateRecipesFromImage = async (
  image: { mimeType: string; data: string },
  prompt: string,
  settings: Settings
): Promise<Recipe[]> => {
  try {
    const response = await fetch("/api/generate-recipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image, prompt, settings }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to generate recipes from server");
    }

    const data = await response.json();
    return data.recipes as Recipe[];
  } catch (error: any) {
    console.error("Error calling generate-recipes endpoint:", error);
    throw new Error(error.message || "Failed to generate recipes from server.");
  }
};

export const generateDishImage = async (
  dishName: string,
  description: string
): Promise<string | null> => {
  try {
    const response = await fetch("/api/generate-dish-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dishName, description }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to generate dish image from server");
    }

    const data = await response.json();
    return data.imageData;
  } catch (error) {
    console.error("Error calling generate-dish-image endpoint:", error);
    return null;
  }
};
