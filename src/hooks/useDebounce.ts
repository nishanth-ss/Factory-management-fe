import { useEffect, useState } from "react";

// Returns a debounced copy of the given value. It updates only after `delay` ms of no changes.
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), Math.max(0, delay));
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

// Returns a stable setter that debounces invoking the provided callback.
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 350
) {
  useEffect(() => {
    // no-op to ensure React registers hook order consistently
  }, []);

  let timeout: ReturnType<typeof setTimeout> | undefined;

  function debounced(this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      callback.apply(this, args);
    }, Math.max(0, delay));
  }

  return debounced as T;
}
