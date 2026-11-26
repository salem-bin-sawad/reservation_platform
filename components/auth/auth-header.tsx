'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Download, Moon, Sun } from 'lucide-react';
import { usePwaInstall } from '@/components/pwa/pwa-provider';
import { useAppTheme } from '@/context/theme-context';

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
  backHref?: string;
}

export function AuthHeader({
  title = 'حجوزاتي',
  subtitle = 'بوابة المكاتب ومزودي الخدمة',
  backHref,
}: AuthHeaderProps) {
  const { isDark, toggleTheme } = useAppTheme();
  const { canInstall, promptInstall } = usePwaInstall();

  return (
    <header className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="رجوع"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-card border border-[var(--border-color)] hover:opacity-85 transition"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
        ) : null}

        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#164C92] text-white shadow-button">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-extrabold leading-tight text-[var(--brand-primary)]">
              {title}
            </div>
            <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
              {subtitle}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canInstall ? (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-soft)] px-3 py-2 text-xs font-bold text-[var(--brand-primary)] shadow-card cursor-pointer hover:opacity-85 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>تثبيت التطبيق</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="تبديل المظهر"
          style={{
            backgroundColor: 'var(--tint-purple-bg)',
            color: 'var(--tint-purple)',
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full shadow-card cursor-pointer hover:opacity-85 transition"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
