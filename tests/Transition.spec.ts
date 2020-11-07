import path from "path";
import { setupPuppeteer } from "./test-utils";

describe("Transition", () => {
  const { page, timeout, nextFrame, classList, click } = setupPuppeteer();

  const baseUrl = `file://${path.resolve(__dirname, "dist", "index.html")}`;

  const duration = 50;
  const buffer = 5;

  const transitionFinish = (time = duration) => timeout(time + buffer);

  beforeEach(async () => {
    await page().goto(baseUrl);
    await page().waitForSelector("#app");
  });

  it("should not render element until visible is true");

  it("adds classes to element", async () => {
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
});
