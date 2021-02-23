import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import { sizeSnapshot } from "rollup-plugin-size-snapshot";

const isTesting = process.env.TESTING === "true";

const testingConfig = {
  input: "src/index.ts",
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          declaration: false,
          sourceMap: true,
          inlineSourceMap: true,
          inlineSources: true,
          removeComments: false,
        },
      },
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env.TESTING": JSON.stringify(true),
    }),
  ],
  external: ["react"],
  output: [
    {
      file: "tests/index.umd.js",
      format: "umd",
      name: "ReactTransition",
      globals: {
        react: "React",
      },
      sourcemap: "inline",
    },
  ],
};

const productionConfig = {
  input: "src/index.ts",
  plugins: [
    typescript(),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env.TESTING": JSON.stringify(false),
    }),
    sizeSnapshot(),
    terser(),
  ],
  external: ["react"],
  output: [
    {
      file: "dist/index.js",
      format: "cjs",
    },
    {
      file: "dist/index.es.js",
      format: "es",
    },
    {
      file: "dist/index.umd.js",
      format: "umd",
      name: "ReactTransition",
      globals: {
        react: "React",
      },
    },
  ],
};

const ie11Config = {
  input: "src/index.ts",
  plugins: [
    typescript({
      tsconfig: "tsconfig.ie11.json",
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env.TESTING": JSON.stringify(false),
    }),
    sizeSnapshot(),
    terser(),
  ],
  external: ["react"],
  output: [
    {
      file: "dist/index.ie11.js",
      format: "cjs",
    },
    {
      file: "dist/index.ie11.es.js",
      format: "es",
    },
    {
      file: "dist/index.ie11.umd.js",
      format: "umd",
      name: "ReactTransition",
      globals: {
        react: "React",
      },
    },
  ],
};

export default isTesting ? testingConfig : [productionConfig, ie11Config];
