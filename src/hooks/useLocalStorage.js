import { useState, useEffect } from "react";

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    if (saved === null) return defaultValue;

    // Try to parse as JSON, fall back to raw value
    try {
      return JSON.parse(saved);
    } catch {
      return saved;
    }
  });

  useEffect(() => {
    const toStore = typeof value === "object" ? JSON.stringify(value) : value.toString();
    localStorage.setItem(key, toStore);
  }, [key, value]);

  return [value, setValue];
}
