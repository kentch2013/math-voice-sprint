import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Clock, CheckCircle, Award } from 'lucide-react';
import type { GameSession } from '../types';

interface SummaryModalProps {
  session: GameSession | null;
  restartCountdown: number;
  onPlayAgain: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  session,
  restartCountdown,
  onPlayAgain,
}) => {
  useEffect(() => {
    // Fire confetti burst on open
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if canvas-confetti fails
    }
  }, []);

  if (!session) return null;

  const percentage = Math.round((session.correctCount / session.totalQuestions) * 100);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-indigo-200 text-center relative overflow-hidden">
        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shadow-inner border-2 border-amber-200 animate-bounce">
            <Trophy size={44} />
          </div>
        </div>

        <h2 className="text-3xl font-black text-indigo-900 mb-1">Sprint Complete!</h2>
        <p className="text-slate-500 font-medium text-sm mb-6">Great job working through your math facts!</p>

        {/* Score Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs uppercase mb-1">
              <Award size={16} /> Accuracy
            </div>
            <div className="text-3xl font-black text-indigo-900">
              {session.correctCount}/{session.totalQuestions}
            </div>
            <div className="text-xs font-semibold text-indigo-600">{percentage}% Correct</div>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-purple-600 font-bold text-xs uppercase mb-1">
              <Clock size={16} /> Total Time
            </div>
            <div className="text-3xl font-black text-purple-900">
              {session.totalDurationSeconds}s
            </div>
            <div className="text-xs font-semibold text-purple-600">Total Duration</div>
          </div>
        </div>

        {/* Question Breakdown List */}
        <div className="bg-slate-50 rounded-2xl p-3 mb-6 max-h-40 overflow-y-auto border border-slate-200 text-left">
          <div className="text-xs font-bold text-slate-500 uppercase mb-2 px-1">Problem Breakdown</div>
          <div className="space-y-1.5">
            {session.results.map((res, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-slate-100"
              >
                <span className="font-bold text-slate-700">{res.problem}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Ans: {res.expectedAnswer}</span>
                  {res.isCorrect ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle size={14} /> {res.timeSpentSeconds}s ({res.inputMethod})
                    </span>
                  ) : (
                    <span className="text-rose-500 font-bold">✕ Timeout/Missed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auto Restart Indicator */}
        <div className="text-xs text-slate-500 mb-4 font-semibold">
          Auto-restarting in <span className="text-indigo-600 font-bold">{restartCountdown}s</span>...
        </div>

        {/* Play Again Button */}
        <button
          onClick={onPlayAgain}
          className="w-full min-h-[64px] py-4 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xl rounded-2xl shadow-lg transition-transform flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw size={24} />
          Play Again Now
        </button>
      </div>
    </div>
  );
};
