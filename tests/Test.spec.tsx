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
    const html = await page().evaluate(() => {
      return new Promise(res => {
        const { React, ReactDOM, ReactTransition } = window as any;
        const { Transition, TransitionGroup } = ReactTransition;
        const baseElement = document.querySelector("#app")!;
        const arr = [1, 2];

        ReactDOM.render(
          <TransitionGroup appear>
            {arr.map(v => (
              <Transition key={"$" + v}>
                <div id="test">{v}</div>
              </Transition>
            ))}
          </TransitionGroup>,
          baseElement,
          () => res(baseElement.innerHTML)
        );
      });
    });
    console.log(html);
    expect(await page().evaluate(() => !!document.querySelector("#test"))).toBe(
      true
    );
  });
});
