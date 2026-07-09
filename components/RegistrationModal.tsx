import React, { useState } from 'react';
import { Settings } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';

interface RegistrationFormProps {
  onRegister: (data: any) => void;
  settings: Settings;
  t: (key: string) => string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegister, settings, t }) => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert(t('passwordsDoNotMatch'));
      return;
    }
    onRegister({ type: 'register', userName, email, password });
  };
  
  const inputClasses = `${settings.themeMode === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-black'} block w-full rounded-md border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t('username')}</label>
        <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className={inputClasses} required />
      </div>
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
      <div className="relative">
        <label className="block text-sm font-medium mb-1">{t('confirmNewPassword')}</label>
        <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClasses} required />
      </div>
      <button
        type="submit"
        className={`w-full justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`}
      >
        {t('register')}
      </button>
    </form>
  );
};
