import React, { Children, useCallback, useContext, useRef } from "react";
import { __DEV__ } from "./constants";
import { TransitionGroupContext } from "./context";
import {
  useIsMounted,
  useLatest,
  usePrevious,
  useSafeState,
  useCombinedRef,
  useIsomorphicLayoutEffect as useLayoutEffect,
} from "./hooks";
import {
  addClass,
  nextFrame,
  removeClass,
  whenTransitionEnds,
  CSSTransitionType,
  once,
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
  children: (props: TransitionChildrenProps) => React.ReactElement;
}

interface TransitionChildrenProps {
  ref: (node: Element | null) => void;
}

const Transition = (props: TransitionProps) => {
  const context = useContext(TransitionGroupContext);
  const latestProps = useLatest(props);
  const { visible, children, unmount = true, nodeRef } = props;

  const [localVisible, setLocalVisible] = useSafeState(visible);

  const previousVisible = usePrevious(visible);
  // wrapping `localVisible` with ref to prevent unnecessary
  // effect calls
  const localVisibleRef = useLatest(localVisible);

  const isMounted = useIsMounted();
  const elementRef = useRef<Element | null>(null);
  const elementDisplay = useRef<string | null>(null);
  const finishEnter = useRef<((cancelled?: boolean) => void) | null>(null);
  const finishLeave = useRef<((cancelled?: boolean) => void) | null>(null);

  const recordDisplayAndHide = useCallback(
    (element: Element) => {
      // unmount is always true unless user explicitly passed `false`
      if (latestProps.current.unmount !== false) return;
      const style = (element as HTMLElement).style;
      elementDisplay.current = style.display;
      style.display = "none";
    },
    [latestProps]
  );

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

      context?.register(el);

      // exit if no appear and component isn't mounted
      if (!appear && !isMounted.current) {
        return;
      }

      // technically it's appear transition, but the parent <TransitionGroup> is already
      // mounted
      const isAppear =
        appear && !isMounted.current && (context ? context.isAppearing : true);

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
      if (!unmount && elementDisplay.current) {
        (el as HTMLElement).style.display = elementDisplay.current;
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
      context?.unregister(el);

      const {
        type,
        name = "transition",
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

          if (!cancelled) {
            setLocalVisible(false);
            recordDisplayAndHide(el);
          }

          const finishHook = cancelled ? onLeaveCancelled : onAfterLeave;
          finishHook && finishHook(el);
          finishLeave.current = null;
        }));
        whenTransitionEnds(el, onEnd, type);
      });
    },
    [latestProps, context, isMounted, setLocalVisible, recordDisplayAndHide]
  );

  // sync state action
  useLayoutEffect(() => {
    if (visible) {
      return setLocalVisible(true);
    }
    const element = elementRef.current;
    if (!element) return;
    // TODO refactor this block
    if (!isMounted.current) {
      recordDisplayAndHide(element);
      // do not run `performLeave` on initial render
      return;
    }
    // we need to make an animation before exiting
    performLeave(element);
  }, [
    visible,
    latestProps,
    isMounted,
    setLocalVisible,
    performLeave,
    recordDisplayAndHide,
  ]);

  // enter after cancel
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (
      element &&
      isMounted.current &&
      previousVisible.current !== localVisibleRef.current
    ) {
      performEnter(element);
    }
  }, [visible, previousVisible, localVisibleRef, isMounted, performEnter]);

  // perform enter animation
  useLayoutEffect(() => {
    const element = elementRef.current;

    if (element && localVisible) {
      performEnter(element);
    }
  }, [localVisible, context, performEnter]);

  const combinedRef = useCombinedRef(elementRef, nodeRef);

  if (unmount && !localVisible) return null;

  try {
    // TODO do we need this verification?
    return Children.only(children({ ref: combinedRef }));
  } catch {
    if (__DEV__) {
      throw new Error(
        "[retransition]: wrong `children` passed to the <Transition> component " +
          "expected to have `ReactElement`, got " +
          typeof children
      );
    }
    return null;
  }
};

export default Transition;
