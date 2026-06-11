"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

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

        const res = await apiFetch("/api/labels", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error("Service temporarily unavailable");
        }

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to load labels");
        }

        setLabels(Array.isArray(data.data) ? data.data : []);
        setError(null);
      } catch (err) {
        console.error("Label Fetch Error:", err);

        if (err.name === "AbortError") {
          setError("Request timed out. Please try again.");
        } else {
          setError("Service temporarily unavailable. Please try again later.");
        }

        // graceful fallback
        setLabels([]);
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
