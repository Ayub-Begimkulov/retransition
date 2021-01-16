import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import { sizeSnapshot } from "rollup-plugin-size-snapshot";

export default {
  input: "src/index.ts",
  plugins: [
    typescript(),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
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
