import React, {
  Children,
  cloneElement,
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
  customAppear?: boolean;
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
  onEnterCancelled?: (el: Element) => void;
  onBeforeLeave?: (el: Element) => void;
  onLeave?: (el: Element /* , done: () => void */) => void;
  onAfterLeave?: (el: Element) => void;
  onLeaveCancelled?: (el: Element) => void;
  onBeforeAppear?: (el: Element) => void;
  onAppear?: (el: Element /* , done: () => void */) => void;
  onAfterAppear?: (el: Element) => void;
  onAppearCancelled?: (el: Element) => void;
  children: React.ReactElement;
}

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
  const finishEnter = useRef<((cancelled?: boolean) => void) | null>(null);
  const finishLeave = useRef<((cancelled?: boolean) => void) | null>(null);
  const initialDisplay = useRef<string | null>(null);
  const performEnter = useCallback(
    (el: Element) => {
      const {
        type,
        appear = false,
        unmount = true,
        customAppear = false,
        name = "transition",
        enterFromClass = `${name}-enter-from`,
        enterActiveClass = `${name}-enter-active`,
        enterToClass = `${name}-enter-to`,
        appearFromClass = customAppear ? `${name}-appear-from` : enterFromClass,
        appearActiveClass = customAppear
          ? `${name}-appear-active`
          : enterActiveClass,
        appearToClass = customAppear ? `${name}-appear-to` : enterToClass,
        onBeforeEnter,
        onEnter,
        onAfterEnter,
        onEnterCancelled,
        onBeforeAppear = customAppear ? undefined : onBeforeEnter,
        onAppear = customAppear ? undefined : onEnter,
        onAfterAppear = customAppear ? undefined : onAfterEnter,
        onAppearCancelled = customAppear ? undefined : onEnterCancelled,
      } = latestProps.current;
      if (!appear && !isMounted.current) {
        return;
      }
      const isAppear =
        appear && !isMounted.current && (context ? context.isAppear : true);
      if (finishLeave.current) {
        finishLeave.current(true);
      }
      const [
        beforeHook,
        hook,
        afterHook,
        cancelHook,
        fromClass,
        activeClass,
        toClass,
      ] = isAppear
        ? [
            onBeforeAppear,
            onAppear,
            onAfterAppear,
            onAppearCancelled,
            appearFromClass,
            appearActiveClass,
            appearToClass,
          ]
        : [
            onBeforeEnter,
            onEnter,
            onAfterEnter,
            onEnterCancelled,
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
        const onEnd = (finishEnter.current = once((cancelled?: boolean) => {
          removeClass(el, toClass, activeClass);
          const finishHook = cancelled ? cancelHook : afterHook;
          finishHook && finishHook(el);
          finishEnter.current = null;
        }));
        whenTransitionEnds(el, onEnd, type);
      });
    },
    [latestProps, isMounted, context]
  );

  const performLeave = useCallback(
    (el: Element) => {
      if (finishEnter.current) {
        finishEnter.current(true);
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
        onLeaveCancelled,
      } = latestProps.current;
      onBeforeLeave && onBeforeLeave(el);
      addClass(el, leaveFromClass);
      addClass(el, leaveActiveClass);
      onLeave && onLeave(el);
      nextFrame(() => {
        removeClass(el, leaveFromClass);
        addClass(el, leaveToClass);
        const onEnd = (finishLeave.current = once((cancelled?: boolean) => {
          removeClass(el, leaveToClass);
          removeClass(el, leaveActiveClass);
          if (isMounted.current) {
            setLocalVisible(false);
          }
          context?.unregister(el);
          if (!unmount) {
            const s = (el as HTMLElement).style;
            initialDisplay.current = s.display;
            s.display = "none";
          }
          const finishHook = cancelled ? onLeaveCancelled : onAfterLeave;
          finishHook && finishHook(el);
          finishLeave.current = null;
        }));
        whenTransitionEnds(el, onEnd, type);
      });
    },
    [isMounted, latestProps, context]
  );

  useLayoutEffect(() => {
    const el = elRef.current;
    if (visible) {
      if (el) {
        // if component is mounted and `previousVisible.current` not
        // equal to `localVisible` prop then it means
        // that leave animation was cancelled and we
        // should perform enter ourself because ref callback
        // won't be called since element isn't unmounted.
        if (
          isMounted.current &&
          previousVisible.current !== localVisibleRef.current
        ) {
          performEnter(el);
        }
        // TODO latestProps doesn't have a default values for props
        if (latestProps.current.unmount === false) {
          performEnter(el);
        }
      }
      setLocalVisible(true);
    } else if (el) {
      if (!isMounted.current) {
        if (latestProps.current.unmount === false) {
          initialDisplay.current = (el as HTMLElement).style.display;
          (el as HTMLElement).style.display = "none";
        }
        // do not run `performLeave` on initial render
        return;
      }
      performLeave(el);
    }
  }, [
    visible,
    performLeave,
    performEnter,
    previousVisible,
    localVisibleRef,
    latestProps,
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

  let child: React.ReactElement;

  try {
    child = Children.only(children);
  } catch (e) {
    if (process.env.NODE_ENV === "development" || process.env.TESTING) {
      console.error(
        "[react-transition]: wrong `children` passed to the <Transition> component " +
          "expected to have `ReactElement`, got " +
          typeof children
      );
      // TODO should we throw original error?
      throw e;
    }
    return null;
  }
  const el = cloneElement(child, {
    ref,
  });
  return el;
};

export default Transition;
