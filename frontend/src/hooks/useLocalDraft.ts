import { useEffect, useState } from "react";

export function useLocalDraft<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(`dsr:${key}`);
      return saved ? (JSON.parse(saved) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(`dsr:${key}`, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
