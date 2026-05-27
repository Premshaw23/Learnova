"use client";

import { useEffect, useRef, useState } from "react";
import { avatarSrcRequiresAuth, isValidAvatarUrl } from "@/lib/avatar";

/**
 * Resolves avatar src for display. Proxied API routes are fetched with auth
 * and converted to blob URLs to avoid broken <img> requests.
 *
 * @param {string|null|undefined} src
 * @param {{ getToken?: () => Promise<string|undefined|null> }} options
 */
export function useAuthenticatedAvatarSrc(src, { getToken } = {}) {
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const objectUrlRef = useRef(null);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      revokeObjectUrl();
      setError(false);

      if (!isValidAvatarUrl(src)) {
        setResolvedSrc(null);
        setLoading(false);
        return;
      }

      if (!avatarSrcRequiresAuth(src)) {
        setResolvedSrc(src);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const token = await getToken?.();
        const response = await fetch(src, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Avatar fetch failed");
        }

        const blob = await response.blob();
        if (cancelled) {
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setResolvedSrc(objectUrl);
      } catch {
        if (!cancelled) {
          setError(true);
          setResolvedSrc(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      revokeObjectUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return { src: resolvedSrc, loading, error };
}
