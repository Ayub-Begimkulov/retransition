import path from "path";
import { setupPlaywright } from "./test-utils";
import type { TransitionProps } from "../src";

declare const React: typeof global.React;

describe("Transition", () => {
  const { page, timeout, nextFrame, html, classList, isVisible, makeRender } =
    setupPlaywright();
  const baseUrl = `file://${path.resolve(__dirname, "transition.html")}`;

  const duration = 50;
  const buffer = 5;

  const transitionFinish = (time = duration) => timeout(time + buffer);

  const render = makeRender(
    props => {
      const Transition: React.FC<TransitionProps> = (window as any).Retransition
        .Transition;
      return (
        <div id="container">
          <Transition {...props}>
            {({ ref }) => <div ref={ref} id="transition-element"></div>}
          </Transition>
        </div>
      );
    },
    res =>
      Promise.resolve().then(() => {
        const el = document.querySelector("#transition-element");
        const classes = el && el.className.split(/\s+/g);
        res(classes);
      })
  );

  beforeEach(async () => {
    await page().goto(baseUrl);
    await page().waitForSelector("#app", { state: "attached" });
  });

  it("basic transition", async () => {
    await render({});
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
    await render({});
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

  it("transition events w/ appear, calls enter events if no appear events passed", async () => {
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

  it("customAppear w/ transition events", async () => {
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
      customAppear: true,
      onBeforeEnter,
      onEnter,
      onAfterEnter,
      onBeforeLeave,
      onLeave,
      onAfterLeave,
      onBeforeAppear,
      onAppear,
      onAfterAppear,
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

  it("customAppear enter events are not used as default values", async () => {
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
      customAppear: true,
      onBeforeEnter,
      onEnter,
      onAfterEnter,
      onBeforeLeave,
      onLeave,
      onAfterLeave,
    });

    // appear
    expect(appearClasses).toEqual(["test-appear-from", "test-appear-active"]);
    expect(onBeforeEnter).not.toBeCalled();
    expect(onEnter).not.toBeCalled();
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-appear-active",
      "test-appear-to",
    ]);
    await transitionFinish();
    expect(onAfterEnter).not.toBeCalledTimes(1);
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
    expect(onAfterEnter).not.toBeCalledTimes(1);
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-enter-active",
      "test-enter-to",
    ]);
    await transitionFinish();
    expect(onAfterEnter).toBeCalledTimes(1);
    expect(await classList("#transition-element")).toEqual([]);
  });

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
    await render({});
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

  it("appear w/ `unmount: false`", async () => {
    const appearClasses = await render({
      visible: true,
      name: "test",
      unmount: false,
      appear: true,
      customAppear: true,
    });

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
  });

  it.todo("explicit type");

  it("transition cancel (appear/enter/leave)", async () => {
    const onEnterCancelled = jest.fn();
    const onAfterEnter = jest.fn();
    const onLeaveCancelled = jest.fn();
    const onAfterLeave = jest.fn();
    const onAppearCancelled = jest.fn();
    const onAfterAppear = jest.fn();

    const appearClasses = await render({
      visible: true,
      name: "test",
      appear: true,
      onAfterEnter,
      onEnterCancelled,
      onAfterLeave,
      onLeaveCancelled,
      onAfterAppear,
      onAppearCancelled,
    });

    // appear
    expect(appearClasses).toEqual(["test-enter-from", "test-enter-active"]);
    expect(onAppearCancelled).not.toBeCalled();
    expect(onAfterAppear).not.toBeCalled();
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-enter-active",
      "test-enter-to",
    ]);

    // leave
    let leaveClasses = await render({ visible: false });
    expect(leaveClasses).toEqual(["test-leave-from", "test-leave-active"]);
    expect(onAppearCancelled).toBeCalled();
    expect(onAfterAppear).not.toBeCalled();
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-active",
      "test-leave-to",
    ]);

    // enter
    const enterClasses = await render({ visible: true });
    expect(enterClasses).toEqual(["test-enter-from", "test-enter-active"]);
    expect(onLeaveCancelled).toBeCalled();
    expect(onAfterLeave).not.toBeCalled();
    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-enter-active",
      "test-enter-to",
    ]);

    leaveClasses = await render({ visible: false });
    expect(leaveClasses).toEqual(["test-leave-from", "test-leave-active"]);
    expect(onAfterEnter).not.toBeCalled();
    expect(onEnterCancelled).toBeCalled();

    await nextFrame();
    expect(await classList("#transition-element")).toEqual([
      "test-leave-active",
      "test-leave-to",
    ]);
    await transitionFinish();
    expect(await html("#container")).toBe("");
  });

  it("warn if wrong children", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error");

    await page().evaluate(() => {
      return new Promise(res => {
        const { React, ReactDOM, Retransition } = window as any;
        const { Transition } = Retransition;
        const baseElement = document.querySelector("#app")!;

        ReactDOM.render(
          <Transition visible={true}></Transition>,
          baseElement,
          res
        );
      });
    });

    expect(consoleErrorSpy).toBeCalled();
  });

  it.each(["object", "function"])("should work with %s refs", async refType => {
    // ref mount
    let passed = await page().evaluate(
      ({ refType }) => {
        return new Promise(res => {
          const { React, ReactDOM, Retransition } = window as any;
          const Transition: React.FC<TransitionProps> = Retransition.Transition;
          const baseElement = document.querySelector("#app")!;
          let ref: any;
          const Component = () => {
            ref =
              refType === "object"
                ? React.useRef(null)
                : (el: any) => (ref = { current: el });
            React.useEffect(() => {
              if (ref.current instanceof HTMLElement) {
                return res(true);
              }
              res(false);
            }, []);
            return (
              <Transition visible={true} nodeRef={ref}>
                {({ ref }) => <div ref={ref}>Hello world</div>}
              </Transition>
            );
          };
          ReactDOM.render(<Component />, baseElement);
        });
      },
      { refType }
    );
    expect(passed).toBe(true);
    // ref unmount
    passed = await page().evaluate(
      ({ refType }) => {
        return new Promise(res => {
          const { React, ReactDOM, Retransition } = window as any;
          const Transition: React.FC<TransitionProps> = Retransition.Transition;
          const baseElement = document.querySelector("#app")!;
          let ref: any;
          const Component = ({ visible = true }) => {
            ref =
              refType === "object"
                ? React.useRef(null)
                : (el: any) => (ref = { current: el });
            return visible ? (
              <Transition visible={true} nodeRef={ref}>
                {({ ref }) => <div ref={ref}>Hello world</div>}
              </Transition>
            ) : null;
          };
          ReactDOM.render(<Component />, baseElement, () => {
            if (!(ref.current instanceof HTMLElement)) {
              throw new Error("didn't assigned ref");
            }
            ReactDOM.render(<Component visible={false} />, baseElement, () => {
              // the ref was cleanedup
              if (ref.current === null) {
                return res(true);
              }
              res(false);
            });
          });
        });
      },
      { refType }
    );
    expect(passed).toBe(true);
  });

  it.skip("should not show error about unmounted component state modification", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error");

    await page().evaluate(() => {
      return new Promise(res => {
        const { React, ReactDOM, Retransition } = window as any;
        const Transition: React.FC<TransitionProps> = Retransition.Transition;
        const baseElement = document.querySelector("#app")!;

        const Component = () => {
          const [visible, setVisible] = React.useState(true);
          const [renderNull, setRenderNull] = React.useState(false);

          React.useEffect(() => {
            // will run leave animation
            setVisible(false);
            window.setTimeout(() => {
              // should trigger leave animation
              setRenderNull(true);
              setTimeout(() => {
                res(undefined);
              }, 100);
            }, 25);
          }, []);

          if (renderNull) {
            return null;
          }

          return (
            <Transition visible={visible} name="test">
              {({ ref }) => <div ref={ref}>Hello world</div>}
            </Transition>
          );
        };

        ReactDOM.render(<Component />, baseElement);
      });
    });

    expect(consoleErrorSpy).not.toBeCalled();
  });

  it.todo(
    "`unmount: false, visible: false` shouldn't run enter animation on initial render"
    // async () => {}
  );

  it.todo("should preserve elements display with unmount - false");
});
