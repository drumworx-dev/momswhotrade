import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export function Input({ label, error, prefix, suffix, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-4 text-text-secondary font-medium pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          className={`w-full bg-surface-dim border border-gray-200 rounded-input px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} ${error ? 'border-accent-error ring-1 ring-accent-error' : ''} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-4 text-text-secondary font-medium pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-accent-error">{error}</p>}
    </div>
  );
}
