'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  FileBadge2,
  Layers,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
} from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { useAuth } from '@/context/auth-context';
import { servicesApi } from '@/lib/api';
import type { ServiceItem } from '@/lib/types';

export default function OfficeProfilePage() {
  const { user, token, refreshProfile, logout } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [, myServices] = await Promise.all([
        refreshProfile(),
        servicesApi.getMyServices(token),
      ]);
      setServices(Array.isArray(myServices) ? myServices : []);
    } finally {
      setLoading(false);
    }
  }, [token, refreshProfile]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  if (!user) return null;

  const infoItems = [
    {
      label: 'اسم المكتب التجاري',
      value: user.officeName || 'غير محدد',
      icon: Building2,
    },
    {
      label: 'اسم مسؤول المكتب',
      value: user.fullName,
      icon: User,
    },
    {
      label: 'رقم الجوال الأساسي',
      value: user.phone,
      icon: Phone,
      ltr: true,
    },
    {
      label: 'البريد الإلكتروني',
      value: user.email || 'غير مضاف',
      icon: Mail,
      ltr: Boolean(user.email),
    },
    {
      label: 'السجل التجاري / الترخيص',
      value: user.commercialRegistration || 'غير محدد',
      icon: FileBadge2,
    },
    {
      label: 'المدينة',
      value: user.city || 'غير محددة',
      icon: MapPin,
    },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--brand-primary)]" />
            <span>ملف المكتب وبيانات الحساب</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mt-1">
            بيانات المكتب المعتمدة من النظام وحالة التوثيق والخدمات المقدمة.
          </p>
        </div>

        <AppButton
          variant="secondary"
          size="md"
          loading={refreshing}
          onClick={handleRefresh}
          icon={<RefreshCw className="h-4 w-4" />}
        >
          تحديث البيانات
        </AppButton>
      </div>

      {/* Hero Office Card */}
      <div className="hero-gradient rounded-[20px] p-6 text-white shadow-button flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-white/15 border border-white/25">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <div className="text-xl font-extrabold">
              {user.officeName || user.fullName}
            </div>
            <div className="text-xs font-semibold text-white/85 mt-1">
              {user.fullName} • دور الحساب: مكتب ومزود خدمة (office)
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {user.isPhoneVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#4ADE80]" />
                  جوال موثق
                </span>
              ) : null}
              {user.isActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#60A5FA]" />
                  حساب نشط
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Office Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {infoItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 shadow-card"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[var(--text-secondary)]">
                  {item.label}
                </div>
                <div
                  dir={item.ltr ? 'ltr' : undefined}
                  className={`text-sm font-extrabold text-[var(--text-primary)] truncate ${
                    item.ltr ? 'text-right' : ''
                  }`}
                >
                  {item.value}
                </div>
              </div>
            </div>
          );
        })}

        {user.address ? (
          <div className="sm:col-span-2 flex items-center gap-3 rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 shadow-card">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text-secondary)]">
                العنوان التفصيلي
              </div>
              <div className="text-sm font-extrabold text-[var(--text-primary)]">
                {user.address}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Subscribed Services */}
      <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="h-5 w-5 text-[var(--brand-primary)]" />
            <span>الخدمات التي يقدمها المكتب ({services.length})</span>
          </h2>
          <Link
            href="/dashboard/services"
            className="text-xs font-bold text-[var(--brand-primary)] hover:underline"
          >
            إدارة الاشتراكات
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
          </div>
        ) : services.length === 0 ? (
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            لم يشترك المكتب في أي خدمة حتى الآن.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-[var(--brand-primary-soft)] px-3.5 py-1.5 text-xs font-extrabold text-[var(--brand-primary)]"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <AppButton
          variant="danger"
          size="md"
          onClick={logout}
          icon={<LogOut className="h-4 w-4" />}
        >
          تسجيل الخروج من بوابة المكتب
        </AppButton>
      </div>
    </div>
  );
}
