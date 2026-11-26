'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  FileSpreadsheet,
  Loader2,
  MapPin,
  Plus,
  Search,
  Send,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { TripStatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/context/auth-context';
import { ApiError, servicesApi, tripsApi } from '@/lib/api';
import type { ServiceItem, TripItem, TripStatus } from '@/lib/types';

const STATUS_TABS: { value: 'ALL' | TripStatus; label: string }[] = [
  { value: 'ALL', label: 'الكل' },
  { value: 'UPCOMING', label: 'قادمة ومتاحة' },
  { value: 'DRAFT', label: 'مسودات' },
  { value: 'STARTED', label: 'بدأت' },
  { value: 'COMPLETED', label: 'مكتملة' },
  { value: 'CANCELLED', label: 'ملغية' },
];

export default function OfficeTripsPage() {
  const { token } = useAuth();

  const [trips, setTrips] = useState<TripItem[]>([]);
  const [myServices, setMyServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'ALL' | TripStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyTripId, setBusyTripId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [tripsData, servicesData] = await Promise.all([
        tripsApi.getMyTrips(token),
        servicesApi.getMyServices(token),
      ]);
      setTrips(Array.isArray(tripsData) ? tripsData : []);
      setMyServices(Array.isArray(servicesData) ? servicesData : []);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تحميل الرحلات.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const run = async () => {
      try {
        const [tripsData, servicesData] = await Promise.all([
          tripsApi.getMyTrips(token),
          servicesApi.getMyServices(token),
        ]);
        if (!active) return;
        setTrips(Array.isArray(tripsData) ? tripsData : []);
        setMyServices(Array.isArray(servicesData) ? servicesData : []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'تعذر تحميل الرحلات.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [token]);

  const filteredTrips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return trips.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.tripNumber.toLowerCase().includes(q) ||
        t.route.toLowerCase().includes(q) ||
        t.fromCity.toLowerCase().includes(q) ||
        t.toCity.toLowerCase().includes(q) ||
        (t.driverName || '').toLowerCase().includes(q)
      );
    });
  }, [trips, statusFilter, searchQuery]);

  const handlePublish = async (trip: TripItem) => {
    if (!token) return;
    setBusyTripId(trip.id);
    setError(null);
    setFeedback(null);
    try {
      const res = await tripsApi.publishDraft(token, trip.id);
      setFeedback(res.message);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر نشر الرحلة.');
    } finally {
      setBusyTripId(null);
    }
  };

  const handleDelete = async (trip: TripItem) => {
    if (!token) return;
    if (!window.confirm(`هل أنت متأكد من حذف الرحلة رقم #${trip.tripNumber}؟`)) {
      return;
    }
    setBusyTripId(trip.id);
    setError(null);
    setFeedback(null);
    try {
      const res = await tripsApi.remove(token, trip.id);
      setFeedback(res.message);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر حذف الرحلة.');
    } finally {
      setBusyTripId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Bus className="h-5 w-5 text-[var(--brand-primary)]" />
            <span>إدارة رحلات المكتب</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mt-1">
            أنشئ رحلات جديدة، حدّث المقاعد والأسعار، وتابع حالة كل رحلة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/trips/import">
            <AppButton
              variant="secondary"
              size="md"
              icon={<FileSpreadsheet className="h-4 w-4 text-[var(--brand-primary)]" />}
            >
              استيراد إكسل والمسودات
            </AppButton>
          </Link>
          <Link href="/dashboard/trips/new">
            <AppButton size="md" icon={<Plus className="h-4 w-4" />}>
              إضافة رحلة جديدة
            </AppButton>
          </Link>
        </div>
      </div>

      {myServices.length === 0 && !loading ? (
        <div
          style={{ backgroundColor: 'var(--tint-amber-bg)', color: 'var(--tint-amber)' }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[16px] px-4 py-3 text-sm font-bold"
        >
          <span>
            تنبيه: مكتبك غير مشترك في أي خدمة حالياً. اشترك في خدمة أولاً لتتمكن من إضافة الرحلات.
          </span>
          <Link
            href="/dashboard/services"
            className="underline font-extrabold whitespace-nowrap"
          >
            الانتقال لاشتراكات الخدمات
          </Link>
        </div>
      ) : null}

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

      {/* Search & Status Tabs */}
      <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 shadow-card flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-[14px] bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] px-3 py-2.5">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="ابحث برقم الرحلة، المسار، مدينة الانطلاق/الوصول أو اسم السائق..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            const count =
              tab.value === 'ALL'
                ? trips.length
                : trips.filter((t) => t.status === tab.value).length;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-[var(--brand-primary)] text-white shadow-button'
                    : 'bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Trips Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-12 text-center shadow-card flex flex-col items-center gap-3">
          <Bus className="h-10 w-10 text-[var(--brand-primary)]" />
          <p className="text-base font-extrabold text-[var(--text-primary)]">
            لا توجد رحلات مطابقة
          </p>
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            أضف رحلة جديدة يدوياً أو استورد جدول رحلات عبر إكسل.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrips.map((trip) => {
            const hasDiscount =
              trip.discountedPrice !== null &&
              trip.discountedPrice !== undefined &&
              Number(trip.discountedPrice) < Number(trip.originalPrice);
            const finalPrice = hasDiscount
              ? Number(trip.discountedPrice)
              : Number(trip.originalPrice);
            const busy = busyTripId === trip.id;

            return (
              <div
                key={trip.id}
                className="overflow-hidden rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-card flex flex-col justify-between hover:border-[var(--brand-primary)]/60 transition"
              >
                <Link
                  href={`/dashboard/trips/${trip.id}`}
                  className="relative h-40 bg-[var(--brand-primary-soft)] block"
                >
                  {trip.vehicleImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={trip.vehicleImage}
                      alt={trip.vehicleType || trip.route}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--brand-primary)]">
                      <Bus className="h-12 w-12" />
                    </div>
                  )}

                  <div className="absolute top-3 right-3">
                    <TripStatusBadge status={trip.status} />
                  </div>

                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-[#164C92] px-3 py-1 text-xs font-extrabold text-white shadow-button">
                    <span>
                      {finalPrice} {trip.currency}
                    </span>
                    {hasDiscount ? (
                      <span className="line-through text-white/70 text-[11px]">
                        {Number(trip.originalPrice)}
                      </span>
                    ) : null}
                  </div>
                </Link>

                <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/dashboard/trips/${trip.id}`}
                        className="rounded-full bg-[var(--brand-primary-soft)] px-2.5 py-0.5 text-xs font-extrabold text-[var(--brand-primary)] hover:opacity-80"
                      >
                        #{trip.tripNumber}
                      </Link>
                      <div className="flex items-center gap-1 text-xs font-bold text-[#F59E0B]">
                        <Star className="h-3.5 w-3.5 fill-[#F59E0B]" />
                        <span>{Number(trip.rating || 5).toFixed(1)}</span>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/trips/${trip.id}`}
                      className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-1.5 hover:text-[var(--brand-primary)] transition"
                    >
                      <MapPin className="h-4 w-4 text-[var(--brand-primary)] shrink-0" />
                      <span className="truncate">{trip.route}</span>
                    </Link>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                        {trip.departureDate}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                        {trip.departureTime}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                        {trip.availableSeats} / {trip.totalSeats} متاح
                      </span>
                    </div>

                    {trip.service?.name || trip.driverName || trip.vehicleType ? (
                      <div className="text-xs font-medium text-[var(--text-muted)]">
                        {[trip.service?.name, trip.driverName, trip.vehicleType]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border-color)]">
                    {trip.status === 'DRAFT' ? (
                      <AppButton
                        size="sm"
                        variant="success"
                        loading={busy}
                        onClick={() => handlePublish(trip)}
                        icon={<Send className="h-3.5 w-3.5" />}
                      >
                        اعتماد ونشر
                      </AppButton>
                    ) : null}

                    <Link href={`/dashboard/trips/${trip.id}`}>
                      <AppButton
                        size="sm"
                        variant="secondary"
                        icon={<Edit3 className="h-3.5 w-3.5 text-[var(--brand-primary)]" />}
                      >
                        تعديل وتفاصيل
                      </AppButton>
                    </Link>

                    <AppButton
                      size="sm"
                      variant="secondary"
                      loading={busy}
                      onClick={() => handleDelete(trip)}
                      icon={<Trash2 className="h-3.5 w-3.5 text-[#DC2626]" />}
                      className="!text-[#DC2626]"
                    >
                      حذف
                    </AppButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
