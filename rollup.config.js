import pug from "pug"
import { basename } from "path"
import { readdirSync } from "fs"
import babel from "@rollup/plugin-babel"
import strip from "@rollup/plugin-strip"
import postcss from "rollup-plugin-postcss"
import replace from "@rollup/plugin-replace"
import { terser } from "rollup-plugin-terser"
import html from "@open-wc/rollup-plugin-html"
import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import visualizer from "rollup-plugin-visualizer"
import { main } from "./package.json"

export default {
  input: main,
  output: { dir: "dist" },
  plugins: (() => {
    const isTest = process.env.NODE_ENV === "test"
    const isProd = process.env.NODE_ENV === "production"
    const extensions = [".js", ".ts"]

    const plugins = [
      postcss({ extract: true, minimize: isProd }),
      babel({ extensions, babelHelpers: "bundled" }),
      resolve({ extensions, preferBuiltins: true }),
      commonjs(),
    ]

    readdirSync("pages").forEach(
      file =>
        void plugins.push(
          html({
            name: `${basename(file, ".pug")}.html`,
            inject: false,
            template: ({ bundle }) =>
              pug
                .compileFile(`pages/${file}`, { pretty: !isProd })()
                .replace(
                  "<!-- bundle -->",
                  bundle.entrypoints.map(({ importPath }) => `<script src="${importPath}"></script>`)
                ),
            minify: isProd,
          })
        )
    )

    if (isTest) {
      plugins.unshift(visualizer())
    }

    if (isProd) {
      plugins.unshift(replace({ "//prod:": "", delimiters: ["", ""] }))
      plugins.push(strip({ include: ["**/*.(t|j)s"] }), terser())
    }

    return plugins
  })(),
}
