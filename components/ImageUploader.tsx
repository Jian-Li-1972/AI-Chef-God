import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { getThemeClasses } from '../utils/themeUtils';
import { Settings } from '../types';

interface ImageUploaderProps {
  onImageSelect: (file: File | null) => void;
  settings: Settings;
  t: (key: string) => string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, settings, t }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const themeClasses = getThemeClasses(settings.themeColor, settings.themeMode);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, [handleFileChange]);


  return (
    <div 
      className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-300 ${isDragging ? `${themeClasses.ring} bg-green-500/10` : `${themeClasses.border} hover:border-gray-400 dark:hover:border-gray-500`}`}
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden"
        accept="image/*"
      />
      {imagePreview ? (
        <>
          <img src={imagePreview} alt="Ingredient preview" className="mx-auto max-h-48 rounded-lg" />
          <button
            onClick={clearImage}
            className="absolute -top-2 -right-2 bg-white dark:bg-gray-900 rounded-full text-gray-500 hover:text-red-500 transition-colors"
            title={t('removeImage')}
          >
            <XCircleIcon className="h-8 w-8" />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center">
          <UploadIcon className={`h-12 w-12 mb-2 ${themeClasses.icon}`} />
          <p className={`mt-2 text-sm ${themeClasses.textSecondary}`}>
            <span className={`${themeClasses.icon} font-semibold`}>{t('uploadClick')}</span> <span className="hidden sm:inline">{t('uploadDrag')}</span>
          </p>
          <p className={`text-xs ${themeClasses.textSecondary} opacity-70 mt-1`}>{t('uploadFileType')}</p>
        </div>
      )}
    </div>
  );
};