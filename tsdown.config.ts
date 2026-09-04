/**
 * Optional tsdown config for @dsh/web-search-advanced.
 *
 * The primary build is `node build.mjs` (npm run build). This config keeps a
 * tsdown-compatible shape for tooling that wants one, and lists only externals
 * the current DSH module table provides.
 */
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))
const PACKAGE_NAME = packageJson.name

const EXTERNAL_MODULES = [
  'react',
  'react/jsx-runtime',
  '@deepseek-ai/cordis',
  '@deepseek-ai/schemastery',
  '@deepseek-ai/dsh-settings',
  '@deepseek-ai/dsh-web',
  '@deepseek-ai/dsh-credentials',
  '@deepseek-ai/dsh-launch-environment',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-ui-settings',
]

/** @type {import('tsdown').UserConfig} */
const libConfig = {
  name: PACKAGE_NAME,
  entry: { index: 'src/index.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: false,
  clean: false,
}

/** @type {import('tsdown').UserConfig} */
const clientConfig = {
  name: `${PACKAGE_NAME}/client`,
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  external: EXTERNAL_MODULES,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_NAME)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default ({ env }) => {
  const face = env?.DSH_BUILD_FACE
  if (face === 'host') return [libConfig]
  if (face === 'client') return [clientConfig]
  return [libConfig, clientConfig]
}
