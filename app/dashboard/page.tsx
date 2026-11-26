'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Layers,
  Loader2,
  MapPin,
  PlusCircle,
  ReceiptText,
  RefreshCw,
} from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { BookingStatusBadge, TripStatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/context/auth-context';
import { ApiError, bookingsApi, servicesApi, tripsApi } from '@/lib/api';
import type { BookingItem, ServiceItem, TripItem } from '@/lib/types';

export default function OfficeDashboardPage() {
  const { token, user } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [drafts, setDrafts] = useState<TripItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!token) return;
    try {
      const [myServices, myTrips, myDrafts, officeBookings] = await Promise.all([
        servicesApi.getMyServices(token),
        tripsApi.getMyTrips(token),
        tripsApi.getMyDrafts(token),
        bookingsApi.getOfficeBookings(token),
      ]);
      setServices(Array.isArray(myServices) ? myServices : []);
      setTrips(Array.isArray(myTrips) ? myTrips : []);
      setDrafts(Array.isArray(myDrafts) ? myDrafts : []);
      setBookings(Array.isArray(officeBookings) ? officeBookings : []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'تعذر تحميل بيانات لوحة التحكم.'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadOverview = () => {
    setLoading(true);
    void fetchOverview();
  };

  useEffect(() => {
    if (!token) return;
    let active = true;
    const run = async () => {
      try {
        const [myServices, myTrips, myDrafts, officeBookings] = await Promise.all([
          servicesApi.getMyServices(token),
          tripsApi.getMyTrips(token),
          tripsApi.getMyDrafts(token),
          bookingsApi.getOfficeBookings(token),
        ]);
        if (!active) return;
        setServices(Array.isArray(myServices) ? myServices : []);
        setTrips(Array.isArray(myTrips) ? myTrips : []);
        setDrafts(Array.isArray(myDrafts) ? myDrafts : []);
        setBookings(Array.isArray(officeBookings) ? officeBookings : []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof ApiError
            ? err.message
            : 'تعذر تحميل بيانات لوحة التحكم.'
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

  const stats = useMemo(() => {
    const pendingReview = bookings.filter(
      (b) => b.status === 'PAYMENT_UNDER_REVIEW'
    );
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED');
    const confirmedRevenue = confirmed.reduce(
      (acc, b) => acc + Number(b.totalAmount || 0),
      0
    );
    const upcomingTrips = trips.filter((t) => t.status === 'UPCOMING');
    return {
      pendingReview,
      confirmed,
      confirmedRevenue,
      upcomingTrips,
    };
  }, [bookings, trips]);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero Promo Card matching reservation-app */}
      <section className="hero-gradient relative overflow-hidden rounded-[20px] p-6 text-white shadow-button">
        <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-blue-300/15" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
              <span>لوحة عمليات المكتب</span>
              {user?.commercialRegistration ? (
                <span className="opacity-85">
                  • سجل رقم {user.commercialRegistration}
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl font-extrabold">
              {user?.officeName || user?.fullName}
            </h1>
            <p className="text-sm text-white/85 max-w-2xl">
              تابع حجوزات العملاء، راجع سندات التحويل والفواتير المرفقة، وأنشئ أو استورد رحلاتك عبر ملفات إكسل بسهولة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/dashboard/trips/new">
              <AppButton
                variant="secondary"
                size="md"
                icon={<PlusCircle className="h-4 w-4 text-[#164C92]" />}
                className="!bg-white !text-[#164C92] !border-0"
              >
                إضافة رحلة يدوياً
              </AppButton>
            </Link>
            <Link href="/dashboard/trips/import">
              <AppButton
                variant="ghost"
                size="md"
                icon={<FileSpreadsheet className="h-4 w-4" />}
                className="!bg-white/15 !text-white hover:!bg-white/25"
              >
                استيراد إكسل ({drafts.length} مسودة)
              </AppButton>
            </Link>
            <button
              type="button"
              onClick={loadOverview}
              aria-label="تحديث البيانات"
              className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/15 text-white hover:bg-white/25 transition cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div
          style={{ backgroundColor: 'var(--tint-red-bg)', color: 'var(--tint-red)' }}
          className="flex items-center gap-2 rounded-[14px] px-4 py-3 text-sm font-bold"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      ) : (
        <>
          {/* 4 KPI Cards using exact design system tint palettes */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Link
              href="/dashboard/trips"
              className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card hover:border-[var(--brand-primary)] transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  إجمالي رحلات المكتب
                </span>
                <div
                  style={{
                    backgroundColor: 'var(--tint-blue-bg)',
                    color: 'var(--tint-blue)',
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                >
                  <Bus className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-[var(--text-primary)]">
                {trips.length}
              </div>
              <div className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                {stats.upcomingTrips.length} قادمة • {drafts.length} مسودة
              </div>
            </Link>

            <Link
              href="/dashboard/bookings?status=PAYMENT_UNDER_REVIEW"
              className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card hover:border-[var(--brand-primary)] transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  فواتير بانتظار المراجعة
                </span>
                <div
                  style={{
                    backgroundColor: 'var(--tint-cyan-bg)',
                    color: 'var(--tint-cyan)',
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                >
                  <ReceiptText className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-[var(--text-primary)]">
                {stats.pendingReview.length}
              </div>
              <div className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                من أصل {bookings.length} إجمالي الحجوزات
              </div>
            </Link>

            <Link
              href="/dashboard/bookings?status=CONFIRMED"
              className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card hover:border-[var(--brand-primary)] transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  الحجوزات المؤكدة
                </span>
                <div
                  style={{
                    backgroundColor: 'var(--tint-green-bg)',
                    color: 'var(--tint-green)',
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                >
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-[var(--text-primary)]">
                {stats.confirmed.length}
              </div>
              <div className="mt-1 text-xs font-semibold text-[#16A34A]">
                إيرادات مؤكدة: {stats.confirmedRevenue.toLocaleString('en-US')} SAR
              </div>
            </Link>

            <Link
              href="/dashboard/services"
              className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card hover:border-[var(--brand-primary)] transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  الخدمات المشترك بها
                </span>
                <div
                  style={{
                    backgroundColor: 'var(--tint-purple-bg)',
                    color: 'var(--tint-purple)',
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                >
                  <Layers className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-[var(--text-primary)]">
                {services.length}
              </div>
              <div className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                {services.length === 0
                  ? 'اشترك بخدمة للبدء بإضافة الرحلات'
                  : services.map((s) => s.name).slice(0, 2).join('، ')}
              </div>
            </Link>
          </section>

          {/* Two Column Actionable Lists */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Bookings Under Review */}
            <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-[var(--brand-primary)]" />
                  <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                    أحدث الحجوزات والفواتير
                  </h2>
                </div>
                <Link
                  href="/dashboard/bookings"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-primary)] hover:underline"
                >
                  <span>عرض الكل</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </div>

              {bookings.length === 0 ? (
                <div className="rounded-[16px] bg-[var(--bg-surface-secondary)] p-8 text-center text-sm font-semibold text-[var(--text-secondary)]">
                  لا توجد حجوزات مسجلة على رحلات مكتبك حتى الآن.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {bookings.slice(0, 4).map((b) => (
                    <Link
                      key={b.id}
                      href={`/dashboard/bookings?focus=${b.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] p-3.5 hover:border-[var(--brand-primary)] transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[var(--text-primary)]">
                            {b.bookingNumber}
                          </span>
                          <BookingStatusBadge status={b.status} />
                        </div>
                        <div className="text-xs font-medium text-[var(--text-secondary)]">
                          العميل: {b.user?.fullName || 'غير محدد'} •{' '}
                          {b.seatsCount} مقعد •{' '}
                          {b.trip
                            ? `${b.trip.fromCity} ➔ ${b.trip.toCity}`
                            : ''}
                        </div>
                      </div>

                      <div className="text-left sm:text-end shrink-0">
                        <div className="text-sm font-extrabold text-[var(--brand-primary)]">
                          {Number(b.totalAmount)} {b.currency}
                        </div>
                        {b.invoiceNumber ? (
                          <div className="text-[11px] font-mono text-[var(--text-muted)]">
                            #{b.invoiceNumber}
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming / Recent Trips */}
            <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bus className="h-5 w-5 text-[var(--brand-primary)]" />
                  <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                    أحدث رحلات المكتب
                  </h2>
                </div>
                <Link
                  href="/dashboard/trips"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-primary)] hover:underline"
                >
                  <span>إدارة الرحلات</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </div>

              {trips.length === 0 ? (
                <div className="rounded-[16px] bg-[var(--bg-surface-secondary)] p-8 text-center flex flex-col items-center gap-3">
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">
                    لم تقم بإضافة أي رحلات بعد.
                  </p>
                  <Link href="/dashboard/trips/new">
                    <AppButton size="sm">إنشاء أول رحلة</AppButton>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {trips.slice(0, 4).map((t) => {
                    const price = Number(t.discountedPrice || t.originalPrice);
                    return (
                      <Link
                        key={t.id}
                        href={`/dashboard/trips/${t.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] p-3.5 hover:border-[var(--brand-primary)] transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-[var(--text-primary)]">
                              #{t.tripNumber}
                            </span>
                            <TripStatusBadge status={t.status} />
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[var(--text-secondary)]">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                              {t.route}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                              {t.departureDate}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                              {t.departureTime}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-1">
                          <span className="text-sm font-extrabold text-[var(--brand-primary)]">
                            {price} {t.currency}
                          </span>
                          <span className="text-xs font-semibold text-[var(--text-secondary)]">
                            {t.availableSeats} / {t.totalSeats} مقعد متاح
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
