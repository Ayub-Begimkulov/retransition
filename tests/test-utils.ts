import playwright from "playwright";
import fs from "fs";
import path from "path";
import { createCoverageMap } from "istanbul-lib-coverage";
import { AnyObject } from "../src/types";

export function setupPlaywright() {
  let browser: playwright.Browser;
  let page: playwright.Page;

  beforeEach(async () => {
    browser = await playwright.chromium.launch();
    page = await browser.newPage();

    page.on("console", async e => {
      const type = e.type() as keyof Console;
      typeof console[type] === "function"
        ? console[type](e.text())
        : console.log(e.type(), e.text());
    });
  });

  afterEach(async () => {
    await browser.close();
  });

  if (process.env.COVERAGE === "true") {
    const coverageMap = createCoverageMap({});
    afterAll(() => {
      try {
        const outputFolder = path.resolve(__dirname, "..", "coverage");
        if (!fs.existsSync(outputFolder)) {
          fs.mkdirSync(outputFolder);
        }
        fs.writeFileSync(
          path.resolve(
            outputFolder,
            `coverage-${Math.random().toString().slice(2)}.json`
          ),
          JSON.stringify(coverageMap)
        );
      } catch (e) {
        console.error(e);
      }
    });

    afterEach(async () => {
      const coverage = await page.evaluate(() => (window as any).__coverage__);
      coverageMap.merge(coverage);
    });
  }

  function text(selector: string) {
    return page.$eval(selector, node => node.textContent);
  }

  function value(selector: string) {
    return page.$eval(selector, node => (node as HTMLInputElement).value);
  }

  function html(selector: string) {
    return page.$eval(selector, node => node.innerHTML);
  }

  function classList(selector: string) {
    return page.$eval(selector, (node: any) => [...node.classList]);
  }

  async function isVisible(selector: string) {
    const display = await page.$eval(selector, node => {
      return window.getComputedStyle(node).display;
    });
    return display !== "none";
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
  // TODO maybe switch to cypress?
  // refactor this
  function makeRender<T extends AnyObject>(
    fn: (props: T) => JSX.Element,
    onRender: (res: (val: any) => void) => void
  ) {
    return async function (props: T) {
      // get all passed props
      const keys = Object.keys(props);
      const serializableProps: AnyObject = {};
      // if the value is function expose it as global function
      // else add it to `serializableProps`
      const promises = mapEntries(props, (key, value) => {
        if (typeof value === "function") {
          return page.exposeFunction(key, value);
        }
        return void (serializableProps[key] = value);
      });

      await Promise.all(promises);

      return page.evaluate(
        ({ fn, onRenderString, serializableProps, keys }) => {
          const render = new Function("return " + fn)();
          const onRender = new Function("return " + onRenderString)();

          const w: any = window;
          const { ReactDOM } = w;
          const baseElement = document.querySelector("#app")!;

          const propsToPass = keys.reduce((acc: AnyObject, key) => {
            // if the props isn't in `serializableProps`, then it's
            // a global function
            acc[key] = serializableProps.hasOwnProperty(key)
              ? serializableProps[key]
              : () => {
                  w[key]();
                };
            return acc;
          }, {});

          w.lastProps = {
            ...w.lastProps,
            ...propsToPass,
          };
          return new Promise(res => {
            ReactDOM.render(render(w.lastProps), baseElement, () =>
              onRender(res)
            );
          });
        },
        {
          fn: fn.toString(),
          onRenderString: onRender.toString(),
          serializableProps,
          keys,
        }
      );
    };
  }

  return {
    page: () => page,
    text,
    value,
    html,
    classList,
    timeout,
    nextFrame,
    makeRender,
    isVisible,
  };
}

function mapEntries<T>(
  obj: AnyObject,
  cb: (key: string, value: any) => T
): T[] {
  return Object.entries(obj).map(([k, v]) => cb(k, v));
}

export function omitBy<T extends AnyObject>(
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

// function pickBy<T extends AnyObject>(
//   obj: T,
//   predicate: (val: T[keyof T], key: keyof T) => boolean
// ) {
//   return omitBy(obj, (val, key) => !predicate(val, key));
// }
