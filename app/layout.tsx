import type { Metadata, Viewport } from 'next';
import { Cairo, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PwaProvider } from '@/components/pwa/pwa-provider';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'حجوزاتي | بوابة المكاتب ومزودي الخدمة',
  description:
    'لوحة تحكم المكاتب وشركات النقل لإدارة الخدمات والرحلات واستيراد الجداول ومراجعة الحجوزات والفواتير',
  manifest: '/manifest.webmanifest',
  applicationName: 'حجوزاتي للمكاتب',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'حجوزاتي للمكاتب',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#164C92' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1120' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${cairo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaProvider>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
