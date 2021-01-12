import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { TransitionGroupContext } from "./context";
import { useIsMounted, useLatest, usePrevious } from "./hooks";
import {
  addClass,
  nextFrame,
  removeClass,
  whenTransitionEnds,
  CSSTransitionType,
  once,
  isFunction,
} from "./utils";

export interface TransitionProps {
  visible?: boolean;
  name?: string;
  type?: CSSTransitionType;
  appear?: boolean;
  unmount?: boolean;
  nodeRef?:
    | React.MutableRefObject<Element | null>
    | ((node: Element | null) => void);
  enterFromClass?: string;
  enterActiveClass?: string;
  enterToClass?: string;
  appearFromClass?: string;
  appearActiveClass?: string;
  appearToClass?: string;
  leaveFromClass?: string;
  leaveActiveClass?: string;
  leaveToClass?: string;
  onBeforeEnter?: (el: Element) => void;
  onEnter?: (el: Element /* , done: () => void */) => void;
  onAfterEnter?: (el: Element) => void;
  // onEnterCancelled?: (el: Element) => void;
  onBeforeLeave?: (el: Element) => void;
  onLeave?: (el: Element /* , done: () => void */) => void;
  onAfterLeave?: (el: Element) => void;
  // onLeaveCancelled?: (el: Element) => void;
  onBeforeAppear?: (el: Element) => void;
  onAppear?: (el: Element /* , done: () => void */) => void;
  onAfterAppear?: (el: Element) => void;
  // onAppearCancelled?: (el: Element) => void;
  children: React.ReactElement;
}

// TODO unmount or hide
const Transition = (props: TransitionProps) => {
  const context = useContext(TransitionGroupContext);
  const latestProps = useLatest(props);
  const { visible, children, unmount = true } = props;

  const [localVisible, setLocalVisible] = useState(visible);
  const previousVisible = usePrevious(visible);
  // wrapping `localVisible` with ref to prevent unnecessary
  // effect calls
  const localVisibleRef = useLatest(localVisible);

  const elRef = useRef<Element | null>(null);
  const isMounted = useIsMounted();
  const finishEnter = useRef<(() => void) | null>(null);
  const finishLeave = useRef<(() => void) | null>(null);
  const initialDisplay = useRef<string | null>(null);

  const performEnter = useCallback(
    (el: Element) => {
      const {
        type,
        appear = false,
        unmount = true,
        name = "transition",
        enterFromClass = `${name}-enter-from`,
        enterActiveClass = `${name}-enter-active`,
        enterToClass = `${name}-enter-to`,
        appearFromClass = enterFromClass,
        appearActiveClass = enterActiveClass,
        appearToClass = enterToClass,
        onBeforeEnter,
        onEnter,
        onAfterEnter,
        onBeforeAppear = onBeforeEnter,
        onAppear = onEnter,
        onAfterAppear = onAfterEnter,
      } = latestProps.current;
      if (!appear && !isMounted.current) {
        return;
      }
      if (finishLeave.current) {
        finishLeave.current();
      }
      const isAppear = appear && !isMounted.current;
      const [
        beforeHook,
        hook,
        afterHook,
        fromClass,
        activeClass,
        toClass,
      ] = isAppear
        ? [
            onBeforeAppear,
            onAppear,
            onAfterAppear,
            appearFromClass,
            appearActiveClass,
            appearToClass,
          ]
        : [
            onBeforeEnter,
            onEnter,
            onAfterEnter,
            enterFromClass,
            enterActiveClass,
            enterToClass,
          ];
      beforeHook && beforeHook(el);
      if (!unmount) {
        // TODO think about the case with initial `display: none`
        (el as HTMLElement).style.display = initialDisplay.current || "";
      }
      addClass(el, fromClass, activeClass);
      hook && hook(el);
      nextFrame(() => {
        removeClass(el, fromClass);
        addClass(el, toClass);
        const onEnd = (finishEnter.current = once(() => {
          removeClass(el, toClass, activeClass);
          afterHook && afterHook(el);
          finishEnter.current = null;
        }));
        whenTransitionEnds(el, onEnd, type);
      });
    },
    [latestProps, isMounted]
  );

  const performLeave = useCallback(
    (el: Element) => {
      if (finishEnter.current) {
        finishEnter.current();
      }
      const {
        type,
        name = "transition",
        unmount = true,
        leaveFromClass = `${name}-leave-from`,
        leaveActiveClass = `${name}-leave-active`,
        leaveToClass = `${name}-leave-to`,
        onBeforeLeave,
        onLeave,
        onAfterLeave,
      } = latestProps.current;
      onBeforeLeave && onBeforeLeave(el);
      addClass(el, leaveFromClass);
      addClass(el, leaveActiveClass);
      onLeave && onLeave(el);
      nextFrame(() => {
        removeClass(el, leaveFromClass);
        addClass(el, leaveToClass);
        const onEnd = (finishLeave.current = once(() => {
          removeClass(el, leaveToClass);
          removeClass(el, leaveActiveClass);
          if (isMounted.current) {
            context?.unregister(el);
            setLocalVisible(false);
            if (!unmount) {
              const s = (el as HTMLElement).style;
              initialDisplay.current = s.display;
              s.display = "none";
            }
          }
          onAfterLeave && onAfterLeave(el);
          finishLeave.current = null;
        }));
        whenTransitionEnds(el, onEnd, type);
      });
    },
    [isMounted, latestProps, context]
  );

  useLayoutEffect(() => {
    if (visible) {
      // if component is mounted and `previousVisible.current` not
      // equal to `localVisible` prop then it means
      // that leave animation was cancelled and we
      // should perform enter ourself because ref callback
      // won't be called since element isn't unmounted.
      if (
        isMounted.current &&
        previousVisible.current !== localVisibleRef.current
      ) {
        elRef.current && performEnter(elRef.current);
      }
      // TODO add comment for this shit
      // TODO fix === false
      // latestProps doesn't have a default values for props
      if (latestProps.current.unmount === false) {
        elRef.current && performEnter(elRef.current);
      }
      setLocalVisible(true);
    } else if (elRef.current) {
      if (!isMounted.current) {
        if (latestProps.current.unmount === false) {
          initialDisplay.current = (elRef.current as HTMLElement).style.display;
          (elRef.current as HTMLElement).style.display = "none";
        }
        console.log("return");
        // do not run `performLeave` on initial render
        return;
      }
      performLeave(elRef.current);
    }
  }, [
    visible,
    performLeave,
    performEnter,
    previousVisible,
    localVisibleRef,
    isMounted,
  ]);

  const ref = useCallback(
    (el: Element | null) => {
      const { nodeRef, unmount = true } = latestProps.current;
      if (nodeRef) {
        isFunction(nodeRef) ? nodeRef(el) : (nodeRef.current = el);
      }
      elRef.current = el;
      if (el) {
        context?.register(el);
        unmount && performEnter(el);
      }
    },
    [performEnter, latestProps, context]
  );

  if (unmount && !localVisible) return null;

  if (process.env.NODE_ENV === "development") {
    console.log("dev");
  }
  // TODO add error handling and warning if multiple children
  const child = React.Children.only(children);
  const el = React.cloneElement(child, {
    ref,
  });
  return el;
};

export default Transition;
