/**
 * Copy built artifacts into installed DSH profiles.
 *
 * DSH installs plugins under `~/.dsh/profiles/<profile>/node_modules`, so a
 * workspace build does not update what DSH loads until the copy is made.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ARTIFACTS = ['index.js', 'client.js', 'client.js.map']
const PROFILES_ROOT = join(homedir(), '.dsh', 'profiles')
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'))
const PACKAGE_NAME = packageJson.name

function packagePath(root, packageName) {
  return join(root, 'node_modules', ...packageName.split('/'))
}

const DENY_LIST = new Set(['node_modules', '.git', 'lib'])

if (!existsSync(PROFILES_ROOT)) {
  console.log(`no DSH profiles directory at ${PROFILES_ROOT}; nothing to sync`)
  process.exit(0)
}

const profiles = readdirSync(PROFILES_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

function copyRecursive(src, dst) {
  const stat = statSync(src)
  if (stat.isDirectory()) {
    mkdirSync(dst, { recursive: true })
    for (const entry of readdirSync(src, { withFileTypes: true })) {
      if (DENY_LIST.has(entry.name)) continue
      copyRecursive(join(src, entry.name), join(dst, entry.name))
    }
  } else {
    copyFileSync(src, dst)
  }
}

let synced = 0
for (const profile of profiles) {
  const profileRoot = join(PROFILES_ROOT, profile)
  const target = packagePath(profileRoot, PACKAGE_NAME)
  if (!existsSync(target)) continue

  copyRecursive(__dirname, target)
  const libDir = join(target, 'lib')
  mkdirSync(libDir, { recursive: true })
  for (const file of ARTIFACTS) {
    const src = join(__dirname, 'lib', file)
    if (!existsSync(src)) continue
    copyFileSync(src, join(libDir, file))
  }

  synced += 1
  console.log(`✓ synced workspace into profile "${profile}"`)
}

if (synced === 0) {
  console.log(`no installed ${PACKAGE_NAME} copies found; install it first with \`dsh plugin add ${PACKAGE_NAME}\``)
} else {
  console.log(`done: synced ${synced} profile(s). Restart DSH for changes to take effect.`)
}
