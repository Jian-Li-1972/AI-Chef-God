
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
  dishImageStatus: 'pending' | 'loaded' | 'failed';
  cookingTime?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  cuisine?: string;
  isFavorite?: boolean;
}

export interface Settings {
  themeColor: 'green' | 'blue' | 'indigo' | 'teal';
  fontFamily: 'sans' | 'serif' | 'mono' | 'cursive' | 'fantasy';
  language: 'en' | 'es' | 'fr' | 'zh-CN' | 'zh-TW';
  themeMode: 'light' | 'dark';
}
