import React from 'react';
import type { VoiceLanguage } from '../hooks/useVoiceRecognition';

interface LanguageToggleProps {
  language: VoiceLanguage;
  onLanguageChange: (lang: VoiceLanguage) => void;
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  language,
  onLanguageChange,
  className = '',
}) => {
  return (
    <div className={`inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-300 ${className}`}>
      <button
        type="button"
        onClick={() => onLanguageChange('en-US')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
          language === 'en-US'
            ? 'bg-white text-indigo-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-label="Switch to English voice mode"
      >
        <span>🇺🇸</span>
        <span>EN</span>
      </button>

      <button
        type="button"
        onClick={() => onLanguageChange('zh-CN')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
          language === 'zh-CN'
            ? 'bg-white text-indigo-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-label="Switch to Mandarin Chinese voice mode"
      >
        <span>🇨🇳</span>
        <span>中文</span>
      </button>
    </div>
  );
};
