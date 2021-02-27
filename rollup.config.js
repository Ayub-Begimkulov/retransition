import path from "path";
import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import { sizeSnapshot } from "rollup-plugin-size-snapshot";

const isTesting = process.env.TESTING === "true";

const umdOptions = {
  name: "ReactTransition",
  globals: {
    react: "React",
  },
};

function createRollupConfig(outputDir, tsOptions, env, formats = {}) {
  const { umd, cjs, es } = formats;
  return {
    input: "src/index.ts",
    plugins: [
      typescript(tsOptions),
      replace({
        "process.env.NODE_ENV": JSON.stringify(env),
        "process.env.TESTING": JSON.stringify(isTesting),
      }),
      !isTesting && sizeSnapshot(),
      !isTesting && terser(),
    ].filter(Boolean),
    external: ["react"],
    output: [
      cjs && {
        file: path.resolve(outputDir, `index.${env}.js`),
        format: "cjs",
      },
      es && {
        file: path.resolve(outputDir, "index.es.js"),
        format: "es",
      },
      umd && {
        file: path.resolve(outputDir, "index.umd.js"),
        format: "umd",
        ...umdOptions,
      },
    ].filter(Boolean),
  };
}

const distDir = path.resolve(__dirname, "dist");
const ie11Dir = path.resolve(__dirname, "dist", "ie11");
const testDir = path.resolve(__dirname, "tests");

export default isTesting
  ? [
      createRollupConfig(
        testDir,
        {
          tsconfigOverride: {
            compilerOptions: {
              declaration: false,
              sourceMap: true,
              inlineSourceMap: true,
              inlineSources: true,
              removeComments: false,
            },
          },
        },
        "production",
        { umd: true }
      ),
    ]
  : [
      createRollupConfig(distDir, undefined, "production", {
        es: true,
        umd: true,
        cjs: true,
      }),
      createRollupConfig(distDir, undefined, "development", { cjs: true }),
      createRollupConfig(
        ie11Dir,
        { tsconfig: "tsconfig.ie11.json" },
        "production",
        { es: true, umd: true, cjs: true }
      ),
      createRollupConfig(ie11Dir, undefined, "development", { cjs: true }),
    ];
