import { useRef } from "react";

export function useLatest<T>(value: T) {
  const latestRef = useRef<T>(value);
  latestRef.current = value;
  return latestRef;
}
