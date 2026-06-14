import fs from "node:fs";
import path from "node:path";

const apiDir = path.resolve("api");

/** Rotas parciais quebram subpaths tRPC — tudo passa por api/index.js + rewrite /api/(.*). */
for (const legacy of [
  "trpc.js",
  "[[...path]].js",
  "[...path].js",
  path.join("oauth", "callback.js"),
  path.join("trpc", "[...path].js"),
]) {
  try {
    fs.unlinkSync(path.join(apiDir, legacy));
  } catch {
    // optional cleanup
  }
}

const indexHandler = path.join(apiDir, "index.js");
if (!fs.existsSync(indexHandler)) {
  console.error("[build] api/index.js missing — run esbuild server/vercel.ts first");
  process.exit(1);
}

console.info("[build] Vercel API: api/index.js + rewrite /api/(.*) → /api");
