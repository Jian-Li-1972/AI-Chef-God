import React, { useState, useCallback } from 'react';
import { Recipe, Settings } from '../types';
import { getThemeClasses } from '../utils/themeUtils';
import Pronunciation from './Pronunciation';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { ShareIcon } from './icons/ShareIcon';
import { ShoppingListModal } from './ShoppingListModal';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ChefHatIcon } from './icons/ChefHatIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';

interface RecipeDisplayProps {
  recipe: Recipe | null;
  settings: Settings;
  t: (key: string) => string;
  onImageEnlarge: (imageUrl: string) => void;
  onBack: () => void;
  onRegenerateImage?: () => void;
  onSaveToLibrary?: () => void;
}

export const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe, settings, t, onImageEnlarge, onBack, onRegenerateImage, onSaveToLibrary }) => {
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const themeClasses = getThemeClasses(settings.themeColor, settings.themeMode);

  const handleShare = useCallback(async () => {
    if (!recipe) return;

    const shareData = {
      title: recipe.dishName,
      text: recipe.description,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
        alert("Failed to copy link.");
      }
    }
  }, [recipe]);

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <ChefHatIcon className="h-20 w-20 opacity-20 mb-4" />
        <h3 className="font-heading text-xl font-semibold opacity-60">{t('appTitle')}</h3>
        <p className={`${themeClasses.textSecondary} mt-2`}>{t('selectRecipe')}</p>
      </div>
    );
  }

  const { dishName, dishNamePronunciation, description, ingredients, cookingSteps, dishImage, dishImageStatus } = recipe;
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex-shrink-0 lg:hidden flex justify-between items-center">
        <button onClick={onBack} className={`inline-flex items-center gap-2 text-sm font-semibold ${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`}>
          <ArrowLeftIcon className="h-5 w-5" />
          {t('backToRecipes')}
        </button>
        {onSaveToLibrary && (
            <button 
                onClick={onSaveToLibrary} 
                className={`inline-flex items-center gap-1.5 text-sm font-semibold py-1.5 px-3 rounded-lg border-2 ${themeClasses.icon} border-current hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                title={t('saveToLibrary')}
            >
                <BookmarkIcon className="h-4 w-4" />
                <span>{t('saveMenu')}</span>
            </button>
        )}
      </div>
      
      <div className="flex-grow overflow-y-auto">
        <div className="p-6 md:p-8">
          {/* Image */}
          <div className="w-full h-64 rounded-xl mb-6 overflow-hidden relative group shadow-lg bg-gray-200 dark:bg-gray-700">
            {
              (() => {
                  switch (dishImageStatus) {
                      case 'loaded':
                          const imgSrc = dishImage?.startsWith('http') || dishImage?.startsWith('data:')
                              ? dishImage
                              : `data:image/jpeg;base64,${dishImage}`;
                          return (
                            <>
                              <img src={imgSrc} alt={dishName} className="w-full h-full object-cover" />
                              <div onClick={() => dishImage && onImageEnlarge(imgSrc)} className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                  <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-md">{t('viewImage')}</span>
                              </div>
                            </>
                          );
                      case 'pending':
                        return (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
                            </div>
                        );
                      case 'failed':
                        return (
                            <div className="w-full h-full bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex flex-col items-center justify-center text-center p-2">
                                <p className="text-sm text-red-600 dark:text-red-400 font-semibold">{t('imageFailed')}</p>
                                {onRegenerateImage && 
                                    <button onClick={(e) => { e.stopPropagation(); onRegenerateImage(); }} className={`mt-2 text-xs px-3 py-1.5 rounded-md ${themeClasses.buttonPrimary} text-white`}>
                                        {t('tryAgain')}
                                    </button>
                                }
                            </div>
                        );
                      default:
                        return null;
                  }
              })()
            }
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className={`text-3xl font-bold font-heading ${themeClasses.textHeader} flex items-center`}>
                {dishName}
                {dishNamePronunciation && <Pronunciation text={dishNamePronunciation} lang={settings.language} t={t} />}
              </h2>
              <p className={`${themeClasses.textSecondary} mt-1`}>{description}</p>
            </div>
             <div className="flex items-start gap-2 flex-shrink-0">
                {onSaveToLibrary && (
                    <button onClick={onSaveToLibrary} title={t('saveToLibrary')} className={`flex items-center gap-2 text-sm font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors border-2 ${themeClasses.icon} border-current hover:bg-gray-200 dark:hover:bg-gray-700`}>
                        <BookmarkIcon className="h-5 w-5" />
                        <span className="hidden md:inline">{t('saveToLibrary')}</span>
                    </button>
                )}
                <button onClick={() => setIsShoppingListModalOpen(true)} title={t('addToShoppingList')} className={`flex items-center gap-2 text-sm font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors border-2 ${themeClasses.icon} border-current hover:bg-gray-200 dark:hover:bg-gray-700`}>
                    <ShoppingCartIcon className="h-5 w-5" />
                    <span className="hidden md:inline">{t('addToShoppingList')}</span>
                </button>
                <div className="relative">
                    <button onClick={handleShare} title={t('shareRecipe')} className={`flex items-center gap-2 text-sm font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors border-2 ${themeClasses.icon} border-current hover:bg-gray-200 dark:hover:bg-gray-700`}>
                        <ShareIcon className="h-5 w-5" />
                        <span className="hidden md:inline">{t('shareRecipe')}</span>
                    </button>
                    {linkCopied && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-10 animate-fade-in-out">
                            {t('linkCopied')}
                        </div>
                    )}
                </div>
            </div>
          </div>
          
          {/* Ingredients */}
          <div className={`mt-8 p-6 rounded-xl border ${themeClasses.border} bg-black/5 dark:bg-white/5`}>
            <h3 className={`text-xl font-bold font-heading ${themeClasses.textHeader} mb-4`}>{t('ingredients')}</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              {ingredients.map((ing, index) => (
                <li key={index} className={`${themeClasses.textSecondary}`}>
                    <span className={`font-semibold ${themeClasses.textPrimary}`}>{ing.quantity}</span> {ing.name}
                </li>
              ))}
            </ul>
          </div>

          {/* Cooking Steps */}
          <div className="mt-8">
            <h3 className={`text-xl font-bold font-heading ${themeClasses.textHeader} mb-6`}>{t('cookingSteps')}</h3>
            <div className="recipe-steps">
              <ol>
                {cookingSteps.map((step, index) => (
                  <li key={index} className={`${themeClasses.textPrimary}`}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
      
      <ShoppingListModal isOpen={isShoppingListModalOpen} onClose={() => setIsShoppingListModalOpen(false)} initialIngredients={ingredients} settings={settings} />
    </div>
  );
};