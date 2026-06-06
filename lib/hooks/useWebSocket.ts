import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/auth';

export enum ReadyState {
  UNINSTANTIATED = -1,
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

interface UseWebSocketOptions {
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  shouldReconnect?: (closeEvent: CloseEvent) => boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useWebSocket(
  url: string | null,
  options: UseWebSocketOptions = {}
) {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.UNINSTANTIATED);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout>();

  const callbacksRef = useRef(options);

  // Keep callbacks fresh without triggering reconnections
  useEffect(() => {
    callbacksRef.current = options;
  });

  const connect = useCallback(() => {
    if (!url || !isAuthenticated || !accessToken) return;

    // Clean up existing
    if (websocketRef.current) {
      websocketRef.current.close(1000, 'Reconnecting');
    }

    // Determine final URL
    let wsUrl = url;
    if (wsUrl.startsWith('http://')) wsUrl = wsUrl.replace('http://', 'ws://');
    if (wsUrl.startsWith('https://')) wsUrl = wsUrl.replace('https://', 'wss://');
    
    const separator = wsUrl.includes('?') ? '&' : '?';
    const finalUrl = `${wsUrl}${separator}access_token=${accessToken}`;

    setReadyState(ReadyState.CONNECTING);
    const ws = new WebSocket(finalUrl);
    websocketRef.current = ws;

    ws.onopen = (event) => {
      setReadyState(ReadyState.OPEN);
      reconnectCount.current = 0;
      callbacksRef.current.onOpen?.(event);
    };

    ws.onmessage = (event) => {
      setLastMessage(event);
      callbacksRef.current.onMessage?.(event);
    };

    ws.onclose = (event) => {
      setReadyState(ReadyState.CLOSED);
      callbacksRef.current.onClose?.(event);

      // Codes 4401 or 4403 are auth/session revoked from Django channels
      if (event.code === 4401 || event.code === 4403) {
         return; 
      }

      // Normal close 1000 usually means we intentionally closed it
      if (event.code === 1000) {
          return;
      }

      const shouldReconnect = callbacksRef.current.shouldReconnect ? callbacksRef.current.shouldReconnect(event) : true;
      const maxAttempts = callbacksRef.current.reconnectAttempts ?? 10;
      const interval = callbacksRef.current.reconnectInterval ?? 3000;

      if (shouldReconnect && reconnectCount.current < maxAttempts) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectCount.current++;
          connect();
        }, interval);
      }
    };

    ws.onerror = (event) => {
      callbacksRef.current.onError?.(event);
    };
  }, [url, accessToken, isAuthenticated]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (websocketRef.current) {
        websocketRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: string | object) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      websocketRef.current.send(message);
    }
  }, []);

  return {
    sendMessage,
    lastMessage,
    readyState,
  };
}
