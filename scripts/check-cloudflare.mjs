import { readFile } from "node:fs/promises";
const config = JSON.parse(await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
const db = config.d1_databases?.find(item => item.binding === "DB");
if (!db?.database_id || db.database_id === "00000000-0000-4000-8000-000000000000") {
  throw new Error("Configure seu D1: npm run configure:cloudflare -- UUID_DO_BANCO");
}
if (process.argv.includes("--built")) {
  const built = JSON.parse(await readFile(new URL("../dist/server/wrangler.json", import.meta.url), "utf8"));
  const deployedDb = built.d1_databases?.find(item => item.binding === "DB");
  if (deployedDb?.database_id !== db.database_id || deployedDb.database_name !== db.database_name || built.name !== config.name) {
    throw new Error("A configuração mudou depois do build. Execute npm run build novamente.");
  }
}
