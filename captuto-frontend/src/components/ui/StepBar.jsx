import { Check } from 'lucide-react';

const steps = ['Select Template', 'Upload Document', 'Confirm', 'Auto-fill & Save'];

export default function StepBar({ currentStep }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const isFuture = stepNum > currentStep;

        return (
          <div key={stepNum} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${isDone ? 'bg-green-500 text-white' : ''}
                  ${isActive ? 'bg-[#534AB7] text-white' : ''}
                  ${isFuture ? 'bg-gray-100 text-gray-400' : ''}
                `}
              >
                {isDone ? <Check size={14} /> : stepNum}
              </div>
              <span
                className={`text-xs whitespace-nowrap
                  ${isActive ? 'text-[#534AB7] font-medium' : ''}
                  ${isDone ? 'text-green-600' : ''}
                  ${isFuture ? 'text-gray-400' : ''}
                `}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-5 ${stepNum < currentStep ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
