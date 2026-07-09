import React from 'react';
import { ChefHatIcon } from './icons/ChefHatIcon';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center my-10 space-y-4">
        <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-green-600 animate-spin"></div>
            <ChefHatIcon className="h-16 w-16 p-2" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-semibold animate-pulse">The Chef is thinking...</p>
    </div>
  );
};