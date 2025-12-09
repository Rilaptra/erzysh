import { useEffect, useState } from "react";

/**
 * Custom Hook untuk debouncing value
 * Berfungsi buat delay eksekusi state update agar gak nge-lag saat user ngetik cepet
 *
 * @param value - Value yang mau di-debounce
 * @param delay - Delay dalam milliseconds (default: 300ms)
 * @returns Debounced value
 *
 * @example
 * const [input, setInput] = useState('');
 * const debouncedInput = useDebounce(input, 500);
 *
 * // debouncedInput akan update 500ms SETELAH user berhenti ngetik
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
