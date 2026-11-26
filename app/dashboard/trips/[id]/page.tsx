'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { TripFormPage } from '@/components/trips/trip-form-page';
import { AppButton } from '@/components/ui/app-button';
import { useAuth } from '@/context/auth-context';
import { ApiError, servicesApi, tripsApi } from '@/lib/api';
import type { ServiceItem, TripItem } from '@/lib/types';

function EditTripContent() {
  const params = useParams<{ id: string }>();
  const tripId = params?.id;
  const { token } = useAuth();

  const [trip, setTrip] = useState<TripItem | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !tripId) return;
    let active = true;
    const run = async () => {
      try {
        const [tripData, myServices] = await Promise.all([
          tripsApi.getById(tripId),
          servicesApi.getMyServices(token),
        ]);
        if (!active) return;
        setTrip(tripData);
        setServices(Array.isArray(myServices) ? myServices : []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof ApiError ? err.message : 'تعذر تحميل تفاصيل الرحلة.'
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [token, tripId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="rounded-[20px] bg-[var(--bg-surface)] border border-[var(--border-color)] p-8 shadow-card flex flex-col items-center gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-[#DC2626]" />
        <p className="text-sm font-extrabold text-[var(--text-primary)]">
          {error || 'الرحلة غير موجودة.'}
        </p>
        <Link href="/dashboard/trips">
          <AppButton
            variant="secondary"
            size="md"
            icon={<ArrowRight className="h-4 w-4" />}
          >
            العودة لقائمة الرحلات
          </AppButton>
        </Link>
      </div>
    );
  }

  return (
    <TripFormPage
      mode="edit"
      initialTrip={trip}
      myServices={services}
      onTripUpdated={setTrip}
    />
  );
}

export default function EditTripPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      }
    >
      <EditTripContent />
    </Suspense>
  );
}
