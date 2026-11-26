'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Phone,
} from 'lucide-react';
import { AuthHeader } from '@/components/auth/auth-header';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { ApiError, authApi } from '@/lib/api';

type ResetStep = 'request' | 'confirm' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>('request');
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('يرجى إدخال رقم الجوال أو البريد الإلكتروني المسجل.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(identifier);
      setInfoMessage(res.message);
      setStep('confirm');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('تعذر إرسال رمز الاستعادة.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (otpCode.trim().length !== 6 || !newPassword) {
      setErrorMessage('يرجى إدخال رمز الاستعادة (6 أرقام) وكلمة المرور الجديدة.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword(identifier, otpCode, newPassword);
      setInfoMessage(res.message);
      setStep('done');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('تعذر إعادة تعيين كلمة المرور.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-[var(--bg-page)]">
      <div className="w-full max-w-[600px] flex flex-col gap-4">
        <AuthHeader
          title="استعادة كلمة المرور"
          subtitle="إعادة تعيين كلمة المرور لحساب المكتب"
          backHref="/"
        />

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

        {infoMessage ? (
          <div
            style={{
              backgroundColor: 'var(--tint-green-bg)',
              color: 'var(--tint-green)',
            }}
            className="flex items-center gap-2 rounded-[12px] border border-green-300/60 px-3.5 py-2.5 text-sm font-semibold"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        ) : null}

        {step === 'request' ? (
          <form onSubmit={handleRequestCode} className="flex flex-col gap-3">
            <AppInput
              label="رقم الجوال أو البريد الإلكتروني"
              icon={<Phone className="h-5 w-5" />}
              placeholder="أدخل رقم الجوال أو البريد الإلكتروني"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              forceFocusedStyle
            />
            <AppButton type="submit" loading={loading} className="w-full">
              إرسال رمز الاستعادة
            </AppButton>
          </form>
        ) : step === 'confirm' ? (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
            <AppInput
              label="رمز التحقق (6 أرقام)"
              icon={<KeyRound className="h-5 w-5" />}
              placeholder="123456"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
            />
            <AppInput
              label="كلمة المرور الجديدة"
              icon={<Lock className="h-5 w-5" />}
              type={showPassword ? 'text' : 'password'}
              placeholder="8 خانات على الأقل (حرف كبير وصغير ورقم)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              trailingAction={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
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
            <AppButton type="submit" loading={loading} className="w-full">
              حفظ كلمة المرور الجديدة
            </AppButton>
          </form>
        ) : (
          <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-6 text-center shadow-card flex flex-col gap-4">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.
            </p>
            <Link href="/">
              <AppButton className="w-full">العودة لتسجيل الدخول</AppButton>
            </Link>
          </div>
        )}

        <div className="text-center text-sm">
          <Link
            href="/"
            className="font-bold text-[var(--brand-primary)] hover:underline"
          >
            العودة إلى صفحة تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
