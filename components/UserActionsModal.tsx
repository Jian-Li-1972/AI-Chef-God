import React from 'react';
import { Settings } from '../types';
import { getTranslation } from '../utils/translations';
import { getThemeClasses } from '../utils/themeUtils';
import { UserIcon } from './icons/UserIcon';
import { ShareIcon } from './icons/ShareIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface UserActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: 'changePassword' | 'shareProfile' | 'manageSettings') => void;
  onLogout: () => void;
  userName: string;
  settings: Settings;
}

export const UserActionsModal: React.FC<UserActionsModalProps> = ({ isOpen, onClose, onAction, onLogout, userName, settings }) => {
  if (!isOpen) {
    return null;
  }

  const t = (key: string) => getTranslation(settings.language, key);
  // Fix: Pass themeMode as the second argument to getThemeClasses.
  const themeClasses = getThemeClasses(settings.themeColor, settings.themeMode);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div 
        className={`${settings.themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} relative rounded-lg shadow-xl p-6 w-full max-w-sm`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-6">
            <UserIcon className="h-10 w-10 mr-4 p-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div>
                <h2 className="text-xl font-bold">{userName}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('manageAccount')}</p>
            </div>
        </div>

        <ul className="space-y-2">
            <li>
                <button
                    onClick={() => onAction('changePassword')}
                    className="w-full text-left flex items-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <SettingsIcon className="h-5 w-5 mr-3" />
                    <span>{t('changePassword')}</span>
                </button>
            </li>
            <li>
                <button
                    onClick={() => onAction('shareProfile')}
                    className="w-full text-left flex items-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <ShareIcon className="h-5 w-5 mr-3" />
                    <span>{t('shareProfile')}</span>
                </button>
            </li>
        </ul>

        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
             <button
                onClick={onLogout}
                className={`w-full justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.buttonPrimary} focus:ring-indigo-500`}
            >
                {t('logout')}
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
