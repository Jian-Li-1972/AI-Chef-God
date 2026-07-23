import React, { useState } from 'react';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { generateAndPlayAudio } from '../utils/audioUtils';

interface PronunciationProps {
  text: string;
  lang: string;
  t: (key: string) => string;
  size?: 'sm' | 'md';
}

const Pronunciation: React.FC<PronunciationProps> = ({ text, lang, t, size = 'md' }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await generateAndPlayAudio(text, lang);
    } catch (error) {
      console.error("Failed to play pronunciation", error);
    } finally {
      setIsPlaying(false);
    }
  };

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-5 w-5';

  return (
    <button
      onClick={handlePlay}
      disabled={isPlaying}
      className={`${size === 'sm' ? 'p-0.5' : 'p-1'} rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
      title={`${t('pronounce')} "${text}"`}
    >
      {isPlaying ? (
        <div className={`${iconSize} animate-pulse`}>
            <SpeakerIcon className="text-indigo-500" />
        </div>
      ) : (
        <SpeakerIcon className={`${iconSize} text-gray-500 dark:text-gray-400`} />
      )}
    </button>
  );
};

export default Pronunciation;