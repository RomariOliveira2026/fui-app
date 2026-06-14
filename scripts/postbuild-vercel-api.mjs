import fs from "node:fs";
import path from "node:path";

const apiDir = path.resolve("api");

/** trpc.js quebra subpaths — tRPC usa api/index.js + rewrite /api/(.*). */
for (const legacy of [
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

const indexHandler = path.join(apiDir, "index.js");
if (!fs.existsSync(indexHandler)) {
  console.error("[build] api/index.js missing — run esbuild server/vercel.ts first");
  process.exit(1);
}

/** Vercel exige este entrypoint (OAuth callback exato — não interfere no tRPC). */
const oauthCallback = path.join(apiDir, "oauth", "callback.js");
fs.mkdirSync(path.dirname(oauthCallback), { recursive: true });
fs.writeFileSync(oauthCallback, 'export { default } from "../index.js";\n', "utf8");

console.info("[build] Vercel API: api/index.js + oauth/callback.js + rewrite /api/(.*) → /api");
