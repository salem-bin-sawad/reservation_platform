'use client';

import React from 'react';
import type { BookingStatus, TripStatus } from '@/lib/types';

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const config: Record<TripStatus, { label: string; bg: string; color: string }> = {
    DRAFT: {
      label: 'مسودة (غير منشورة)',
      bg: 'var(--tint-amber-bg)',
      color: 'var(--tint-amber)',
    },
    UPCOMING: {
      label: 'متاحة للحجز',
      bg: 'var(--tint-blue-bg)',
      color: 'var(--tint-blue)',
    },
    STARTED: {
      label: 'الرحلة بدأت',
      bg: 'var(--tint-purple-bg)',
      color: 'var(--tint-purple)',
    },
    COMPLETED: {
      label: 'مكتملة',
      bg: 'var(--tint-green-bg)',
      color: 'var(--tint-green)',
    },
    CANCELLED: {
      label: 'ملغية',
      bg: 'var(--tint-red-bg)',
      color: 'var(--tint-red)',
    },
  };

  const item = config[status] || config.UPCOMING;

  return (
    <span
      style={{ backgroundColor: item.bg, color: item.color }}
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap"
    >
      {item.label}
    </span>
  );
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config: Record<
    BookingStatus,
    { label: string; bg: string; color: string }
  > = {
    PENDING_PAYMENT: {
      label: 'بانتظار السداد',
      bg: 'var(--tint-amber-bg)',
      color: 'var(--tint-amber)',
    },
    PAYMENT_UNDER_REVIEW: {
      label: 'فحص الفاتورة (قيد المراجعة)',
      bg: 'var(--tint-cyan-bg)',
      color: 'var(--tint-cyan)',
    },
    CONFIRMED: {
      label: 'مؤكد ومعتمد',
      bg: 'var(--tint-green-bg)',
      color: 'var(--tint-green)',
    },
    REJECTED: {
      label: 'مرفوض',
      bg: 'var(--tint-red-bg)',
      color: 'var(--tint-red)',
    },
    CANCELLED: {
      label: 'ملغي من العميل',
      bg: 'var(--bg-surface-secondary)',
      color: 'var(--text-secondary)',
    },
  };

  const item = config[status] || config.PENDING_PAYMENT;

  return (
    <span
      style={{ backgroundColor: item.bg, color: item.color }}
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap"
    >
      {item.label}
    </span>
  );
}
