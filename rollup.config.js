import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import { sizeSnapshot } from "rollup-plugin-size-snapshot";
import istanbul from "rollup-plugin-istanbul";

const isTesting = process.env.TESTING === "true";

export default {
  input: "src/index.ts",
  plugins: [
    typescript(
      isTesting && {
        tsconfigOverride: {
          compilerOptions: {
            declaration: false,
            sourceMap: true,
            inlineSourceMap: true,
            inlineSources: true,
            removeComments: false,
          },
        },
      }
    ),
    isTesting && istanbul(),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env.TESTING": JSON.stringify(isTesting),
    }),
    !isTesting && sizeSnapshot(),
    !isTesting && terser(),
  ].filter(Boolean),
  external: ["react"],
  output: isTesting
    ? [
        {
          file: "tests/index.umd.js",
          format: "umd",
          name: "ReactTransition",
          globals: {
            react: "React",
          },
          sourcemap: "inline",
        },
      ]
    : [
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
