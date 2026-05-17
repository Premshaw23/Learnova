"use client";

import { useEffect, useState } from "react";

export default function useLabels() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const res = await fetch("/api/labels");
        if (!res.ok) throw new Error("Failed to fetch labels");
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch labels");
        }
        setLabels(data.data?.labels ?? []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, []);

  return { labels, loading, error };
}
