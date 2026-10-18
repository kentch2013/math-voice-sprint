import React from 'react';
import { Mic, MicOff, Volume2, Timer, MessageSquareHeart } from 'lucide-react';
import type { MathProblem } from '../types';

interface GameBoardProps {
  problem: MathProblem;
  timeLeft: number;
  showSilenceNudge: boolean;
  showExpiredAnswer?: boolean;
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  volumeLevel: number;
  isSpeechDetected: boolean;
  keypadInput: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  problem,
  timeLeft,
  showSilenceNudge,
  showExpiredAnswer = false,
  transcript,
  interimTranscript,
  isListening,
  volumeLevel,
  isSpeechDetected,
  keypadInput,
}) => {
  const currentDisplayedTranscript = interimTranscript || transcript;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center">
      {/* Timer and Status Bar */}
      <div className="w-full flex justify-between items-center bg-white rounded-2xl p-4 shadow-md mb-6 border border-slate-200">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center p-2 rounded-xl ${
              timeLeft <= 5 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            <Timer size={24} />
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Time Left
            </span>
            <span
              className={`text-2xl font-black ${
                timeLeft <= 5 ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Live Microphone Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Voice Input
            </span>
            <span className="text-sm font-bold text-slate-700">
              {isListening ? (isSpeechDetected ? 'Speaking...' : 'Listening...') : 'Mic Off'}
            </span>
          </div>
          <div
            className={`relative flex items-center justify-center p-3 rounded-full transition-colors ${
              isListening
                ? isSpeechDetected
                  ? 'bg-emerald-500 text-white shadow-lg ring-4 ring-emerald-200 animate-pulse'
                  : 'bg-indigo-600 text-white'
                : 'bg-slate-300 text-slate-600'
            }`}
          >
            {isListening ? <Mic size={22} /> : <MicOff size={22} />}
            {isListening && volumeLevel > 0 && (
              <span
                className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 -z-10 transition-transform duration-75"
                style={{ transform: `scale(${1 + Math.min(volumeLevel, 100) / 100})` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Question Display (Font size >= 72px) */}
      <div className="w-full bg-gradient-to-b from-white to-indigo-50/50 border-4 border-indigo-200 rounded-3xl p-8 sm:p-12 shadow-xl text-center mb-6 relative overflow-hidden">
        <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">
          Solve the problem
        </div>

        {showExpiredAnswer ? (
          <div
            className="font-black text-rose-600 tracking-tight select-none my-4 animate-bounce"
            style={{ fontSize: '64px', lineHeight: '1.1' }}
          >
            {problem.operandA} × {problem.operandB} = {problem.expectedAnswer}
          </div>
        ) : (
          <div
            className="font-black text-indigo-900 tracking-tight select-none my-4"
            style={{ fontSize: '72px', lineHeight: '1.1' }}
          >
            {problem.operandA} × {problem.operandB} = ?
          </div>
        )}

        {/* Typed Keypad Display or Voice Feedback */}
        <div className="min-h-[50px] flex items-center justify-center">
          {keypadInput ? (
            <div className="text-3xl font-black text-purple-700 bg-purple-100 px-6 py-2 rounded-2xl border-2 border-purple-300 animate-fade-in">
              {keypadInput}
            </div>
          ) : currentDisplayedTranscript ? (
            <div className="flex items-center justify-center gap-2 text-indigo-700 bg-indigo-100/80 px-4 py-2 rounded-xl text-lg font-semibold border border-indigo-200">
              <Volume2 size={20} className="animate-bounce text-indigo-600" />
              <span>"{currentDisplayedTranscript}"</span>
            </div>
          ) : (
            <div className="text-slate-400 text-sm italic">
              Say answer out loud or use the keypad below...
            </div>
          )}
        </div>
      </div>

      {/* Silence Encouragement Banner (triggers after 10s of silence) */}
      {showSilenceNudge && (
        <div className="w-full bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-4 text-amber-900 flex items-center gap-3 shadow-md animate-bounce">
          <MessageSquareHeart size={28} className="text-amber-600 shrink-0" />
          <div className="text-left">
            <p className="font-bold text-sm sm:text-base">Take a guess!</p>
            <p className="text-xs sm:text-sm text-amber-800">
              Say the answer out loud or tap the numbers on the keypad below!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
