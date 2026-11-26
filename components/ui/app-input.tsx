'use client';

import React, { useState } from 'react';

export interface AppInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  icon: React.ReactNode;
  trailingAction?: React.ReactNode;
  forceFocusedStyle?: boolean;
  containerClassName?: string;
}

export function AppInput({
  label,
  icon,
  trailingAction,
  forceFocusedStyle = false,
  containerClassName = '',
  onFocus,
  onBlur,
  ...inputProps
}: AppInputProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || forceFocusedStyle;

  return (
    <div
      className={`flex items-center gap-3 rounded-[16px] px-3 py-2.5 min-h-[66px] bg-[var(--bg-surface)] shadow-card transition-all ${
        active
          ? 'border-[1.5px] border-[var(--border-focused)]'
          : 'border border-[var(--border-color)]'
      } ${containerClassName}`}
    >
      {/* RTL Start Icon Badge */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] transition-colors ${
          active
            ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)]'
            : 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]'
        }`}
      >
        {icon}
      </div>

      {/* Label + Input */}
      <div className="flex flex-1 flex-col justify-center min-w-0">
        <label
          className={`text-xs font-semibold mb-0.5 truncate ${
            active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
          }`}
        >
          {label}
        </label>
        <input
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className="w-full bg-transparent text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
      </div>

      {/* Optional Trailing Action */}
      {trailingAction ? (
        <div className="shrink-0 flex items-center">{trailingAction}</div>
      ) : null}
    </div>
  );
}
