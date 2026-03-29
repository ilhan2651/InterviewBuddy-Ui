// src/components/ui/Button.jsx
import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md hover:-translate-y-0.5",
    secondary: "bg-white border border-slate-200 text-text-main hover:bg-slate-50 shadow-sm hover:shadow-md",
    outline: "border-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40",
    ghost: "text-text-muted hover:bg-slate-100 hover:text-text-main",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md",
    glass: "glass text-text-main hover:bg-white/90 shadow-sm hover:shadow-md"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
