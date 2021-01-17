import { act, render } from "@testing-library/react";
import { AnyObject } from "../types";

export const DURATION = 50;
export const BUFFER = 5;

export const transitionFinish = () => {
  return act(
    () =>
      new Promise<void>(res => {
        setTimeout(() => res(), DURATION + BUFFER);
      })
  );
};

export const nextFrame = () => {
  return new Promise<void>(res => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => res());
    });
  });
};

export const classList = (selector: string) => {
  const el = document.querySelector(selector);
  if (!el)
    throw new Error(`element with selector ${selector} is not in the document`);
  return [...el.classList];
};

export function makeRender(fn: (props: AnyObject) => JSX.Element) {
  return function (props: AnyObject) {
    let lastProps = { ...props };
    const result = render(fn(props));
    return {
      ...result,
      rerender: (props: AnyObject) => {
        lastProps = { ...lastProps, ...props };
        result.rerender(fn(lastProps));
      },
    };
  };
}

export const createTransitionStyles = () => {
  const style = document.createElement("style");
  style.innerHTML = `
      // transition
      .transition-enter-from,
      .transition-leave-to,
      .test-enter-from,
      .test-appear-from,
      .test-leave-to,
      .enter-step-1,
      .leave-step-3 {
        opacity: 0;
      }
      .transition-enter-active,
      .transition-leave-active,
      .test-enter-active,
      .test-appear-active,
      .test-leave-active,
      .enter-step-2,
      .leave-step-2 {
        transition: opacity ${DURATION}ms ease;
      }
      .transition-enter-to,
      .transition-leave-from,
      .test-enter-to,
      .test-appear-to,
      .test-leave-from,
      .enter-step-3,
      .leave-step-1 {
        opacity: 1;
      }
      // animation
      .anim-leave-to,
      .anim-enter-from {
        opacity: 0;
      }
      .anim-enter-active {
        animation: test ${DURATION}ms ease 1;
      }
      .anim-leave-active {
        animation: test ${DURATION}ms ease 1 reverse;
      }
      .anim-leave-from,
      .anim-enter-to {
        opacity: 1;
      }
      @keyframes test {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
      .transition-move {
        transition: transform ${DURATION}ms ease;
      }
    `;
  document.head.appendChild(style);
};

export const patchGetComputedStyle = () => {
  const gcs = window.getComputedStyle;
  window.getComputedStyle = function (...args) {
    const result = gcs.apply(window, args);
    return {
      ...result,
      transitionDuration: `${DURATION / 1000}s`,
      transitionDelay: "0",
      animationDuration: `${DURATION / 1000}s`,
      animationDelay: "0",
    };
  };
};
