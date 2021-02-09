import path from "path";
import { setupPuppeteer } from "./test-utils";

describe("TransitionGroup2", () => {
  const { page } = setupPuppeteer();
  const baseUrl = `file://${path.resolve(__dirname, "transition.html")}`;

  beforeEach(async () => {
    await page().goto(baseUrl);
    await page().waitForSelector("#app");
  });

  it("warn if wrong children", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error");

    await page().evaluate(() => {
      return new Promise(res => {
        const { React, ReactDOM, ReactTransition } = window as any;
        const { Transition } = ReactTransition;
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
});
