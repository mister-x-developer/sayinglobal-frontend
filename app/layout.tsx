import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastContainer } from '@/components/ui/Toast';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { TermsGate } from '@/components/providers/TermsGate';
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

// No-flash bootstrap: mark the html element as JS-ready AFTER hydration
// completes so framer-motion doesn't run "from-opacity-0" animations on the
// first paint. CSS handles the no-JS / pre-hydration case so initial paint
// always shows fully-styled content; framer-motion only animates *re-mounts*
// triggered by user interaction.
const motionBootScript = `
(function(){
  document.documentElement.classList.add('js');
  if (document.readyState === 'complete') {
    document.documentElement.classList.add('js-ready');
  } else {
    window.addEventListener('load', function(){
      document.documentElement.classList.add('js-ready');
    });
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
      className={`${inter.variable} ${poppins.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: motionBootScript }} />
      </head>
      <body className="antialiased min-h-screen bg-bg text-fg pb-[72px] md:pb-0 overflow-x-hidden">
        <ThemeProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
            <TermsGate />
            <MobileBottomNav />
            <ToastContainer />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
