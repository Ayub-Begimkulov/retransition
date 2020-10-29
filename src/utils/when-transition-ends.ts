import { AnyObject } from "types";

const ANIMATION = "animation";
const TRANSITION = "transition";

export type CSSTransitionType = typeof ANIMATION | typeof TRANSITION;

export function whenTransitionEnds(
  el: HTMLElement,
  cb: () => void,
  expectedType?: CSSTransitionType
) {
  const { type, timeout, propCount } = getTransitionInfo(el, expectedType);

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
  type: CSSTransitionType | null;
  propCount: number;
  timeout: number;
  hasTransform: boolean;
}

function getTransitionInfo(
  el: Element,
  expectedType?: CSSTransitionType
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
  const hasTransform =
    type === TRANSITION &&
    /\b(transform|all)(,|$)/.test(styles[TRANSITION + "Property"]);
  return {
    type,
    timeout,
    propCount,
    hasTransform,
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
