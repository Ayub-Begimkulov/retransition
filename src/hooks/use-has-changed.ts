import { usePrevious } from "./use-previous";

export function useHasChanged<T>(value: T) {
  const prevValue = usePrevious(value);
  return prevValue.current !== value;
}
