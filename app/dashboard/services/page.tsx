'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bus,
  Car,
  CheckCircle2,
  Compass,
  KeyRound,
  Layers,
  Loader2,
  LogOut,
  Package,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { useAuth } from '@/context/auth-context';
import { ApiError, servicesApi } from '@/lib/api';
import type { AuthUser, ServiceItem } from '@/lib/types';

function renderServiceIcon(icon?: string | null) {
  switch (icon) {
    case 'car-share':
      return <Users className="h-6 w-6" />;
    case 'car-vip':
      return <Car className="h-6 w-6" />;
    case 'package-delivery':
      return <Package className="h-6 w-6" />;
    case 'bus-tourism':
      return <Compass className="h-6 w-6" />;
    case 'van-rental':
      return <KeyRound className="h-6 w-6" />;
    case 'bus-international':
    default:
      return <Bus className="h-6 w-6" />;
  }
}

export default function OfficeServicesPage() {
  const { token } = useAuth();
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);
  const [myServices, setMyServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [officesModal, setOfficesModal] = useState<{
    service: ServiceItem;
    offices: AuthUser[];
    loading: boolean;
  } | null>(null);

  const loadServices = useCallback(async () => {
    if (!token) return;
    try {
      const [all, mine] = await Promise.all([
        servicesApi.getAll(),
        servicesApi.getMyServices(token),
      ]);
      setAllServices(Array.isArray(all) ? all : []);
      setMyServices(Array.isArray(mine) ? mine : []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'تعذر تحميل قائمة الخدمات.'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const run = async () => {
      try {
        const [all, mine] = await Promise.all([
          servicesApi.getAll(),
          servicesApi.getMyServices(token),
        ]);
        if (!active) return;
        setAllServices(Array.isArray(all) ? all : []);
        setMyServices(Array.isArray(mine) ? mine : []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof ApiError ? err.message : 'تعذر تحميل قائمة الخدمات.'
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [token]);

  const myServiceIds = useMemo(
    () => new Set(myServices.map((s) => s.id)),
    [myServices]
  );

  const handleJoin = async (service: ServiceItem) => {
    if (!token) return;
    setBusyId(service.id);
    setError(null);
    setFeedback(null);
    try {
      const res = await servicesApi.joinService(token, service.id);
      setFeedback(res.message);
      await loadServices();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'تعذر الاشتراك في الخدمة.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleLeave = async (service: ServiceItem) => {
    if (!token) return;
    setBusyId(service.id);
    setError(null);
    setFeedback(null);
    try {
      const res = await servicesApi.leaveService(token, service.id);
      setFeedback(res.message);
      await loadServices();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'تعذر إلغاء الاشتراك من الخدمة.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const openServiceOffices = async (service: ServiceItem) => {
    setOfficesModal({ service, offices: [], loading: true });
    try {
      const list = await servicesApi.getOfficesByService(service.id);
      setOfficesModal({
        service,
        offices: Array.isArray(list) ? list : [],
        loading: false,
      });
    } catch {
      setOfficesModal({ service, offices: [], loading: false });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="h-5 w-5 text-[var(--brand-primary)]" />
            <span>الخدمات واشتراكات المكتب</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mt-1">
            اختر الخدمات التي يقدمها مكتبك لتتمكن من إنشاء الرحلات والظهور للعملاء في تطبيق الحجوزات.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full bg-[var(--brand-primary-soft)] px-4 py-2 text-xs font-extrabold text-[var(--brand-primary)]">
          <span>الخدمات المشترك بها:</span>
          <span>{myServices.length}</span>
        </div>
      </div>

      {error ? (
        <div
          style={{ backgroundColor: 'var(--tint-red-bg)', color: 'var(--tint-red)' }}
          className="flex items-center gap-2 rounded-[14px] px-4 py-3 text-sm font-bold"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {feedback ? (
        <div
          style={{ backgroundColor: 'var(--tint-green-bg)', color: 'var(--tint-green)' }}
          className="flex items-center gap-2 rounded-[14px] px-4 py-3 text-sm font-bold"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{feedback}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      ) : allServices.length === 0 ? (
        <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-10 text-center shadow-card">
          <p className="text-sm font-bold text-[var(--text-secondary)]">
            لا توجد خدمات متاحة في النظام حالياً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allServices.map((service) => {
            const subscribed = myServiceIds.has(service.id);
            const busy = busyId === service.id;

            return (
              <div
                key={service.id}
                className={`relative flex flex-col justify-between gap-4 rounded-[20px] bg-[var(--bg-surface)] p-5 shadow-card transition-all ${
                  subscribed
                    ? 'border-[1.5px] border-[var(--brand-primary)]'
                    : 'border border-[var(--border-color)]'
                }`}
              >
                {subscribed ? (
                  <span className="absolute -top-3 left-5 rounded-full bg-[var(--brand-primary)] px-3 py-0.5 text-[11px] font-bold text-white shadow-button">
                    مشترك حالياً ✓
                  </span>
                ) : null}

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                      {renderServiceIcon(service.icon)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                        {service.name}
                      </h2>
                      <button
                        type="button"
                        onClick={() => openServiceOffices(service)}
                        className="text-xs font-bold text-[var(--brand-primary)] hover:underline cursor-pointer mt-0.5"
                      >
                        استعراض المكاتب المقدمة للخدمة
                      </button>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed font-medium text-[var(--text-secondary)]">
                    {service.description || 'خدمة نقل وحجز معتمدة عبر المنصة.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border-color)]">
                  {subscribed ? (
                    <AppButton
                      variant="secondary"
                      size="md"
                      loading={busy}
                      onClick={() => handleLeave(service)}
                      icon={<LogOut className="h-4 w-4 text-[#DC2626]" />}
                      className="w-full !text-[#DC2626]"
                    >
                      إلغاء تقديم الخدمة
                    </AppButton>
                  ) : (
                    <AppButton
                      variant="primary"
                      size="md"
                      loading={busy}
                      onClick={() => handleJoin(service)}
                      icon={<Plus className="h-4 w-4" />}
                      className="w-full"
                    >
                      الاشتراك وتقديم الخدمة
                    </AppButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Offices Modal */}
      {officesModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                المكاتب المقدمة لخدمة: {officesModal.service.name}
              </h3>
              <button
                type="button"
                onClick={() => setOfficesModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {officesModal.loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
              </div>
            ) : officesModal.offices.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-[var(--text-secondary)]">
                لا توجد مكاتب مسجلة ومفعلة في هذه الخدمة حالياً.
              </p>
            ) : (
              <div className="overflow-y-auto space-y-2.5">
                {officesModal.offices.map((off) => (
                  <div
                    key={off.id}
                    className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] p-3"
                  >
                    <div className="text-sm font-extrabold text-[var(--text-primary)]">
                      {off.officeName || off.fullName}
                    </div>
                    <div className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
                      {off.city ? `${off.city} • ` : ''}
                      <span dir="ltr">{off.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
