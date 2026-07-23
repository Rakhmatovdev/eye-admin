import { useCallback, useEffect, useRef, useState } from 'react';
import type { Alert } from '../api/alerts';
import { useAuthStore } from '../store/authStore';

// Sibling of useLiveThreatFeed — same WS endpoint, but only cares about
// {type:"alert"} frames. Kept separate (rather than teaching the threat feed
// hook a second frame type) so each hook stays a single-purpose subscriber;
// both connections share the same backend `/ws` endpoint and coexist fine.
const resolveWsUrl = (token: string | null) => {
  const envUrl = (import.meta as any).env?.VITE_WS_URL as string | undefined;
  const base =
    envUrl ||
    `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8080/ws`;
  if (!token) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}token=${encodeURIComponent(token)}`;
};

const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

export type AlertLinkStatus = 'connecting' | 'live' | 'offline';

/**
 * Streams live alert frames from the backend WebSocket. Purely additive to
 * whatever a page fetches over REST — callers merge `alerts` (newest first)
 * with an initial REST page and dedupe by id. Reconnects with exponential
 * backoff; if the socket can't be reached, `status` stays 'offline' (no fake
 * data simulation here — alerts are safety-relevant, unlike the demo threat
 * feed).
 */
export function useLiveAlerts(maxItems = 10) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [status, setStatus] = useState<AlertLinkStatus>('connecting');

  const pushAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => {
      if (prev.some((a) => a.id === alert.id)) return prev;
      return [alert, ...prev].slice(0, maxItems);
    });
  }, [maxItems]);

  const pushAlertRef = useRef(pushAlert);
  pushAlertRef.current = pushAlert;

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;
    let connectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let backoff = BASE_BACKOFF_MS;

    const scheduleReconnect = () => {
      if (cancelled || reconnectTimer) return;
      const delay = backoff;
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (cancelled) return;

      try {
        const token = useAuthStore.getState().token;
        ws = new WebSocket(resolveWsUrl(token));
      } catch {
        setStatus('offline');
        scheduleReconnect();
        return;
      }

      connectTimeout = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) ws.close();
      }, 2500);

      ws.onopen = () => {
        if (cancelled) return;
        if (connectTimeout) {
          clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        backoff = BASE_BACKOFF_MS;
        setStatus('live');
      };

      ws.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.type === 'alert' && msg.data) {
            pushAlertRef.current(msg.data as Alert);
          }
          // threat / monitoring frame types are ignored on this feed
        } catch {
          // ignore malformed frames
        }
      };

      ws.onerror = () => {
        if (!cancelled) ws?.close();
      };

      ws.onclose = () => {
        if (cancelled) return;
        if (connectTimeout) {
          clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        setStatus('offline');
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (connectTimeout) clearTimeout(connectTimeout);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  return { alerts, status };
}
