import React, { useRef } from 'react';
import { Recipe, Settings } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';

interface SavedRecipesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMenus: Recipe[][];
  onLoadMenu: (menu: Recipe[]) => void;
  onClear: () => void;
  onDeleteMenu: (index: number) => void;
  onImportLibrary: (library: Recipe[][]) => void;
  settings: Settings;
  t: (key: string) => string;
}

export const SavedRecipesModal: React.FC<SavedRecipesModalProps> = ({ 
  isOpen, 
  onClose, 
  savedMenus, 
  onLoadMenu, 
  onClear, 
  onDeleteMenu,
  onImportLibrary,
  settings, 
  t 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) {
    return null;
  }

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (Array.isArray(data)) {
          if (data.length > 0 && Array.isArray(data[0])) {
            onImportLibrary(data);
            alert(t('menuLoadedSuccessfully'));
          } else if (data.length > 0 && typeof data[0] === 'object' && 'dishName' in data[0]) {
            onImportLibrary([data]);
            alert(t('menuLoadedSuccessfully'));
          } else {
            alert(t('invalidFileFormat'));
          }
        } else if (data && typeof data === 'object' && 'recipes' in data && Array.isArray(data.recipes)) {
          onImportLibrary([data.recipes]);
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
    e.target.value = '';
  };

  const handleExportClick = () => {
    if (savedMenus.length === 0) return;
    const blob = new Blob([JSON.stringify(savedMenus, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recipe-library-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-16 p-4" onClick={onClose}>
      <div 
        className={`${settings.themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} relative rounded-lg shadow-xl p-6 w-full max-w-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BookmarkIcon className="h-8 w-8 mr-3 text-indigo-500" />
            <h2 className="text-2xl font-bold">{t('savedRecipes')}</h2>
          </div>
          {savedMenus.length > 0 && (
             <button onClick={onClear} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                <TrashIcon className="h-4 w-4" />
                {t('clearSaved')}
            </button>
          )}
        </div>

        {/* Import/Export buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={handleImportClick} 
            className="inline-flex justify-center items-center gap-2 text-sm font-semibold py-2.5 px-3 rounded-lg border-2 border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>{t('importAll')}</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />

          <button 
            onClick={handleExportClick} 
            disabled={savedMenus.length === 0}
            className={`inline-flex justify-center items-center gap-2 text-sm font-semibold py-2.5 px-3 rounded-lg border-2 transition-colors ${
              savedMenus.length === 0 
                ? 'border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                : 'border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-500'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{t('exportAll')}</span>
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
          {savedMenus.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">{t('noSavedRecipes')}</p>
          ) : (
            savedMenus.map((menu, index) => (
              <div key={index} className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{t('menu')} {index + 1}</h3>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onLoadMenu(menu)}
                            className="bg-indigo-600 text-white font-semibold py-1 px-3 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                        >
                            {t('loadMenu')}
                        </button>
                        <button 
                            onClick={() => onDeleteMenu(index)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                            title={t('deleteMenu') || 'Delete Menu'}
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                    {menu.map(recipe => <li key={recipe.dishName}>{recipe.dishName}</li>)}
                </ul>
              </div>
            ))
          )}
        </div>

        <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            title={t('close')}
          >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
