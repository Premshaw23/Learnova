/**
 * hooks/useAchievements.js
 * 
 * Custom hook for fetching and managing achievements.
 * Provides reusable logic for achievement state management across components.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [newBadges, setNewBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const token = await user.getIdToken();
      const res = await fetch("/api/student/achievements", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch achievements");

      const data = await res.json();
      setAchievements(data.badges || []);

      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        setNewBadges(data.newlyUnlocked);
      }

      return data;
    } catch (err) {
      console.error("Error fetching achievements:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveBadges = useCallback(
    async (badges) => {
      if (!user) return false;

      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/student/achievements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ badges }),
        });

        return res.ok;
      } catch (err) {
        console.error("Error saving badges:", err);
        return false;
      }
    },
    [user]
  );

  useEffect(() => {
    fetchAchievements();
  }, [user, fetchAchievements]);

  return {
    achievements,
    newBadges,
    loading,
    error,
    fetchAchievements,
    saveBadges,
  };
}

export default useAchievements;
