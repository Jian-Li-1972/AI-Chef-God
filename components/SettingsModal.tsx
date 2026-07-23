

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from '../types';
import { getTranslation } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const t = (key: string) => getTranslation(settings.language, key);

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
            className={`${settings.themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-10 pb-safe-offset-6`}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6 sm:hidden" />
            <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
                {t('settings')}
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 sm:hidden">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </h2>

            <div className="space-y-6">
              {/* Theme Color */}
              <div>
                <label className="block text-sm font-semibold mb-2 opacity-70">{t('themeColor')}</label>
                <div className="grid grid-cols-4 gap-3">
                    {['green', 'blue', 'indigo', 'teal'].map((color) => (
                        <button
                            key={color}
                            onClick={() => onSettingsChange({ themeColor: color as Settings['themeColor'] })}
                            className={`h-10 rounded-lg border-2 transition-all ${settings.themeColor === color ? 'border-indigo-500 scale-105' : 'border-transparent'}`}
                            style={{ backgroundColor: { green: '#10B981', blue: '#3B82F6', indigo: '#6366F1', teal: '#14B8A6' }[color as Settings['themeColor']] }}
                        />
                    ))}
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm font-semibold mb-2 opacity-70">{t('font')}</label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => onSettingsChange({ fontFamily: e.target.value as Settings['fontFamily'] })}
                  className={`${settings.themeMode === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} block w-full rounded-xl border p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm`}
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
                <label className="block text-sm font-semibold mb-2 opacity-70">{t('language')}</label>
                <select
                  value={settings.language}
                  onChange={(e) => onSettingsChange({ language: e.target.value as Settings['language'] })}
                  className={`${settings.themeMode === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} block w-full rounded-xl border p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm`}
                >
                  <option value="en">{t('english')}</option>
                  <option value="es">{t('spanish')}</option>
                  <option value="fr">{t('language_french')}</option>
                  <option value="zh-CN">{t('chinese_simplified')}</option>
                  <option value="zh-TW">{t('chinese_traditional')}</option>
                </select>
              </div>

              {/* Theme Mode */}
              <div>
                <label className="block text-sm font-semibold mb-2 opacity-70">{t('themeMode')}</label>
                <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <button onClick={() => onSettingsChange({ themeMode: 'light' })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.themeMode === 'light' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500'}`}>{t('light')}</button>
                  <button onClick={() => onSettingsChange({ themeMode: 'dark' })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.themeMode === 'dark' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500'}`}>{t('dark')}</button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
              >
                {t('close')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
