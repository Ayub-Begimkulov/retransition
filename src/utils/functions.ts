import { ElementBindings } from "../constants";
import { AnyFunction, AnyObject } from "../types";

export function isFunction(val: unknown): val is AnyFunction {
  return typeof val === "function";
}

const hasOwnProperty = Object.prototype.hasOwnProperty;

export function hasOwn<T extends AnyObject>(
  value: T,
  key: PropertyKey
): key is keyof T {
  return hasOwnProperty.call(value, key);
}

export function once<T extends AnyFunction>(fn: T) {
  let invoked = false;
  return function (...args: Parameters<T>) {
    if (invoked) return;
    invoked = true;
    fn.apply(null, args);
  };
}

export function nextFrame(cb: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb);
  });
}

export function addClass(el: Element, ...classes: string[]) {
  return classes.forEach(cls =>
    cls.split(/\s+/).forEach(c => {
      if (c) {
        (
          (el as any)[ElementBindings.transitionClasses] ||
          ((el as any)[ElementBindings.transitionClasses] = new Set())
        ).add(c);
        el.classList.add(c);
      }
    })
  );
}

export function removeClass(el: Element, ...classes: string[]) {
  return classes.forEach(cls =>
    cls.split(/\s+/).forEach(c => {
      if (c) {
        (el as any)[ElementBindings.transitionClasses]?.delete(c);
        el.classList.remove(c);
      }
    })
  );
}

export function combine(...args: unknown[]) {
  const fns = args.filter(isFunction);
  return (arg: unknown) => {
    fns.forEach(f => f(arg));
  };
}
