/**
 * Production-hardened WebSocket hook.
 * Features:
 * - Automatic reconnect with exponential backoff
 * - Max retry limit
 * - Cleanup on unmount
 * - Auth token injection
 * - Message queue during reconnect
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '../store/auth';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enabled?: boolean;
  maxRetries?: number;
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  enabled = true,
  maxRetries = 5,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);
  const messageQueueRef = useRef<string[]>([]);
  const [state, setState] = useState<ConnectionState>('disconnected');

  const { accessToken } = useAuthStore();

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setState('connecting');

    const fullUrl = `${WS_URL}${url}${accessToken ? `?token=${accessToken}` : ''}`;

    try {
      const ws = new WebSocket(fullUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        retriesRef.current = 0;
        setState('connected');
        onConnect?.();

        // Flush queued messages
        while (messageQueueRef.current.length > 0) {
          const msg = messageQueueRef.current.shift();
          if (msg) ws.send(msg);
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch {
          onMessage?.(event.data);
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        setState('disconnected');
        onDisconnect?.();

        // Don't retry on intentional close (code 1000) or auth failure (4001)
        if (event.code === 1000 || event.code === 4001) return;

        if (retriesRef.current < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 30000);
          retriesRef.current++;
          retryTimerRef.current = setTimeout(connect, delay);
        } else {
          setState('error');
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setState('error');
      };
    } catch {
      setState('error');
    }
  }, [url, enabled, accessToken, onMessage, onConnect, onDisconnect, maxRetries]);

  const send = useCallback((data: unknown) => {
    const msg = typeof data === 'string' ? data : JSON.stringify(data);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(msg);
    } else {
      // Queue for when connection is restored
      messageQueueRef.current.push(msg);
    }
  }, []);

  const disconnect = useCallback(() => {
    clearTimeout(retryTimerRef.current);
    retriesRef.current = maxRetries; // prevent auto-reconnect
    wsRef.current?.close(1000);
    wsRef.current = null;
    setState('disconnected');
  }, [maxRetries]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(retryTimerRef.current);
      wsRef.current?.close(1000);
      wsRef.current = null;
    };
  }, [connect, enabled]);

  return { state, send, disconnect, reconnect: connect };
}
