import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, fullWidth, children, className = '', disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-pill transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-white text-text-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:ring-accent-primary',
    secondary: 'bg-transparent border-2 border-text-primary text-text-primary hover:bg-text-primary hover:text-white focus:ring-text-primary',
    accent: 'bg-accent-primary text-white shadow-sm hover:bg-accent-dark hover:shadow-md hover:-translate-y-0.5 focus:ring-accent-primary',
    danger: 'bg-accent-error text-white shadow-sm hover:opacity-90 focus:ring-accent-error',
    ghost: 'bg-transparent text-text-secondary hover:bg-surface-dim hover:text-text-primary focus:ring-accent-primary',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
}
