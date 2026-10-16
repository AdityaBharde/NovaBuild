import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'violet' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-[#181622] text-[#a1a1aa] border-[#24242d]',
    violet: 'bg-[#20172f] text-[#c4b5fd] border-[#3b2b5d] shadow-[0_0_10px_rgba(121,80,232,0.25)]',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    outline: 'bg-transparent text-[#a1a1aa] border-[#24242d]',
  }[variant];

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles} ${sizeStyles} ${className}`}
    >
      {children}
    </span>
  );
};
