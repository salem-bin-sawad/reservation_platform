'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Bus,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Lock,
  Phone,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';
import { AuthHeader } from '@/components/auth/auth-header';
import { OfficeHeroBanner } from '@/components/auth/office-hero-banner';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';

const QUICK_HIGHLIGHTS = [
  {
    id: 'trips',
    label: 'إدارة الرحلات',
    icon: Bus,
    bg: 'var(--tint-blue-bg)',
    color: 'var(--tint-blue)',
  },
  {
    id: 'bookings',
    label: 'تأكيد الحجوزات',
    icon: ShieldCheck,
    bg: 'var(--tint-green-bg)',
    color: 'var(--tint-green)',
  },
  {
    id: 'invoices',
    label: 'فحص الفواتير',
    icon: ReceiptText,
    bg: 'var(--tint-cyan-bg)',
    color: 'var(--tint-cyan)',
  },
  {
    id: 'excel',
    label: 'استيراد إكسل',
    icon: FileSpreadsheet,
    bg: 'var(--tint-purple-bg)',
    color: 'var(--tint-purple)',
  },
];

export default function OfficeLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isReady } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isReady, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage('يرجى إدخال رقم الجوال (أو البريد الإلكتروني) وكلمة المرور.');
      return;
    }

    setLoading(true);
    try {
      await login(identifier, password);
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('حدث خطأ غير متوقع أثناء تسجيل الدخول.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-[var(--bg-page)]">
      <div className="w-full max-w-[680px] flex flex-col gap-4">
        <AuthHeader />

        <OfficeHeroBanner />

        <div className="text-center mt-1">
          <h1 className="text-xl font-extrabold text-[var(--text-primary)]">
            أهلاً بك في لوحة تحكم المكتب
          </h1>
          <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">
            سجّل الدخول برقم جوال المكتب أو البريد الإلكتروني المسجل
          </p>
        </div>

        {errorMessage ? (
          <div
            style={{
              backgroundColor: 'var(--tint-red-bg)',
              color: 'var(--tint-red)',
            }}
            className="flex items-center gap-2 rounded-[12px] border border-red-300/60 px-3.5 py-2.5 text-sm font-semibold"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <AppInput
            label="رقم الجوال أو البريد الإلكتروني"
            icon={<Phone className="h-5 w-5" />}
            placeholder="أدخل رقم الجوال أو البريد الإلكتروني"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />

          <AppInput
            label="كلمة المرور"
            icon={<Lock className="h-5 w-5" />}
            type={showPassword ? 'text' : 'password'}
            placeholder="اكتب كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            forceFocusedStyle
            trailingAction={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {showPassword ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </button>
            }
          />

          <div className="flex items-center justify-end px-1">
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-[var(--brand-primary)] hover:underline whitespace-nowrap"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>

          <AppButton type="submit" loading={loading} className="w-full mt-1">
            تسجيل الدخول للمكتب
          </AppButton>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-sm mt-1">
          <span className="text-[var(--text-secondary)] font-medium">
            ليس لدى مكتبك حساب؟
          </span>
          <Link
            href="/signup"
            className="font-bold text-[var(--brand-primary)] hover:underline"
          >
            تسجيل مكتب جديد
          </Link>
        </div>

        {/* Bottom quick highlights matching reservation-app */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[var(--border-color)]">
          {QUICK_HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <div
                  style={{ backgroundColor: item.bg, color: item.color }}
                  className="flex h-12 w-12 items-center justify-center rounded-[16px]"
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
