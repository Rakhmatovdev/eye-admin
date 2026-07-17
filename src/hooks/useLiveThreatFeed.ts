import { useCallback, useEffect, useRef, useState } from 'react';
import type { ThreatFeedItem } from '../types';
import { THREAT_FEED_SEED, generateThreatFeedItem } from '../api/security';
import { useAuthStore } from '../store/authStore';

// Derive the WS URL from the current hostname (not a baked-in env value) so
// this also works when the admin panel is opened over LAN from another
// machine, e.g. http://192.168.1.42:3000 -> ws://192.168.1.42:8080/ws.
// The backend requires a JWT on the query string (`?token=`) — without it the
// connection is rejected outright.
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

export type FeedLinkStatus = 'connecting' | 'live' | 'simulated';

/**
 * Streams the threat feed. Prefers the real backend WebSocket (`type: "threat"`
 * frames); if the backend is unreachable it falls back to a local simulation so
 * the Security Center is always demonstrable, but the connection badge always
 * reflects the true state. Reconnects with exponential backoff (1s -> 30s cap,
 * reset on a successful open) whenever the socket closes or errors.
 */
export function useLiveThreatFeed(maxItems = 30) {
  const [feed, setFeed] = useState<ThreatFeedItem[]>(THREAT_FEED_SEED);
  const [status, setStatus] = useState<FeedLinkStatus>('connecting');
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const pushItem = useCallback((item: ThreatFeedItem) => {
    setFeed((prev) => [item, ...prev].slice(0, maxItems));
  }, [maxItems]);

  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;
    let simTimer: ReturnType<typeof setInterval> | null = null;
    let connectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let backoff = BASE_BACKOFF_MS;

    const startSimulation = () => {
      if (simTimer || cancelled) return;
      setStatus('simulated');
      simTimer = setInterval(() => {
        if (!pausedRef.current) pushItem(generateThreatFeedItem());
      }, 2800 + Math.random() * 1800);
    };

    const stopSimulation = () => {
      if (simTimer) {
        clearInterval(simTimer);
        simTimer = null;
      }
    };

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
        startSimulation();
        scheduleReconnect();
        return;
      }

      connectTimeout = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) {
          ws.close();
        }
      }, 2500);

      ws.onopen = () => {
        if (cancelled) return;
        if (connectTimeout) {
          clearTimeout(connectTimeout);
          connectTimeout = null;
        }
        backoff = BASE_BACKOFF_MS; // reset backoff on a successful connection
        stopSimulation();
        setStatus('live');
      };

      ws.onmessage = (ev) => {
        if (pausedRef.current || cancelled) return;
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.type === 'threat' && msg.data) {
            pushItem({
              id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              timestamp: new Date().toISOString(),
              indicator: msg.data.indicator ?? 'unknown',
              type: msg.data.type ?? 'ip',
              severity: msg.data.severity ?? 'medium',
              source: msg.data.source ?? 'SIEM Engine',
              description: msg.data.description ?? '',
              tags: msg.data.tags ?? [],
            });
          }
          // monitoring / other frame types are ignored on this feed
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
        startSimulation();
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (connectTimeout) clearTimeout(connectTimeout);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (simTimer) clearInterval(simTimer);
      ws?.close();
    };
  }, [pushItem]);

  return {
    feed,
    status,
    paused,
    togglePause: () => setPaused((p) => !p),
    clear: () => setFeed([]),
  };
}
