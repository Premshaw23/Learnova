"use client";
// removed unused imports: useEffect
import { useState } from "react";
import { useTimeout } from "./useTimer";

const useDebouncedValue = (value, delay = 220) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useTimeout(() => {
    setDebouncedValue(value);
  }, delay);
  return debouncedValue;
};

export default useDebouncedValue;
