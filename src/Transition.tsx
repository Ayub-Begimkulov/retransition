import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnyObject } from "types";

const TRANSITION = "transition";
const ANIMATION = "animation";

interface TransitionProps {
  visible: boolean;
  name?: string;
  type?: typeof TRANSITION | typeof ANIMATION;
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
}

const Transition: React.FC<TransitionProps> = ({
  visible,
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
  children,
}) => {
  const [localVisible, setLocalVisible] = useState(visible);
  const elRef = useRef<HTMLElement | null>(null);
  const isMounted = useIsMounted();

  useLayoutEffect(() => {
    if (visible) {
      setLocalVisible(true);
    } else if (elRef.current) {
      const el = elRef.current;
      addClass(el, leaveFromClass);
      addClass(el, leaveActiveClass);
      nextFrame(() => {
        removeClass(el, leaveFromClass);
        addClass(el, leaveToClass);
        whenTransitionEnds(el, undefined, () => {
          removeClass(el, leaveToClass);
          removeClass(el, leaveActiveClass);
          setLocalVisible(false);
        });
      });
    }
  }, [visible]);

  const ref = useCallback((el: HTMLElement | null) => {
    elRef.current = el;
    if (el) {
      if (!appear && !isMounted.current) {
        return;
      }
      const isAppear = appear && !isMounted.current;
      addClass(el, isAppear ? appearFromClass : enterFromClass);
      addClass(el, isAppear ? appearActiveClass : enterActiveClass);
      nextFrame(() => {
        removeClass(el, isAppear ? appearFromClass : enterFromClass);
        addClass(el, isAppear ? appearToClass : enterToClass);
        whenTransitionEnds(el, undefined, () => {
          removeClass(el, isAppear ? appearToClass : enterToClass);
          removeClass(el, isAppear ? appearActiveClass : enterActiveClass);
        });
      });
    }
  }, []);

  if (!localVisible) return null;

  const child = React.Children.only(children) as React.ReactElement;

  const el = React.cloneElement(child, {
    ref,
    ...child.props,
  });

  return el;
};

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

function nextFrame(cb: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb);
  });
}

function addClass(el: Element, className: string) {
  className.split(/\s+/).forEach(c => el.classList.add(c));
}

function removeClass(el: Element, className: string) {
  className.split(/\s+/).forEach(c => el.classList.remove(c));
}

function whenTransitionEnds(
  el: Element,
  expectedType: TransitionProps["type"] | undefined,
  cb: () => void
) {
  const { type, timeout, propCount } = getTransitionInfo(el, expectedType);
  console.log(type, timeout);
  if (!type) {
    return cb();
  }

  const endEvent = type + "end";
  let ended = 0;
  const end = () => {
    el.removeEventListener(endEvent, onEnd);
    cb();
  };
  const onEnd = (e: Event) => {
    if (e.target === el) {
      if (++ended >= propCount) {
        end();
      }
    }
  };
  setTimeout(() => {
    if (ended < propCount) {
      end();
    }
  }, timeout + 1);
  el.addEventListener(endEvent, onEnd);
}

interface CSSTransitionInfo {
  type: typeof TRANSITION | typeof ANIMATION | null;
  propCount: number;
  timeout: number;
  // hasTransform: boolean;
}

function getTransitionInfo(
  el: Element,
  expectedType?: TransitionProps["type"]
): CSSTransitionInfo {
  const styles: AnyObject = window.getComputedStyle(el);
  // JSDOM may return undefined for transition properties
  const getStyleProperties = (key: string) => (styles[key] || "").split(", ");
  const transitionDelays = getStyleProperties(TRANSITION + "Delay");
  const transitionDurations = getStyleProperties(TRANSITION + "Duration");
  const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
  const animationDelays = getStyleProperties(ANIMATION + "Delay");
  const animationDurations = getStyleProperties(ANIMATION + "Duration");
  const animationTimeout = getTimeout(animationDelays, animationDurations);

  let type: CSSTransitionInfo["type"] = null;
  let timeout = 0;
  let propCount = 0;

  if (expectedType === TRANSITION) {
    if (transitionTimeout > 0) {
      type = TRANSITION;
      timeout = transitionTimeout;
      propCount = transitionDurations.length;
    }
  } else if (expectedType === ANIMATION) {
    if (animationTimeout > 0) {
      type = ANIMATION;
      timeout = animationTimeout;
      propCount = animationDurations.length;
    }
  } else {
    timeout = Math.max(transitionTimeout, animationTimeout);
    type =
      timeout > 0
        ? transitionTimeout > animationTimeout
          ? TRANSITION
          : ANIMATION
        : null;
    propCount = type
      ? type === TRANSITION
        ? transitionDurations.length
        : animationDurations.length
      : 0;
  }
  // const hasTransform =
  //   type === TRANSITION &&
  //   /\b(transform|all)(,|$)/.test(styles[TRANSITION + "Property"]);
  return {
    type,
    timeout,
    propCount,
    // hasTransform,
  };
}

function getTimeout(delays: string[], durations: string[]): number {
  while (delays.length < durations.length) {
    delays = delays.concat(delays);
  }
  return Math.max.apply(
    Math,
    durations.map((d, i) => toMs(d) + toMs(delays[i]))
  );
}

// Old versions of Chromium (below 61.0.3163.100) formats floating pointer
// numbers in a locale-dependent way, using a comma instead of a dot.
// If comma is not replaced with a dot, the input will be rounded down
// (i.e. acting as a floor function) causing unexpected behaviors
function toMs(s: string): number {
  return Number(s.slice(0, -1).replace(",", ".")) * 1000;
}

export default Transition;
