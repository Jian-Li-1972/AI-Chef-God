import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    if (!isOpen) {
      setTimeout(() => {
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setIsLoginView(true);
      }, 200);
    }
  }, [isOpen]);

  const t = (key: string) => getTranslation(settings.language, key);
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

  const inputClasses = `${settings.themeMode === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-black'} block w-full rounded-xl border p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm`;

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
            className={`${settings.themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} relative rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 w-full max-w-md z-10 pb-safe-offset-6`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6 sm:hidden" />
            
            <div className="flex border-b mb-6">
              <button onClick={() => setIsLoginView(true)} className={`py-3 px-4 w-1/2 font-bold transition-all ${isLoginView ? `${themeClasses.icon} border-b-4 border-current` : 'text-gray-400'}`}>{t('login')}</button>
              <button onClick={() => setIsLoginView(false)} className={`py-3 px-4 w-1/2 font-bold transition-all ${!isLoginView ? `${themeClasses.icon} border-b-4 border-current` : 'text-gray-400'}`}>{t('register')}</button>
            </div>

            {isLoginView ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 opacity-70">{t('email')}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} required />
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 opacity-70">{t('password')}</label>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} required />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 top-8 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    title={showPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showPassword ? <EyeSlashIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                  </button>
                </div>
                <button
                  type="submit"
                  className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${themeClasses.buttonPrimary}`}
                >
                  {t('login')}
                </button>
              </form>
            ) : (
              <RegistrationForm onRegister={handleRegister} settings={settings} t={t} />
            )}
            
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
