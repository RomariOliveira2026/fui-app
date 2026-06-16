import fs from "node:fs";
import path from "node:path";

const apiDir = path.resolve("api");

for (const legacy of [
  "index.js",
  "_handler.js",
  "trpc.js",
  "[[...path]].js",
  "[...path].js",
]) {
  try {
    fs.unlinkSync(path.join(apiDir, legacy));
  } catch {
    // optional cleanup
  }
}

const trpcHandler = path.join(apiDir, "trpc", "[...path].js");
if (!fs.existsSync(trpcHandler)) {
  console.error("[build] api/trpc/[...path].js missing — run esbuild server/trpcVercel.ts first");
  process.exit(1);
}

/** /api/trpc exato + alvo do rewrite opcional */
fs.copyFileSync(trpcHandler, path.join(apiDir, "trpc.js"));

/** OAuth callback — reutiliza o mesmo handler tRPC por ora (rota OAuth fica no Express em Railway). */
const oauthCallback = path.join(apiDir, "oauth", "callback.js");
fs.mkdirSync(path.dirname(oauthCallback), { recursive: true });
fs.writeFileSync(
  oauthCallback,
  `export default function handler(_req, res) {
  res.statusCode = 501;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "OAuth callback not configured on Vercel preview" }));
}
`,
  "utf8"
);

console.info("[build] Vercel API: trpc/[...path].js + trpc.js");
