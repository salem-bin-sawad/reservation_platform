'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { TripFormPage } from '@/components/trips/trip-form-page';
import { useAuth } from '@/context/auth-context';
import { ApiError, servicesApi } from '@/lib/api';
import type { ServiceItem } from '@/lib/types';

export default function NewTripPage() {
  const { token } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const run = async () => {
      try {
        const list = await servicesApi.getMyServices(token);
        if (!active) return;
        setServices(Array.isArray(list) ? list : []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof ApiError ? err.message : 'تعذر تحميل خدمات المكتب.'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ backgroundColor: 'var(--tint-red-bg)', color: 'var(--tint-red)' }}
        className="flex items-center gap-2 rounded-[14px] px-4 py-3 text-sm font-bold"
      >
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return <TripFormPage mode="create" myServices={services} />;
}
