import fs from "node:fs";
import path from "node:path";

const apiDir = path.resolve("api");

/** Legado: trpc.js só atendia /api/trpc exato. */
for (const legacy of ["trpc.js", "[[...path]].js", "[...path].js"]) {
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

const reExport = 'export { default } from "../index.js";\n';

/** tRPC usa /api/trpc/<procedure> — catch-all nativo da Vercel. */
const trpcCatchAll = path.join(apiDir, "trpc", "[...path].js");
fs.mkdirSync(path.dirname(trpcCatchAll), { recursive: true });
fs.writeFileSync(trpcCatchAll, reExport, "utf8");

/** OAuth callback exato — reutiliza o mesmo Express bundle. */
const oauthCallback = path.join(apiDir, "oauth", "callback.js");
fs.mkdirSync(path.dirname(oauthCallback), { recursive: true });
fs.writeFileSync(oauthCallback, reExport, "utf8");

console.info(
  "[build] Vercel API: api/index.js + api/trpc/[...path].js + api/oauth/callback.js"
);
