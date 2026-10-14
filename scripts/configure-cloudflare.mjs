import { readFile, writeFile } from "node:fs/promises";
const [id, databaseName = "copa-madu", workerName = "copa-madu"] = process.argv.slice(2);
if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || id === "00000000-0000-4000-8000-000000000000") {
  throw new Error("Use: npm run configure:cloudflare -- UUID_DO_BANCO [NOME_DO_BANCO] [NOME_DO_WORKER]");
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(workerName)) throw new Error("Nome do Worker: use letras minúsculas, números e hífens.");
const config = JSON.parse(await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
config.d1_databases[0].database_id = id;
config.d1_databases[0].database_name = databaseName;
config.name = workerName;
await writeFile(new URL("../wrangler.jsonc", import.meta.url), JSON.stringify(config, null, 2) + "\n");
console.log("Banco DB configurado. Execute npm run build antes do deploy.");
