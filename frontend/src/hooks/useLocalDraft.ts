import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export type LocalDraftOptions<T> = {
  legacyKeys?: readonly string[];
  migrate?: (value: unknown) => T;
};

function parsedDraft<T>(raw: string, options?: LocalDraftOptions<T>) {
  const parsed: unknown = JSON.parse(raw);
  return options?.migrate ? options.migrate(parsed) : (parsed as T);
}

function readDraft<T>(
  key: string,
  initialValue: T,
  options?: LocalDraftOptions<T>,
) {
  try {
    const targetKey = `dsr:${key}`;
    const saved = localStorage.getItem(targetKey);
    if (saved) {
      try {
        return parsedDraft(saved, options);
      } catch {
        // Try a legacy draft before falling back to the initial value.
      }
    }

    for (const legacyKey of options?.legacyKeys ?? []) {
      const legacyStorageKey = `dsr:${legacyKey}`;
      const legacy = localStorage.getItem(legacyStorageKey);
      if (!legacy) continue;
      try {
        const migrated = parsedDraft(legacy, options);
        localStorage.setItem(targetKey, JSON.stringify(migrated));
        localStorage.removeItem(legacyStorageKey);
        return migrated;
      } catch {
        // Leave an unreadable legacy value untouched for manual recovery.
      }
    }
  } catch {
    // Storage can be unavailable; keep the in-memory draft usable.
  }

  return initialValue;
}

export function useLocalDraft<T>(
  key: string,
  initialValue: T,
  options?: LocalDraftOptions<T>,
) {
  const [draft, setDraft] = useState(() => ({
    key,
    value: readDraft(key, initialValue, options),
  }));

  let currentDraft = draft;
  if (draft.key !== key) {
    currentDraft = { key, value: readDraft(key, initialValue, options) };
    setDraft(currentDraft);
  }

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (nextValue) => {
      setDraft((current) => {
        // Never let an event from a replaced route write into another project.
        if (current.key !== key) return current;
        return {
          key,
          value:
            typeof nextValue === "function"
              ? (nextValue as (value: T) => T)(current.value)
              : nextValue,
        };
      });
    },
    [key],
  );

  useEffect(() => {
    if (draft.key !== key) return;
    try {
      localStorage.setItem(`dsr:${key}`, JSON.stringify(draft.value));
    } catch {
      // Storage can be unavailable or full; keep the in-memory draft usable.
    }
  }, [draft, key]);

  return [currentDraft.value, setValue] as const;
}
