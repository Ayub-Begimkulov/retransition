import puppeteer from "puppeteer";

export const E2E_TIMEOUT = 30 * 1000;

export const timeout = (n: number) => new Promise(r => setTimeout(r, n));

export function setupPuppeteer() {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  beforeEach(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();

    page.on("console", e => {
      const type = e.type() as keyof Console;
      typeof console[type] === "function"
        ? console[type](e.text(), e.location())
        : console.log(e.type(), e.text(), e.location());
    });
  });

  afterEach(async () => {
    await browser.close();
  });

  async function click(selector: string, options?: puppeteer.ClickOptions) {
    await page.click(selector, options);
  }

  async function count(selector: string) {
    return (await page.$$(selector)).length;
  }

  async function text(selector: string) {
    return await page.$eval(selector, node => node.textContent);
  }

  async function value(selector: string) {
    return await page.$eval(selector, node => (node as HTMLInputElement).value);
  }

  async function html(selector: string) {
    return await page.$eval(selector, node => node.innerHTML);
  }

  async function classList(selector: string) {
    return await page.$eval(selector, (node: any) => [...node.classList]);
  }

  async function children(selector: string) {
    return await page.$eval(selector, (node: any) => [...node.children]);
  }

  async function isVisible(selector: string) {
    const display = await page.$eval(selector, node => {
      return window.getComputedStyle(node).display;
    });
    return display !== "none";
  }

  async function isChecked(selector: string) {
    return await page.$eval(
      selector,
      node => (node as HTMLInputElement).checked
    );
  }

  async function isFocused(selector: string) {
    return await page.$eval(selector, node => node === document.activeElement);
  }

  async function setValue(selector: string, value: string) {
    await page.$eval(
      selector,
      (node, value) => {
        (node as HTMLInputElement).value = value;
        node.dispatchEvent(new Event("input"));
      },
      value
    );
  }

  async function typeValue(selector: string, value: string) {
    const el = (await page.$(selector))!;
    await el.evaluate(node => ((node as HTMLInputElement).value = ""));
    await el.type(value);
  }

  async function enterValue(selector: string, value: string) {
    const el = (await page.$(selector))!;
    await el.evaluate(node => ((node as HTMLInputElement).value = ""));
    await el.type(value);
    await el.press("Enter");
  }

  async function clearValue(selector: string) {
    return await page.$eval(
      selector,
      node => ((node as HTMLInputElement).value = "")
    );
  }

  function timeout(time: number) {
    return page.evaluate(time => {
      return new Promise(r => {
        setTimeout(r, time);
      });
    }, time);
  }

  function nextFrame() {
    return page.evaluate(() => {
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
    });
  }

  return {
    page: () => page,
    click,
    count,
    text,
    value,
    html,
    classList,
    children,
    isVisible,
    isChecked,
    isFocused,
    setValue,
    typeValue,
    enterValue,
    clearValue,
    timeout,
    nextFrame,
  };
}
