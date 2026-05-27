import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastContainer } from '@/components/ui/Toast';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { TermsGate } from '@/components/providers/TermsGate';
import { NotificationSocketProvider } from '@/components/providers/NotificationSocketProvider';
import { HydrationReady } from '@/components/providers/HydrationReady';
import { OnboardingModal } from '@/components/shared/OnboardingModal';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

const poppins = Poppins({
  weight: ['500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

export const metadata: Metadata = {
  title: {
    default: 'SAYIN GLOBAL — Raqamli Chorva Bozori',
    template: '%s · SAYIN GLOBAL',
  },
  description:
    'Raqamli chorva bozori. Toʻgʻridan-toʻgʻri sotuvchilar bilan bogʻlaning. Tasdiqlangan profillar, ishonchli eʼlonlar, xavfsiz savdo.',
  keywords: ['chorva', 'qoramol', 'qoʻy', 'echki', 'ot', 'tuya', 'parranda', 'bozor', 'savdo', 'sayin', 'livestock', 'marketplace'],
  authors: [{ name: 'SAYIN GLOBAL' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'SAYIN GLOBAL — Raqamli Chorva Bozori',
    description: 'Raqamli chorva bozori. Toʻgʻridan-toʻgʻri sotuvchilar bilan bogʻlaning.',
    type: 'website',
    siteName: 'SAYIN GLOBAL',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
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
      <body className="antialiased min-h-screen bg-bg text-fg pb-[72px] md:pb-0 overflow-x-hidden">
        <HydrationReady />
        <ThemeProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
            <TermsGate />
            <NotificationSocketProvider />
            <MobileBottomNav />
            <OnboardingModal />
            <ToastContainer />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
