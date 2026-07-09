import React from 'react';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
  t: (key: string) => string;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, t }) => {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4" 
      onClick={onClose}
    >
      <div 
        className="relative" 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
      >
        <img 
          src={imageUrl.startsWith('http') || imageUrl.startsWith('data:') ? imageUrl : `data:image/jpeg;base64,${imageUrl}`} 
          alt="Enlarged dish" 
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" 
        />
        <button 
          onClick={onClose} 
          className="absolute -top-4 -right-4 text-white bg-black bg-opacity-50 rounded-full h-10 w-10 flex items-center justify-center text-2xl font-bold hover:bg-opacity-75"
          title={t('closeImage')}
        >
          &times;
        </button>
      </div>
    </div>
  );
};