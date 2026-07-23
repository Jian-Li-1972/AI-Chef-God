import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
  t: (key: string) => string;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, t }) => {
  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-[60] flex justify-center items-center p-4 backdrop-blur-sm" 
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative max-w-full max-h-full flex items-center justify-center" 
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={`data:image/jpeg;base64,${imageUrl}`} 
              alt="Enlarged dish" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
            />
            <button 
              onClick={onClose} 
              className="absolute -top-4 -right-4 text-white bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full h-12 w-12 flex items-center justify-center text-3xl font-light transition-all active:scale-90"
              title={t('closeImage')}
            >
              &times;
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
