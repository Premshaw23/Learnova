"use client";

import { useEffect, useState } from "react";

export default function useLabels(user) {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchLabels = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/labels", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch labels");
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch labels");
        }
        setLabels(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, [user]);

  return { labels, loading: !user ? true : loading, error };
}
