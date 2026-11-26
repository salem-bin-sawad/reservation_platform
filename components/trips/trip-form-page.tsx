'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileEdit,
  FileText,
  Image as ImageIcon,
  Layers,
  MapPin,
  Navigation,
  PlayCircle,
  Save,
  Send,
  Tag,
  Trash2,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { TripStatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/context/auth-context';
import { ApiError, tripsApi } from '@/lib/api';
import type {
  CreateTripPayload,
  ServiceItem,
  TripItem,
  TripStatus,
} from '@/lib/types';

interface StatusStepConfig {
  value: TripStatus;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  color: string;
  ring: string;
}

const TRIP_STATUS_STEPS: StatusStepConfig[] = [
  {
    value: 'DRAFT',
    label: 'مسودة',
    shortDesc: 'محفوظة للمراجعة ولا تظهر للعملاء بعد',
    icon: FileEdit,
    bg: 'var(--tint-amber-bg)',
    color: 'var(--tint-amber)',
    ring: '#D97706',
  },
  {
    value: 'UPCOMING',
    label: 'قادمة ومتاحة',
    shortDesc: 'منشورة للجمهور ومتاحة لاستقبال الحجوزات',
    icon: Calendar,
    bg: 'var(--tint-blue-bg)',
    color: 'var(--tint-blue)',
    ring: '#164C92',
  },
  {
    value: 'STARTED',
    label: 'الرحلة بدأت',
    shortDesc: 'المركبة انطلقت في المسار المحدد',
    icon: PlayCircle,
    bg: 'var(--tint-purple-bg)',
    color: 'var(--tint-purple)',
    ring: '#8B5CF6',
  },
  {
    value: 'COMPLETED',
    label: 'مكتملة',
    shortDesc: 'وصلت الرحلة لوجهتها وانتهت بنجاح',
    icon: CheckCircle2,
    bg: 'var(--tint-green-bg)',
    color: 'var(--tint-green)',
    ring: '#16A34A',
  },
  {
    value: 'CANCELLED',
    label: 'ملغية',
    shortDesc: 'تم إلغاء الرحلة وإيقاف الحجز عليها',
    icon: XCircle,
    bg: 'var(--tint-red-bg)',
    color: 'var(--tint-red)',
    ring: '#DC2626',
  },
];

interface TripFormPageProps {
  mode: 'create' | 'edit';
  initialTrip?: TripItem | null;
  myServices: ServiceItem[];
  onTripUpdated?: (trip: TripItem) => void;
}

export function TripFormPage({
  mode,
  initialTrip,
  myServices,
  onTripUpdated,
}: TripFormPageProps) {
  const router = useRouter();
  const { token } = useAuth();

  const [serviceId, setServiceId] = useState(
    initialTrip?.serviceId || myServices[0]?.id || ''
  );
  const [fromCity, setFromCity] = useState(initialTrip?.fromCity || '');
  const [toCity, setToCity] = useState(initialTrip?.toCity || '');
  const [route, setRoute] = useState(initialTrip?.route || '');
  const [departureDate, setDepartureDate] = useState(
    () =>
      initialTrip?.departureDate ||
      new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [departureTime, setDepartureTime] = useState(
    initialTrip?.departureTime?.slice(0, 5) || '08:00'
  );
  const [originalPrice, setOriginalPrice] = useState(
    initialTrip ? String(initialTrip.originalPrice ?? '') : ''
  );
  const [discountedPrice, setDiscountedPrice] = useState(
    initialTrip?.discountedPrice !== null &&
      initialTrip?.discountedPrice !== undefined
      ? String(initialTrip.discountedPrice)
      : ''
  );
  const [currency, setCurrency] = useState(initialTrip?.currency || 'SAR');
  const [totalSeats, setTotalSeats] = useState(
    initialTrip ? String(initialTrip.totalSeats ?? 50) : '50'
  );
  const [availableSeats, setAvailableSeats] = useState(
    initialTrip ? String(initialTrip.availableSeats ?? 50) : '50'
  );
  const [status, setStatus] = useState<TripStatus>(
    initialTrip?.status || 'UPCOMING'
  );
  const [driverName, setDriverName] = useState(initialTrip?.driverName || '');
  const [vehicleType, setVehicleType] = useState(
    initialTrip?.vehicleType || ''
  );
  const [vehicleImage, setVehicleImage] = useState(
    initialTrip?.vehicleImage || ''
  );
  const [notes, setNotes] = useState(initialTrip?.notes || '');

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeStatusMeta =
    TRIP_STATUS_STEPS.find((s) => s.value === status) || TRIP_STATUS_STEPS[1];

  const totalSeatsNum = Math.max(1, Number(totalSeats) || 1);
  const availSeatsNum = Math.max(
    0,
    Math.min(totalSeatsNum, Number(availableSeats) || 0)
  );
  const bookedSeatsNum = Math.max(0, totalSeatsNum - availSeatsNum);
  const occupancyPct = Math.round((bookedSeatsNum / totalSeatsNum) * 100);

  const origPriceNum = Number(originalPrice) || 0;
  const discPriceNum = Number(discountedPrice) || 0;
  const hasDiscount =
    discountedPrice !== '' && discPriceNum > 0 && discPriceNum < origPriceNum;
  const displayPrice = hasDiscount ? discPriceNum : origPriceNum;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setFeedback(null);

    if (mode === 'create' && !serviceId) {
      setError('يجب اختيار خدمة مشترك بها المكتب قبل إنشاء الرحلة.');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        const payload: CreateTripPayload = {
          serviceId,
          fromCity: fromCity.trim(),
          toCity: toCity.trim(),
          route: route.trim() || `${fromCity.trim()} - ${toCity.trim()}`,
          departureDate,
          departureTime,
          originalPrice: Number(originalPrice),
          currency: currency.trim() || 'SAR',
          totalSeats: Number(totalSeats),
          availableSeats:
            availableSeats !== '' ? Number(availableSeats) : Number(totalSeats),
          status,
        };
        if (discountedPrice !== '') {
          payload.discountedPrice = Number(discountedPrice);
        }
        if (driverName.trim()) payload.driverName = driverName.trim();
        if (vehicleType.trim()) payload.vehicleType = vehicleType.trim();
        if (vehicleImage.trim()) payload.vehicleImage = vehicleImage.trim();
        if (notes.trim()) payload.notes = notes.trim();

        const created = await tripsApi.create(token, payload);
        router.replace(`/dashboard/trips/${created.id}`);
      } else if (initialTrip) {
        const updated = await tripsApi.update(token, initialTrip.id, {
          fromCity: fromCity.trim(),
          toCity: toCity.trim(),
          route: route.trim(),
          departureDate,
          departureTime,
          originalPrice: Number(originalPrice),
          discountedPrice:
            discountedPrice !== '' ? Number(discountedPrice) : undefined,
          totalSeats: Number(totalSeats),
          availableSeats: Number(availableSeats),
          status,
          driverName: driverName.trim() || undefined,
          vehicleType: vehicleType.trim() || undefined,
          vehicleImage: vehicleImage.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        setFeedback(`تم حفظ تعديلات الرحلة #${updated.tripNumber} بنجاح.`);
        onTripUpdated?.(updated);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'تعذر حفظ بيانات الرحلة.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!token || !initialTrip) return;
    setPublishing(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await tripsApi.publishDraft(token, initialTrip.id);
      setStatus(res.trip.status);
      setFeedback(res.message);
      onTripUpdated?.(res.trip);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر نشر الرحلة.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !initialTrip) return;
    if (
      !window.confirm(`هل أنت متأكد من حذف الرحلة رقم #${initialTrip.tripNumber}؟`)
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await tripsApi.remove(token, initialTrip.id);
      router.replace('/dashboard/trips');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر حذف الرحلة.');
      setDeleting(false);
    }
  };

  const inputCls =
    'h-11 w-full rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] px-3.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-focused)] focus:outline-none transition';

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      {/* Page Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/trips"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-card hover:border-[var(--brand-primary)] transition"
            aria-label="العودة للرحلات"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-[var(--text-primary)]">
                {mode === 'create'
                  ? 'إنشاء رحلة جديدة'
                  : `إدارة وتعديل الرحلة #${initialTrip?.tripNumber}`}
              </h1>
              <TripStatusBadge status={status} />
            </div>
            <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mt-0.5">
              {mode === 'create'
                ? 'أدخل تفاصيل المسار، التوقيت، الأسعار، والمقاعد ثم اختر حالة النشر.'
                : 'عدّل بيانات الرحلة وتابع حالة التشغيل والمقاعد المتاحة مباشرة.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode === 'edit' && status === 'DRAFT' ? (
            <AppButton
              type="button"
              variant="success"
              size="md"
              loading={publishing}
              onClick={handlePublish}
              icon={<Send className="h-4 w-4" />}
            >
              اعتماد ونشر الرحلة
            </AppButton>
          ) : null}

          {mode === 'edit' && initialTrip ? (
            <AppButton
              type="button"
              variant="secondary"
              size="md"
              loading={deleting}
              onClick={handleDelete}
              icon={<Trash2 className="h-4 w-4 text-[#DC2626]" />}
              className="!text-[#DC2626]"
            >
              حذف الرحلة
            </AppButton>
          ) : null}

          <AppButton
            type="submit"
            size="md"
            loading={saving}
            icon={<Save className="h-4 w-4" />}
          >
            {mode === 'create' ? 'حفظ وإنشاء الرحلة' : 'حفظ التعديلات'}
          </AppButton>
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

      {/* Visual Trip Status Bar */}
      <section className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-sm font-extrabold text-[var(--text-primary)]">
            شريط حالة الرحلة (Status Bar)
          </div>
          <div
            style={{
              backgroundColor: activeStatusMeta.bg,
              color: activeStatusMeta.color,
            }}
            className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-bold"
          >
            <span>الحالة المحددة: {activeStatusMeta.label}</span>
            <span className="opacity-80">— {activeStatusMeta.shortDesc}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {TRIP_STATUS_STEPS.map((step, index) => {
            const Icon = step.icon;
            const active = status === step.value;
            return (
              <button
                key={step.value}
                type="button"
                onClick={() => setStatus(step.value)}
                style={
                  active
                    ? {
                        backgroundColor: step.bg,
                        borderColor: step.ring,
                        color: step.color,
                      }
                    : undefined
                }
                className={`relative flex flex-col items-start gap-2 rounded-[16px] border p-3.5 text-right transition cursor-pointer ${
                  active
                    ? 'border-2 shadow-card'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)]/50'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    style={
                      active
                        ? { backgroundColor: step.ring, color: '#FFFFFF' }
                        : undefined
                    }
                    className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${
                      active
                        ? ''
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-extrabold opacity-70">
                    0{index + 1}
                  </span>
                </div>

                <div>
                  <div
                    className={`text-xs font-extrabold ${
                      active ? '' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] font-medium opacity-80 mt-0.5 line-clamp-2">
                    {step.shortDesc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Distributed Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        {/* Left/Right 2-col Form Sections */}
        <div className="xl:col-span-2 flex flex-col gap-5">
          {/* Card 1: Route & Schedule */}
          <section className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-color)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                  المسار والتوقيت والخدمة
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  بيانات مدن الانطلاق والوصول وموعد التحرك
                </p>
              </div>
            </div>

            {mode === 'create' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  <span>الخدمة التابعة لها الرحلة *</span>
                </label>
                <select
                  required
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">اختر الخدمة</option>
                  {myServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {myServices.length === 0 ? (
                  <p className="text-xs font-bold text-[#D97706]">
                    يجب الاشتراك في خدمة أولاً من صفحة{' '}
                    <Link href="/dashboard/services" className="underline">
                      الخدمات والاشتراكات
                    </Link>
                    .
                  </p>
                ) : null}
              </div>
            ) : initialTrip?.service ? (
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-[var(--brand-primary-soft)] px-3.5 py-1.5 text-xs font-extrabold text-[var(--brand-primary)]">
                <Layers className="h-3.5 w-3.5" />
                <span>الخدمة: {initialTrip.service.name}</span>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  مدينة الانطلاق *
                </label>
                <input
                  required
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  placeholder="أدخل مدينة الانطلاق"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  مدينة الوصول *
                </label>
                <input
                  required
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  placeholder="أدخل مدينة الوصول"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                <span>المسار الكامل ومحطات التوقف *</span>
              </label>
              <input
                required
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="مثال: مدينة الانطلاق - محطة التوقف - مدينة الوصول"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  <span>تاريخ المغادرة *</span>
                </label>
                <input
                  required
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  <span>وقت المغادرة (24 ساعة) *</span>
                </label>
                <input
                  required
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* Card 2: Pricing & Seats */}
          <section className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-color)]">
              <div
                style={{
                  backgroundColor: 'var(--tint-green-bg)',
                  color: 'var(--tint-green)',
                }}
                className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              >
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                  التسعير والمقاعد
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  تحديد سعر التذكرة والخصم وسعة المقاعد المتاحة
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  السعر الأساسي *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  السعر بعد الخصم (اختياري)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountedPrice}
                  onChange={(e) => setDiscountedPrice(e.target.value)}
                  placeholder="اختياري"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  العملة
                </label>
                <input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="SAR"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  <span>إجمالي المقاعد *</span>
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  المقاعد المتاحة للحجز
                </label>
                <input
                  type="number"
                  min="0"
                  value={availableSeats}
                  onChange={(e) => setAvailableSeats(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* Card 3: Vehicle, Driver & Notes */}
          <section className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-color)]">
              <div
                style={{
                  backgroundColor: 'var(--tint-purple-bg)',
                  color: 'var(--tint-purple)',
                }}
                className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              >
                <Bus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                  المركبة والسائق والملاحظات
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  تفاصيل المركبة وصورتها وتعليمات الحجز للعملاء
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  <span>اسم السائق</span>
                </label>
                <input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="أدخل اسم السائق"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  نوع وطراز المركبة
                </label>
                <input
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  placeholder="أدخل طراز المركبة"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                <span>رابط صورة المركبة (اختياري)</span>
              </label>
              <input
                value={vehicleImage}
                onChange={(e) => setVehicleImage(e.target.value)}
                placeholder="https://..."
                dir="ltr"
                className={`${inputCls} text-right`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                <span>ملاحظات وتعليمات الحجز</span>
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أدخل أي ملاحظات أو شروط للرحلة..."
                className="w-full rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] p-3.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-focused)] focus:outline-none transition"
              />
            </div>
          </section>
        </div>

        {/* Right Summary & Preview Column */}
        <aside className="flex flex-col gap-5 xl:sticky xl:top-20">
          {/* Live Card Preview */}
          <div className="overflow-hidden rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-card">
            <div className="relative h-44 bg-[var(--brand-primary-soft)]">
              {vehicleImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vehicleImage}
                  alt={vehicleType || route || 'صورة المركبة'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--brand-primary)]">
                  <Bus className="h-12 w-12" />
                  <span className="text-xs font-bold opacity-75">
                    معاينة صورة المركبة
                  </span>
                </div>
              )}

              <div className="absolute top-3 right-3">
                <TripStatusBadge status={status} />
              </div>

              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-[#164C92] px-3 py-1 text-xs font-extrabold text-white shadow-button">
                <span>
                  {displayPrice} {currency || 'SAR'}
                </span>
                {hasDiscount ? (
                  <span className="line-through text-white/70 text-[11px]">
                    {origPriceNum}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-sm font-extrabold text-[var(--text-primary)]">
                {route || (fromCity || toCity ? `${fromCity} - ${toCity}` : 'مسار الرحلة')}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  {departureDate || '-'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  {departureTime || '-'}
                </span>
              </div>

              {/* Seat Occupancy Progress */}
              <div className="rounded-[14px] bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[var(--text-secondary)]">إشغال المقاعد</span>
                  <span className="text-[var(--text-primary)]">
                    {availSeatsNum} متاح من {totalSeatsNum} ({occupancyPct}% محجوز)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border-color)]">
                  <div
                    style={{ width: `${occupancyPct}%` }}
                    className="h-full rounded-full bg-[var(--brand-primary)] transition-all"
                  />
                </div>
              </div>

              <AppButton
                type="submit"
                loading={saving}
                icon={<Save className="h-4 w-4" />}
                className="w-full"
              >
                {mode === 'create' ? 'حفظ وإنشاء الرحلة' : 'حفظ التعديلات'}
              </AppButton>
            </div>
          </div>

          {/* Excel Import / Ticket Metadata if present */}
          {initialTrip &&
          (initialTrip.passengerName ||
            initialTrip.issuedDate ||
            initialTrip.source) ? (
            <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 shadow-card space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)]">
                <Tag className="h-4 w-4 text-[var(--brand-primary)]" />
                <span>بيانات الاستيراد والتذكرة</span>
              </div>
              {initialTrip.source ? (
                <div className="text-xs font-medium text-[var(--text-secondary)]">
                  المصدر:{' '}
                  <span className="font-bold text-[var(--text-primary)]">
                    {initialTrip.source}
                  </span>
                </div>
              ) : null}
              {initialTrip.passengerName ? (
                <div className="text-xs font-medium text-[var(--text-secondary)]">
                  اسم الراكب:{' '}
                  <span className="font-bold text-[var(--text-primary)]">
                    {initialTrip.passengerName}
                  </span>
                </div>
              ) : null}
              {initialTrip.issuedDate ? (
                <div className="text-xs font-medium text-[var(--text-secondary)]">
                  تاريخ الإصدار:{' '}
                  <span className="font-bold text-[var(--text-primary)]">
                    {initialTrip.issuedDate}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </form>
  );
}
