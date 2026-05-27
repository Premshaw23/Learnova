"use client";

import { useEffect, useRef, useState } from "react";
import { avatarSrcRequiresAuth, isValidAvatarUrl } from "@/lib/avatar";
import {
  getCachedAvatarObjectUrl,
  getCachedIdToken,
  setCachedAvatarObjectUrl,
} from "@/lib/avatar-image-cache";

/**
 * Resolves avatar src for display. Proxied API routes are fetched with auth
 * and converted to blob URLs. Results are cached in memory for fast reuse.
 *
 * @param {string|null|undefined} src
 * @param {{ getToken?: () => Promise<string|undefined|null> }} options
 */
export function useAuthenticatedAvatarSrc(src, { getToken } = {}) {
  const cachedOnMount = src ? getCachedAvatarObjectUrl(src) : null;
  const [resolvedSrc, setResolvedSrc] = useState(cachedOnMount);
  const [loading, setLoading] = useState(
    Boolean(src && avatarSrcRequiresAuth(src) && !cachedOnMount)
  );
  const [error, setError] = useState(false);
  const objectUrlRef = useRef(cachedOnMount);
  const ownsObjectUrlRef = useRef(false);

  const releaseOwnedObjectUrl = () => {
    if (ownsObjectUrlRef.current && objectUrlRef.current) {
      const globalCached = getCachedAvatarObjectUrl(src);
      if (objectUrlRef.current !== globalCached) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    }
    ownsObjectUrlRef.current = false;
    objectUrlRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;

    const applySrc = (url, { fromCache = false } = {}) => {
      objectUrlRef.current = url;
      ownsObjectUrlRef.current = !fromCache;
      setResolvedSrc(url);
    };

    const load = async () => {
      releaseOwnedObjectUrl();
      setError(false);

      if (!isValidAvatarUrl(src)) {
        applySrc(null);
        setLoading(false);
        return;
      }

      if (!avatarSrcRequiresAuth(src)) {
        applySrc(src);
        setLoading(false);
        return;
      }

      const cached = getCachedAvatarObjectUrl(src);
      if (cached) {
        applySrc(cached, { fromCache: true });
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const token = await getCachedIdToken(getToken);
        const response = await fetch(src, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Avatar fetch failed");
        }

        const blob = await response.blob();
        if (cancelled) {
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        setCachedAvatarObjectUrl(src, objectUrl);
        applySrc(objectUrl, { fromCache: true });
      } catch {
        if (!cancelled) {
          setError(true);
          applySrc(null);
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
      releaseOwnedObjectUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return { src: resolvedSrc, loading, error };
}
