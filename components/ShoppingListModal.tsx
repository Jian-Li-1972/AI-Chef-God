import React, { useState, useEffect } from 'react';
import { Ingredient, Settings } from '../types';
import { getTranslation } from '../utils/translations';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIngredients: Ingredient[];
  settings: Settings;
}

interface ShoppingListItem {
  id: number;
  text: string;
  completed: boolean;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ isOpen, onClose, initialIngredients, settings }) => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    if (isOpen) {
      const initialItems = initialIngredients.map((ing, index) => ({
        id: Date.now() + index,
        text: `${ing.quantity} ${ing.name}`,
        completed: false,
      }));
      setItems(initialItems);
    }
  }, [isOpen, initialIngredients]);
  
  if (!isOpen) {
    return null;
  }
  
  const t = (key: string) => getTranslation(settings.language, key);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim() === '') return;
    setItems([...items, { id: Date.now(), text: newItemText, completed: false }]);
    setNewItemText('');
  };

  const toggleItem = (id: number) => {
    setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const clearCompleted = () => {
    setItems(items.filter(item => !item.completed));
  };

  const clearAll = () => {
    setItems([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-16 p-4">
      <div 
        className={`${settings.themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} relative rounded-lg shadow-xl p-6 w-full max-w-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <ShoppingCartIcon className="h-8 w-8 mr-3 text-indigo-500" />
          <h2 className="text-2xl font-bold">{t('shoppingList')}</h2>
        </div>

        <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder={t('newItemPlaceholder')}
            className={`${settings.themeMode === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} flex-grow rounded-md border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
          />
          <button type="submit" className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300" title={t('addItem')}>
            <PlusCircleIcon className="h-8 w-8" />
          </button>
        </form>

        <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
          {items.map(item => (
            <li key={item.id} className="flex items-center justify-between p-2 rounded-md bg-gray-100 dark:bg-gray-700">
              <span 
                onClick={() => toggleItem(item.id)}
                className={`cursor-pointer ${item.completed ? 'line-through text-gray-400' : ''}`}
              >
                {item.text}
              </span>
              <button onClick={() => toggleItem(item.id)}>
                <CheckCircleIcon className={`h-6 w-6 ${item.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-500'}`} />
              </button>
            </li>
          ))}
        </ul>
        
        <div className="flex justify-between mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button onClick={clearCompleted} className="text-sm text-gray-500 hover:text-red-500">{t('clearCompleted')}</button>
            <button onClick={clearAll} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                <TrashIcon className="h-4 w-4" />
                {t('clearAll')}
            </button>
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
