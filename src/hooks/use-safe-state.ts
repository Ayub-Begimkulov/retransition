import React, { useCallback, useState } from "react";
import { useIsMounted } from "./use-is-mounted";

export function useSafeState<T>(initialValue: T | (() => T)) {
  const [state, setState] = useState(initialValue);
  const isMounted = useIsMounted();

  const safeSetState = useCallback(
    (value: React.SetStateAction<T>) => {
      if (!isMounted.current) return;
      setState(value);
    },
    [isMounted]
  );

  return [state, safeSetState] as const;
}
