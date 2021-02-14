import path from "path";
import { setupPlaywright } from "./test-utils";
import { createCoverageMap, CoverageMap } from "istanbul-lib-coverage";
import fs from "fs";

declare const React: typeof global.React;

let coverageMap: CoverageMap;
if (!(coverageMap = (global as any).coverageMap)) {
  beforeAll(() => {
    let coverage: any;
    try {
      coverage = fs.readFileSync(
        path.resolve(__dirname, "..", "coverage", "coverage.json"),
        { encoding: "utf-8" }
      );
      if (coverage) {
        coverage = JSON.parse(coverage);
      }
    } catch (e) {
      coverage = {};
    }
    coverageMap = createCoverageMap(coverage);
    (global as any).coverageMap = coverageMap;
  });

  afterAll(() => {
    try {
      const outputFolder = path.resolve(__dirname, "..", "coverage");
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
      }
      fs.writeFileSync(
        path.resolve(outputFolder, "coverage.json"),
        JSON.stringify(coverageMap)
      );
    } catch (e) {
      console.error(e);
    }
  });
}

describe("TransitionGroup", () => {
  const { page, nextFrame, html, timeout, makeRender } = setupPlaywright();
  const baseUrl = `file://${path.resolve(__dirname, "transition.html")}`;

  const duration = 50;
  const buffer = 5;

  const transitionFinish = (time = duration) => timeout(time + buffer);

  beforeEach(async () => {
    await page().goto(baseUrl);
    await page().waitForSelector("#app", { state: "attached" });
  });

  afterEach(async () => {
    const coverage = await page().evaluate(() => (window as any).__coverage__);
    coverageMap.merge(coverage);
  });

  /* The test is no longer relevant since we use Children.toArray
    and it creates it's own keys
  */
  // it("warn unkeyed children", async () => {
  //   const consoleErrorSpy = jest.spyOn(console, "error");

  //   await page().evaluate(() => {
  //     return new Promise(res => {
  //       const { React, ReactDOM, ReactTransition } = window as any;
  //       const { Transition, TransitionGroup } = ReactTransition;
  //       const baseElement = document.querySelector("#app")!;
  //       const arr = [1, 2];

  //       ReactDOM.render(
  //         <TransitionGroup>
  //           {arr.map(v => (
  //             <Transition>
  //               <div id="test">{v}</div>
  //             </Transition>
  //           ))}
  //         </TransitionGroup>,
  //         baseElement,
  //         res
  //       );
  //     });
  //   });

  //   expect(consoleErrorSpy).toBeCalledTimes(1);
  // });

  const render = makeRender(
    ({
      elements,
      transitionProps,
      ...rest
    }: {
      elements: number[];
      [key: string]: any;
    }) => {
      const { TransitionGroup, Transition } = (window as any).ReactTransition;
      return (
        <TransitionGroup {...rest}>
          {elements.map(v => (
            <Transition key={v} {...transitionProps}>
              <div>{v}</div>
            </Transition>
          ))}
        </TransitionGroup>
      );
    },
    res => {
      debugger;
      return res(document.querySelector("#app")?.innerHTML);
    }
  );

  it("add element", async () => {
    const initialHTML = await render({ elements: [1, 2] });

    expect(initialHTML).toBe(`<div>1</div><div>2</div>`);

    const enterHTML = await render({ elements: [1, 2, 3] });

    expect(enterHTML).toBe(
      `<div>1</div>` +
        `<div>2</div>` +
        `<div class="transition-enter-from transition-enter-active">3</div>`
    );

    await nextFrame();

    expect(await html("#app")).toBe(
      `<div>1</div>` +
        `<div>2</div>` +
        `<div class="transition-enter-active transition-enter-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(
      `<div>1</div><div>2</div><div class="">3</div>`
    );
  });

  it("remove element", async () => {
    await render({
      elements: [1, 2, 3],
    });
    expect(await html("#app")).toBe(`<div>1</div><div>2</div><div>3</div>`);

    await render({
      elements: [1, 2],
    });

    expect(await html("#app")).toBe(
      `<div>1</div>` +
        `<div>2</div>` +
        `<div class="transition-leave-from transition-leave-active">3</div>`
    );

    await nextFrame();

    expect(await html("#app")).toBe(
      `<div>1</div>` +
        `<div>2</div>` +
        `<div class="transition-leave-active transition-leave-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(`<div>1</div><div>2</div>`);
  });

  it.skip("add + remove", async () => {
    await render({
      elements: [1, 2, 3],
    });
    expect(await html("#app")).toBe(`<div>1</div><div>2</div><div>3</div>`);

    await render({
      elements: [2, 3, 4],
    });

    expect(await html("#app")).toBe(
      `<div class="transition-leave-from transition-leave-active">1</div>` +
        `<div>2</div>` +
        `<div class="transition-leave-from transition-leave-active">3</div>`
    );

    await nextFrame();

    expect(await html("#app")).toBe(
      `<div>1</div>` +
        `<div>2</div>` +
        `<div class="transition-leave-active transition-leave-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(`<div>1</div><div>2</div>`);
  });

  it("enter + move", async () => {
    const initialHTML = await render({
      elements: [1, 3],
    });
    expect(initialHTML).toBe(`<div>1</div><div>3</div>`);

    const enterHTML = await render({
      elements: [1, 2, 3],
    });

    expect(enterHTML).toBe(
      `<div>1</div>` +
        `<div class="transition-enter-from transition-enter-active">2</div>` +
        `<div class="transition-move" style="">3</div>`
    );

    await nextFrame();

    expect(await html("#app")).toBe(
      `<div>1</div>` +
        `<div class="transition-enter-active transition-enter-to">2</div>` +
        `<div class="transition-move" style="">3</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(
      `<div>1</div><div class="">2</div><div class="" style="">3</div>`
    );
  });

  it("remove + move", async () => {
    await render({
      elements: [1, 2, 3],
    });
    expect(await html("#app")).toBe(`<div>1</div><div>2</div><div>3</div>`);

    await render({
      elements: [1, 3],
    });

    expect(await html("#app")).toBe(
      `<div>1</div>` +
        `<div class="transition-leave-from transition-leave-active">2</div>` +
        `<div class="transition-move" style="">3</div>`
    );

    await nextFrame();

    expect(await html("#app")).toBe(
      `<div>1</div>` +
        `<div class="transition-leave-active transition-leave-to">2</div>` +
        `<div class="transition-move" style="">3</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(
      `<div>1</div><div class="" style="">3</div>`
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

    expect(await html("#app")).toBe(
      `<div class="transition-appear-active transition-appear-to">1</div>` +
        `<div class="transition-appear-active transition-appear-to">2</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(
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

    expect(await html("#app")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-enter-active transition-enter-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(
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

    expect(await html("#app")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-leave-active transition-leave-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(
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

    expect(await html("#app")).toBe(
      `<div class="transition-appear-active transition-appear-to">1</div>` +
        `<div class="transition-appear-active transition-appear-to">2</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(
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

    expect(await html("#app")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-enter-active transition-enter-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(
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

    expect(await html("#app")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-leave-active transition-leave-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(
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

    expect(await html("#app")).toBe(
      `<div class="transition-appear-active transition-appear-to">1</div>` +
        `<div class="transition-appear-active transition-appear-to">2</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(
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

    expect(await html("#app")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-enter-active transition-enter-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(
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

    expect(await html("#app")).toBe(
      `<div class="">1</div>` +
        `<div class="">2</div>` +
        `<div class="transition-leave-active transition-leave-to">3</div>`
    );

    await transitionFinish();

    expect(await html("#app")).toBe(
      `<div class="">1</div>` + `<div class="">2</div>`
    );
  });

  it.skip("should not add move class if no move transition", () => {});

  it.todo("should not update if props and children keys are the same");
});
