import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { OfficeShell } from '@/components/layout/office-shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      }
    >
      <OfficeShell>{children}</OfficeShell>
    </Suspense>
  );
}
