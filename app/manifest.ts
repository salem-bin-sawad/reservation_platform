import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'حجوزاتي | بوابة المكاتب ومزودي الخدمة',
    short_name: 'حجوزاتي للمكاتب',
    description:
      'لوحة تحكم المكاتب وشركات النقل لإدارة الخدمات والرحلات واستيراد الجداول ومراجعة الحجوزات والفواتير',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F3F5F9',
    theme_color: '#164C92',
    dir: 'rtl',
    lang: 'ar',
    categories: ['business', 'travel', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
