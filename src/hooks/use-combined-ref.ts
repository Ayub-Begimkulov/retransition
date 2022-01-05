import { useCallback } from "react";
import { Ref } from "../types";
import { isFunction } from "../utils";

export function useCombinedRef<T>(...refs: (Ref<T | null> | undefined)[]) {
  const combinedRef = useCallback((node: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (isFunction(ref)) ref(node);
      else ref.current = node;
    });
  }, refs);

  return combinedRef;
}
