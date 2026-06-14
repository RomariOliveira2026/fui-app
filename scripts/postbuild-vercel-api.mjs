import fs from "node:fs";
import path from "node:path";

const apiDir = path.resolve("api");

/** api/trpc.js só atende /api/trpc exato — subpaths tRPC caem em 404 HTML. */
for (const legacy of [
  "index.js",
  "trpc.js",
  path.join("oauth", "callback.js"),
]) {
  try {
    fs.unlinkSync(path.join(apiDir, legacy));
  } catch {
    // optional cleanup
  }
}

const catchAll = path.join(apiDir, "[[...path]].js");
if (!fs.existsSync(catchAll)) {
  console.error("[build] api/[[...path]].js missing — run esbuild server/vercel.ts first");
  process.exit(1);
}

console.info("[build] Vercel API catch-all:", catchAll);
