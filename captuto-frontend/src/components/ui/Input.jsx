import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        ref={ref}
        className={`h-9 w-full px-3 border rounded-lg text-sm outline-none transition-colors
          ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#534AB7]'}
          ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
});

export default Input;
