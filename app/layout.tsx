// FIRST: global CSS — must be imported before any component that may
// import its own CSS so the global cascade order is deterministic across
// SSR and client renders (premium-launch-readiness Req 1.4, design §3.1 R1).
import './globals.css';

import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { IntlClientProvider } from '@/components/providers/IntlClientProvider';
import { ToastContainer } from '@/components/ui/Toast';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { TermsGate } from '@/components/providers/TermsGate';
import { NotificationSocketProvider } from '@/components/providers/NotificationSocketProvider';
import { HydrationReady } from '@/components/providers/HydrationReady';
import { MotionProvider } from '@/components/providers/MotionProvider';
import { OnboardingModal } from '@/components/shared/OnboardingModal';
import { FloatingNearbyButton } from '@/components/shared/FloatingNearbyButton';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
  adjustFontFallback: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

const poppins = Poppins({
  weight: ['500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  preload: false,
  adjustFontFallback: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

export const metadata: Metadata = {
  title: {
    default: 'SAYIN GLOBAL — Raqamli Chorva Bozori',
    template: '%s · SAYIN GLOBAL',
  },
  description:
    "Raqamli chorva bozori. To'g'ridan-to'g'ri sotuvchilar bilan bog'laning. Tasdiqlangan profillar, ishonchli e'lonlar, xavfsiz savdo.",
  keywords: ['chorva', 'qoramol', "qo'y", 'echki', 'ot', 'tuya', 'parranda', 'bozor', 'savdo', 'sayin', 'livestock', 'marketplace'],
  authors: [{ name: 'SAYIN GLOBAL' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'SAYIN GLOBAL — Raqamli Chorva Bozori',
    description: "Raqamli chorva bozori. To'g'ridan-to'g'ri sotuvchilar bilan bog'laning.",
    type: 'website',
    siteName: 'SAYIN GLOBAL',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png', type: 'image/png' },
    ]
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafbfa' },
    { media: '(prefers-color-scheme: dark)', color: '#090e13' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('sayin-theme');
    var mode = (stored === 'day' || stored === 'night') ? stored : 'day';
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.style.colorScheme = mode === 'night' ? 'dark' : 'light';
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'day');
  }
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      data-theme="day"
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable} overflow-x-hidden`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased min-h-[100dvh] bg-bg text-fg pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0 overflow-x-hidden">
        <HydrationReady />
        <ThemeProvider>
          <IntlClientProvider messages={messages} locale={locale} timeZone="Asia/Tashkent">
            <MotionProvider>
              {children}
              <TermsGate />
              <NotificationSocketProvider />
              <MobileBottomNav />
              <OnboardingModal />
              <FloatingNearbyButton />
              <ToastContainer />
            </MotionProvider>
          </IntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
