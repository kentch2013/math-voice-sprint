import React from 'react';
import { Play, Mic, Sparkles, Zap } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  isVoiceSupported: boolean;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, isVoiceSupported }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-4 border-indigo-200">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 animate-bounce">
            <Zap size={48} />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold text-indigo-900 mb-2">
          Math Sprint!
        </h1>

        <p className="text-lg text-slate-600 mb-6">
          Shout out or type the answer to 10 multiplication questions as fast as you can!
        </p>

        <div className="bg-indigo-50 rounded-2xl p-4 mb-6 border border-indigo-100 text-left">
          <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles size={16} /> How to Play
          </h2>
          <ul className="text-sm text-slate-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600">•</span>
              <span>Say your answer out loud when you see the math problem.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600">•</span>
              <span>You can also use the on-screen keypad to type your answer!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-indigo-600">•</span>
              <span>Complete all 10 questions to set a new record!</span>
            </li>
          </ul>
        </div>

        {!isVoiceSupported && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-amber-800 text-xs flex items-center gap-2">
            <Mic size={16} className="shrink-0 text-amber-600" />
            <span>Voice recognition isn't supported in this browser. You can still play using the keypad!</span>
          </div>
        )}

        <button
          onClick={onStart}
          className="w-full min-h-[64px] py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white font-bold text-2xl rounded-2xl shadow-lg transition-transform flex items-center justify-center gap-3 cursor-pointer"
        >
          <Play size={28} fill="currentColor" />
          Start Sprint!
        </button>
      </div>
    </div>
  );
};
