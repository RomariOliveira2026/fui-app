import fs from "node:fs";
import path from "node:path";

const apiDir = path.resolve("api");
const reExportFromIndex = 'export { default } from "./index.js";\n';
const reExportFromParent = 'export { default } from "../index.js";\n';

const routes = [
  { file: "trpc.js", content: reExportFromIndex },
  { file: path.join("oauth", "callback.js"), content: reExportFromParent },
];

for (const { file, content } of routes) {
  const target = path.join(apiDir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

for (const legacy of ["[[...path]].js"]) {
  try {
    fs.unlinkSync(path.join(apiDir, legacy));
  } catch {
    // optional cleanup
  }
}

console.info("[build] Vercel API entrypoints:", routes.map((r) => r.file).join(", "));
