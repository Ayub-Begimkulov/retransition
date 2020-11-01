import { useRef, useEffect } from "react";

export function usePrevious<T>(value: T) {
  const prevRef = useRef<T | null>(null);
  useEffect(() => {
    prevRef.current = value;
  });
  return prevRef;
}
