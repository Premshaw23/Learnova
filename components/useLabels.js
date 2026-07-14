"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import {
  getLabelsFromOfflineStore,
  saveLabelsToOfflineStore,
} from "@/db/offlineStore";

export default function useLabels(user) {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchLabels = async () => {
      try {
        const token = await user.getIdToken();

        // Timeout controller
        const controller = new AbortController();

        const timeout = setTimeout(() => {
          controller.abort();
        }, 5000);

        const data = await apiFetch("/api/labels", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!data.success) {
          throw new Error(data.error || "Failed to load labels");
        }

        const labelsData = Array.isArray(data.data) ? data.data : [];
        setLabels(labelsData);
        setError(null);

        // Cache to IndexedDB for offline use
        if (labelsData.length > 0) {
          saveLabelsToOfflineStore(labelsData);
        }
      } catch (err) {
        console.error("Label Fetch Error:", err);

        if (
          err.name === "AbortError" ||
          !navigator.onLine ||
          err.message.includes("Failed to load") ||
          err.message.includes("fetch")
        ) {
          console.log("Loading labels from offline IndexedDB cache...");
          const offlineLabels = await getLabelsFromOfflineStore();
          if (offlineLabels && offlineLabels.length > 0) {
            setLabels(offlineLabels);
            setError(null);
          } else {
            setError("You are offline and no cached students were found.");
            setLabels([]);
          }
        } else {
          setError("Service temporarily unavailable. Please try again later.");
          setLabels([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, [user]);

  return {
    labels,
    loading,
    error,
  };
}
