'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Network } from '@capacitor/network';
import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '@/lib/store/auth';

/**
 * CapacitorNativeProvider Orchestrates the Native App Experience.
 * Binds hardware buttons, manages the splash screen, status bar, and network state.
 */
export function CapacitorNativeProvider() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOffline, setIsOffline] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    // Only run this logic if we are running as a native app via Capacitor
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // 1. Configure Keyboard behavior
    try {
      Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});
    } catch {}

    // 2. Status Bar configuration
    const setStatusBar = async () => {
      try {
        const isNight = document.documentElement.getAttribute('data-theme') === 'night';
        await StatusBar.setStyle({
          style: isNight ? Style.Dark : Style.Light,
        });
        await StatusBar.setBackgroundColor({
          color: isNight ? '#0A0D10' : '#FAFBFA',
        });
      } catch (err) {
        // Status bar plugin might not be available or supported on all platforms
      }
    };
    setStatusBar();

    // Re-apply status bar if theme changes dynamically (observer)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setStatusBar();
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    // 3. Hardware Back Button Handling
    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      // If the user is on the primary "root" views, exit the app instead of navigating back
      const isRootView =
        pathname === '/' ||
        pathname === '/index.html' ||
        pathname === '/dashboard' ||
        pathname === '/admin' ||
        pathname === '/auth';

      if (isRootView) {
        App.exitApp();
      } else if (canGoBack) {
        router.back();
      } else {
        App.exitApp();
      }
    });

    // 4. Network (Offline) Detection
    let wasOffline = false;
    const setupNetwork = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);
      wasOffline = !status.connected;

      Network.addListener('networkStatusChange', (status) => {
        setIsOffline(!status.connected);
        if (status.connected && wasOffline) {
          Toast.show({ text: 'Internet tarmog\'iga qayta ulandingiz.', duration: 'short' });
        }
        wasOffline = !status.connected;
      });
    };
    setupNetwork();

    return () => {
      backButtonListener.then((listener) => listener.remove());
      Network.removeAllListeners();
      observer.disconnect();
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    
    // Hide splash screen once hydrated
    if (hasHydrated) {
      const timer = setTimeout(() => {
        SplashScreen.hide().catch(() => {});
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasHydrated]);

  const t = useTranslations();
  // If offline, render a full-screen native-feeling overlay
  if (isOffline) {
    return (
      <div className="fixed inset-0 z-[9999] bg-bg flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9 9a3 3 0 00-3 3v6a3 3 0 003 3h6a3 3 0 003-3v-1.5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('Errors.connectionLost')}</h2>
        <p className="text-fg-muted mb-8 max-w-sm">
          SAYIN GLOBAL tarmog&apos;iga ulanishda xatolik yuz berdi. Iltimos, internet aloqangizni tekshiring.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary btn-lg w-full max-w-xs"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  return null;
}
