import React from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';

interface KeypadProps {
  onNumberPress: (digit: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  value: string;
}

export const Keypad: React.FC<KeypadProps> = ({
  onNumberPress,
  onDelete,
  onSubmit,
  value,
}) => {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="w-full max-w-xs mx-auto mt-4 p-4 bg-slate-100 rounded-3xl border-2 border-slate-200">
      <div className="text-center mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Touch Keypad
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 justify-items-center">
        {digits.slice(0, 9).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onNumberPress(num)}
            className="w-16 h-16 min-w-[64px] min-h-[64px] bg-white hover:bg-indigo-50 active:bg-indigo-100 text-indigo-900 text-2xl font-bold rounded-2xl shadow border-2 border-slate-200 hover:border-indigo-300 active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          onClick={onDelete}
          className="w-16 h-16 min-w-[64px] min-h-[64px] bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-bold rounded-2xl shadow border-2 border-rose-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
          aria-label="Delete"
        >
          <Delete size={24} />
        </button>

        <button
          type="button"
          onClick={() => onNumberPress('0')}
          className="w-16 h-16 min-w-[64px] min-h-[64px] bg-white hover:bg-indigo-50 active:bg-indigo-100 text-indigo-900 text-2xl font-bold rounded-2xl shadow border-2 border-slate-200 hover:border-indigo-300 active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
        >
          0
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!value}
          className={`w-16 h-16 min-w-[64px] min-h-[64px] ${
            value
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          } font-bold rounded-2xl border-2 border-emerald-600 active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none`}
          aria-label="Enter"
        >
          <CornerDownLeft size={24} />
        </button>
      </div>
    </div>
  );
};
