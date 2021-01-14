import path from "path";
import { TransitionGroupProps } from "../src/TransitionGroup";
import { AnyFunction, AnyObject } from "../src/types";
import { setupPuppeteer } from "./test-utils";

function omitBy<T extends AnyObject>(
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

describe("TransitionGroup", () => {
  const { page, timeout, html, nextFrame } = setupPuppeteer();
  const baseUrl = `file://${path.resolve(__dirname, "dist2", "index.html")}`;

  const duration = 50;
  const buffer = 5;

  const transitionFinish = (time = duration) => timeout(time + buffer);

  const render = async (
    props: Partial<TransitionGroupProps> & AnyObject = {}
  ) => {
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
        return new Promise(res => {
          this.render(resultProps, () => {
            Promise.resolve().then(() => {
              res(document.querySelector("#container")?.innerHTML);
            });
          });
        });
      },
      rest as any,
      keys
    );
  };

  beforeEach(async () => {
    await page().goto(baseUrl);
    await page().waitForSelector("#app");
  });

  it("add element", async () => {
    const initialHTML = await render({
      elements: [1, 2],
    });
    expect(initialHTML).toBe(`<div>1</div><div>2</div>`);

    const enterHTML = await render({
      elements: [1, 2, 3],
    });

    expect(enterHTML).toBe(
      `<div>1</div>` +
        `<div>2</div>` +
        `<div class="transition-enter-from transition-enter-active">3</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div>1</div>` +
        `<div>2</div>` +
        `<div class="transition-enter-active transition-enter-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(
      `<div>1</div><div>2</div><div class="">3</div>`
    );
  });

  it("remove element", async () => {
    await render({
      elements: [1, 2, 3],
    });
    expect(await html("#container")).toBe(
      `<div>1</div><div>2</div><div>3</div>`
    );

    await render({
      elements: [1, 2],
    });

    expect(await html("#container")).toBe(
      `<div>1</div>` +
        `<div>2</div>` +
        `<div class="transition-leave-from transition-leave-active">3</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div>1</div>` +
        `<div>2</div>` +
        `<div class="transition-leave-active transition-leave-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(`<div>1</div><div>2</div>`);
  });

  it.skip("add + remove", async () => {
    await render({
      elements: [1, 2, 3],
    });
    expect(await html("#container")).toBe(
      `<div>1</div><div>2</div><div>3</div>`
    );

    await render({
      elements: [2, 3, 4],
    });

    expect(await html("#container")).toBe(
      `<div class="transition-leave-from transition-leave-active">1</div>` +
        `<div>2</div>` +
        `<div class="transition-leave-from transition-leave-active">3</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div>1</div>` +
        `<div>2</div>` +
        `<div class="transition-leave-active transition-leave-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(`<div>1</div><div>2</div>`);
  });

  it("enter + move", async () => {
    await render({
      elements: [1, 3],
    });
    expect(await html("#container")).toBe(`<div>1</div><div>3</div>`);

    await render({
      elements: [1, 2, 3],
    });

    expect(await html("#container")).toBe(
      `<div>1</div>` +
        `<div class="transition-enter-from transition-enter-active">2</div>` +
        `<div class="transition-move" style="">3</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div>1</div>` +
        `<div class="transition-enter-active transition-enter-to">2</div>` +
        `<div class="transition-move" style="">3</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(
      `<div>1</div><div class="">2</div><div class="" style="">3</div>`
    );
  });

  it("appear passed to TransitionGroup", async () => {
    const appearHTML = await render({
      elements: [1, 2],
      appear: true,
      transitionProps: {
        appearFromClass: "transition-appear-from",
        appearActiveClass: "transition-appear-active",
        appearToClass: "transition-appear-to",
      },
    });

    expect(appearHTML).toBe(
      `<div class="transition-appear-from transition-appear-active">1</div>` +
        `<div class="transition-appear-from transition-appear-active">2</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div class="transition-appear-active transition-appear-to">1</div>` +
        `<div class="transition-appear-active transition-appear-to">2</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` + `<div class="">2</div>`
    );

    // enter
    const enterHTML = await render({
      elements: [1, 2, 3],
    });

    expect(enterHTML).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-enter-from transition-enter-active">3</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-enter-active transition-enter-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="">3</div>`
    );

    // leave
    const leaveHTML = await render({
      elements: [1, 2],
    });

    expect(leaveHTML).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-leave-from transition-leave-active">3</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-leave-active transition-leave-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` + `<div class="">2</div>`
    );
  });

  it("appear passed to each Transition", async () => {
    const appearHTML = await render({
      elements: [1, 2],
      transitionProps: {
        appear: true,
        appearFromClass: "transition-appear-from",
        appearActiveClass: "transition-appear-active",
        appearToClass: "transition-appear-to",
      },
    });

    expect(appearHTML).toBe(
      `<div class="transition-appear-from transition-appear-active">1</div>` +
        `<div class="transition-appear-from transition-appear-active">2</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div class="transition-appear-active transition-appear-to">1</div>` +
        `<div class="transition-appear-active transition-appear-to">2</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` + `<div class="">2</div>`
    );

    // enter
    const enterHTML = await render({
      elements: [1, 2, 3],
    });

    expect(enterHTML).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-enter-from transition-enter-active">3</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-enter-active transition-enter-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="">3</div>`
    );

    // leave
    const leaveHTML = await render({
      elements: [1, 2],
    });

    expect(leaveHTML).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-leave-from transition-leave-active">3</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-leave-active transition-leave-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` + `<div class="">2</div>`
    );
  });

  it("prioritize child appear", async () => {
    const appearHTML = await render({
      elements: [1, 2],
      appear: false,
      transitionProps: {
        appear: true,
        appearFromClass: "transition-appear-from",
        appearActiveClass: "transition-appear-active",
        appearToClass: "transition-appear-to",
      },
    });

    expect(appearHTML).toBe(
      `<div class="transition-appear-from transition-appear-active">1</div>` +
        `<div class="transition-appear-from transition-appear-active">2</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div class="transition-appear-active transition-appear-to">1</div>` +
        `<div class="transition-appear-active transition-appear-to">2</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` + `<div class="">2</div>`
    );

    // enter
    const enterHTML = await render({
      elements: [1, 2, 3],
    });

    expect(enterHTML).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-enter-from transition-enter-active">3</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-enter-active transition-enter-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="">3</div>`
    );

    // leave
    const leaveHTML = await render({
      elements: [1, 2],
    });

    expect(leaveHTML).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-leave-from transition-leave-active">3</div>`
    );

    await nextFrame();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-leave-active transition-leave-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#container")).toBe(
      `<div class="">1</div>` + `<div class="">2</div>`
    );
  });

  it.skip("should not add move class if no move transition", () => {});

  it("warn unkeyed children", async () => {
    const spy =jest.spyOn(console, "error")
    await render({
      elements: [1, 2, 3],
      transitionProps: {
        key: undefined,
      },
    });

    expect(spy).toBeCalledTimes(1);
  });
});
