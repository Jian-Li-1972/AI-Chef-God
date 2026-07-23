import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Recipe, Settings } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';

interface SavedRecipesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMenus: Recipe[][];
  onLoadMenu: (menu: Recipe[]) => void;
  onClear: () => void;
  settings: Settings;
  t: (key: string) => string;
}

export const SavedRecipesModal: React.FC<SavedRecipesModalProps> = ({ isOpen, onClose, savedMenus, onLoadMenu, onClear, settings, t }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`${settings.themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} relative rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 w-full max-w-2xl z-10 pb-safe-offset-6`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6 sm:hidden" />
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <BookmarkIcon className="h-8 w-8 mr-3 text-indigo-500" />
                <h2 className="text-2xl font-bold font-heading">{t('savedRecipes')}</h2>
              </div>
              {savedMenus.length > 0 && (
                 <button onClick={onClear} className="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                    <TrashIcon className="h-4 w-4" />
                    {t('clearSaved')}
                </button>
              )}
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {savedMenus.length === 0 ? (
                <div className="text-center py-12">
                    <BookmarkIcon className="h-16 w-16 mx-auto mb-4 opacity-10" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('noSavedRecipes')}</p>
                </div>
              ) : (
                savedMenus.map((menu, index) => (
                  <div key={index} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{t('menu')} {index + 1}</h3>
                        <button 
                            onClick={() => { onLoadMenu(menu); onClose(); }}
                            className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-xl text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-md"
                        >
                            {t('loadMenu')}
                        </button>
                    </div>
                    <ul className="space-y-1">
                        {menu.map(recipe => (
                            <li key={recipe.dishName} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                {recipe.dishName}
                            </li>
                        ))}
                    </ul>
                  </div>
                ))
              )}
            </div>

            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 sm:block hidden"
                title={t('close')}
              >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
