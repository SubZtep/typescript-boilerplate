import babel from "@rollup/plugin-babel"
import { terser } from "rollup-plugin-terser"
import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import replace from "@rollup/plugin-replace"
import strip from "@rollup/plugin-strip"
import html from "@open-wc/rollup-plugin-html"
import pug from "pug"

const isProd = process.env.NODE_ENV === "production"
const extensions = [".js", ".ts"]

const plugins = [
  resolve({ extensions }),
  babel({
    babelHelpers: "bundled",
    extensions,
    include: ["src/**/*"],
  }),
  commonjs(),
  html({
    inject: false,
    template: ({ bundle }) =>
      pug
        .compileFile("pug/template.pug", { pretty: !isProd })()
        .replace(
          "<!-- bundle-->",
          bundle.entrypoints.map(({ importPath }) => `<script type="module" src="${importPath}"></script>`)
        ),
    minify: isProd,
  }),
]

const output = {
  dir: "dist",
  // format: "esm",
}

if (isProd) {
  plugins.unshift(replace({ "//prod:": "", delimiters: ["", ""] }))
  plugins.push(strip({ include: ["**/*.(t|j)s"] }), terser())
}

const main = {
  input: "src/main.ts",
  output,
  plugins,
}

export default [main]
