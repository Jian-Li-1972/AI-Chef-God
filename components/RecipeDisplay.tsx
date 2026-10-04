import React, { useState, useCallback, useMemo } from 'react';
import { Recipe, Settings } from '../types';
import { getThemeClasses } from '../utils/themeUtils';
import { scaleQuantity } from '../utils/recipeUtils';
import Pronunciation from './Pronunciation';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { ShareIcon } from './icons/ShareIcon';
import { LinkIcon } from './icons/LinkIcon';
import { StarIcon } from './icons/StarIcon';
import { ShoppingListModal } from './ShoppingListModal';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ChefHatIcon } from './icons/ChefHatIcon';

interface RecipeDisplayProps {
  recipe: Recipe | null;
  settings: Settings;
  t: (key: string) => string;
  onImageEnlarge: (imageUrl: string) => void;
  onBack: () => void;
  onRegenerateImage?: () => void;
  onToggleFavorite?: () => void;
  onRate?: (rating: number) => void;
}

export const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe, settings, t, onImageEnlarge, onBack, onRegenerateImage, onToggleFavorite, onRate }) => {
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [hoverRating, setHoverRating] = useState(0);
  const themeClasses = getThemeClasses(settings.themeColor, settings.themeMode);

  const handleShare = useCallback(async () => {
    if (!recipe) return;

    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('recipe', recipe.dishName);
    const shareUrl = url.toString();

    const shareData = {
      title: recipe.dishName,
      text: recipe.description,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
        alert("Failed to copy link.");
      }
    }
  }, [recipe]);

  const handleCopyLink = useCallback(async () => {
    if (!recipe) return;

    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('recipe', recipe.dishName);
    const shareUrl = url.toString();

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      alert("Failed to copy link.");
    }
  }, [recipe]);

  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map(ing => ({
      ...ing,
      quantity: scaleQuantity(ing.quantity, scaleFactor)
    }));
  }, [recipe, scaleFactor]);

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <ChefHatIcon className="h-20 w-20 opacity-20 mb-4" />
        <h3 className="font-heading text-xl font-semibold opacity-60">{t('appTitle')}</h3>
        <p className={`${themeClasses.textSecondary} mt-2`}>{t('selectRecipe')}</p>
      </div>
    );
  }

  const { dishName, dishNamePronunciation, description, cookingSteps, dishImage, dishImageStatus, servings } = recipe;
  
  return (
    <div className={`h-full flex flex-col ${themeClasses.bgCard}`}>
      <div className="p-4 sm:p-6 border-b flex-shrink-0 lg:hidden sticky top-0 z-10 bg-inherit/90 backdrop-blur-md pt-safe">
        <button onClick={onBack} className={`inline-flex items-center gap-2 text-sm font-semibold ${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`}>
          <ArrowLeftIcon className="h-5 w-5" />
          {t('backToRecipes')}
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto pb-safe">
        <div className="p-5 sm:p-8">
          {/* Image */}
          <div className="w-full h-56 sm:h-64 rounded-xl mb-6 overflow-hidden relative group shadow-lg bg-gray-200 dark:bg-gray-700">
            {
              (() => {
                  switch (dishImageStatus) {
                      case 'loaded':
                          return (
                            <>
                              <img src={`data:image/jpeg;base64,${dishImage}`} alt={dishName} className="w-full h-full object-cover" />
                              <div onClick={() => dishImage && onImageEnlarge(dishImage)} className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
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
                      case 'quota_exceeded':
                        return (
                            <div className="w-full h-full bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex flex-col items-center justify-center text-center p-2">
                                <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                                    {dishImageStatus === 'quota_exceeded' ? t('quotaExceeded') : t('imageFailed')}
                                </p>
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
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="w-full">
              <h2 className={`text-2xl sm:text-3xl font-bold font-heading ${themeClasses.textHeader} flex items-center gap-2 flex-wrap`}>
                {dishName}
                {dishNamePronunciation && <Pronunciation text={dishNamePronunciation} lang={settings.language} t={t} />}
                {recipe.rating && recipe.rating > 0 && (
                  <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
                    <StarIcon solid={true} className="h-4 w-4" />
                    <span>{recipe.rating.toFixed(1)}</span>
                    <span className="text-gray-400 font-normal">({recipe.ratingCount})</span>
                  </div>
                )}
              </h2>
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                <p className={`${themeClasses.textSecondary}`}>{description}</p>
                {recipe.cuisine && (
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-xs font-semibold text-indigo-700 dark:text-indigo-300`}>
                    <span>{t('cuisine')}:</span>
                    <span className="font-bold">{recipe.cuisine}</span>
                  </div>
                )}
                {servings && (
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-semibold ${themeClasses.textSecondary}`}>
                    <span>{t('servings')}:</span>
                    <span className={themeClasses.textPrimary}>{servings * scaleFactor}</span>
                  </div>
                )}
                {onRate && (
                  <div className="flex items-center gap-1 ml-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => onRate(star)}
                        className={`transition-all duration-200 transform hover:scale-110 ${
                          (hoverRating || recipe.userRating || 0) >= star
                            ? 'text-yellow-500'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      >
                        <StarIcon solid={(hoverRating || recipe.userRating || 0) >= star} className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                <button 
                    onClick={onToggleFavorite} 
                    title={t(recipe.isFavorite ? 'unfavorite' : 'favorite')} 
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors border-2 ${recipe.isFavorite ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500' : `${themeClasses.icon} border-current hover:bg-gray-200 dark:hover:bg-gray-700`}`}
                >
                    <StarIcon solid={!!recipe.isFavorite} className="h-5 w-5" />
                    <span className="sm:inline">{t(recipe.isFavorite ? 'unfavorite' : 'favorite')}</span>
                </button>
                <button onClick={() => setIsShoppingListModalOpen(true)} title={t('addToShoppingList')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors border-2 ${themeClasses.icon} border-current hover:bg-gray-200 dark:hover:bg-gray-700`}>
                    <ShoppingCartIcon className="h-5 w-5" />
                    <span className="sm:inline">{t('addToShoppingList')}</span>
                </button>
                <div className="relative flex-1 sm:flex-none">
                    <button onClick={handleCopyLink} title={t('copyLink')} className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors border-2 ${themeClasses.icon} border-current hover:bg-gray-200 dark:hover:bg-gray-700`}>
                        <LinkIcon className="h-5 w-5" />
                        <span className="sm:inline">{t('copyLink')}</span>
                    </button>
                    {linkCopied && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-10 animate-fade-in-out">
                            {t('linkCopied')}
                        </div>
                    )}
                </div>
                <div className="relative flex-1 sm:flex-none">
                    <button onClick={handleShare} title={t('shareRecipe')} className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 px-3 sm:px-4 rounded-lg transition-colors border-2 ${themeClasses.icon} border-current hover:bg-gray-200 dark:hover:bg-gray-700`}>
                        <ShareIcon className="h-5 w-5" />
                        <span className="sm:inline">{t('shareRecipe')}</span>
                    </button>
                </div>
            </div>
          </div>
          
          {/* Ingredients */}
          <div className={`mt-8 p-6 rounded-xl border ${themeClasses.border} bg-black/5 dark:bg-white/5`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className={`text-xl font-bold font-heading ${themeClasses.textHeader}`}>{t('ingredients')}</h3>
              
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${themeClasses.textSecondary}`}>{t('scale')}:</span>
                <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                  {[0.5, 1, 2, 3].map((factor) => (
                    <button
                      key={factor}
                      onClick={() => setScaleFactor(factor)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        scaleFactor === factor
                          ? `${themeClasses.buttonPrimary} text-white shadow-md`
                          : `${themeClasses.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`
                      }`}
                    >
                      {factor}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              {scaledIngredients.map((ing, index) => (
                <li key={index} className={`${themeClasses.textSecondary} flex items-center flex-wrap gap-x-1`}>
                    <span className={`font-semibold ${themeClasses.textPrimary}`}>{ing.quantity}</span> 
                    <span>{ing.name}</span>
                    <Pronunciation text={ing.pronunciation || ing.name} lang={settings.language} t={t} />
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
      
      <ShoppingListModal isOpen={isShoppingListModalOpen} onClose={() => setIsShoppingListModalOpen(false)} initialIngredients={scaledIngredients} settings={settings} />
    </div>
  );
};