import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from '../types';
import { getThemeClasses } from '../utils/themeUtils';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface ChefTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  t: (key: string) => string;
}

export const ChefTipsModal: React.FC<ChefTipsModalProps> = ({ isOpen, onClose, settings, t }) => {
  const themeClasses = getThemeClasses(settings.themeColor, settings.themeMode);

  const tips = [
    { title: t('secretTitle1'), desc: t('secretDesc1') },
    { title: t('secretTitle2'), desc: t('secretDesc2') },
    { title: t('secretTitle3'), desc: t('secretDesc3') },
    { title: t('secretTitle4'), desc: t('secretDesc4') },
    { title: t('secretTitle5'), desc: t('secretDesc5') },
    { title: t('secretTitle6'), desc: t('secretDesc6') },
  ];

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
            className={`${settings.themeMode === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'} rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 w-full max-w-lg relative z-10 pb-safe-offset-6 sm:max-h-[80vh] overflow-hidden flex flex-col`}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6 sm:hidden" />
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="h-6 w-6 text-yellow-500" />
                    <h2 className="text-2xl font-bold font-heading">{t('successSecrets')}</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {tips.map((tip, index) => (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-xl border ${themeClasses.bgCard} ${themeClasses.border} shadow-sm`}
                    >
                        <h3 className="font-bold text-lg text-indigo-500 mb-1 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-xs">{index + 1}</span>
                            {tip.title}
                        </h3>
                        <p className={`text-sm leading-relaxed ${themeClasses.textSecondary}`}>
                            {tip.desc}
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="mt-8">
              <button
                onClick={onClose}
                className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
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
