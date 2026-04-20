import { forwardRef } from 'react';

const Select = forwardRef(function Select({ label, error, options = [], className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        ref={ref}
        className={`h-9 w-full px-3 border rounded-lg text-sm outline-none transition-colors bg-white
          ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#534AB7]'}
          ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
});

export default Select;
