import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  addClass,
  nextFrame,
  removeClass,
  whenTransitionEnds,
  CSSTransitionType,
  once,
} from "utils";

function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

interface TransitionProps {
  visible: boolean;
  name?: string;
  type?: CSSTransitionType;
  appear?: boolean;
  enterFromClass?: string;
  enterActiveClass?: string;
  enterToClass?: string;
  appearFromClass?: string;
  appearActiveClass?: string;
  appearToClass?: string;
  leaveFromClass?: string;
  leaveActiveClass?: string;
  leaveToClass?: string;
  onBeforeEnter?: (el: HTMLElement) => void;
  onEnter?: (el: HTMLElement /* , done: () => void */) => void;
  onAfterEnter?: (el: HTMLElement) => void;
  // onEnterCancelled?: (el: HTMLElement) => void;
  onBeforeLeave?: (el: HTMLElement) => void;
  onLeave?: (el: HTMLElement /* , done: () => void */) => void;
  onAfterLeave?: (el: HTMLElement) => void;
  // onLeaveCancelled?: (el: HTMLElement) => void;
  onBeforeAppear?: (el: HTMLElement) => void;
  onAppear?: (el: HTMLElement /* , done: () => void */) => void;
  onAfterAppear?: (el: HTMLElement) => void;
  // onAppearCancelled?: (el: HTMLElement) => void;
}

const Transition: React.FC<TransitionProps> = ({
  visible,
  type,
  name = "transition",
  appear = false,
  enterFromClass = `${name}-enter-from`,
  enterActiveClass = `${name}-enter-active`,
  enterToClass = `${name}-enter-to`,
  appearFromClass = enterFromClass,
  appearActiveClass = enterActiveClass,
  appearToClass = enterToClass,
  leaveFromClass = `${name}-leave-from`,
  leaveActiveClass = `${name}-leave-active`,
  leaveToClass = `${name}-leave-to`,
  onBeforeAppear,
  onAppear,
  onAfterAppear,
  onBeforeEnter,
  onEnter,
  onAfterEnter,
  onBeforeLeave,
  onLeave,
  onAfterLeave,
  children,
}) => {
  const [localVisible, setLocalVisible] = useState(visible);
  const elRef = useRef<HTMLElement | null>(null);
  const isMounted = useIsMounted();

  const finishEnter = useRef<(() => void) | null>(null);
  const finishLeave = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    if (visible) {
      setLocalVisible(true);
    } else if (elRef.current) {
      if (finishEnter.current) {
        finishEnter.current();
      }
      const el = elRef.current;
      addClass(el, leaveFromClass);
      addClass(el, leaveActiveClass);
      onBeforeLeave && onBeforeLeave(el);
      nextFrame(() => {
        removeClass(el, leaveFromClass);
        addClass(el, leaveToClass);
        onLeave && onLeave(el);
        const onEnd = (finishLeave.current = once(() => {
          removeClass(el, leaveToClass);
          removeClass(el, leaveActiveClass);
          setLocalVisible(false);
          onAfterLeave && onAfterLeave(el);
          finishLeave.current = null;
        }));
        whenTransitionEnds(el, onEnd, type);
      });
    }
  }, [
    type,
    visible,
    leaveActiveClass,
    leaveFromClass,
    leaveToClass,
    onBeforeLeave,
    onLeave,
    onAfterLeave,
  ]);

  const ref = useCallback(
    (el: HTMLElement | null) => {
      elRef.current = el;
      if (el) {
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
        addClass(el, fromClass);
        addClass(el, activeClass);
        beforeHook && beforeHook(el);
        nextFrame(() => {
          removeClass(el, fromClass);
          addClass(el, toClass);
          hook && hook(el);
          const onEnd = (finishEnter.current = once(() => {
            removeClass(el, toClass);
            removeClass(el, activeClass);
            afterHook && afterHook(el);
            finishEnter.current = null;
          }));
          whenTransitionEnds(el, onEnd, type);
        });
      }
    },
    [
      type,
      appear,
      appearFromClass,
      appearActiveClass,
      appearToClass,
      enterFromClass,
      enterActiveClass,
      enterToClass,
      isMounted,
      onBeforeAppear,
      onAppear,
      onAfterAppear,
      onBeforeEnter,
      onEnter,
      onAfterEnter,
    ]
  );

  if (!localVisible) return null;

  const child = React.Children.only(children) as React.ReactElement;

  const el = React.cloneElement(child, {
    ref,
    ...child.props,
  });

  return el;
};

export default Transition;
