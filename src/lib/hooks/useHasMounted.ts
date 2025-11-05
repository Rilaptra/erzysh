// src/lib/hooks/useHasMounted.ts
import { useState, useEffect } from "react";

/**
 * A hook to determine if the component has mounted on the client.
 * This is useful to prevent hydration errors when using client-side state
 * like localStorage or theme.
 *
 * @returns {boolean} `true` if the component has mounted, otherwise `false`.
 */
export const useHasMounted = () => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
};