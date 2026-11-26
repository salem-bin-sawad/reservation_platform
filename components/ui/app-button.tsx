'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface AppButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'md' | 'lg' | 'sm';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function AppButton({
  children,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled,
  icon,
  className = '',
  type = 'button',
  ...props
}: AppButtonProps) {
  const heightCls =
    size === 'sm' ? 'h-9 px-3.5 text-xs' : size === 'md' ? 'h-11 px-4 text-sm' : 'h-[52px] px-5 text-[15px]';

  let variantCls = '';
  if (variant === 'primary') {
    variantCls =
      'bg-[var(--brand-primary)] text-[var(--text-on-primary)] shadow-button hover:opacity-95';
  } else if (variant === 'secondary') {
    variantCls =
      'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-card hover:bg-[var(--bg-surface-secondary)]';
  } else if (variant === 'success') {
    variantCls =
      'bg-[#16A34A] text-white shadow-card hover:bg-[#15803D]';
  } else if (variant === 'danger') {
    variantCls =
      'bg-[#DC2626] text-white shadow-card hover:bg-[#B91C1C]';
  } else {
    variantCls =
      'bg-transparent text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]';
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-[14px] font-bold transition-all cursor-pointer active:scale-[0.99] disabled:opacity-55 disabled:cursor-not-allowed ${heightCls} ${variantCls} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
