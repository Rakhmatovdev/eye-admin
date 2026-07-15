import { useCallback, useEffect, useRef, useState } from 'react';
import type { ThreatFeedItem } from '../types';
import { THREAT_FEED_SEED, generateThreatFeedItem } from '../api/security';

const resolveWsUrl = () => {
  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';
  return apiUrl.replace(/^http/, 'ws') + '/ws';
};

export type FeedLinkStatus = 'connecting' | 'live' | 'simulated';

/**
 * Streams the threat feed. Prefers the real backend WebSocket (`type: "threat"`
 * frames); if the backend is unreachable it falls back to a local simulation so
 * the Security Center is always demonstrable, but the connection badge always
 * reflects the true state.
 */
export function useLiveThreatFeed(maxItems = 60) {
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

    const startSimulation = () => {
      if (simTimer || cancelled) return;
      setStatus('simulated');
      simTimer = setInterval(() => {
        if (!pausedRef.current) pushItem(generateThreatFeedItem());
      }, 2800 + Math.random() * 1800);
    };

    try {
      ws = new WebSocket(resolveWsUrl());

      connectTimeout = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) {
          ws.close();
        }
      }, 2500);

      ws.onopen = () => {
        if (cancelled) return;
        if (connectTimeout) clearTimeout(connectTimeout);
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
        setStatus((prev) => (prev === 'live' ? 'live' : 'simulated'));
        startSimulation();
      };
    } catch {
      startSimulation();
    }

    return () => {
      cancelled = true;
      if (connectTimeout) clearTimeout(connectTimeout);
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
