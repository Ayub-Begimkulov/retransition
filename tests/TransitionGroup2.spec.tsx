import path from "path";
import { setupPuppeteer } from "./test-utils";
// import { createCoverageMap, CoverageMap } from "istanbul-lib-coverage";
// import fs from "fs";

describe("TransitionGroup2", () => {
  const { page } = setupPuppeteer();
  const baseUrl = `file://${path.resolve(__dirname, "transition.html")}`;

  // let coverageMap: CoverageMap;
  // beforeAll(() => {
  //   coverageMap = createCoverageMap({});
  // });

  // afterAll(() => {
  //   try {
  //     console.log(coverageMap.toJSON());
  //     const outputFolder = path.resolve(__dirname, "..", "coverage");
  //     if (!fs.existsSync(outputFolder)) {
  //       fs.mkdirSync(outputFolder);
  //     }
  //     fs.writeFileSync(
  //       path.resolve(outputFolder, "coverage.json"),
  //       JSON.stringify(coverageMap)
  //     );
  //   } catch (e) {
  //     console.error(e);
  //   }
  // });

  // afterEach(async () => {
  //   const coverage = await page().evaluate(() => (window as any).__coverage__);
  //   coverageMap.merge(coverage);
  // });

  beforeEach(async () => {
    await page().goto(baseUrl);
    await page().waitForSelector("#app");
  });

  it("warn unkeyed children", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error");

    await page().evaluate(() => {
      return new Promise(res => {
        const { React, ReactDOM, ReactTransition } = window as any;
        const { Transition, TransitionGroup } = ReactTransition;
        const baseElement = document.querySelector("#app")!;
        const arr = [1, 2];

        ReactDOM.render(
          <TransitionGroup>
            {arr.map(v => (
              <Transition>
                <div id="test">{v}</div>
              </Transition>
            ))}
          </TransitionGroup>,
          baseElement,
          res
        );
      });
    });

    expect(consoleErrorSpy).toBeCalledTimes(1);
  });

  it.todo("should not update if props and children keys are the same");
});
