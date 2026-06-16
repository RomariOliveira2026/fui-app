import fs from "node:fs";
import path from "node:path";

const apiDir = path.resolve("api");

for (const legacy of [
  "index.js",
  "_handler.js",
  "trpc.js",
  "[[...path]].js",
  path.join("trpc", "handler.js"),
  path.join("trpc", "_app.js"),
  path.join("trpc", "_entry.js"),
  path.join("trpc", "[...path].js"),
]) {
  try {
    fs.unlinkSync(path.join(apiDir, legacy));
  } catch {
    // optional cleanup
  }
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

console.info("[build] Vercel API: api/trpc/[...path].ts (native) + oauth/callback.js");
