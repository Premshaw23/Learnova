"use client";

import { useEffect, useState } from "react";

export default function useLabels() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const res = await fetch("/labels.json");
        if (!res.ok) throw new Error("Failed to fetch labels");
        const data = await res.json();
        setLabels(data);
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, []);

  return { labels, loading, error };
}
