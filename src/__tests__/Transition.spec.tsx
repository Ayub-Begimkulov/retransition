import React from "react";
import { Transition } from "index";
import { render } from "@testing-library/react";

const duration = 50;
const buffer = 5;

function nextFrame() {
  return new Promise(res => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        res();
      });
    });
  });
}

function classList(el: Element) {
  return [...el.classList];
}

function transitionFinishes() {
  return new Promise(res => setTimeout(res, duration + buffer));
}

describe("Transition", () => {
  beforeEach(() => {
    const gCS = window.getComputedStyle;
    window.getComputedStyle = function (...args) {
      return {
        ...gCS(...args),
        transitionDuration: `${duration / 1000}s`,
        transitionDelay: "0s",
        animationDuration: `${duration / 1000}s`,
        animationDelay: "0s",
      };
    };
    const style = document.createElement("style");
    style.innerHTML = `
      .test-enter-from, .test-leave-to {
        opacity: 0;
      }
      .test-enter-active {
        transition: opacity ${duration}ms ease;
      }
      .test-enter-to, .test-leave-from {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  });

  it("should ", async () => {
    const { rerender } = render(
      <Transition visible={false} name="test">
        <div id="test"></div>
      </Transition>
    );

    rerender(
      <Transition visible={true} name="test">
        <div id="test"></div>
      </Transition>
    );

    const el = document.getElementById("test")!;
    expect(classList(el)).toEqual(["test-enter-from", "test-enter-active"]);
    await nextFrame();
    expect(classList(el)).toEqual(["test-enter-active", "test-enter-to"]);
    await transitionFinishes();
    expect(classList(el)).toEqual([]);
  });
});
