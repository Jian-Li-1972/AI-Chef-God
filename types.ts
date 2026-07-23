
export interface Ingredient {
  name: string;
  quantity: string;
  pronunciation?: string;
}

export interface Recipe {
  dishName: string;
  dishNamePronunciation?: string;
  description: string;
  ingredients: Ingredient[];
  cookingSteps: string[];
  dishImage?: string;
  dishImageStatus: 'pending' | 'loaded' | 'failed' | 'quota_exceeded';
  cookingTime?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  cuisine?: string;
  isFavorite?: boolean;
  servings?: number;
  rating?: number;
  ratingCount?: number;
  userRating?: number;
}

export interface Settings {
  themeColor: 'green' | 'blue' | 'indigo' | 'teal';
  fontFamily: 'sans' | 'serif' | 'mono' | 'cursive' | 'fantasy';
  language: 'en' | 'es' | 'fr' | 'zh-CN' | 'zh-TW';
  themeMode: 'light' | 'dark';
}
