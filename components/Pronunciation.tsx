import React, { useState } from 'react';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { generateAndPlayAudio } from '../utils/audioUtils';

interface PronunciationProps {
  text: string;
  lang: string;
  t: (key: string) => string;
}

const Pronunciation: React.FC<PronunciationProps> = ({ text, lang, t }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
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

  return (
    <button
      onClick={handlePlay}
      disabled={isPlaying}
      className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title={`${t('pronounce')} "${text}"`}
    >
      {isPlaying ? (
        <div className="h-5 w-5 animate-pulse">
            <SpeakerIcon className="text-indigo-500" />
        </div>
      ) : (
        <SpeakerIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      )}
    </button>
  );
};

export default Pronunciation;