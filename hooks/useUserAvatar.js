"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAvatarCacheBust,
  getUserDisplayName,
  getUserInitials,
  resolveAvatarUrl,
} from "@/lib/avatar";

/**
 * Centralized avatar state derived from auth + optional overrides.
 *
 * @param {{ user?: object|null, userProfile?: object|null, previewUrl?: string|null, cacheVersion?: string|number|null }} [options]
 */
export function useUserAvatar(options = {}) {
  const auth = useAuth();
  const user = options.user ?? auth.user;
  const userProfile = options.userProfile ?? auth.userProfile;
  const previewUrl = options.previewUrl ?? null;
  const cacheVersion = options.cacheVersion ?? null;

  const cacheBust = useMemo(
    () => getAvatarCacheBust({ userProfile, user, version: cacheVersion }),
    [userProfile, user, cacheVersion]
  );

  const avatarUrl = useMemo(
    () =>
      resolveAvatarUrl({
        user,
        userProfile,
        overrideUrl: previewUrl,
        cacheBust: previewUrl ? null : cacheBust,
      }),
    [user, userProfile, previewUrl, cacheBust]
  );

  const displayName = useMemo(
    () => getUserDisplayName({ user, userProfile }),
    [user, userProfile]
  );

  const initials = useMemo(
    () => getUserInitials(displayName),
    [displayName]
  );

  const getToken = useCallback(async () => {
    if (!user?.getIdToken) {
      return null;
    }
    return user.getIdToken();
  }, [user]);

  return {
    user,
    userProfile,
    avatarUrl,
    displayName,
    initials,
    getToken,
    cacheBust,
  };
}
