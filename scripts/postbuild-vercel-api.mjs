import fs from "node:fs";
import path from "node:path";

const apiDir = path.resolve("api");
const trpcDir = path.join(apiDir, "trpc");

for (const legacy of [
  "index.js",
  "_handler.js",
  "trpc.js",
  "[[...path]].js",
  path.join("trpc", "[...path].js"),
]) {
  try {
    fs.unlinkSync(path.join(apiDir, legacy));
  } catch {
    // optional cleanup
  }
}

const appBundle = path.join(trpcDir, "_app.js");
const entryBundle = path.join(trpcDir, "_entry.js");

if (!fs.existsSync(appBundle) || !fs.existsSync(entryBundle)) {
  console.error("[build] api/trpc/_app.js and _entry.js required — run esbuild first");
  process.exit(1);
}

const catchAll = path.join(trpcDir, "[...path].js");
fs.writeFileSync(catchAll, 'export { default } from "./_entry.js";\n', "utf8");

fs.copyFileSync(catchAll, path.join(apiDir, "trpc.js"));

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

console.info("[build] Vercel API: trpc/_entry.js + trpc/_app.js + trpc/[...path].js");
