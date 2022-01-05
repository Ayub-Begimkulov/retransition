import type { MutableRefObject, RefCallback } from "react";

export type AnyFunction = (...args: any[]) => any;
export type AnyObject = Record<string, any>;

export type Ref<T> = MutableRefObject<T> | RefCallback<T>;
