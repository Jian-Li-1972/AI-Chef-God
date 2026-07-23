

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageUploader } from './components/ImageUploader';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDisplay } from './components/RecipeDisplay';
import { Loader } from './components/Loader';
import { SettingsModal } from './components/SettingsModal';
import { ImageModal } from './components/ImageModal';
import { AuthModal } from './components/AuthModal';
import { UserActionsModal } from './components/UserActionsModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { SavedRecipesModal } from './components/SavedRecipesModal';
import { VideoPromoModal } from './components/VideoPromoModal';
import { ChefTipsModal } from './components/ChefTipsModal';
import { ChefHatIcon } from './components/icons/ChefHatIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { UserIcon } from './components/icons/UserIcon';
import { BookmarkIcon } from './components/icons/BookmarkIcon';
import { VideoIcon } from './components/icons/VideoIcon';
import { MicrophoneIcon } from './components/icons/MicrophoneIcon';
import { SearchIcon } from './components/icons/SearchIcon';
import { StarIcon } from './components/icons/StarIcon';
import { generateRecipesFromImage, generateDishImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { getTranslation } from './utils/translations';
import { getThemeClasses } from './utils/themeUtils';
import { Recipe, Settings } from './types';

// Fix: Add TypeScript definitions for the Web Speech API to resolve errors on lines 51 and 74.
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

// Utility to parse time string like "45 minutes" or "1 hour" to a number in minutes
const parseCookingTime = (timeStr?: string): number => {
    if (!timeStr) return Infinity;
    const lowerStr = timeStr.toLowerCase();
    const match = lowerStr.match(/(\d+)/);
    if (!match) return Infinity;
    
    let value = parseInt(match[1], 10);
    if (lowerStr.includes('hour') || lowerStr.includes('hr')) {
        // If it's something like "1 hour 30 minutes", this simple logic might need more work, 
        // but for "1 hour" or "1.5 hours" it's a start. 
        // Let's handle "X hour(s) Y minute(s)"
        const hourMatch = lowerStr.match(/(\d+)\s*h/);
        const minuteMatch = lowerStr.match(/(\d+)\s*m/);
        
        if (hourMatch && minuteMatch) {
            return parseInt(hourMatch[1], 10) * 60 + parseInt(minuteMatch[1], 10);
        } else if (hourMatch) {
            return parseInt(hourMatch[1], 10) * 60;
        } else if (lowerStr.includes('hour') || lowerStr.includes('hr')) {
             return value * 60;
        }
    }
    return value;
};

function App() {
  // State
  const [settings, setSettings] = useState<Settings>({
    themeColor: 'green',
    fontFamily: 'sans',
    language: 'en',
    themeMode: 'light',
  });
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Modal states
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserActionsModalOpen, setIsUserActionsModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isSavedRecipesModalOpen, setIsSavedRecipesModalOpen] = useState(false);
  const [isVideoPromoModalOpen, setIsVideoPromoModalOpen] = useState(false);
  const [isChefTipsModalOpen, setIsChefTipsModalOpen] = useState(false);

  // User & Saved Data
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [savedMenus, setSavedMenus] = useState<Recipe[][]>([]);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const t = useCallback((key: string) => getTranslation(settings.language, key), [settings.language]);
  const themeClasses = useMemo(() => getThemeClasses(settings.themeColor, settings.themeMode), [settings.themeColor, settings.themeMode]);


  // Effects
  useEffect(() => {
    const isAnyModalOpen = isSettingsModalOpen || !!enlargedImageUrl || isAuthModalOpen || isUserActionsModalOpen || isChangePasswordModalOpen || isSavedRecipesModalOpen || isVideoPromoModalOpen || isChefTipsModalOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isSettingsModalOpen, enlargedImageUrl, isAuthModalOpen, isUserActionsModalOpen, isChangePasswordModalOpen, isSavedRecipesModalOpen, isVideoPromoModalOpen, isChefTipsModalOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recipeName = params.get('recipe');
    if (recipeName && recipes.length > 0) {
      const recipe = recipes.find(r => r.dishName === recipeName);
      if (recipe) {
        setSelectedRecipe(recipe);
      }
    }
  }, [recipes]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', settings.themeMode === 'dark');
    root.classList.toggle('light', settings.themeMode === 'light');
    document.body.className = `${themeClasses.bgBody} ${themeClasses.textPrimary} font-body`;

    // Set CSS variable for theme accent color
    const accentColor = {
        green: '#10B981', // emerald-500
        blue: '#3B82F6', // blue-500
        indigo: '#6366F1', // indigo-500
        teal: '#14B8A6' // teal-500
    }[settings.themeColor];
    root.style.setProperty('--theme-color-accent', accentColor);
  }, [settings.themeColor, settings.themeMode, themeClasses]);

  useEffect(() => {
    // Fix: Use window.webkitSpeechRecognition with proper types, removing the 'as any' cast.
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = settings.language;

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            if (transcript) {
                setPrompt(prev => (prev ? prev.trim() + ' ' : '') + transcript);
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setError(t('microphonePermissionDenied'));
            }
            setIsRecording(false);
        };
        
        recognitionRef.current = recognition;
    } else {
        console.warn('Speech Recognition not supported in this browser.');
    }
  }, [settings.language, t]);

  const updateRecipeImageAndStatus = useCallback((recipeName: string, imageData: string | null, status: 'loaded' | 'failed' | 'quota_exceeded') => {
    setRecipes(currentRecipes =>
      currentRecipes.map(r =>
        r.dishName === recipeName ? { ...r, dishImage: imageData ?? undefined, dishImageStatus: status } : r
      )
    );
    setSelectedRecipe(currentSelected =>
      (currentSelected && currentSelected.dishName === recipeName) ? { ...currentSelected, dishImage: imageData ?? undefined, dishImageStatus: status } : currentSelected
    );
  }, []);
  
  const handleRegenerateImage = async (recipeName: string) => {
    setRecipes(currentRecipes =>
        currentRecipes.map(r => r.dishName === recipeName ? { ...r, dishImageStatus: 'pending' as const } : r)
    );
    setSelectedRecipe(currentSelected =>
        (currentSelected && currentSelected.dishName === recipeName) ? { ...currentSelected, dishImageStatus: 'pending' as const } : currentSelected
    );

    setTimeout(async () => {
        const recipeToRegenerate = recipes.find(r => r.dishName === recipeName);
        if (recipeToRegenerate) {
            const imageData = await generateDishImage(recipeToRegenerate.dishName, recipeToRegenerate.description);
             if (imageData === 'QUOTA_EXCEEDED') {
                updateRecipeImageAndStatus(recipeToRegenerate.dishName, null, 'quota_exceeded');
            } else if (imageData) {
                updateRecipeImageAndStatus(recipeToRegenerate.dishName, imageData, 'loaded');
            } else {
                updateRecipeImageAndStatus(recipeToRegenerate.dishName, null, 'failed');
            }
        }
    }, 100);
  };

  useEffect(() => {
    const fetchImages = async () => {
        for (const recipe of recipes) {
            if (recipe.dishImageStatus === 'pending' && !recipe.dishImage) {
                // Add a small delay between calls to avoid hitting rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
                const imageData = await generateDishImage(recipe.dishName, recipe.description);
                if (imageData === 'QUOTA_EXCEEDED') {
                    updateRecipeImageAndStatus(recipe.dishName, null, 'quota_exceeded');
                } else if (imageData) {
                    updateRecipeImageAndStatus(recipe.dishName, imageData, 'loaded');
                } else {
                    updateRecipeImageAndStatus(recipe.dishName, null, 'failed');
                }
            }
        }
    };

    if (recipes.length > 0) {
        fetchImages();
    }
  }, [recipes, updateRecipeImageAndStatus]);

  // Handlers
  const handleGenerateRecipes = async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setRecipes([]);
    setSelectedRecipe(null);
    try {
      const base64Image = await fileToBase64(imageFile);
      const generatedRecipes = await generateRecipesFromImage(
        { mimeType: imageFile.type, data: base64Image },
        prompt,
        settings
      );
      const recipesWithStatus = generatedRecipes.map(r => ({ ...r, dishImageStatus: 'pending' as const, isFavorite: false }));
      setRecipes(recipesWithStatus);
      setSelectedRecipe(recipesWithStatus[0] || null);
    } catch (e) {
      setError(t('errorGeneratingRecipes'));
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (file: File | null) => {
    setImageFile(file);
    if(file) {
        setError(null);
        setRecipes([]);
        setSelectedRecipe(null);
    }
  };
  
  const handleVoiceInput = () => {
    if (isRecording || !recognitionRef.current) return;
    try {
        recognitionRef.current.start();
        setIsRecording(true);
    } catch(e) {
        console.error("Could not start recognition", e);
        setIsRecording(false);
    }
  };

  const handleSelectRecipe = (recipe: Recipe | null) => {
    setSelectedRecipe(recipe);
  };

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const handleImageEnlarge = (imageUrl: string) => {
    setEnlargedImageUrl(imageUrl);
  };
  
  const handleAuth = (data: any) => {
    // Mock auth
    setUser({ name: data.userName || 'Demo User' });
  };
  
  const handleLogout = () => {
    setUser(null);
    setIsUserActionsModalOpen(false);
  };

  const handleSaveMenu = () => {
    if (recipes.length > 0) {
      setSavedMenus(prev => [...prev, recipes]);
      // simple feedback
      alert('Menu saved!');
    }
  }

  const handleLoadMenu = (menu: Recipe[]) => {
    setRecipes(menu);
    setSelectedRecipe(menu[0] || null);
    setIsSavedRecipesModalOpen(false);
  }

  const handleToggleFavorite = (dishName: string) => {
    setRecipes(currentRecipes =>
        currentRecipes.map(r =>
            r.dishName === dishName ? { ...r, isFavorite: !r.isFavorite } : r
        )
    );
    setSelectedRecipe(currentSelected =>
        (currentSelected && currentSelected.dishName === dishName) ? { ...currentSelected, isFavorite: !currentSelected.isFavorite } : currentSelected
    );
  };

  const handleRateRecipe = (dishName: string, rating: number) => {
    setRecipes(currentRecipes =>
      currentRecipes.map(r => {
        if (r.dishName === dishName) {
          const currentRating = r.rating || 0;
          const currentCount = r.ratingCount || 0;
          const oldUserRating = r.userRating || 0;
          
          let newCount = currentCount;
          let newRating = currentRating;
          
          if (oldUserRating === 0) {
            // New rating
            newCount = currentCount + 1;
            newRating = (currentRating * currentCount + rating) / newCount;
          } else {
            // Updating existing rating
            newRating = (currentRating * currentCount - oldUserRating + rating) / currentCount;
          }
          
          return { ...r, rating: newRating, ratingCount: newCount, userRating: rating };
        }
        return r;
      })
    );
    setSelectedRecipe(currentSelected => {
      if (currentSelected && currentSelected.dishName === dishName) {
        const currentRating = currentSelected.rating || 0;
        const currentCount = currentSelected.ratingCount || 0;
        const oldUserRating = currentSelected.userRating || 0;
        
        let newCount = currentCount;
        let newRating = currentRating;
        
        if (oldUserRating === 0) {
          newCount = currentCount + 1;
          newRating = (currentRating * currentCount + rating) / newCount;
        } else {
          newRating = (currentRating * currentCount - oldUserRating + rating) / currentCount;
        }
        
        return { ...currentSelected, rating: newRating, ratingCount: newCount, userRating: rating };
      }
      return currentSelected;
    });
  };
  
  const filteredRecipes = useMemo(() => {
    return recipes
        .filter(recipe => {
            // Text search
            if (!searchQuery) return true;
            const lowercasedQuery = searchQuery.toLowerCase();
            const nameMatch = recipe.dishName.toLowerCase().includes(lowercasedQuery);
            const ingredientMatch = recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowercasedQuery));
            return nameMatch || ingredientMatch;
        })
        .filter(recipe => {
            // Difficulty filter
            if (difficultyFilter === 'all') return true;
            return recipe.difficulty === difficultyFilter;
        })
        .filter(recipe => {
            // Time filter
            if (timeFilter === 'all') return true;
            const time = parseCookingTime(recipe.cookingTime);
            if (timeFilter === 'under30') return time < 30;
            if (timeFilter === '30to60') return time >= 30 && time <= 60;
            if (timeFilter === 'over60') return time > 60;
            return true;
        })
        .filter(recipe => {
            // Cuisine filter
            if (cuisineFilter === 'all') return true;
            return recipe.cuisine?.toLowerCase().includes(cuisineFilter.toLowerCase());
        })
        .filter(recipe => {
            // Favorites filter
            if (!favoritesOnly) return true;
            return !!recipe.isFavorite;
        });
  }, [recipes, searchQuery, difficultyFilter, timeFilter, cuisineFilter, favoritesOnly]);

  return (
    <div className={`min-h-screen transition-colors duration-300`}>
      <header className={`sticky top-0 z-20 shadow-sm border-b ${themeClasses.bgCard} ${themeClasses.border} transition-colors pt-safe`}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-2 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <ChefHatIcon className={`h-6 w-6 sm:h-8 sm:w-8`} />
            <h1 className={`text-lg sm:text-2xl font-bold font-heading ${themeClasses.textHeader} truncate max-w-[150px] sm:max-w-none`}>{t('appTitle')}</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <button onClick={() => setIsChefTipsModalOpen(true)} title={t('successSecrets')} className="p-2 rounded-full text-yellow-500 hover:bg-yellow-500/10 transition-colors">
                <SparklesIcon className="h-6 w-6" />
            </button>
            <button onClick={() => setIsVideoPromoModalOpen(true)} title={t('generatePromoVideo')} className="p-2 rounded-full text-indigo-500 hover:bg-indigo-500/10 transition-colors">
                <VideoIcon className="h-6 w-6" />
            </button>
            <button onClick={() => setIsSavedRecipesModalOpen(true)} title={t('savedMenus')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors hidden sm:flex">
                <BookmarkIcon className="h-6 w-6" />
            </button>
            <button onClick={() => setIsSettingsModalOpen(true)} title={t('settings')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors hidden sm:flex">
              <SettingsIcon className="h-6 w-6" />
            </button>
            {user ? (
              <button onClick={() => setIsUserActionsModalOpen(true)} title={user.name} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <UserIcon className="h-6 w-6" />
              </button>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className={`text-sm font-semibold ${themeClasses.icon} hover:underline px-2`}>{t('loginRegister')}</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8 lg:grid lg:grid-cols-5 lg:gap-12 pb-24 lg:pb-8">
        {/* Left Column */}
        <div className={`space-y-6 lg:space-y-8 lg:col-span-2 ${selectedRecipe ? 'hidden lg:block' : 'block'}`}>
          <div className={`p-5 sm:p-6 rounded-2xl shadow-lg border ${themeClasses.bgCard} ${themeClasses.border}`}>
            <h2 className={`text-lg sm:text-xl font-bold font-heading mb-4 ${themeClasses.textHeader}`}>{t('appSubtitle')}</h2>
            <ImageUploader onImageSelect={handleImageSelect} settings={settings} t={t} />
            <div className="relative mt-4">
                <textarea
                    className={`w-full p-3 border rounded-lg pr-12 transition-colors ${themeClasses.input} ${themeClasses.border} ${themeClasses.borderFocus}`}
                    rows={3}
                    placeholder={t('promptPlaceholder')}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <button
                    onClick={handleVoiceInput}
                    disabled={isRecording || !recognitionRef.current}
                    title={t('voiceInput')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isRecording 
                        ? 'text-red-500 animate-pulse' 
                        : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                    <MicrophoneIcon className="h-6 w-6" />
                </button>
            </div>
            <button
              onClick={handleGenerateRecipes}
              disabled={isLoading || !imageFile}
              className={`w-full mt-4 font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] flex justify-center items-center h-12 shadow-md hover:shadow-lg ${isLoading || !imageFile ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed' : `${themeClasses.buttonPrimary} text-white`}`}
            >
              {isLoading ? <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div> : t('generateButton')}
            </button>
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          </div>

          {recipes.length > 0 && (
            <div className="space-y-4">
                <div className="flex justify-between items-center gap-4">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      placeholder={t('searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full p-2.5 pl-10 border rounded-lg transition-colors ${themeClasses.input} ${themeClasses.border} ${themeClasses.borderFocus}`}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <SearchIcon className="h-5 w-5" />
                    </span>
                  </div>
                  <button onClick={handleSaveMenu} className={`inline-flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors border-2 flex-shrink-0 ${themeClasses.icon} border-current hover:bg-gray-200 dark:hover:bg-gray-700`}>
                    <BookmarkIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">{t('saveMenu')}</span>
                  </button>
                </div>
                {/* Advanced Filters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="difficulty-filter" className={`block text-xs font-medium ${themeClasses.textSecondary} mb-1`}>{t('difficulty')}</label>
                    <select id="difficulty-filter" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className={`w-full text-sm p-2 border rounded-lg transition-colors ${themeClasses.input} ${themeClasses.border} ${themeClasses.borderFocus}`}>
                        <option value="all">{t('all')}</option>
                        <option value="Easy">{t('easy')}</option>
                        <option value="Medium">{t('medium')}</option>
                        <option value="Hard">{t('hard')}</option>
                    </select>
                  </div>
                   <div>
                    <label htmlFor="time-filter" className={`block text-xs font-medium ${themeClasses.textSecondary} mb-1`}>{t('cookingTime')}</label>
                    <select id="time-filter" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className={`w-full text-sm p-2 border rounded-lg transition-colors ${themeClasses.input} ${themeClasses.border} ${themeClasses.borderFocus}`}>
                        <option value="all">{t('all')}</option>
                        <option value="under30">{t('timeUnder30')}</option>
                        <option value="30to60">{t('time30to60')}</option>
                        <option value="over60">{t('timeOver60')}</option>
                    </select>
                  </div>
                   <div>
                    <label htmlFor="cuisine-filter" className={`block text-xs font-medium ${themeClasses.textSecondary} mb-1`}>{t('cuisine')}</label>
                    <select id="cuisine-filter" value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)} className={`w-full text-sm p-2 border rounded-lg transition-colors ${themeClasses.input} ${themeClasses.border} ${themeClasses.borderFocus}`}>
                        <option value="all">{t('all')}</option>
                        <option value="chinese">{t('chinese')}</option>
                        <option value="japanese">{t('japanese')}</option>
                        <option value="thai">{t('thai')}</option>
                        <option value="french">{t('cuisine_french')}</option>
                        <option value="italian">{t('italian')}</option>
                        <option value="indian">{t('indian')}</option>
                        <option value="mexican">{t('mexican')}</option>
                        <option value="american">{t('american')}</option>
                        <option value="korean">{t('korean')}</option>
                        <option value="mediterranean">{t('mediterranean')}</option>
                        <option value="middle eastern">{t('middle_eastern')}</option>
                        <option value="vietnamese">{t('vietnamese')}</option>
                        <option value="greek">{t('greek')}</option>
                        <option value="spanish">{t('cuisine_spanish')}</option>
                        <option value="british">{t('british')}</option>
                        <option value="german">{t('german')}</option>
                        <option value="turkish">{t('turkish')}</option>
                        <option value="brazilian">{t('brazilian')}</option>
                        <option value="russian">{t('russian')}</option>
                        <option value="african">{t('african')}</option>
                        <option value="caribbean">{t('caribbean')}</option>
                        <option value="lebanese">{t('lebanese')}</option>
                        <option value="moroccan">{t('moroccan')}</option>
                        <option value="portuguese">{t('portuguese')}</option>
                        <option value="scandinavian">{t('scandinavian')}</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <button 
                        onClick={() => setFavoritesOnly(!favoritesOnly)}
                        className={`w-full text-sm p-2 border rounded-lg transition-colors flex items-center justify-center gap-2 h-[38px] ${favoritesOnly ? 'bg-yellow-500/10 border-yellow-500 text-yellow-600 dark:text-yellow-400' : `${themeClasses.input} ${themeClasses.border}`}`}
                    >
                        <StarIcon solid={favoritesOnly} className="h-4 w-4" />
                        <span>{t('favoritesOnly')}</span>
                    </button>
                  </div>
                </div>
            </div>
          )}
          
          <div className="space-y-4">
            {isLoading && !recipes.length && <Loader />}
            {filteredRecipes.length > 0 ? (
                [...filteredRecipes]
                  .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
                  .map((recipe) => (
                  <RecipeCard
                    key={recipe.dishName}
                    recipe={recipe}
                    onSelect={() => handleSelectRecipe(recipe)}
                    onRegenerateImage={() => handleRegenerateImage(recipe.dishName)}
                    onToggleFavorite={() => handleToggleFavorite(recipe.dishName)}
                    isSelected={selectedRecipe?.dishName === recipe.dishName}
                    settings={settings}
                    t={t}
                  />
                ))
            ) : (
                recipes.length > 0 && (
                    <p className={`text-center py-4 ${themeClasses.textSecondary}`}>
                        {t('noResultsFound')}
                    </p>
                )
            )}
          </div>
        </div>

        {/* Right Column */}
        <AnimatePresence>
          {selectedRecipe && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`lg:col-span-3 rounded-2xl shadow-lg border lg:sticky lg:top-28 lg:h-[calc(100vh-8.5rem)] fixed inset-0 z-40 lg:relative lg:inset-auto ${themeClasses.bgCard} ${themeClasses.border}`}
            >
              <RecipeDisplay 
                recipe={selectedRecipe} 
                settings={settings} 
                t={t} 
                onImageEnlarge={handleImageEnlarge}
                onBack={() => handleSelectRecipe(null)}
                onRegenerateImage={selectedRecipe ? () => handleRegenerateImage(selectedRecipe.dishName) : undefined}
                onToggleFavorite={selectedRecipe ? () => handleToggleFavorite(selectedRecipe.dishName) : undefined}
                onRate={selectedRecipe ? (rating) => handleRateRecipe(selectedRecipe.dishName, rating) : undefined}
              />
            </motion.div>
          )}
          {!selectedRecipe && (
            <div className="hidden lg:block lg:col-span-3 rounded-2xl shadow-lg border lg:sticky lg:top-28 lg:h-[calc(100vh-8.5rem)] bg-gray-50 dark:bg-gray-900/50 border-dashed border-gray-300 dark:border-gray-700">
                <RecipeDisplay 
                    recipe={null} 
                    settings={settings} 
                    t={t} 
                    onImageEnlarge={handleImageEnlarge}
                    onBack={() => {}}
                />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t shadow-[0_-4px_12px_rgba(0,0,0,0.05)] ${themeClasses.bgCard} ${themeClasses.border} flex justify-around items-center h-16 px-2 pb-safe`}>
        <button 
          onClick={() => { setSelectedRecipe(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${!selectedRecipe ? themeClasses.icon : 'text-gray-400'}`}
        >
          <ChefHatIcon className="h-6 w-6" />
          <span className="text-[10px] font-medium">{t('home')}</span>
        </button>
        <button 
          onClick={() => setIsSavedRecipesModalOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <BookmarkIcon className="h-6 w-6" />
          <span className="text-[10px] font-medium">{t('saved')}</span>
        </button>
        <button 
          onClick={() => setIsSettingsModalOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <SettingsIcon className="h-6 w-6" />
          <span className="text-[10px] font-medium">{t('settings')}</span>
        </button>
      </nav>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} settings={settings} onSettingsChange={handleSettingsChange} />
      <ImageModal imageUrl={enlargedImageUrl} onClose={() => setEnlargedImageUrl(null)} t={t} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuth={handleAuth} settings={settings} />
      {user && <UserActionsModal isOpen={isUserActionsModalOpen} onClose={() => setIsUserActionsModalOpen(false)} onAction={(action) => { if (action === 'changePassword') setIsChangePasswordModalOpen(true); setIsUserActionsModalOpen(false); }} onLogout={handleLogout} userName={user.name} settings={settings} />}
      <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} onChangePassword={() => alert('Password changed!')} settings={settings} />
      <SavedRecipesModal isOpen={isSavedRecipesModalOpen} onClose={() => setIsSavedRecipesModalOpen(false)} savedMenus={savedMenus} onLoadMenu={handleLoadMenu} onClear={() => setSavedMenus([])} settings={settings} t={t} />
      <VideoPromoModal isOpen={isVideoPromoModalOpen} onClose={() => setIsVideoPromoModalOpen(false)} settings={settings} t={t} />
      <ChefTipsModal isOpen={isChefTipsModalOpen} onClose={() => setIsChefTipsModalOpen(false)} settings={settings} t={t} />
    </div>
  );
}

export default App;