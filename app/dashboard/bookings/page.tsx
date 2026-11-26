'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CreditCard,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { BookingStatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/context/auth-context';
import { ApiError, bookingsApi, resolveMediaUrl } from '@/lib/api';
import type { BookingItem, BookingStatus } from '@/lib/types';

const STATUS_TABS: { value: 'ALL' | BookingStatus; label: string }[] = [
  { value: 'ALL', label: 'الكل' },
  { value: 'PAYMENT_UNDER_REVIEW', label: 'فحص الفواتير' },
  { value: 'PENDING_PAYMENT', label: 'بانتظار السداد' },
  { value: 'CONFIRMED', label: 'مؤكدة' },
  { value: 'REJECTED', label: 'مرفوضة' },
  { value: 'CANCELLED', label: 'ملغية' },
];

function BookingsContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') as BookingStatus | null;
  const focusId = searchParams.get('focus');

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'ALL' | BookingStatus>(
    initialStatus || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectModalBooking, setRejectModalBooking] =
    useState<BookingItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [detailBooking, setDetailBooking] = useState<BookingItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    try {
      const data = await bookingsApi.getOfficeBookings(token);
      const list = Array.isArray(data) ? data : [];
      setBookings(list);
      setError(null);
      if (focusId) {
        const found = list.find((item) => item.id === focusId);
        if (found) setDetailBooking(found);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'تعذر تحميل الحجوزات.'
      );
    } finally {
      setLoading(false);
    }
  }, [token, focusId]);

  const loadBookings = () => {
    setLoading(true);
    return fetchBookings();
  };

  useEffect(() => {
    if (!token) return;
    let active = true;
    const run = async () => {
      try {
        const data = await bookingsApi.getOfficeBookings(token);
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setBookings(list);
        setError(null);
        if (focusId) {
          const found = list.find((item) => item.id === focusId);
          if (found) setDetailBooking(found);
        }
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof ApiError ? err.message : 'تعذر تحميل الحجوزات.'
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [token, focusId]);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.bookingNumber.toLowerCase().includes(q) ||
        (b.user?.fullName || '').toLowerCase().includes(q) ||
        (b.user?.phone || '').toLowerCase().includes(q) ||
        (b.invoiceNumber || '').toLowerCase().includes(q) ||
        (b.trip?.tripNumber || '').toLowerCase().includes(q) ||
        (b.trip?.route || '').toLowerCase().includes(q)
      );
    });
  }, [bookings, statusFilter, searchQuery]);

  const handleConfirm = async (booking: BookingItem) => {
    if (!token) return;
    setBusyId(booking.id);
    setError(null);
    setFeedback(null);
    try {
      const updated = await bookingsApi.reviewBooking(token, booking.id, {
        action: 'CONFIRM',
      });
      setFeedback(`تم تأكيد الحجز رقم ${updated.bookingNumber} بنجاح.`);
      if (detailBooking?.id === updated.id) setDetailBooking(updated);
      await loadBookings();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'تعذر تأكيد الحجز.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rejectModalBooking) return;
    if (!rejectionReason.trim()) {
      setError('يرجى كتابة سبب رفض الفاتورة لتوضيحه للعميل.');
      return;
    }

    setBusyId(rejectModalBooking.id);
    setError(null);
    setFeedback(null);
    try {
      const updated = await bookingsApi.reviewBooking(
        token,
        rejectModalBooking.id,
        {
          action: 'REJECT',
          rejectionReason: rejectionReason.trim(),
        }
      );
      setFeedback(
        `تم رفض الحجز ${updated.bookingNumber} وإرجاع المقاعد للرحلة تلقائياً.`
      );
      setRejectModalBooking(null);
      setRejectionReason('');
      if (detailBooking?.id === updated.id) setDetailBooking(updated);
      await loadBookings();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر رفض الحجز.');
    } finally {
      setBusyId(null);
    }
  };

  const openBookingDetails = async (booking: BookingItem) => {
    setDetailBooking(booking);
    if (!token) return;
    setDetailLoading(true);
    try {
      const fresh = await bookingsApi.getById(token, booking.id);
      setDetailBooking(fresh);
    } catch {
      // keep existing booking summary
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-[var(--brand-primary)]" />
            <span>حجوزات وفواتير رحلات المكتب</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mt-1">
            طابق سندات التحويل والفواتير المرفقة من العملاء مع الحساب الرسمي لتأكيد التذاكر أو رفضها.
          </p>
        </div>

        <AppButton
          variant="secondary"
          size="md"
          onClick={loadBookings}
          icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          تحديث القائمة
        </AppButton>
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

      {/* Filter & Search Bar */}
      <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 shadow-card flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-[14px] bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] px-3 py-2.5">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="ابحث برقم الحجز، رقم الحوالة، اسم العميل، رقم الجوال أو رقم الرحلة..."
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
                ? bookings.length
                : bookings.filter((b) => b.status === tab.value).length;
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

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-12 text-center shadow-card flex flex-col items-center gap-3">
          <ReceiptText className="h-10 w-10 text-[var(--brand-primary)]" />
          <p className="text-base font-extrabold text-[var(--text-primary)]">
            لا توجد حجوزات مطابقة
          </p>
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            ستظهر هنا جميع حجوزات العملاء والفواتير المرفقة على رحلات مكتبك.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredBookings.map((booking) => {
            const invoiceUrl = resolveMediaUrl(booking.invoiceImage);
            const busy = busyId === booking.id;
            const canReview =
              booking.status !== 'CANCELLED' && booking.status !== 'CONFIRMED';

            return (
              <div
                key={booking.id}
                className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card flex flex-col gap-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-full bg-[var(--brand-primary-soft)] px-3 py-1 text-xs font-extrabold text-[var(--brand-primary)]">
                      {booking.bookingNumber}
                    </span>
                    <BookingStatusBadge status={booking.status} />
                    {booking.trip ? (
                      <span className="text-xs font-bold text-[var(--text-secondary)]">
                        رحلة #{booking.trip.tripNumber}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="text-base font-extrabold text-[var(--brand-primary)]">
                        {Number(booking.totalAmount)} {booking.currency}
                      </div>
                      <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                        {booking.seatsCount} مقعد ({Number(booking.pricePerSeat)}{' '}
                        {booking.currency}/مقعد)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Customer & Trip info */}
                  <div className="space-y-2 text-xs">
                    <div className="font-extrabold text-[var(--text-primary)] text-sm flex items-center gap-1.5">
                      <User className="h-4 w-4 text-[var(--brand-primary)]" />
                      <span>{booking.user?.fullName || 'عميل'}</span>
                    </div>
                    {booking.user?.phone ? (
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-medium">
                        <Phone className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                        <span dir="ltr">{booking.user.phone}</span>
                      </div>
                    ) : null}
                    {booking.trip ? (
                      <>
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-medium">
                          <MapPin className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                          <span>{booking.trip.route}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-medium">
                          <Calendar className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                          <span>
                            {booking.trip.departureDate} • {booking.trip.departureTime}
                          </span>
                        </div>
                      </>
                    ) : null}
                    {booking.seatNumbers ? (
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-medium">
                        <Users className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                        <span>أرقام المقاعد: {booking.seatNumbers}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Invoice & Payment info */}
                  <div className="space-y-2 text-xs rounded-[14px] bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] p-3">
                    <div className="font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-[var(--brand-primary)]" />
                      <span>{booking.paymentMethod}</span>
                    </div>
                    {booking.invoiceNumber ? (
                      <div className="font-semibold text-[var(--text-secondary)]">
                        رقم الإشعار / الحوالة:{' '}
                        <span className="font-mono font-bold text-[var(--text-primary)]">
                          {booking.invoiceNumber}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[var(--text-muted)]">
                        لم يُرفق رقم إشعار بعد
                      </div>
                    )}
                    {booking.paymentNotes ? (
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        {booking.paymentNotes}
                      </p>
                    ) : null}
                    {booking.rejectionReason ? (
                      <p className="text-[#DC2626] font-bold">
                        سبب الرفض: {booking.rejectionReason}
                      </p>
                    ) : null}
                  </div>

                  {/* Invoice Image Preview & Actions */}
                  <div className="flex flex-col justify-between gap-3">
                    {invoiceUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImageUrl(invoiceUrl)}
                        className="group relative h-24 w-full overflow-hidden rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={invoiceUrl}
                          alt={`فاتورة ${booking.bookingNumber}`}
                          className="h-full w-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/35 flex items-center justify-center gap-1.5 text-white text-xs font-bold opacity-90 group-hover:opacity-100">
                          <ImageIcon className="h-4 w-4" />
                          <span>معاينة صورة الفاتورة</span>
                        </div>
                      </button>
                    ) : (
                      <div className="flex h-24 items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-[var(--border-color)] bg-[var(--bg-surface-secondary)] text-xs font-semibold text-[var(--text-muted)]">
                        <FileText className="h-4 w-4" />
                        <span>لا توجد صورة فاتورة مرفقة</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <AppButton
                        size="sm"
                        variant="secondary"
                        onClick={() => openBookingDetails(booking)}
                        icon={<Eye className="h-3.5 w-3.5 text-[var(--brand-primary)]" />}
                      >
                        التفاصيل
                      </AppButton>

                      {canReview ? (
                        <>
                          <AppButton
                            size="sm"
                            variant="success"
                            loading={busy}
                            onClick={() => handleConfirm(booking)}
                            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          >
                            اعتماد وتأكيد
                          </AppButton>
                          <AppButton
                            size="sm"
                            variant="danger"
                            disabled={busy}
                            onClick={() => {
                              setRejectModalBooking(booking);
                              setRejectionReason('');
                            }}
                            icon={<XCircle className="h-3.5 w-3.5" />}
                          >
                            رفض
                          </AppButton>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                رفض فاتورة الحجز {rejectModalBooking.bookingNumber}
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalBooking(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="mt-4 flex flex-col gap-3">
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                عند رفض الفاتورة سيظهر السبب للعميل وتُعاد المقاعد المحجوزة ({rejectModalBooking.seatsCount}) تلقائياً إلى الرحلة.
              </p>

              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="مثال: رقم الإشعار البنكي غير مطابق للمبلغ المطلوب، يرجى إعادة إرسال السند الصحيح."
                className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] p-3 text-sm font-medium text-[var(--text-primary)] focus:border-[var(--border-focused)] focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2">
                <AppButton
                  variant="secondary"
                  size="md"
                  onClick={() => setRejectModalBooking(null)}
                >
                  إلغاء
                </AppButton>
                <AppButton
                  type="submit"
                  variant="danger"
                  size="md"
                  loading={busyId === rejectModalBooking.id}
                >
                  تأكيد الرفض
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Full Booking Details Modal */}
      {detailBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                  تفاصيل الحجز {detailBooking.bookingNumber}
                </h3>
                <BookingStatusBadge status={detailBooking.status} />
              </div>
              <button
                type="button"
                onClick={() => setDetailBooking(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-[14px] bg-[var(--bg-surface-secondary)] p-3 space-y-1">
                    <div className="font-bold text-[var(--text-muted)]">العميل</div>
                    <div className="text-sm font-extrabold text-[var(--text-primary)]">
                      {detailBooking.user?.fullName}
                    </div>
                    <div dir="ltr" className="text-right text-[var(--text-secondary)]">
                      {detailBooking.user?.phone}
                    </div>
                  </div>
                  <div className="rounded-[14px] bg-[var(--bg-surface-secondary)] p-3 space-y-1">
                    <div className="font-bold text-[var(--text-muted)]">المبلغ والمقاعد</div>
                    <div className="text-sm font-extrabold text-[var(--brand-primary)]">
                      {Number(detailBooking.totalAmount)} {detailBooking.currency}
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      {detailBooking.seatsCount} مقعد{' '}
                      {detailBooking.seatNumbers ? `(${detailBooking.seatNumbers})` : ''}
                    </div>
                  </div>
                </div>

                {detailBooking.passengers && detailBooking.passengers.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)]">
                      بيانات الركاب ({detailBooking.passengers.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {detailBooking.passengers.map((p, idx) => (
                        <div
                          key={idx}
                          className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] p-3 text-xs space-y-0.5"
                        >
                          <div className="font-bold text-[var(--text-primary)]">
                            {p.fullName}
                          </div>
                          {p.phone ? (
                            <div className="text-[var(--text-secondary)]" dir="ltr">
                              {p.phone}
                            </div>
                          ) : null}
                          {p.identityNumber ? (
                            <div className="text-[var(--text-muted)]">
                              الهوية/الجواز: {p.identityNumber}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {resolveMediaUrl(detailBooking.invoiceImage) ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)]">
                      صورة الفاتورة / سند التحويل
                    </h4>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(detailBooking.invoiceImage) || ''}
                      alt="سند التحويل"
                      className="max-h-72 w-full rounded-[16px] border border-[var(--border-color)] object-contain bg-[var(--bg-surface-secondary)]"
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Image Lightbox Modal */}
      {previewImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-[20px] bg-[var(--bg-surface)] p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-5 left-5 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImageUrl}
              alt="معاينة الفاتورة"
              className="max-h-[80vh] w-full rounded-[14px] object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function OfficeBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}
