import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { QuestionResult } from '../types';

interface ProgressBarProps {
  currentIndex: number;
  totalQuestions: number;
  results: QuestionResult[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentIndex,
  totalQuestions,
  results,
}) => {
  const steps = Array.from({ length: totalQuestions }, (_, i) => i);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 my-4">
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {steps.map((index) => {
          const result = results[index];
          const isCurrent = index === currentIndex;
          const isPassed = index < currentIndex;

          let statusBg = 'bg-slate-200 text-slate-400 border-slate-300';
          let icon = <Circle size={16} />;

          if (isPassed && result) {
            if (result.isCorrect) {
              statusBg = 'bg-emerald-500 text-white border-emerald-600';
              icon = <CheckCircle2 size={16} />;
            } else {
              statusBg = 'bg-rose-500 text-white border-rose-600';
              icon = <span className="text-xs font-bold">✕</span>;
            }
          } else if (isCurrent) {
            statusBg = 'bg-indigo-600 text-white border-indigo-700 ring-4 ring-indigo-200 scale-110';
            icon = <span className="text-xs font-bold">{index + 1}</span>;
          }

          return (
            <div
              key={index}
              className={`flex-1 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 font-bold ${statusBg}`}
              title={`Question ${index + 1}`}
            >
              {icon}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center text-xs text-slate-500 font-semibold mt-2 px-1">
        <span>Question {Math.min(currentIndex + 1, totalQuestions)} of {totalQuestions}</span>
        <span>{results.filter((r) => r.isCorrect).length} Correct</span>
      </div>
    </div>
  );
};
