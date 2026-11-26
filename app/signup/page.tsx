'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileBadge2,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  User,
} from 'lucide-react';
import { AuthHeader } from '@/components/auth/auth-header';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { useAuth } from '@/context/auth-context';
import { ApiError, authApi } from '@/lib/api';

type SignupStep = 'form' | 'otp';

export default function OfficeSignupPage() {
  const router = useRouter();
  const { login, isAuthenticated, isReady } = useAuth();

  const [step, setStep] = useState<SignupStep>('form');
  const [fullName, setFullName] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [commercialRegistration, setCommercialRegistration] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [phoneStatus, setPhoneStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isReady, isAuthenticated, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCheckPhone = async () => {
    if (!phone.trim()) return;
    try {
      const res = await authApi.checkPhone(phone);
      setPhoneStatus({ ok: true, message: res.message });
    } catch (err) {
      if (err instanceof ApiError) {
        setPhoneStatus({ ok: false, message: err.message });
      }
    }
  };

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      setEmailStatus(null);
      return;
    }
    try {
      const res = await authApi.checkEmail(email);
      setEmailStatus({ ok: true, message: res.message });
    } catch (err) {
      if (err instanceof ApiError) {
        setEmailStatus({ ok: false, message: err.message });
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!fullName.trim() || !officeName.trim() || !phone.trim() || !password) {
      setErrorMessage(
        'يرجى إدخال اسم المسؤول، اسم المكتب التجاري، رقم الجوال، وكلمة المرور.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.signupOffice({
        fullName,
        officeName,
        commercialRegistration,
        city,
        address,
        phone,
        email,
        password,
      });
      setInfoMessage(res.message);
      setCooldown(60);
      setStep('otp');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('حدث خطأ غير متوقع أثناء تسجيل المكتب.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (otpCode.trim().length !== 6) {
      setErrorMessage('يرجى إدخال رمز التحقق المكون من 6 أرقام.');
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyOtp(phone, otpCode);
      await login(phone, password);
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('تعذر التحقق من الرمز.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setResending(true);
    try {
      const res = await authApi.resendOtp(phone);
      setInfoMessage(res.message);
      setCooldown(60);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('تعذر إعادة إرسال الرمز.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-[var(--bg-page)]">
      <div className="w-full max-w-[740px] flex flex-col gap-4">
        <AuthHeader
          title={step === 'form' ? 'تسجيل مكتب جديد' : 'تفعيل رقم جوال المكتب'}
          subtitle="انضم كمزود خدمة ونقل لإدارة رحلاتك وحجوزاتك"
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

        {step === 'form' ? (
          <form onSubmit={handleSignup} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AppInput
                label="اسم المكتب التجاري *"
                icon={<Building2 className="h-5 w-5" />}
                placeholder="أدخل اسم المكتب التجاري"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
              />

              <AppInput
                label="اسم مسؤول المكتب *"
                icon={<User className="h-5 w-5" />}
                placeholder="أدخل الاسم الكامل لمسؤول المكتب"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <div>
                <AppInput
                  label="رقم الجوال (المعرف الأساسي) *"
                  icon={<Phone className="h-5 w-5" />}
                  placeholder="+9665XXXXXXXX"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneStatus(null);
                  }}
                  onBlur={handleCheckPhone}
                />
                {phoneStatus ? (
                  <p
                    className={`mt-1 px-2 text-xs font-semibold ${
                      phoneStatus.ok ? 'text-[#16A34A]' : 'text-[#DC2626]'
                    }`}
                  >
                    {phoneStatus.message}
                  </p>
                ) : null}
              </div>

              <div>
                <AppInput
                  label="البريد الإلكتروني (اختياري)"
                  icon={<Mail className="h-5 w-5" />}
                  type="email"
                  placeholder="office@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailStatus(null);
                  }}
                  onBlur={handleCheckEmail}
                />
                {emailStatus ? (
                  <p
                    className={`mt-1 px-2 text-xs font-semibold ${
                      emailStatus.ok ? 'text-[#16A34A]' : 'text-[#DC2626]'
                    }`}
                  >
                    {emailStatus.message}
                  </p>
                ) : null}
              </div>

              <AppInput
                label="رقم السجل التجاري / الترخيص"
                icon={<FileBadge2 className="h-5 w-5" />}
                placeholder="أدخل رقم السجل التجاري"
                value={commercialRegistration}
                onChange={(e) => setCommercialRegistration(e.target.value)}
              />

              <AppInput
                label="المدينة الرئيسية"
                icon={<MapPin className="h-5 w-5" />}
                placeholder="أدخل المدينة"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <AppInput
              label="العنوان التفصيلي للمكتب"
              icon={<Navigation className="h-5 w-5" />}
              placeholder="الشارع، الحي"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <AppInput
              label="كلمة المرور *"
              icon={<Lock className="h-5 w-5" />}
              type={showPassword ? 'text' : 'password'}
              placeholder="8 خانات على الأقل (حرف كبير وصغير ورقم أو رمز)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

            <p className="text-[11px] font-medium text-[var(--text-muted)] px-1">
              يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم أو رمز خاص على الأقل.
            </p>

            <AppButton type="submit" loading={loading} className="w-full mt-1">
              إنشاء حساب المكتب وإرسال رمز التحقق
            </AppButton>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
            <div className="rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 text-sm text-[var(--text-secondary)] shadow-card">
              تم إرسال رمز التحقق (OTP) المكون من 6 أرقام إلى الجوال{' '}
              <span className="font-bold text-[var(--text-primary)]" dir="ltr">
                {phone}
              </span>
              . (في بيئة التطوير يظهر الرمز في سجل الخادم).
            </div>

            <AppInput
              label="رمز التحقق (OTP)"
              icon={<KeyRound className="h-5 w-5" />}
              placeholder="أدخل الرمز المكون من 6 أرقام"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              forceFocusedStyle
            />

            <AppButton type="submit" loading={loading} className="w-full">
              تفعيل حساب المكتب والدخول
            </AppButton>

            <AppButton
              type="button"
              variant="secondary"
              loading={resending}
              disabled={cooldown > 0}
              onClick={handleResendOtp}
              icon={<RefreshCw className="h-4 w-4" />}
              className="w-full"
            >
              {cooldown > 0
                ? `إعادة إرسال الرمز بعد ${cooldown} ثانية`
                : 'إعادة إرسال رمز التحقق'}
            </AppButton>
          </form>
        )}

        <div className="flex items-center justify-center gap-1.5 text-sm mt-1">
          <span className="text-[var(--text-secondary)] font-medium">
            لدى مكتبك حساب بالفعل؟
          </span>
          <Link
            href="/"
            className="font-bold text-[var(--brand-primary)] hover:underline"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
