import { AnyFunction } from "types";
export { whenTransitionEnds } from "./when-transition-ends";
export type { CSSTransitionType } from "./when-transition-ends";

export function once<T extends AnyFunction>(fn: T) {
  let called = false;
  return function (...args: Parameters<T>) {
    if (called) return;
    called = true;
    fn.apply(null, args);
  };
}

export function nextFrame(cb: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cb();
    });
  });
}

export function addClass(el: Element, ...classes: string[]) {
  return classes
    .flatMap(c => c.split(/\s+/))
    .forEach(c => c && el.classList.add(c));
}

export function removeClass(el: Element, ...classes: string[]) {
  return classes
    .flatMap(c => c.split(/\s+/))
    .forEach(c => el.classList.remove(c));
}

export function hasClass(el: Element, className: string) {
  return el.classList.contains(className);
}
