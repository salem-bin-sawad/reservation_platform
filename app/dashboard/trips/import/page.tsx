'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Download,
  Edit3,
  FileSpreadsheet,
  Loader2,
  Send,
  Square,
  Trash2,
  Upload,
} from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { TripStatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/context/auth-context';
import { ApiError, servicesApi, tripsApi } from '@/lib/api';
import type { ExcelImportResponse, ServiceItem, TripItem } from '@/lib/types';

export default function OfficeImportAndDraftsPage() {
  const { token } = useAuth();
  const [drafts, setDrafts] = useState<TripItem[]>([]);
  const [myServices, setMyServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [defaultSeats, setDefaultSeats] = useState('50');
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ExcelImportResponse | null>(
    null
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [draftsData, servicesData] = await Promise.all([
        tripsApi.getMyDrafts(token),
        servicesApi.getMyServices(token),
      ]);
      setDrafts(Array.isArray(draftsData) ? draftsData : []);
      setMyServices(Array.isArray(servicesData) ? servicesData : []);
      setSelectedIds([]);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'تعذر تحميل المسودات.'
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
        const [draftsData, servicesData] = await Promise.all([
          tripsApi.getMyDrafts(token),
          servicesApi.getMyServices(token),
        ]);
        if (!active) return;
        setDrafts(Array.isArray(draftsData) ? draftsData : []);
        setMyServices(Array.isArray(servicesData) ? servicesData : []);
        setSelectedIds([]);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof ApiError ? err.message : 'تعذر تحميل المسودات.'
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !file) {
      setError('يرجى اختيار ملف إكسل (.xlsx أو .xls أو .csv) أولاً.');
      return;
    }

    setUploading(true);
    setError(null);
    setFeedback(null);
    setImportResult(null);

    try {
      const res = await tripsApi.importExcel(token, file, {
        serviceId: serviceId || undefined,
        defaultSeats: Number(defaultSeats) || 50,
      });
      setImportResult(res);
      setFeedback(res.message);
      setFile(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'فشل استيراد ملف الإكسل.'
      );
    } finally {
      setUploading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === drafts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(drafts.map((d) => d.id));
    }
  };

  const handlePublishBulk = async (onlySelected: boolean) => {
    if (!token || drafts.length === 0) return;
    setPublishing(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await tripsApi.publishBulk(
        token,
        onlySelected ? selectedIds : undefined
      );
      setFeedback(res.message);
      await loadData();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'تعذر اعتماد ونشر المسودات.'
      );
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishSingle = async (draft: TripItem) => {
    if (!token) return;
    setBusyId(draft.id);
    setError(null);
    setFeedback(null);
    try {
      const res = await tripsApi.publishDraft(token, draft.id);
      setFeedback(res.message);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر نشر المسودة.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteDraft = async (draft: TripItem) => {
    if (!token) return;
    setBusyId(draft.id);
    setError(null);
    setFeedback(null);
    try {
      const res = await tripsApi.remove(token, draft.id);
      setFeedback(res.message);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر حذف المسودة.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[var(--brand-primary)]" />
            <span>استيراد رحلات من إكسل والمسودات</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mt-1">
            ارفع ملف إكسل لتستورد التذاكر والرحلات كمسودات، ثم راجعها وانشرها دفعة واحدة.
          </p>
        </div>

        <a href={tripsApi.getSampleExcelUrl()} download>
          <AppButton
            variant="secondary"
            size="md"
            icon={<Download className="h-4 w-4 text-[var(--brand-primary)]" />}
          >
            تحميل نموذج ملف إكسل
          </AppButton>
        </a>
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

      {/* Upload Excel Card */}
      <form
        onSubmit={handleUpload}
        className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-[var(--text-primary)]">
            رفع ملف إكسل جديد (.xlsx, .xls, .csv)
          </h2>
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            الأعمدة المدعومة: TicketNumber, PassengerName, IssuedDate, Date, RoutList, Price, Currency, TheSource
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="md:col-span-1 flex flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-[var(--brand-primary)]/40 bg-[var(--brand-primary-soft)]/50 p-4 text-center cursor-pointer hover:border-[var(--brand-primary)] transition">
            <Upload className="h-6 w-6 text-[var(--brand-primary)]" />
            <span className="text-xs font-extrabold text-[var(--text-primary)]">
              {file ? file.name : 'اضغط لاختيار ملف إكسل'}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              xlsx / xls / csv
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                الخدمة المرتبطة (اختياري)
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="h-11 rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] px-3 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--border-focused)] focus:outline-none"
              >
                <option value="">تلقائي (أول خدمة مسجل بها المكتب)</option>
                {myServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                عدد المقاعد الافتراضي لكل رحلة
              </label>
              <input
                type="number"
                min="1"
                value={defaultSeats}
                onChange={(e) => setDefaultSeats(e.target.value)}
                className="h-11 rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] px-3 text-sm font-medium text-[var(--text-primary)] focus:border-[var(--border-focused)] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end items-end">
              <AppButton
                type="submit"
                loading={uploading}
                disabled={!file}
                icon={<Upload className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                استيراد وحفظ كمسودات
              </AppButton>
            </div>
          </div>
        </div>

        {importResult ? (
          <div className="rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] p-3.5 text-xs space-y-1.5">
            <div className="font-extrabold text-[var(--text-primary)]">
              ملخص الاستيراد: إجمالي الصفوف {importResult.totalRows} • تم استيراد{' '}
              <span className="text-[#16A34A]">{importResult.importedCount}</span>{' '}
              • فشل{' '}
              <span className="text-[#DC2626]">{importResult.failedCount}</span>
            </div>
            {importResult.errors.length > 0 ? (
              <ul className="list-disc pr-4 text-[#DC2626] space-y-0.5">
                {importResult.errors.map((err, i) => (
                  <li key={i}>
                    صف {err.row}: {err.error}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </form>

      {/* Drafts Section */}
      <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-5 shadow-card flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">
              المسودات بانتظار الاعتماد والنشر ({drafts.length})
            </h2>
            {drafts.length > 0 ? (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-primary)] hover:underline cursor-pointer"
              >
                {selectedIds.length === drafts.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>
                  {selectedIds.length === drafts.length
                    ? 'إلغاء تحديد الكل'
                    : 'تحديد الكل'}
                </span>
              </button>
            ) : null}
          </div>

          {drafts.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.length > 0 ? (
                <AppButton
                  size="sm"
                  variant="primary"
                  loading={publishing}
                  onClick={() => handlePublishBulk(true)}
                  icon={<Send className="h-3.5 w-3.5" />}
                >
                  نشر المحدد ({selectedIds.length})
                </AppButton>
              ) : null}
              <AppButton
                size="sm"
                variant="success"
                loading={publishing}
                onClick={() => handlePublishBulk(false)}
                icon={<Send className="h-3.5 w-3.5" />}
              >
                اعتماد ونشر الكل
              </AppButton>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-[var(--brand-primary)]" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="rounded-[16px] bg-[var(--bg-surface-secondary)] p-8 text-center text-sm font-semibold text-[var(--text-secondary)]">
            لا توجد مسودات حالياً. عند استيراد ملف إكسل ستظهر الرحلات هنا لمراجعتها قبل النشر.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {drafts.map((draft) => {
              const checked = selectedIds.includes(draft.id);
              const busy = busyId === draft.id;
              return (
                <div
                  key={draft.id}
                  className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-[16px] border p-4 transition ${
                    checked
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]/35'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface-secondary)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSelect(draft.id)}
                      className="mt-0.5 text-[var(--brand-primary)] cursor-pointer"
                    >
                      {checked ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5 text-[var(--text-muted)]" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-[var(--text-primary)]">
                          #{draft.tripNumber}
                        </span>
                        <TripStatusBadge status={draft.status} />
                        {draft.source ? (
                          <span className="rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                            المصدر: {draft.source}
                          </span>
                        ) : null}
                      </div>

                      <div className="text-sm font-bold text-[var(--text-primary)]">
                        {draft.route} ({draft.fromCity} ➔ {draft.toCity})
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[var(--text-secondary)]">
                        <span>التاريخ: {draft.departureDate}</span>
                        <span>السعر: {Number(draft.originalPrice)} {draft.currency}</span>
                        <span>المقاعد: {draft.totalSeats}</span>
                        {draft.passengerName ? (
                          <span>الراكب: {draft.passengerName}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                    <Link href={`/dashboard/trips/${draft.id}`}>
                      <AppButton
                        size="sm"
                        variant="secondary"
                        icon={<Edit3 className="h-3.5 w-3.5 text-[var(--brand-primary)]" />}
                      >
                        تعديل
                      </AppButton>
                    </Link>
                    <AppButton
                      size="sm"
                      variant="success"
                      loading={busy}
                      onClick={() => handlePublishSingle(draft)}
                      icon={<Send className="h-3.5 w-3.5" />}
                    >
                      نشر الآن
                    </AppButton>
                    <AppButton
                      size="sm"
                      variant="secondary"
                      loading={busy}
                      onClick={() => handleDeleteDraft(draft)}
                      icon={<Trash2 className="h-3.5 w-3.5 text-[#DC2626]" />}
                      className="!text-[#DC2626]"
                    >
                      حذف
                    </AppButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
