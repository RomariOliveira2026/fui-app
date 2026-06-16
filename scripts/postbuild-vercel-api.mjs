import fs from "node:fs";
import path from "node:path";

const apiDir = path.resolve("api");
const trpcDir = path.join(apiDir, "trpc");
const bundle = path.join(trpcDir, "bundle.js");
const catchAll = path.join(trpcDir, "[...path].js");

for (const legacy of ["index.js", "_handler.js", "trpc.js", "[[...path]].js", path.join("trpc", "[...path].ts")]) {
  try {
    fs.unlinkSync(path.join(apiDir, legacy));
  } catch {
    // optional cleanup
  }
}

if (!fs.existsSync(bundle)) {
  console.error("[build] api/trpc/bundle.js missing — run esbuild server/trpcVercel.ts first");
  process.exit(1);
}

if (!fs.existsSync(catchAll)) {
  fs.writeFileSync(catchAll, 'export { default } from "./bundle.js";\n', "utf8");
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

console.info("[build] Vercel API: trpc/[...path].js + trpc/bundle.js");
