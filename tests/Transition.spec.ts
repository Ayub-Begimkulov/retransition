import path from "path";
import { TransitionProps } from "../src/Transition";
import { AnyFunction, AnyObject } from "../src/types";
import { setupPuppeteer } from "./test-utils";

export function omitBy<T extends AnyObject>(
  obj: T,
  predicate: (val: T[keyof T], key: keyof T) => boolean
) {
  return Object.keys(obj).reduce((acc, c: keyof T) => {
    if (predicate(obj[c], c)) {
      acc[c] = obj[c];
    }
    return acc;
  }, {} as T);
}

describe("Transition", () => {
  const {
    page,
    timeout,
    nextFrame,
    html,
    classList,
    isVisible,
  } = setupPuppeteer();
  const baseUrl = `file://${path.resolve(__dirname, "dist", "index.html")}`;

  const duration = 50;
  const buffer = 5;

  const transitionFinish = (time = duration) => timeout(time + buffer);

  const render = async (props: Partial<TransitionProps> = {}) => {
    const keys = Object.keys(props) as (keyof typeof props)[];

    await Promise.all(
      keys
        .filter(v => typeof props[v] === "function")
        .map(key => page().exposeFunction(key, props[key] as AnyFunction))
    );
    const rest = omitBy(props, v => v !== "function");
    return page().evaluate(
      function (this: any, props, keys: string[]) {
        const resultProps = {} as any;
        keys.forEach(key => {
          if (props[key] !== undefined) {
            resultProps[key] = props[key];
          } else {
            resultProps[key] = () => this[key]();
          }
        });
        return new Promise(res =>
          this.render(resultProps, () => {
            Promise.resolve().then(() => {
              res(
                document
                  .querySelector("#transition-element")
                  ?.className.split(/\s+/g)
              );
            });
          })
        );
      },
      rest as any,
      keys
    );
  };

  beforeEach(async () => {
    await page().goto(baseUrl);
    await page().waitForSelector("#app");
  });

  it("basic transition", async () => {
    await render();
    // enter
    const enterClasses = await render({ visible: true });
    expect(enterClasses).toEqual([
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
    const leaveClasses = await render({ visible: false });
    expect(leaveClasses).toEqual([
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
    await render();
    // enter
    const enterClasses = await render({ visible: true, name: "test" });
    expect(enterClasses).toEqual(["test-enter-from", "test-enter-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-enter-active",
      "test-enter-to",
    ]);
    await transitionFinish();
    expect(await classList("#transition-element")).toEqual([]);

    // leave
    const leaveClasses = await render({ visible: false });
    expect(leaveClasses).toEqual(["test-leave-from", "test-leave-active"]);
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
    await render(classes);

    // enter
    const enterClasses = await render({ visible: true });
    expect(enterClasses).toEqual([
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
    const leaveClasses = await render({ visible: false });
    expect(leaveClasses).toEqual([
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
    const appearClasses = await render({
      name: "test",
      appear: true,
      visible: true,
      appearFromClass: "test-appear-from",
      appearActiveClass: "test-appear-active",
      appearToClass: "test-appear-to",
    });

    // appear
    expect(appearClasses).toEqual(["test-appear-from", "test-appear-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-appear-active",
      "test-appear-to",
    ]);
    await transitionFinish();
    expect(await classList("#transition-element")).toEqual([]);

    // leave
    const leaveClasses = await render({ visible: false });
    expect(leaveClasses).toEqual(["test-leave-from", "test-leave-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-active",
      "test-leave-to",
    ]);
    await transitionFinish();
    expect(await html("#container")).toBe("");

    // enter;
    const enterClasses = await render({ visible: true });
    expect(enterClasses).toEqual(["test-enter-from", "test-enter-active"]);
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

    await render({
      name: "test",
      onBeforeEnter,
      onEnter,
      onAfterEnter,
      onBeforeLeave,
      onLeave,
      onAfterLeave,
    });

    // enter
    const enterClasses = await render({ visible: true });
    expect(enterClasses).toEqual(["test-enter-from", "test-enter-active"]);
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
    const leaveClasses = await render({ visible: false });
    expect(onBeforeLeave).toBeCalledTimes(1);
    expect(onLeave).toBeCalledTimes(1);
    expect(onAfterLeave).not.toBeCalled();
    expect(leaveClasses).toEqual(["test-leave-from", "test-leave-active"]);
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

    const appearClasses = await render({
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
    expect(appearClasses).toEqual(["test-appear-from", "test-appear-active"]);
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
    const leaveClasses = await render({ visible: false });
    expect(onBeforeLeave).toBeCalledTimes(1);
    expect(onLeave).toBeCalledTimes(1);
    expect(onAfterLeave).not.toBeCalled();
    expect(leaveClasses).toEqual(["test-leave-from", "test-leave-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-active",
      "test-leave-to",
    ]);
    await transitionFinish();
    expect(onAfterLeave).toBeCalledTimes(1);
    expect(await html("#container")).toBe("");

    // enter
    const enterClasses = await render({ visible: true });
    expect(enterClasses).toEqual(["test-enter-from", "test-enter-active"]);
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

    const appearClasses = await render({
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
    expect(appearClasses).toEqual(["test-enter-from", "test-enter-active"]);
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
    const leaveClasses = await render({ visible: false });
    expect(onBeforeLeave).toBeCalledTimes(1);
    expect(onLeave).toBeCalledTimes(1);
    expect(onAfterLeave).not.toBeCalled();
    expect(leaveClasses).toEqual(["test-leave-from", "test-leave-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-active",
      "test-leave-to",
    ]);
    await transitionFinish();
    expect(onAfterLeave).toBeCalledTimes(1);
    expect(await html("#container")).toBe("");

    // enter
    const enterClasses = await render({ visible: true });
    expect(enterClasses).toEqual(["test-enter-from", "test-enter-active"]);
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

  it("customAppear", async () => {
    const appearClasses = await render({
      visible: true,
      name: "test",
      appear: true,
      customAppear: true,
    });

    // appear
    expect(appearClasses).toEqual(["test-appear-from", "test-appear-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-appear-active",
      "test-appear-to",
    ]);
    await transitionFinish();
    expect(await classList("#transition-element")).toEqual([]);

    // leave
    const leaveClasses = await render({ visible: false });
    expect(leaveClasses).toEqual(["test-leave-from", "test-leave-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-active",
      "test-leave-to",
    ]);
    await transitionFinish();
    expect(await html("#container")).toBe("");

    // enter
    const enterClasses = await render({ visible: true });
    expect(enterClasses).toEqual(["test-enter-from", "test-enter-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-enter-active",
      "test-enter-to",
    ]);
    await transitionFinish();
    expect(await classList("#transition-element")).toEqual([]);
  });

  it.skip("customAppear no appear is passed", async () => {});
  it.skip("customAppear transition events", async () => {});

  it("no transition detected", async () => {
    await render({
      visible: false,
      name: "noop",
    });
    // enter
    const enterClasses = await render({ visible: true });
    expect(enterClasses).toEqual(["noop-enter-from", "noop-enter-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([]);
    // leave
    const leaveClasses = await render({ visible: false });
    expect(leaveClasses).toEqual(["noop-leave-from", "noop-leave-active"]);
    await nextFrame();
    expect(await html("#container")).toEqual("");
  });

  it("animation", async () => {
    await render();
    // enter
    const enterClasses = await render({ visible: true, name: "anim" });
    expect(enterClasses).toEqual(["anim-enter-from", "anim-enter-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "anim-enter-active",
      "anim-enter-to",
    ]);
    await transitionFinish();
    expect(await classList("#transition-element")).toEqual([]);

    // leave
    const leaveClasses = await render({ visible: false });
    expect(leaveClasses).toEqual(["anim-leave-from", "anim-leave-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "anim-leave-active",
      "anim-leave-to",
    ]);
    await transitionFinish();
    expect(await html("#container")).toBe("");
  });

  it("transition with `unmount: false`", async () => {
    await render({
      visible: false,
      name: "test",
      unmount: false,
    });

    expect(await isVisible("#transition-element")).toBe(false);

    // enter
    const enterClasses = await render({ visible: true });
    expect(enterClasses).toEqual(["test-enter-from", "test-enter-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-enter-active",
      "test-enter-to",
    ]);
    await transitionFinish();
    expect(await classList("#transition-element")).toEqual([]);

    // leave
    const leaveClasses = await render({ visible: false });
    expect(leaveClasses).toEqual(["test-leave-from", "test-leave-active"]);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-active",
      "test-leave-to",
    ]);
    await transitionFinish();
    expect(await isVisible("#transition-element")).toBe(false);
  });

  it.todo("explicit type");

  it.todo("transition cancel (enter/leave)");

  it.todo("warn if wrong children");

  it.todo(
    "`unmount: false, visible: false` shouldn't run enter animation on initial render"
    // async () => {}
  );
});
