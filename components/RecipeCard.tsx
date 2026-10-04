import React from 'react';
import { Recipe, Settings } from '../types';
import { getThemeClasses } from '../utils/themeUtils';
import { ClockIcon } from './icons/ClockIcon';
import { StarIcon } from './icons/StarIcon';
import { EyeIcon } from './icons/EyeIcon';
import Pronunciation from './Pronunciation';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: () => void;
  isSelected: boolean;
  settings: Settings;
  t: (key: string) => string;
  onRegenerateImage: () => void;
  onToggleFavorite: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect, isSelected, settings, t, onRegenerateImage, onToggleFavorite }) => {
  const themeClasses = getThemeClasses(settings.themeColor, settings.themeMode);
  const cardClasses = `
    relative p-4 rounded-xl shadow-md cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border
    group
    ${isSelected 
      ? `ring-2 ${themeClasses.ring} ${themeClasses.border}` 
      : `${themeClasses.bgCard} ${themeClasses.border} hover:border-gray-300 dark:hover:border-gray-600`}
  `;

  const getDifficultyClass = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className={cardClasses} onClick={onSelect}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`absolute top-2 right-2 p-1.5 rounded-full z-10 transition-all duration-200 
          ${recipe.isFavorite 
              ? 'text-yellow-400 bg-yellow-400/20 hover:text-yellow-500 hover:bg-yellow-400/30' 
              : 'text-gray-400 dark:text-gray-500 bg-transparent hover:bg-gray-500/20'
          }`}
        title={t(recipe.isFavorite ? 'unfavorite' : 'favorite')}
      >
        <StarIcon solid={!!recipe.isFavorite} className="h-5 w-5" />
      </button>
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 overflow-hidden shadow-sm">
             {
                (() => {
                    switch (recipe.dishImageStatus) {
                        case 'loaded':
                            return <img src={`data:image/jpeg;base64,${recipe.dishImage}`} alt={recipe.dishName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />;
                        case 'pending':
                            return (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400 dark:border-gray-500"></div>
                                </div>
                            );
                        case 'failed':
                        case 'quota_exceeded':
                            return (
                                <div className="w-full h-full bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex flex-col items-center justify-center text-center p-2">
                                    <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                                        {recipe.dishImageStatus === 'quota_exceeded' ? t('quotaExceeded') : t('imageFailed')}
                                    </p>
                                    <button onClick={(e) => { e.stopPropagation(); onRegenerateImage(); }} className={`mt-1 text-xs px-2 py-1 rounded ${themeClasses.buttonPrimary} text-white`}>
                                        {t('tryAgain')}
                                    </button>
                                </div>
                            );
                        default:
                             return (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
                                </div>
                            );
                    }
                })()
             }
             <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-1">
                <EyeIcon className="h-6 w-6 mb-1" />
                <span className="text-xs font-semibold">{t('viewDetails')}</span>
             </div>
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-1">
            <h3 className={`font-bold font-heading text-lg ${themeClasses.textHeader}`}>{recipe.dishName}</h3>
            {recipe.dishNamePronunciation && (
              <Pronunciation text={recipe.dishNamePronunciation} lang={settings.language} t={t} size="sm" />
            )}
          </div>
          <p className={`text-sm ${themeClasses.textSecondary} line-clamp-2 mt-1`}>{recipe.description}</p>
          
          <div className="mt-2 flex flex-wrap gap-1">
            {recipe.ingredients.slice(0, 3).map((ing, idx) => (
              <div key={idx} className={`flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 ${themeClasses.textSecondary}`}>
                <span>{ing.name}</span>
                <Pronunciation text={ing.pronunciation || ing.name} lang={settings.language} t={t} size="sm" />
              </div>
            ))}
            {recipe.ingredients.length > 3 && (
              <span className={`text-[10px] ${themeClasses.textSecondary} flex items-center`}>...</span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs">
            {recipe.rating && recipe.rating > 0 && (
                <div className="flex items-center gap-1 text-yellow-500 font-bold" title={`${recipe.rating.toFixed(1)} stars (${recipe.ratingCount} ratings)`}>
                    <StarIcon solid={true} className="h-4 w-4" />
                    <span>{recipe.rating.toFixed(1)}</span>
                    <span className="text-gray-400 font-normal">({recipe.ratingCount})</span>
                </div>
            )}
            {recipe.cookingTime && (
                <div className={`flex items-center gap-1.5 ${themeClasses.textSecondary}`} title={t('cookingTime')}>
                    <ClockIcon className="h-4 w-4" />
                    <span>{recipe.cookingTime}</span>
                </div>
            )}
            {recipe.cuisine && (
                <span className={`px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300`}>
                    {recipe.cuisine}
                </span>
            )}
            {recipe.difficulty && (
                <span className={`px-2 py-0.5 rounded-full font-semibold ${getDifficultyClass(recipe.difficulty)}`}>
                    {t(recipe.difficulty.toLowerCase())}
                </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};