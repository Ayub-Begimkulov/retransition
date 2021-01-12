import path from "path";
import { setupPuppeteer } from "./test-utils";

describe("Test", () => {
  const { page } = setupPuppeteer();
  const baseUrl = `file://${path.resolve(__dirname, "test.html")}`;

  beforeEach(async () => {
    await page().goto(baseUrl);
    await page().waitForSelector("#app");
  });

  it("Test", async () => {
    await page().evaluate(() => {
      return new Promise(res => {
        const { React, ReactDOM, ReactTransition } = window as any;
        const { Transition } = ReactTransition;
        const baseElement = document.querySelector("#app");
        ReactDOM.render(
          <Transition>
            <div id="test">Hello</div>
          </Transition>,
          baseElement,
          res
        );
      });
    });

    expect(await page().evaluate(() => !!document.querySelector("#test"))).toBe(
      true
    );
  });
});
