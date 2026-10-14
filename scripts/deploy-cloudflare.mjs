import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const flags = process.argv.slice(2);
if (flags.some(flag => !["--dry-run", "--preview"].includes(flag)) || flags.length > 1) {
  throw new Error("Use npm run deploy, npm run deploy:check ou npm run preview.");
}
const dryRun = flags.includes("--dry-run");
const root = fileURLToPath(new URL("../", import.meta.url));
function run(script, args = []) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url)), ...args], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// The source entry contains a virtual module that only Vite can resolve.
// Always generate the Worker and assets before handing them to Wrangler.
if (!dryRun) run("./check-cloudflare.mjs");
run("../node_modules/vite/bin/vite.js", ["build"]);
if (!dryRun) run("./check-cloudflare.mjs", ["--built"]);
run("../node_modules/wrangler/bin/wrangler.js", [
  flags.includes("--preview") ? "preview" : "deploy",
  "--config", "dist/server/wrangler.json",
  ...(dryRun ? ["--dry-run"] : []),
]);
