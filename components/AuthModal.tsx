import React, { useState, useEffect } from 'react';
import { Settings } from '../types';
import { getTranslation } from '../utils/translations';
import { getThemeClasses } from '../utils/themeUtils';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import { RegistrationForm } from './RegistrationModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (data: any) => void;
  settings: Settings;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuth, settings }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Clear form fields when the modal is closed
    if (!isOpen) {
      setTimeout(() => {
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setIsLoginView(true); // Reset to login view
      }, 200); // Delay to allow for closing animation
    }
  }, [isOpen]);


  if (!isOpen) {
    return null;
  }

  const t = (key: string) => getTranslation(settings.language, key);
  // Fix: Pass themeMode as the second argument to getThemeClasses.
  const themeClasses = getThemeClasses(settings.themeColor, settings.themeMode);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuth({ type: 'login', email, password });
    onClose();
  };

  const handleRegister = (data: any) => {
    onAuth(data);
    onClose();
  };

  const inputClasses = `${settings.themeMode === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-black'} block w-full rounded-md border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div 
        className={`${settings.themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} relative rounded-lg shadow-xl p-6 w-full max-w-md`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex border-b mb-4">
          <button onClick={() => setIsLoginView(true)} className={`py-2 px-4 w-1/2 font-semibold ${isLoginView ? `${themeClasses.icon} border-b-2 border-current` : 'text-gray-500'}`}>{t('login')}</button>
          <button onClick={() => setIsLoginView(false)} className={`py-2 px-4 w-1/2 font-semibold ${!isLoginView ? `${themeClasses.icon} border-b-2 border-current` : 'text-gray-500'}`}>{t('register')}</button>
        </div>

        {isLoginView ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} required />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium mb-1">{t('password')}</label>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} required />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                title={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            <button
              type="submit"
              className={`w-full justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.buttonPrimary} focus:ring-indigo-500`}
            >
              {t('login')}
            </button>
          </form>
        ) : (
          <RegistrationForm onRegister={handleRegister} settings={settings} t={t} />
        )}
        
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
