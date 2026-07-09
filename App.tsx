

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { ChefHatIcon } from './components/icons/ChefHatIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { UserIcon } from './components/icons/UserIcon';
import { BookmarkIcon } from './components/icons/BookmarkIcon';
import { MicrophoneIcon } from './components/icons/MicrophoneIcon';
import { SearchIcon } from './components/icons/SearchIcon';
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

// Utility to parse time string like "45 minutes" to a number
const parseCookingTime = (timeStr?: string): number => {
    if (!timeStr) return Infinity;
    const match = timeStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : Infinity;
};

function App() {
  // State
  const [settings, setSettings] = useState<Settings>({
    themeColor: 'green',
    fontFamily: 'sans',
    language: 'zh-CN',
    themeMode: 'dark',
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

  // Modal states
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserActionsModalOpen, setIsUserActionsModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isSavedRecipesModalOpen, setIsSavedRecipesModalOpen] = useState(false);

  // User & Saved Data
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [savedMenus, setSavedMenus] = useState<Recipe[][]>(() => {
    try {
      const saved = localStorage.getItem('chef_god_saved_menus');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveDropdownRef = useRef<HTMLDivElement>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const t = useCallback((key: string) => getTranslation(settings.language, key), [settings.language]);
  const themeClasses = useMemo(() => getThemeClasses(settings.themeColor, settings.themeMode), [settings.themeColor, settings.themeMode]);


  // Effects
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

  const updateRecipeImageAndStatus = useCallback((recipeName: string, imageData: string | null, status: 'loaded' | 'failed') => {
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
             if (imageData) {
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
                const imageData = await generateDishImage(recipe.dishName, recipe.description);
                if (imageData) {
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

  // Persist saved menus to localStorage, stripping large base64 images to avoid QuotaExceededError
  useEffect(() => {
    try {
      const sanitizedMenus = savedMenus.map(menu => 
        menu.map(recipe => {
          const isBase64 = recipe.dishImage && (recipe.dishImage.startsWith('data:') || recipe.dishImage.length > 500);
          return {
            ...recipe,
            dishImage: isBase64 ? undefined : recipe.dishImage,
            dishImageStatus: isBase64 ? 'pending' : recipe.dishImageStatus
          };
        })
      );
      localStorage.setItem('chef_god_saved_menus', JSON.stringify(sanitizedMenus));
    } catch (e) {
      console.error('Error saving menus to localStorage', e);
    }
  }, [savedMenus]);

  // Close Save dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (saveDropdownRef.current && !saveDropdownRef.current.contains(event.target as Node)) {
        setIsSaveDropdownOpen(false);
      }
    };
    if (isSaveDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSaveDropdownOpen]);

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
      // Deep clone the current recipes to save a distinct snapshot in the library
      const clonedRecipes = JSON.parse(JSON.stringify(recipes));
      setSavedMenus(prev => [...prev, clonedRecipes]);
      alert(t('savedSuccessfully'));
    }
  };

  const handleExportCurrentMenu = () => {
    if (recipes.length === 0) return;
    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recipe-menu-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        let importedRecipes: Recipe[] = [];
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && Array.isArray(parsed[0])) {
            importedRecipes = parsed[0];
          } else {
            importedRecipes = parsed;
          }
        } else if (parsed && parsed.recipes && Array.isArray(parsed.recipes)) {
          importedRecipes = parsed.recipes;
        } else if (parsed && typeof parsed === 'object' && parsed.dishName) {
          importedRecipes = [parsed];
        }

        const isValid = importedRecipes.every(r => typeof r.dishName === 'string' && Array.isArray(r.ingredients));
        if (isValid && importedRecipes.length > 0) {
          setRecipes(importedRecipes);
          setSelectedRecipe(importedRecipes[0]);
          alert(t('menuLoadedSuccessfully'));
        } else {
          alert(t('invalidFileFormat'));
        }
      } catch (err) {
        console.error(err);
        alert(t('errorReadingFile'));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleImportLibrary = (importedLibrary: Recipe[][]) => {
    setSavedMenus(prev => {
      const existingTitles = new Set(prev.map(m => m[0]?.dishName));
      const filteredNew = importedLibrary.filter(m => m.length > 0 && !existingTitles.has(m[0].dishName));
      return [...prev, ...filteredNew];
    });
  };

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
        });
  }, [recipes, searchQuery, difficultyFilter, timeFilter, cuisineFilter]);

  return (
    <div className={`min-h-screen transition-colors duration-300`}>
      <header className={`sticky top-0 z-10 shadow-sm border-b ${themeClasses.bgCard} ${themeClasses.border} transition-colors`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ChefHatIcon className={`h-8 w-8`} />
            <h1 className={`text-2xl font-bold font-heading ${themeClasses.textHeader}`}>{t('appTitle')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSavedRecipesModalOpen(true)} title={t('savedMenus')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <BookmarkIcon className="h-6 w-6" />
            </button>
            <button onClick={() => setIsSettingsModalOpen(true)} title={t('settings')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <SettingsIcon className="h-6 w-6" />
            </button>
            {user ? (
              <button onClick={() => setIsUserActionsModalOpen(true)} title={user.name} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <UserIcon className="h-6 w-6" />
              </button>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className={`text-sm font-semibold ${themeClasses.icon} hover:underline`}>{t('loginRegister')}</button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 lg:grid lg:grid-cols-5 lg:gap-12">
        {/* Left Column */}
        <div className={`space-y-8 lg:col-span-2 ${selectedRecipe ? 'hidden lg:block' : 'block'}`}>
          <div className={`p-6 rounded-2xl shadow-lg border ${themeClasses.bgCard} ${themeClasses.border}`}>
            <h2 className={`text-xl font-bold font-heading mb-4 ${themeClasses.textHeader}`}>{t('appSubtitle')}</h2>
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
                <div className="flex justify-between items-center gap-4 relative" ref={saveDropdownRef}>
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
                  
                  <div className="flex items-center flex-shrink-0">
                    <button 
                      onClick={handleSaveMenu} 
                      className={`inline-flex items-center gap-2 text-sm font-semibold py-2 px-3 sm:px-4 rounded-l-lg transition-colors border-2 border-r border-current flex-shrink-0 ${themeClasses.icon} hover:bg-gray-200 dark:hover:bg-gray-700 h-[42px]`}
                      title={t('saveToLibrary')}
                    >
                      <BookmarkIcon className="h-5 w-5" />
                      <span className="hidden sm:inline">{t('saveMenu')}</span>
                    </button>
                    <button
                      onClick={() => setIsSaveDropdownOpen(prev => !prev)}
                      className={`inline-flex items-center justify-center p-2 rounded-r-lg transition-colors border-2 border-l-0 border-current flex-shrink-0 ${themeClasses.icon} hover:bg-gray-200 dark:hover:bg-gray-700 h-[42px]`}
                      title={t('moreOptions')}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {isSaveDropdownOpen && (
                    <div className={`absolute right-0 top-full mt-2 w-56 rounded-lg shadow-xl border z-20 ${settings.themeMode === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-black'}`}>
                      <div className="p-1.5 space-y-1">
                        <button
                          onClick={() => {
                            handleSaveMenu();
                            setIsSaveDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${settings.themeMode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                          <BookmarkIcon className="h-4 w-4 text-indigo-500" />
                          <span>{t('saveToLibrary')}</span>
                        </button>
                        <button
                          onClick={() => {
                            handleExportCurrentMenu();
                            setIsSaveDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${settings.themeMode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>{t('saveToDevice')}</span>
                        </button>
                        <button
                          onClick={() => {
                            fileInputRef.current?.click();
                            setIsSaveDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${settings.themeMode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>{t('openFromFile')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Advanced Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        {/* Fix: Use the new 'cuisine_french' translation key. */}
                        <option value="french">{t('cuisine_french')}</option>
                        <option value="italian">{t('italian')}</option>
                    </select>
                  </div>
                </div>
            </div>
          )}
          
          <div className="space-y-4">
            {isLoading && !recipes.length && <Loader />}
            
            {!isLoading && recipes.length === 0 && (
              <div className={`p-8 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center space-y-4 ${themeClasses.bgCard} ${themeClasses.border}`}>
                <div className="p-3 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
                  <ChefHatIcon className="h-10 w-10 animate-bounce" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="font-bold text-lg">{t('emptyStateTitle')}</h3>
                  <p className={`text-xs ${themeClasses.textSecondary} leading-relaxed`}>
                    {t('emptyStateSubtitle')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`inline-flex items-center gap-2 text-sm font-semibold py-2 px-5 rounded-lg transition-all duration-200 border-2 ${themeClasses.icon} border-current hover:bg-gray-150 dark:hover:bg-gray-800 shadow-sm`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>{t('openFromFile')}</span>
                  </button>
                </div>
              </div>
            )}

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
        <div className={`lg:col-span-3 rounded-2xl shadow-lg border lg:sticky top-28 lg:h-[calc(100vh-8.5rem)] ${selectedRecipe ? 'block' : 'hidden lg:block'} ${themeClasses.bgCard} ${themeClasses.border}`}>
          <RecipeDisplay 
            recipe={selectedRecipe} 
            settings={settings} 
            t={t} 
            onImageEnlarge={handleImageEnlarge}
            onBack={() => handleSelectRecipe(null)}
            onRegenerateImage={selectedRecipe ? () => handleRegenerateImage(selectedRecipe.dishName) : undefined}
            onSaveToLibrary={handleSaveMenu}
          />
        </div>
      </main>

      {/* Modals & Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImport} 
        accept=".json" 
        className="hidden" 
      />

      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} settings={settings} onSettingsChange={handleSettingsChange} />
      <ImageModal imageUrl={enlargedImageUrl} onClose={() => setEnlargedImageUrl(null)} t={t} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuth={handleAuth} settings={settings} />
      {user && <UserActionsModal isOpen={isUserActionsModalOpen} onClose={() => setIsUserActionsModalOpen(false)} onAction={(action) => { if (action === 'changePassword') setIsChangePasswordModalOpen(true); setIsUserActionsModalOpen(false); }} onLogout={handleLogout} userName={user.name} settings={settings} />}
      <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} onChangePassword={() => alert('Password changed!')} settings={settings} />
      <SavedRecipesModal 
        isOpen={isSavedRecipesModalOpen} 
        onClose={() => setIsSavedRecipesModalOpen(false)} 
        savedMenus={savedMenus} 
        onLoadMenu={handleLoadMenu} 
        onClear={() => setSavedMenus([])} 
        onDeleteMenu={(index) => setSavedMenus(prev => prev.filter((_, idx) => idx !== index))}
        onImportLibrary={handleImportLibrary} 
        settings={settings} 
        t={t} 
      />
    </div>
  );
}

export default App;