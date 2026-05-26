'use client';

/**
 * NotificationSocketProvider — mounts the notification WebSocket connection
 * for authenticated users. Renders nothing (null) — purely side-effect.
 *
 * Mount this inside NextIntlClientProvider in the root layout so it is
 * available on every page. It connects when the user is authenticated and
 * disconnects on logout or unmount.
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { notificationSocket } from '@/lib/ws/notificationSocket';

export function NotificationSocketProvider() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      notificationSocket.connect(accessToken);
    } else {
      notificationSocket.disconnect();
    }

    return () => {
      notificationSocket.disconnect();
    };
  }, [isAuthenticated, accessToken]);

  return null;
}
