'use client';

import React from 'react';
import {
  Bus,
  CheckCircle2,
  FileSpreadsheet,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

const FEATURES = [
  { label: 'إدارة الرحلات والمقاعد', icon: Bus, accent: '#F59E0B' },
  { label: 'استيراد الرحلات من إكسل', icon: FileSpreadsheet, accent: '#34D399' },
  { label: 'مراجعة الفواتير وسندات الدفع', icon: ReceiptText, accent: '#60A5FA' },
  { label: 'تأكيد فوري لحجوزات العملاء', icon: CheckCircle2, accent: '#FBBF24' },
  { label: 'إدارة الخدمات والاشتراكات', icon: ShieldCheck, accent: '#A78BFA' },
];

export function OfficeHeroBanner() {
  return (
    <div className="hero-gradient relative overflow-hidden rounded-[20px] p-5 shadow-button text-white">
      {/* Decorative glows matching reservation-app */}
      <div className="pointer-events-none absolute -top-8 -left-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-blue-400/15" />

      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Feature pills */}
        <div className="flex flex-1 flex-col gap-2 w-full">
          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>بوابة المكاتب وشركات النقل</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold leading-snug">
            أدِر رحلات مكتبك وحجوزاتك من مكان واحد
          </h2>
          <div className="grid grid-cols-1 gap-1.5 mt-1">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-[10px] border border-white/20 bg-white/12 px-2.5 py-1.5 text-xs font-bold"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-white/15">
                    <Icon className="h-3.5 w-3.5" style={{ color: item.accent }} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stylized Mini Dashboard Preview matching reservation-app phoneFrame */}
        <div className="hidden sm:flex w-[140px] shrink-0 flex-col gap-2 rounded-[16px] bg-white/95 p-3 text-[#1A2138] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="h-2.5 w-2.5 rounded-full bg-[#164C92]" />
            <span className="h-1.5 w-10 rounded-full bg-slate-300" />
          </div>
          <div className="flex items-center gap-2 rounded-[10px] bg-[#164C92] p-2 text-white">
            <Bus className="h-4 w-4 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-3/5 rounded bg-white/65" />
              <div className="h-1.5 w-11/12 rounded bg-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[Bus, FileSpreadsheet, ReceiptText, CheckCircle2].map((Icon, i) => (
              <div
                key={i}
                className="flex h-8 items-center justify-center rounded-[8px] bg-[#EEF3FA] text-[#164C92]"
              >
                <Icon className="h-4 w-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
