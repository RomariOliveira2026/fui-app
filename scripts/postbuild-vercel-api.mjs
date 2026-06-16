import fs from "node:fs";
import path from "node:path";

const apiDir = path.resolve("api");
const trpcCatchAll = path.join(apiDir, "trpc", "[...path].js");

for (const legacy of ["index.js", "_handler.js", "trpc.js", "[[...path]].js"]) {
  try {
    fs.unlinkSync(path.join(apiDir, legacy));
  } catch {
    // optional cleanup
  }
}

if (!fs.existsSync(trpcCatchAll)) {
  console.error("[build] api/trpc/[...path].js missing — run esbuild server/trpcVercel.ts first");
  process.exit(1);
}

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

console.info("[build] Vercel API: api/trpc/[...path].js");
