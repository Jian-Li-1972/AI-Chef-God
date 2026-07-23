import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Settings } from '../types';
import { getThemeClasses } from '../utils/themeUtils';
import { XIcon } from './icons/XIcon';
import { VideoIcon } from './icons/VideoIcon';
import { LoaderIcon } from './icons/LoaderIcon';

interface VideoPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  t: (key: string) => string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export const VideoPromoModal: React.FC<VideoPromoModalProps> = ({ isOpen, onClose, settings, t }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(1);

  const themeClasses = getThemeClasses(settings.themeColor, settings.themeMode);

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 95) return prev + Math.random() * 2;
          return prev;
        });
        setLoadingStep(prev => {
          if (Math.random() > 0.9) return Math.min(prev + 1, 4);
          return prev;
        });
      }, 1000);
    } else {
      setProgress(0);
      setLoadingStep(1);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (isOpen) {
      checkApiKey();
    }
  }, [isOpen]);

  const checkApiKey = async () => {
    try {
      const result = await window.aistudio.hasSelectedApiKey();
      setHasKey(result);
    } catch (err) {
      console.error("Error checking API key:", err);
      setHasKey(false);
    }
  };

  const handleOpenSelectKey = async () => {
    await window.aistudio.openSelectKey();
    setHasKey(true); // Assume success as per guidelines
  };

  const generateVideo = async () => {
    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatusMessage(t('generatingVideo'));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: 'A cinematic, high-quality promotional video for a cooking app called AI Chef God. Show a user taking a photo of fresh ingredients on a kitchen counter, then the app interface generating beautiful chef-level recipes, and finally a delicious steaming dish being served. Modern, vibrant, and appetizing.',
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // Fetch with API key
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY || '',
          },
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                 // Reset key if not found
                 setHasKey(false);
                 throw new Error("API key not found or invalid. Please select again.");
            }
            throw new Error("Failed to download video.");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setProgress(100);
        setVideoUrl(url);
        setStatusMessage(t('videoReady'));
      } else {
        throw new Error("No video URI returned.");
      }
    } catch (err: any) {
      console.error("Video generation error:", err);
      setError(err.message || "An error occurred during video generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${themeClasses.bgCard} ${themeClasses.border} border`}>
        <div className={`flex items-center justify-between p-4 border-b ${themeClasses.border}`}>
          <div className="flex items-center gap-2">
            <VideoIcon className={`h-6 w-6 ${themeClasses.textHeader}`} />
            <h2 className={`text-xl font-bold font-heading ${themeClasses.textHeader}`}>{t('generatePromoVideo')}</h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 ${themeClasses.textSecondary}`}>
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {!hasKey ? (
            <div className="text-center py-8">
              <p className={`mb-6 ${themeClasses.textSecondary}`}>{t('selectApiKey')}</p>
              <button
                onClick={handleOpenSelectKey}
                className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${themeClasses.buttonPrimary}`}
              >
                {t('settings')}
              </button>
              <div className="mt-4">
                <a
                  href="https://ai.google.dev/gemini-api/docs/billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-500 hover:underline"
                >
                  {t('billingDoc')}
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className={`text-lg font-semibold mb-2 ${themeClasses.textHeader}`}>{t('promoVideoTitle')}</h3>
                <p className={`text-sm ${themeClasses.textSecondary}`}>{t('promoVideoDescription')}</p>
              </div>

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-8">
                  <div className="relative">
                    <div className={`h-24 w-24 rounded-full border-4 border-t-transparent animate-spin ${themeClasses.border} border-indigo-500`}></div>
                    <LoaderIcon className="absolute inset-0 m-auto h-12 w-12 text-indigo-500 animate-pulse" />
                  </div>
                  
                  <div className="w-full max-w-md space-y-4">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className={themeClasses.textHeader}>{t(`loadingStep${loadingStep}`)}</span>
                      <span className={themeClasses.textSecondary}>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full transition-all duration-500 ease-out ${themeClasses.buttonPrimary}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className={`text-center text-sm font-medium animate-pulse ${themeClasses.textHeader}`}>{statusMessage}</p>
                  </div>
                </div>
              ) : videoUrl ? (
                <div className="rounded-xl overflow-hidden shadow-inner bg-black aspect-video flex items-center justify-center">
                  <video src={videoUrl} controls className="w-full h-full" autoPlay />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-black/5 dark:bg-white/5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <VideoIcon className="h-16 w-16 text-gray-400 mb-4" />
                  <button
                    onClick={generateVideo}
                    className={`px-8 py-4 rounded-xl font-bold text-white shadow-xl transition-all active:scale-95 ${themeClasses.buttonPrimary}`}
                  >
                    {t('generateVideo')}
                  </button>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              {videoUrl && (
                <div className="flex justify-center">
                  <button
                    onClick={generateVideo}
                    className={`text-sm font-medium hover:underline ${themeClasses.textHeader}`}
                  >
                    {t('tryAgain')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
