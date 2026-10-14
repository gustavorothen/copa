import { defineConfig } from "vite";
import vinext from "vinext";
export default defineConfig(async () => {
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
  process.env.WRANGLER_SEND_METRICS ??= "false";
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  return { plugins: [vinext(), cloudflare({
    viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    inspectorPort: false,
    // Wrangler publishes the compiled output; Vite starts from the source.
    config: {
      main: "./worker/index.ts",
      assets: { directory: "./public", binding: "ASSETS" },
      build: { command: "" },
    },
  })] };
});
