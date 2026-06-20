// Pre-existing Capacitor 8.x type mismatch — the runtime export exists
// but the .d.ts declarations are incomplete for this version.
// @ts-expect-error Capacitor 8.x types may not export Capacitor directly
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNativeApp = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();
export const isIOS = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';

export type AppMode = 'user' | 'admin' | 'web';

export const getAppMode = (): AppMode => {
  const envMode = process.env.NEXT_PUBLIC_APP_MODE;
  if (envMode === 'user' || envMode === 'admin') return envMode;
  if (isNativeApp()) {
    const hostname = window.location.hostname;
    if (hostname.includes('admin')) return 'admin';
    return 'user';
  }
  return 'web';
};

export const isUserApp = () => getAppMode() === 'user';
export const isAdminApp = () => getAppMode() === 'admin';
export const isWebApp = () => getAppMode() === 'web';

export const initializeApp = async () => {
  if (!isNativeApp()) return;
  const mode = getAppMode();
  try {
    const statusBarColor = mode === 'admin' ? '#3b82f6' : '#10b981';
    if (isIOS() || isAndroid()) {
      await StatusBar.setStyle({ style: Style.Dark });
      if (isAndroid()) {
        await StatusBar.setBackgroundColor({ color: statusBarColor });
      }
    }
    await SplashScreen.hide();
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active:', isActive);
    });
    if (isAndroid()) {
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) App.exitApp();
        else window.history.back();
      });
    }
    App.addListener('appUrlOpen', (event) => {
      console.log('App opened with URL:', event.url);
      const slug = event.url.split('.com').pop();
      if (slug) window.location.href = slug;
    });
  } catch (error) {
    console.error('Error initializing app:', error);
  }
};

export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--safe-area-top') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-left') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-right') || '0'),
  };
};

export const openUrl = async (url: string, target: '_blank' | '_system' = '_system') => {
  if (isNativeApp()) window.open(url, '_system');
  else window.open(url, target);
};

export const getAppInfo = async () => {
  if (!isNativeApp()) return null;
  try { return await App.getInfo(); }
  catch (error) { console.error('Error getting app info:', error); return null; }
};
