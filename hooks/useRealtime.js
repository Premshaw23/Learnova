"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const FALLBACK_POLL_MS = 15000;

export function useRealtime(handlers, { enabled = true, pollInterval = FALLBACK_POLL_MS } = {}) {
  const { user } = useAuth();
  const [status, setStatus] = useState("disconnected");
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectDelayRef = useRef(RECONNECT_BASE_MS);
  const isMountedRef = useRef(true);
  const handlersRef = useRef(handlers);
  const pollTimerRef = useRef(null);
  const lastPollUrlRef = useRef(null);

  handlersRef.current = handlers;

  const startPolling = useCallback((token) => {
    const poll = async () => {
      if (!isMountedRef.current || !token) return;
      try {
        const res = await fetch(`/api/notifications?userId=${encodeURIComponent(user.uid)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (isMountedRef.current) {
          handlersRef.current?.onNotification?.(data);
        }
      } catch {}
      if (isMountedRef.current) {
        pollTimerRef.current = setTimeout(poll, pollInterval);
      }
    };
    if (isMountedRef.current) {
      pollTimerRef.current = setTimeout(poll, pollInterval);
    }
  }, [pollInterval, user?.uid]);

  useEffect(() => {
    if (!enabled || !user) {
      setStatus("disconnected");
      return;
    }

    isMountedRef.current = true;
    setStatus("connecting");

    let currentEventSource = null;

    const connect = async () => {
      try {
        const token = await user.getIdToken();
        const url = `/api/events/stream?token=${encodeURIComponent(token)}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;
        currentEventSource = es;

        es.onopen = () => {
          if (!isMountedRef.current) { es.close(); return; }
          setStatus("connected");
          reconnectDelayRef.current = RECONNECT_BASE_MS;
        };

        es.addEventListener("notification", (event) => {
          if (!isMountedRef.current) return;
          try {
            const data = JSON.parse(event.data);
            handlersRef.current?.onNotification?.(data);
          } catch {}
        });

        es.addEventListener("attendance", (event) => {
          if (!isMountedRef.current) return;
          try {
            const data = JSON.parse(event.data);
            handlersRef.current?.onAttendance?.(data);
          } catch {}
        });

        es.addEventListener("ping", () => {});

        es.addEventListener("error", () => {
          if (!isMountedRef.current) return;
          es.close();
          setStatus("reconnecting");
          const delay = Math.min(reconnectDelayRef.current, RECONNECT_MAX_MS);
          reconnectDelayRef.current *= 2;
          if (isMountedRef.current) {
            reconnectTimerRef.current = setTimeout(connect, delay);
          }
        });
      } catch {
        setStatus("fallback-polling");
        startPolling();
      }
    };

    connect();

    const fallbackTimer = setTimeout(() => {
      if (isMountedRef.current && currentEventSource?.readyState !== EventSource.OPEN) {
        setStatus("fallback-polling");
        currentEventSource?.close();
        startPolling();
      }
    }, 10000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(fallbackTimer);
      clearTimeout(reconnectTimerRef.current);
      clearTimeout(pollTimerRef.current);
      eventSourceRef.current?.close();
    };
  }, [enabled, user, startPolling]);

  return { status };
}
