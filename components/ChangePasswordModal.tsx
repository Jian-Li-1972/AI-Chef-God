import React, { useState } from 'react';
import { Settings } from '../types';
import { getTranslation } from '../utils/translations';
import { getThemeClasses } from '../utils/themeUtils';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangePassword: (data: any) => void;
  settings: Settings;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onChangePassword, settings }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  if (!isOpen) {
    return null;
  }
  
  const t = (key: string) => getTranslation(settings.language, key);
  // Fix: Pass themeMode as the second argument to getThemeClasses.
  const themeClasses = getThemeClasses(settings.themeColor, settings.themeMode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert("New passwords do not match!");
      return;
    }
    onChangePassword({ currentPassword, newPassword });
    onClose();
  };

  const inputClasses = `${settings.themeMode === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-black'} block w-full rounded-md border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div 
        className={`${settings.themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} relative rounded-lg shadow-xl p-6 w-full max-w-md`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">{t('changePassword')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-1">{t('currentPassword')}</label>
            <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClasses} required />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title={showCurrentPassword ? t('hidePassword') : t('showPassword')}
            >
              {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium mb-1">{t('newPassword')}</label>
            <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClasses} required />
             <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title={showNewPassword ? t('hidePassword') : t('showPassword')}
            >
              {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium mb-1">{t('confirmNewPassword')}</label>
            <input type={showNewPassword ? 'text' : 'password'} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputClasses} required />
          </div>
          
          <button
            type="submit"
            className={`w-full justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.buttonPrimary} focus:ring-indigo-500`}
          >
            {t('updatePassword')}
          </button>
        </form>
        
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
