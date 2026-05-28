import { useEffect, useRef } from 'react';

export function useDebouncedSave<T>(value: T, save: (v: T) => void | Promise<void>, delay = 400) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => {
      save(value);
    }, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}
