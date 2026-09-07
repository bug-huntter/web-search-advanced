import { readFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { basename, dirname, resolve } from "node:path"
import { transform } from "lightningcss"

const CSS_VIRTUAL_PREFIX = "\0dsh-css:"
const CSS_VIRTUAL_SUFFIX = ".mjs"

const EXTERNAL_MODULES = [
  "react", "react-dom", "react/jsx-runtime",
  "@deepseek-ai/cordis", "@deepseek-ai/schemastery",
  "@deepseek-ai/dsh-invariants",
  "@deepseek-ai/dsh-client-runtime", "@deepseek-ai/dsh-client-runtime/client",
  "@deepseek-ai/dsh-client-web-react",
  "@deepseek-ai/dsh-client-locale",
  "@deepseek-ai/dsh-client-connection",
  "@deepseek-ai/dsh-client-ui-slots",
  "@deepseek-ai/dsh-client-ui-settings", "@deepseek-ai/dsh-client-ui-settings/client",
  "@deepseek-ai/dsh-client-ui-sidebar",
  "@deepseek-ai/dsh-client-ui-primitives",
  "@deepseek-ai/dsh-api-remotes", "@deepseek-ai/dsh-api-remotes/client", "@deepseek-ai/dsh-api-remotes/types",
  "@deepseek-ai/dsh-settings",
  "@deepseek-ai/dsh-web", "@deepseek-ai/dsh-agent",
  "@deepseek-ai/dsh-credentials", "@deepseek-ai/dsh-launch-environment",
  "@deepseek-ai/dsh-session",
]

const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"))
const PACKAGE_NAME = packageJson.name
const HOST_EXTERNAL_MODULES = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
]

const libConfig = {
  name: PACKAGE_NAME,
  entry: { index: "src/index.ts", invariant: "src/invariant.ts" },
  outDir: "lib", format: ["esm"], platform: "node", target: "es2024", tsconfig: resolve(import.meta.dirname, "tsconfig.json"),
  fixedExtension: false, dts: false, clean: false,
  external: HOST_EXTERNAL_MODULES,
}

const clientConfig = {
  name: PACKAGE_NAME + "/client",
  entry: { client: "src/client/index.ts" },
  outDir: "lib", format: "cjs", platform: "browser", target: "es2020", tsconfig: resolve(import.meta.dirname, "tsconfig.json"), dts: false, sourcemap: true, clean: false,
  external: EXTERNAL_MODULES,
  noExternal: (id: string) => EXTERNAL_MODULES.includes(id) ? undefined : true,
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
    "import.meta.env.MODE": JSON.stringify(process.env.NODE_ENV ?? "production"),
    "import.meta.env": JSON.stringify({ MODE: process.env.NODE_ENV ?? "production" }),
  },
  plugins: [{
    name: "dsh-css-modules-inline",
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith(".module.css")) return null
      const abs = importer !== undefined ? resolve(dirname(importer), source) : source
      return CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const { code, exports: cssExports } = transform({ filename: fileId, code: source, cssModules: { pattern: "[hash]_[local]" }, minify: true })
      const classMap: Record<string, string> = {}
      for (const [local, exp] of Object.entries(cssExports ?? {})) classMap[local] = exp.name
      return [
        "const css = " + JSON.stringify(code.toString()) + ";",
        "const tagId = " + JSON.stringify(PACKAGE_NAME + "/" + basename(fileId)) + ";",
        "if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {",
        "  const tag = document.createElement('style');",
        "  tag.dataset.plugin = " + JSON.stringify(PACKAGE_NAME) + ";",
        "  tag.dataset.pluginCss = tagId;",
        "  tag.textContent = css;",
        "  document.head.appendChild(tag);",
        "}",
        "export default " + JSON.stringify(classMap) + ";",
      ].join("\n")
    },
  }],
  outputOptions: {
    entryFileNames: "client.js",
    banner: "window.__ModuleLoader__.load({ id: " + JSON.stringify(PACKAGE_NAME) + ", factory: (require) => {",
    footer: "return module.exports; } });",
    intro: "var module = { exports: {} }; var exports = module.exports;",
  },
}

export default ({ env }: { env?: Record<string, string> }) => {
  const face = env?.DSH_BUILD_FACE
  if (face === "host") return [libConfig]
  if (face === "client") return [clientConfig]
  return [libConfig, clientConfig]
}
