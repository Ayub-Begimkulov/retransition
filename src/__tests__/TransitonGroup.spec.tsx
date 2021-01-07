import React from "react";
import Transition from "../Transition";
import TransitionGroup from "../TransitionGroup";
import {
  createTransitionStyles,
  patchGetComputedStyle,
  makeRender,
  nextFrame,
  transitionFinish,
} from "./test-utils";

const html = (selector: string) => {
  const el = document.querySelector(selector);
  if (!el)
    throw new Error(`element with selector ${selector} is not in the document`);
  return el.innerHTML;
};

describe("TransitionGroup", () => {
  beforeAll(() => {
    createTransitionStyles();
    patchGetComputedStyle();
  });
  it.todo("basic");

  it.todo("appear");

  it.todo("name");

  it.todo("preserves correct order");

  it("add element", async () => {
    const render = makeRender(({ elements }) => {
      return (
        <div id="root" data-testid="root">
          <TransitionGroup appear={false}>
            {elements.map((e: number) => (
              <Transition key={"$" + e}>
                <div>{e}</div>
              </Transition>
            ))}
          </TransitionGroup>
        </div>
      );
    });
    const { rerender } = render({ elements: [1, 2] });

    expect(html("#root")).toBe(`<div>1</div><div>2</div>`);

    rerender({ elements: [1, 3, 2] });

    expect(html("#root")).toBe(
      `<div>1</div>` +
        `<div class="transition-enter-from transition-enter-active">3</div>` +
        `<div class="transition-move">2</div>`
    );

    await nextFrame();

    expect(html("#root")).toBe(
      `<div>1</div>` +
        `<div class="transition-enter-active transition-enter-to">3</div>` +
        `<div class="transition-move">2</div>`
    );

    await transitionFinish();

    expect(html("#root")).toBe(
      `<div>1</div>` + `<div>3</div>` + `<div>2</div>`
    );
  });

  it.todo("remove element");

  it.todo("warns no keys");
});
