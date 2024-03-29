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
  classes.forEach(cls =>
    cls.split(/\s+/).forEach(c => {
      c && el.classList.add(c);
    })
  );
}

export function removeClass(el: Element, ...classes: string[]) {
  classes.forEach(cls =>
    cls.split(/\s+/).forEach(c => c && el.classList.remove(c))
  );
}

export function removeArrayElement<T>(array: T[], element: T) {
  const index = array.indexOf(element);
  if (index < 0) return;
  array.splice(index, 1);
}
