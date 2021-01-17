import React from "react";
import { screen } from "@testing-library/react";
import Transition from "../Transition";
import {
  classList,
  createTransitionStyles,
  makeRender,
  nextFrame,
  patchGetComputedStyle,
  transitionFinish,
} from "./test-utils";
import "@testing-library/jest-dom/extend-expect";

describe("Transition", () => {
  beforeAll(() => {
    createTransitionStyles();
    patchGetComputedStyle();
  });

  it("base transition", async () => {
    const render = makeRender((props: any) => {
      return (
        <Transition {...props}>
          <div id="root" data-testid={"root"}>
            Hello
          </div>
        </Transition>
      );
    });
    const { rerender } = render({ visible: false });

    // enter
    rerender({ visible: true });

    expect(classList("#root")).toEqual([
      "transition-enter-from",
      "transition-enter-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual([
      "transition-enter-active",
      "transition-enter-to",
    ]);
    await transitionFinish();
    expect(classList("#root")).toEqual([]);

    // leave
    rerender({ visible: false });

    expect(classList("#root")).toEqual([
      "transition-leave-from",
      "transition-leave-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual([
      "transition-leave-active",
      "transition-leave-to",
    ]);

    await transitionFinish();
    expect(screen.queryByTestId("root")).not.toBeInTheDocument();
  });

  it("named transition", async () => {
    const render = makeRender((props: any) => {
      return (
        <Transition {...props}>
          <div id="root" data-testid={"root"}>
            Hello
          </div>
        </Transition>
      );
    });
    const { rerender } = render({ visible: false, name: "test" });

    // enter
    rerender({ visible: true });

    expect(classList("#root")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual(["test-enter-active", "test-enter-to"]);
    await transitionFinish();
    expect(classList("#root")).toEqual([]);

    // leave
    rerender({ visible: false });

    expect(classList("#root")).toEqual([
      "test-leave-from",
      "test-leave-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual(["test-leave-active", "test-leave-to"]);

    await transitionFinish();
    expect(screen.queryByTestId("root")).not.toBeInTheDocument();
  });

  it("custom classes", async () => {
    const render = makeRender((props: any) => {
      return (
        <Transition {...props}>
          <div id="root" data-testid={"root"}>
            Hello
          </div>
        </Transition>
      );
    });

    const classes = {
      enterFromClass: "enter-step-1",
      enterActiveClass: "enter-step-2",
      enterToClass: "enter-step-3",
      leaveFromClass: "leave-step-1",
      leaveActiveClass: "leave-step-2",
      leaveToClass: "leave-step-3",
    };

    const { rerender } = render({ visible: false, ...classes });

    // enter
    rerender({ visible: true });

    expect(classList("#root")).toEqual([
      classes.enterFromClass,
      classes.enterActiveClass,
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual([
      classes.enterActiveClass,
      classes.enterToClass,
    ]);
    await transitionFinish();
    expect(classList("#root")).toEqual([]);

    // leave
    rerender({ visible: false });

    expect(classList("#root")).toEqual([
      classes.leaveFromClass,
      classes.leaveActiveClass,
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual([
      classes.leaveActiveClass,
      classes.leaveToClass,
    ]);
    await transitionFinish();
    expect(screen.queryByTestId("root")).not.toBeInTheDocument();
  });

  it("appear", async () => {
    const render = makeRender((props: any) => {
      return (
        <Transition {...props}>
          <div id="root" data-testid={"root"}>
            Hello
          </div>
        </Transition>
      );
    });

    const props = {
      name: "test",
      appear: true,
      visible: true,
      appearFromClass: "test-appear-from",
      appearActiveClass: "test-appear-active",
      appearToClass: "test-appear-to",
    };

    const { rerender } = render(props);

    // appear
    expect(classList("#root")).toEqual([
      "test-appear-from",
      "test-appear-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual([
      "test-appear-active",
      "test-appear-to",
    ]);
    await transitionFinish();
    expect(classList("#root")).toEqual([]);

    // leave
    rerender({ visible: false });
    expect(classList("#root")).toEqual([
      "test-leave-from",
      "test-leave-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual(["test-leave-active", "test-leave-to"]);
    await transitionFinish();
    expect(screen.queryByTestId("root")).not.toBeInTheDocument();

    // enter;
    rerender({ visible: true });
    expect(classList("#root")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual(["test-enter-active", "test-enter-to"]);
    await transitionFinish();
    expect(classList("#root")).toEqual([]);
  });

  it("transition events", async () => {
    const render = makeRender((props: any) => {
      return (
        <Transition {...props}>
          <div id="root" data-testid={"root"}>
            Hello
          </div>
        </Transition>
      );
    });

    const onBeforeEnter = jest.fn();
    const onEnter = jest.fn();
    const onAfterEnter = jest.fn();
    const onBeforeLeave = jest.fn();
    const onLeave = jest.fn();
    const onAfterLeave = jest.fn();

    const props = {
      name: "test",
      onBeforeEnter,
      onEnter,
      onAfterEnter,
      onBeforeLeave,
      onLeave,
      onAfterLeave,
    };

    const { rerender } = render(props);

    // enter
    rerender({ visible: true });

    expect(classList("#root")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    expect(onBeforeEnter).toBeCalledTimes(1);
    expect(onEnter).toBeCalledTimes(1);
    expect(onAfterEnter).not.toBeCalled();
    await nextFrame();
    expect(classList("#root")).toEqual(["test-enter-active", "test-enter-to"]);
    await transitionFinish();
    expect(onAfterEnter).toBeCalledTimes(1);
    expect(classList("#root")).toEqual([]);

    // leave
    rerender({ visible: false });

    expect(onBeforeLeave).toBeCalledTimes(1);
    expect(onLeave).toBeCalledTimes(1);
    expect(onAfterLeave).not.toBeCalled();
    expect(classList("#root")).toEqual([
      "test-leave-from",
      "test-leave-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual(["test-leave-active", "test-leave-to"]);
    await transitionFinish();
    expect(onAfterLeave).toBeCalledTimes(1);
    expect(screen.queryByTestId("root")).not.toBeInTheDocument();
  });

  it("transition events w/ appear", async () => {
    const render = makeRender((props: any) => {
      return (
        <Transition {...props}>
          <div id="root" data-testid={"root"}>
            Hello
          </div>
        </Transition>
      );
    });

    const onBeforeEnter = jest.fn();
    const onEnter = jest.fn();
    const onAfterEnter = jest.fn();
    const onBeforeLeave = jest.fn();
    const onLeave = jest.fn();
    const onAfterLeave = jest.fn();
    const onBeforeAppear = jest.fn();
    const onAppear = jest.fn();
    const onAfterAppear = jest.fn();

    const props = {
      visible: true,
      name: "test",
      appear: true,
      onBeforeEnter,
      onEnter,
      onAfterEnter,
      onBeforeLeave,
      onLeave,
      onAfterLeave,
      onBeforeAppear,
      onAppear,
      onAfterAppear,
      appearFromClass: "test-appear-from",
      appearActiveClass: "test-appear-active",
      appearToClass: "test-appear-to",
    };

    const { rerender } = render(props);

    // appear
    expect(classList("#root")).toEqual([
      "test-appear-from",
      "test-appear-active",
    ]);
    expect(onBeforeAppear).toBeCalledTimes(1);
    expect(onAppear).toBeCalledTimes(1);
    expect(onAfterAppear).not.toBeCalled();
    await nextFrame();
    expect(classList("#root")).toEqual([
      "test-appear-active",
      "test-appear-to",
    ]);
    await transitionFinish();
    expect(onAfterAppear).toBeCalledTimes(1);
    expect(classList("#root")).toEqual([]);

    // leave
    rerender({ visible: false });
    expect(onBeforeLeave).toBeCalledTimes(1);
    expect(onLeave).toBeCalledTimes(1);
    expect(onAfterLeave).not.toBeCalled();
    expect(classList("#root")).toEqual([
      "test-leave-from",
      "test-leave-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual(["test-leave-active", "test-leave-to"]);
    await transitionFinish();
    expect(onAfterLeave).toBeCalledTimes(1);
    expect(screen.queryByTestId("root")).not.toBeInTheDocument();

    // enter
    rerender({ visible: true });
    expect(classList("#root")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    expect(onBeforeEnter).toBeCalledTimes(1);
    expect(onEnter).toBeCalledTimes(1);
    expect(onAfterEnter).not.toBeCalled();
    await nextFrame();
    expect(classList("#root")).toEqual(["test-enter-active", "test-enter-to"]);
    await transitionFinish();
    expect(onAfterEnter).toBeCalledTimes(1);
    expect(classList("#root")).toEqual([]);
  });

  it("transition events w/ appear, calls enter events if no appear one passed", async () => {
    const render = makeRender((props: any) => {
      return (
        <Transition {...props}>
          <div id="root" data-testid={"root"}>
            Hello
          </div>
        </Transition>
      );
    });

    const onBeforeEnter = jest.fn();
    const onEnter = jest.fn();
    const onAfterEnter = jest.fn();
    const onBeforeLeave = jest.fn();
    const onLeave = jest.fn();
    const onAfterLeave = jest.fn();

    const props = {
      visible: true,
      name: "test",
      appear: true,
      onBeforeEnter,
      onEnter,
      onAfterEnter,
      onBeforeLeave,
      onLeave,
      onAfterLeave,
    };

    const { rerender } = render(props);

    // appear
    expect(classList("#root")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    expect(onBeforeEnter).toBeCalledTimes(1);
    expect(onEnter).toBeCalledTimes(1);
    expect(onAfterEnter).not.toBeCalled();
    await nextFrame();
    expect(classList("#root")).toEqual(["test-enter-active", "test-enter-to"]);
    await transitionFinish();
    expect(onAfterEnter).toBeCalledTimes(1);
    expect(classList("#root")).toEqual([]);

    // leave
    rerender({ visible: false });
    expect(onBeforeLeave).toBeCalledTimes(1);
    expect(onLeave).toBeCalledTimes(1);
    expect(onAfterLeave).not.toBeCalled();
    expect(classList("#root")).toEqual([
      "test-leave-from",
      "test-leave-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual(["test-leave-active", "test-leave-to"]);
    await transitionFinish();
    expect(onAfterLeave).toBeCalledTimes(1);
    expect(screen.queryByTestId("root")).not.toBeInTheDocument();

    // enter
    rerender({ visible: true });
    expect(classList("#root")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    expect(onBeforeEnter).toBeCalledTimes(2);
    expect(onEnter).toBeCalledTimes(2);
    expect(onAfterEnter).not.toBeCalledTimes(2);
    await nextFrame();
    expect(classList("#root")).toEqual(["test-enter-active", "test-enter-to"]);
    await transitionFinish();
    expect(onAfterEnter).toBeCalledTimes(2);
    expect(classList("#root")).toEqual([]);
  });

  it.todo("no transition detected");

  it("animation", async () => {
    const render = makeRender((props: any) => {
      return (
        <Transition {...props}>
          <div id="root" data-testid={"root"}>
            Hello
          </div>
        </Transition>
      );
    });

    const { rerender } = render({ visible: false, name: "anim" });

    // enter
    rerender({ visible: true });
    expect(classList("#root")).toEqual([
      "anim-enter-from",
      "anim-enter-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual(["anim-enter-active", "anim-enter-to"]);
    await transitionFinish();
    expect(classList("#root")).toEqual([]);

    // leave
    rerender({ visible: false });
    expect(classList("#root")).toEqual([
      "anim-leave-from",
      "anim-leave-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual(["anim-leave-active", "anim-leave-to"]);
    await transitionFinish();
    expect(screen.queryByTestId("root")).not.toBeInTheDocument();
  });

  it.todo("explicit type");

  it("transition w/ display: none/no unmount", async () => {
    const render = makeRender((props: any) => {
      return (
        <Transition {...props}>
          <div id="root" data-testid={"root"}>
            Hello
          </div>
        </Transition>
      );
    });

    const props = {
      visible: false,
      name: "test",
      unmount: false,
    };

    const { rerender, debug } = render(props);
    expect(screen.getByTestId("root")).toHaveStyle({ display: "none" });

    // enter
    debug();
    rerender({ visible: true });
    expect(classList("#root")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual(["test-enter-active", "test-enter-to"]);
    await transitionFinish();
    expect(classList("#root")).toEqual([]);

    // leave
    rerender({ visible: false });
    expect(classList("#root")).toEqual([
      "test-leave-from",
      "test-leave-active",
    ]);
    await nextFrame();
    expect(classList("#root")).toEqual(["test-leave-active", "test-leave-to"]);
    await transitionFinish();
    expect(screen.queryByTestId("root")).toBeInTheDocument();
    expect(screen.queryByTestId("root")).toHaveStyle({ display: "none" });
  });

  it.todo("transition cancel (enter/leave)");

  it.todo("warn if wrong children");
});
