"use client";

import { useEffect, useState } from "react";

const useDebouncedValue = (value, delay = 220) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebouncedValue;
