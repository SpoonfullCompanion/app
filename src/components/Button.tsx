import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  className = '', 
  disabled = false,
  type = 'button',
  'aria-label': ariaLabel,
  ...props 
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-midnight-black disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-bold-blue text-white hover:bg-periwinkle focus:ring-bold-blue shadow-lg hover:shadow-xl',
    secondary: 'bg-periwinkle text-white hover:bg-periwinkle/90 focus:ring-periwinkle shadow-lg hover:shadow-xl',
    outline: 'border-2 border-bold-blue text-bold-blue hover:bg-bold-blue hover:text-white focus:ring-bold-blue'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-3 text-sm min-h-[44px]',
    md: 'px-6 py-4 text-lg min-h-[48px]',
    lg: 'px-8 py-5 text-lg min-h-[56px]'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}