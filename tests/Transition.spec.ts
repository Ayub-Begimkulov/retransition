import path from "path";
import { TransitionProps } from "Transition";
import { AnyFunction } from "types";
import { setupPuppeteer } from "./test-utils";

describe("Transition", () => {
  const { page, timeout, nextFrame, html, classList, click } = setupPuppeteer();
  const baseUrl = `file://${path.resolve(__dirname, "dist", "index.html")}`;

  const duration = 50;
  const buffer = 5;

  const transitionFinish = (time = duration) => timeout(time + buffer);

  const updateProps = async (props: Partial<TransitionProps> = {}) => {
    const keys = Object.keys(props) as (keyof typeof props)[];
    await Promise.all(
      keys
        .filter(key => typeof props[key] === "function")
        .map(key => page().exposeFunction(key, props[key] as AnyFunction))
    );
    const rest = Object.fromEntries(
      Object.entries(props).filter(([, value]) => typeof value !== "function")
    );
    return page().evaluate(
      (props, keys: string[]) => {
        const resultProps = {} as any;
        keys.forEach(key => {
          if (props[key] !== undefined) {
            resultProps[key] = props[key];
          } else {
            resultProps[key] = function () {
              (window as any)[key]();
            };
          }
        });
        (window as any).setProps(resultProps);
      },
      rest as any,
      keys
    );
  };

  const mount = async (props?: Partial<TransitionProps>) => {
    await updateProps(props);
    return page().evaluate(() => {
      (window as any).mount();
    });
  };

  beforeEach(async () => {
    await page().goto(baseUrl);
    await page().waitForSelector("#app");
  });

  it("basic transition", async () => {
    await mount();
    // enter
    await click("#btn");
    expect(await classList("#transition-element")).toEqual([
      "transition-enter-from",
      "transition-enter-active",
    ]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "transition-enter-active",
      "transition-enter-to",
    ]);
    await transitionFinish();
    expect(await classList("#transition-element")).toEqual([]);

    // leave
    await click("#btn");
    expect(await classList("#transition-element")).toEqual([
      "transition-leave-from",
      "transition-leave-active",
    ]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "transition-leave-active",
      "transition-leave-to",
    ]);
    await transitionFinish();
    expect(await html("#container")).toBe("");
  });

  it("named transition", async () => {
    await mount({ name: "test" });

    // enter
    await click("#btn");
    expect(await classList("#transition-element")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-enter-active",
      "test-enter-to",
    ]);
    await transitionFinish();
    expect(await classList("#transition-element")).toEqual([]);

    // leave
    await click("#btn");
    expect(await classList("#transition-element")).toEqual([
      "test-leave-from",
      "test-leave-active",
    ]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-active",
      "test-leave-to",
    ]);
    await transitionFinish();
    expect(await html("#container")).toBe("");
  });

  it("custom classes", async () => {
    const classes = {
      enterFromClass: "enter-step-1",
      enterActiveClass: "enter-step-2",
      enterToClass: "enter-step-3",
      leaveFromClass: "leave-step-1",
      leaveActiveClass: "leave-step-2",
      leaveToClass: "leave-step-3",
    };
    await mount(classes);

    // enter
    await click("#btn");
    expect(await classList("#transition-element")).toEqual([
      classes.enterFromClass,
      classes.enterActiveClass,
    ]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      classes.enterActiveClass,
      classes.enterToClass,
    ]);
    await transitionFinish();
    expect(await classList("#transition-element")).toEqual([]);

    // leave
    await click("#btn");
    expect(await classList("#transition-element")).toEqual([
      classes.leaveFromClass,
      classes.leaveActiveClass,
    ]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      classes.leaveActiveClass,
      classes.leaveToClass,
    ]);
    await transitionFinish();
    expect(await html("#container")).toBe("");
  });

  it("appear", async () => {
    await mount({
      name: "test",
      appear: true,
      visible: true,
      appearFromClass: "test-appear-from",
      appearActiveClass: "test-appear-active",
      appearToClass: "test-appear-to",
    });

    // appear
    expect(await classList("#transition-element")).toEqual([
      "test-appear-from",
      "test-appear-active",
    ]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-appear-active",
      "test-appear-to",
    ]);
    await transitionFinish();
    expect(await classList("#transition-element")).toEqual([]);

    // leave
    await click("#btn");
    expect(await classList("#transition-element")).toEqual([
      "test-leave-from",
      "test-leave-active",
    ]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-active",
      "test-leave-to",
    ]);
    await transitionFinish();
    expect(await html("#container")).toBe("");

    // enter;
    await click("#btn");
    expect(await classList("#transition-element")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-enter-active",
      "test-enter-to",
    ]);
    await transitionFinish();
    expect(await classList("#transition-element")).toEqual([]);
  });

  it("transition events", async () => {
    const onBeforeEnter = jest.fn();
    const onEnter = jest.fn();
    const onAfterEnter = jest.fn();
    const onBeforeLeave = jest.fn();
    const onLeave = jest.fn();
    const onAfterLeave = jest.fn();

    await mount({
      name: "test",
      onBeforeEnter: onBeforeEnter,
      onEnter: onEnter,
      onAfterEnter: onAfterEnter,
      onBeforeLeave: onBeforeLeave,
      onLeave: onLeave,
      onAfterLeave: onAfterLeave,
    });

    // enter
    await click("#btn");
    expect(await classList("#transition-element")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    expect(onBeforeEnter).toBeCalledTimes(1);
    expect(onEnter).toBeCalledTimes(1);
    expect(onAfterEnter).not.toBeCalled();
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-enter-active",
      "test-enter-to",
    ]);
    await transitionFinish();
    expect(onAfterEnter).toBeCalledTimes(1);
    expect(await classList("#transition-element")).toEqual([]);

    // leave
    await click("#btn");
    expect(onBeforeLeave).toBeCalledTimes(1);
    expect(onLeave).toBeCalledTimes(1);
    expect(onAfterLeave).not.toBeCalled();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-from",
      "test-leave-active",
    ]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-active",
      "test-leave-to",
    ]);
    await transitionFinish();
    expect(onAfterLeave).toBeCalledTimes(1);
    expect(await html("#container")).toBe("");
  });

  it("transition events w/ appear", async () => {
    const onBeforeEnter = jest.fn();
    const onEnter = jest.fn();
    const onAfterEnter = jest.fn();
    const onBeforeLeave = jest.fn();
    const onLeave = jest.fn();
    const onAfterLeave = jest.fn();
    const onBeforeAppear = jest.fn();
    const onAppear = jest.fn();
    const onAfterAppear = jest.fn();

    await mount({
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
    });

    // appear
    expect(await classList("#transition-element")).toEqual([
      "test-appear-from",
      "test-appear-active",
    ]);
    expect(onBeforeAppear).toBeCalledTimes(1);
    expect(onAppear).toBeCalledTimes(1);
    expect(onAfterAppear).not.toBeCalled();
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-appear-active",
      "test-appear-to",
    ]);
    await transitionFinish();
    expect(onAfterAppear).toBeCalledTimes(1);
    expect(await classList("#transition-element")).toEqual([]);

    // leave
    await click("#btn");
    expect(onBeforeLeave).toBeCalledTimes(1);
    expect(onLeave).toBeCalledTimes(1);
    expect(onAfterLeave).not.toBeCalled();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-from",
      "test-leave-active",
    ]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-active",
      "test-leave-to",
    ]);
    await transitionFinish();
    expect(onAfterLeave).toBeCalledTimes(1);
    expect(await html("#container")).toBe("");

    // enter
    await click("#btn");
    expect(await classList("#transition-element")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    expect(onBeforeEnter).toBeCalledTimes(1);
    expect(onEnter).toBeCalledTimes(1);
    expect(onAfterEnter).not.toBeCalled();
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-enter-active",
      "test-enter-to",
    ]);
    await transitionFinish();
    expect(onAfterEnter).toBeCalledTimes(1);
    expect(await classList("#transition-element")).toEqual([]);
  });

  it("transition events w/ appear, calls enter events if no appear one passed", async () => {
    const onBeforeEnter = jest.fn();
    const onEnter = jest.fn();
    const onAfterEnter = jest.fn();
    const onBeforeLeave = jest.fn();
    const onLeave = jest.fn();
    const onAfterLeave = jest.fn();

    await mount({
      visible: true,
      name: "test",
      appear: true,
      onBeforeEnter,
      onEnter,
      onAfterEnter,
      onBeforeLeave,
      onLeave,
      onAfterLeave,
    });

    // appear
    expect(await classList("#transition-element")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    expect(onBeforeEnter).toBeCalledTimes(1);
    expect(onEnter).toBeCalledTimes(1);
    expect(onAfterEnter).not.toBeCalled();
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-enter-active",
      "test-enter-to",
    ]);
    await transitionFinish();
    expect(onAfterEnter).toBeCalledTimes(1);
    expect(await classList("#transition-element")).toEqual([]);

    // leave
    await click("#btn");
    expect(onBeforeLeave).toBeCalledTimes(1);
    expect(onLeave).toBeCalledTimes(1);
    expect(onAfterLeave).not.toBeCalled();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-from",
      "test-leave-active",
    ]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-active",
      "test-leave-to",
    ]);
    await transitionFinish();
    expect(onAfterLeave).toBeCalledTimes(1);
    expect(await html("#container")).toBe("");

    // enter
    await click("#btn");
    expect(await classList("#transition-element")).toEqual([
      "test-enter-from",
      "test-enter-active",
    ]);
    expect(onBeforeEnter).toBeCalledTimes(2);
    expect(onEnter).toBeCalledTimes(2);
    expect(onAfterEnter).not.toBeCalledTimes(2);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-enter-active",
      "test-enter-to",
    ]);
    await transitionFinish();
    expect(onAfterEnter).toBeCalledTimes(2);
    expect(await classList("#transition-element")).toEqual([]);
  });

  it.todo("no transition detected");

  it.todo("animation");

  it.todo("explicit type");

  it.todo("transition w/ display: none/no unmount");

  it.todo("transition cancel (enter/leave)");

  it.todo("warn if wrong children");
});
