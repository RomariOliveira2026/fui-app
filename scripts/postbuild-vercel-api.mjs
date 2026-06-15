import fs from "node:fs";
import path from "node:path";

const apiDir = path.resolve("api");

for (const legacy of [
  "index.js",
  "trpc.js",
  "[[...path]].js",
  "[...path].js",
  path.join("trpc", "[...path].js"),
]) {
  try {
    fs.unlinkSync(path.join(apiDir, legacy));
  } catch {
    // optional cleanup
  }
}

const handlerBundle = path.join(apiDir, "_handler.js");
if (!fs.existsSync(handlerBundle)) {
  console.error("[build] api/_handler.js missing — run esbuild server/vercel.ts first");
  process.exit(1);
}

const reExport = 'export { default } from "./_handler.js";\n';
const reExportFromParent = 'export { default } from "../_handler.js";\n';

/** Catch-all /api/* (Stripe, etc.) — rotas específicas têm prioridade. */
fs.writeFileSync(path.join(apiDir, "[[...path]].js"), reExport, "utf8");

/** tRPC: /api/trpc/<procedure> */
const trpcCatchAll = path.join(apiDir, "trpc", "[...path].js");
fs.mkdirSync(path.dirname(trpcCatchAll), { recursive: true });
fs.writeFileSync(trpcCatchAll, reExportFromParent, "utf8");

/** OAuth callback exato. */
const oauthCallback = path.join(apiDir, "oauth", "callback.js");
fs.mkdirSync(path.dirname(oauthCallback), { recursive: true });
fs.writeFileSync(oauthCallback, 'export { default } from "../_handler.js";\n', "utf8");

console.info(
  "[build] Vercel API: _handler.js + trpc/[...path].js + [[...path]].js + oauth/callback.js"
);
