'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Bus,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  Layers,
  Loader2,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  ReceiptText,
  Sun,
  UserCircle2,
  X,
} from 'lucide-react';
import { usePwaInstall } from '@/components/pwa/pwa-provider';
import { useAuth } from '@/context/auth-context';
import { useAppTheme } from '@/context/theme-context';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchExact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'لوحة التحكم',
    icon: LayoutDashboard,
    matchExact: true,
  },
  {
    href: '/dashboard/services',
    label: 'الخدمات والاشتراكات',
    icon: Layers,
  },
  {
    href: '/dashboard/trips',
    label: 'إدارة الرحلات',
    icon: Bus,
    matchExact: true,
  },
  {
    href: '/dashboard/trips/import',
    label: 'استيراد إكسل والمسودات',
    icon: FileSpreadsheet,
  },
  {
    href: '/dashboard/bookings',
    label: 'الحجوزات والفواتير',
    icon: ReceiptText,
  },
  {
    href: '/dashboard/profile',
    label: 'ملف المكتب',
    icon: UserCircle2,
  },
];

export function OfficeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isReady, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useAppTheme();
  const { canInstall, promptInstall } = usePwaInstall();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/');
    }
  }, [isReady, isAuthenticated, router]);

  if (!isReady || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[var(--bg-page)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
        <p className="text-sm font-bold text-[var(--text-secondary)]">
          جاري التحقق من جلسة المكتب...
        </p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const isActiveNav = (item: NavItem) => {
    if (item.matchExact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex flex-col gap-5">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 px-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#164C92] text-white shadow-button">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-extrabold leading-tight text-[var(--brand-primary)]">
              حجوزاتي
            </div>
            <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
              بوابة المكاتب المعتمدة
            </div>
          </div>
        </Link>

        {/* Office Card */}
        <div className="rounded-[16px] bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] p-3.5">
          <div className="text-xs font-bold text-[var(--brand-primary)] mb-0.5">
            حساب مكتب نشط
          </div>
          <div className="text-sm font-extrabold text-[var(--text-primary)] truncate">
            {user.officeName || user.fullName}
          </div>
          <div className="text-xs font-medium text-[var(--text-secondary)] truncate mt-0.5">
            {user.fullName} {user.city ? `• ${user.city}` : ''}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActiveNav(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-sm font-bold transition-all ${
                  active
                    ? 'bg-[var(--brand-primary)] text-white shadow-button'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Logout */}
      <div className="pt-4 border-t border-[var(--border-color)]">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-sm font-bold text-[#DC2626] hover:bg-[var(--tint-red-bg)] transition cursor-pointer"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--bg-page)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[272px] shrink-0 bg-[var(--bg-surface)] border-l border-[var(--border-color)] sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/45"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-[280px] max-w-[85vw] bg-[var(--bg-surface)] h-full shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="إغلاق القائمة"
              className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-surface-secondary)] text-[var(--text-primary)]"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-[var(--bg-surface)]/90 backdrop-blur border-b border-[var(--border-color)] px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="فتح القائمة"
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                مرحباً، {user.officeName || user.fullName}
              </div>
              <div className="text-[11px] font-medium text-[var(--text-secondary)]">
                إدارة الرحلات والخدمات ومطابقة الفواتير
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {canInstall ? (
              <button
                type="button"
                onClick={() => void promptInstall()}
                className="inline-flex items-center gap-1.5 rounded-[12px] bg-[var(--brand-primary-soft)] px-3 py-2 text-xs font-bold text-[var(--brand-primary)] hover:opacity-85 transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">تثبيت التطبيق</span>
              </button>
            ) : null}

            <Link
              href="/dashboard/trips/new"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-[12px] bg-[var(--brand-primary)] px-3.5 py-2 text-xs font-bold text-white shadow-button hover:opacity-95 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>رحلة جديدة</span>
            </Link>

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

        <main className="flex-1 p-4 sm:p-6 max-w-[1280px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
