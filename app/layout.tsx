// FIRST: global CSS — must be imported before any component that may
// import its own CSS so the global cascade order is deterministic across
// SSR and client renders (premium-launch-readiness Req 1.4, design §3.1 R1).
import './globals.css';

import type { Metadata, Viewport } from 'next';
// Removed next/font/google due to timeouts
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { IntlClientProvider } from '@/components/providers/IntlClientProvider';
import { ToastContainer } from '@/components/ui/Toast';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { TermsGate } from '@/components/providers/TermsGate';
import { NotificationSocketProvider } from '@/components/providers/NotificationSocketProvider';
import { HydrationReady } from '@/components/providers/HydrationReady';
import { CapacitorNativeProvider } from '@/components/providers/CapacitorNativeProvider';
import { MotionProvider } from '@/components/providers/MotionProvider';
import { OnboardingModal } from '@/components/shared/OnboardingModal';
import { FloatingNearbyButton } from '@/components/shared/FloatingNearbyButton';
import { AIAssistantButton } from '@/components/ai/AIAssistantButton';
import { GoogleAnalytics } from '@next/third-parties/google';
import { ReCaptchaProvider } from '@/components/providers/ReCaptchaProvider';
import { ClientAuthGuard } from '@/components/providers/ClientAuthGuard';

const inter = { variable: '--font-inter', className: 'font-inter' };
const poppins = { variable: '--font-poppins', className: 'font-poppins' };

export const metadata: Metadata = {
  title: {
    default: 'SAYIN GLOBAL — Raqamli Chorva Bozori',
    template: '%s · SAYIN GLOBAL',
  },
  description:
    "Raqamli chorva bozori. Toʻgʻridan-toʻgʻri sotuvchilar bilan bogʻlaning. Tasdiqlangan profillar, ishonchli eʼlonlar, xavfsiz savdo.",
  keywords: ['chorva', 'qoramol', "qo'y", 'echki', 'ot', 'tuya', 'parranda', 'bozor', 'savdo', 'sayin', 'livestock', 'marketplace'],
  authors: [{ name: 'SAYIN GLOBAL' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'SAYIN GLOBAL — Raqamli Chorva Bozori',
    description: "Raqamli chorva bozori. Toʻgʻridan-toʻgʻri sotuvchilar bilan bogʻlaning.",
    type: 'website',
    siteName: 'SAYIN GLOBAL',
  },
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    statusBarStyle: 'black-translucent',
    title: 'SAYIN GLOBAL',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
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
  maximumScale: 1,
  userScalable: false,
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



import uzMessages from '@/messages/uz.json';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = 'uz';
  const messages = uzMessages;

  return (
    <html
      lang={locale}
      data-theme="day"
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable}`}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased min-h-[100dvh] bg-bg text-fg pb-nav-safe md:pb-0">
        <HydrationReady />
        <ThemeProvider>
          <IntlClientProvider messages={messages} locale={locale} timeZone="Asia/Tashkent">
            <CapacitorNativeProvider />
            <MotionProvider>
              <ReCaptchaProvider>
                <ClientAuthGuard>
                  {children}
                </ClientAuthGuard>
                <TermsGate />
                <NotificationSocketProvider />
                <MobileBottomNav />
                <OnboardingModal />
                <FloatingNearbyButton />
                <AIAssistantButton />
                <ToastContainer />
              </ReCaptchaProvider>
            </MotionProvider>
          </IntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
