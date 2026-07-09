

import React from 'react';
import { Settings } from '../types';
import { getTranslation } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) {
    return null;
  }
  
  const t = (key: string) => getTranslation(settings.language, key);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className={`${settings.themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded-lg shadow-xl p-6 w-full max-w-md m-4`}>
        <h2 className="text-2xl font-bold mb-4">{t('settings')}</h2>

        <div className="space-y-4">
          {/* Theme Color */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('themeColor')}</label>
            <select
              value={settings.themeColor}
              onChange={(e) => onSettingsChange({ themeColor: e.target.value as Settings['themeColor'] })}
              className={`${settings.themeMode === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} block w-full rounded-md border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
            >
              <option value="green">{t('green')}</option>
              <option value="blue">{t('blue')}</option>
              <option value="indigo">{t('indigo')}</option>
              <option value="teal">{t('teal')}</option>
            </select>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('font')}</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => onSettingsChange({ fontFamily: e.target.value as Settings['fontFamily'] })}
              className={`${settings.themeMode === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} block w-full rounded-md border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
            >
              <option value="sans">{t('sans')}</option>
              <option value="serif">{t('serif')}</option>
              <option value="mono">{t('mono')}</option>
              <option value="cursive">{t('cursive')}</option>
              <option value="fantasy">{t('fantasy')}</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('language')}</label>
            <select
              value={settings.language}
              onChange={(e) => onSettingsChange({ language: e.target.value as Settings['language'] })}
              className={`${settings.themeMode === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} block w-full rounded-md border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
            >
              <option value="en">{t('english')}</option>
              <option value="es">{t('spanish')}</option>
              {/* Fix: Use the new 'language_french' translation key. */}
              <option value="fr">{t('language_french')}</option>
              <option value="zh-CN">{t('chinese_simplified')}</option>
              <option value="zh-TW">{t('chinese_traditional')}</option>
            </select>
          </div>

          {/* Theme Mode */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('themeMode')}</label>
            <div className="flex items-center space-x-4">
              <button onClick={() => onSettingsChange({ themeMode: 'light' })} className={`px-4 py-2 rounded-md text-sm ${settings.themeMode === 'light' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{t('light')}</button>
              <button onClick={() => onSettingsChange({ themeMode: 'dark' })} className={`px-4 py-2 rounded-md text-sm ${settings.themeMode === 'dark' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{t('dark')}</button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};