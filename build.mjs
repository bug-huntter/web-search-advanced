import { execSync } from "node:child_process"

const face = process.argv[2] ?? "both"
const run = (target) => {
  console.log(`Building ${target} half...`)
  execSync(`npx --no-install tsdown --env.DSH_BUILD_FACE=${target}`, {
    stdio: "inherit",
    cwd: import.meta.dirname,
  })
}

if (face === "host" || face === "both") run("host")
if (face === "client" || face === "both") run("client")
console.log("Build complete.")
