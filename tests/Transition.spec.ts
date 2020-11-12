import path from "path";
import { TransitionProps } from "Transition";
import { AnyFunction } from "types";
import { setupPuppeteer } from "./test-utils";

jest.setTimeout(100000);

describe("Transition", () => {
  const { page, timeout, nextFrame, html, classList, click } = setupPuppeteer();

  const baseUrl = `file://${path.resolve(__dirname, "dist", "index.html")}`;

  const duration = 50;
  const buffer = 5;

  const transitionFinish = (time = duration) => timeout(time + buffer);

  const updateProps = (props: Partial<TransitionProps>) => {
    const keys = Object.keys(props);
    Object.entries(props)
      .filter(([, value]) => typeof value === "function")
      .forEach(([key, value]) => {
        page().exposeFunction(key, value as AnyFunction);
      });
    const rest = Object.fromEntries(
      Object.entries(props).filter(([, value]) => typeof value !== "function")
    );
    return page().evaluate(
      (props, keys: string[]) => {
        debugger;
        const resultProps = {} as any;
        keys.forEach(key => {
          if (props[key] !== undefined) {
            resultProps[key] = props[key];
          } else {
            debugger;
            // @ts-ignore
            console.log(window[key], typeof window[key]);
            resultProps[key] = (window as any)[key];
          }
        });
        (window as any).setProps(props);
      },
      rest as any,
      keys
    );
  };

  beforeEach(async () => {
    await page().goto(baseUrl);
    await page().waitForSelector("#app");
  });

  it("test asdf", async () => {
    page().evaluate(() => {
      debugger;
    });
    const spy = jest.fn();
    await updateProps({ onBeforeEnter: spy });
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
    expect(spy).toBeCalled();
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

  it("basic transition", async () => {
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
    await updateProps({ name: "test" });

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
    await updateProps(classes);

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

  // TODO find a way to set props before mount
  xit("appear", async () => {
    await updateProps({
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

  it.todo("transition events");
  it.todo("transition events w/ appear");
  it.todo("no transition detected");
  it.todo("animation");
  it.todo("explicit type");
  it.todo("transition w/ display: none/no unmount");
  it.todo("transition cancel (enter/leave)");
  it.todo("warn if wrong children");
});
