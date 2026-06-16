import http from "node:http";
import app from "../api/trpc/[...path].ts";

const intelligenceInput = encodeURIComponent(
  JSON.stringify({ 0: { json: { preset: "7d" } } })
);
const authInput = encodeURIComponent(JSON.stringify({ 0: { json: null } }));

const paths = [
  `/api/trpc/auth.me?batch=1&input=${authInput}`,
  `/api/trpc/admin.getOperationalIntelligence?batch=1&input=${intelligenceInput}`,
];

function request(path) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, async () => {
      const { port } = server.address();
      try {
        const response = await fetch(`http://127.0.0.1:${port}${path}`);
        const body = await response.text();
        resolve({ path, status: response.status, body });
      } catch (err) {
        reject(err);
      } finally {
        server.close();
      }
    });
  });
}

let failed = false;
for (const path of paths) {
  const result = await request(path);
  const isJson = result.body.startsWith("[") || result.body.startsWith("{");
  const label = path.split("/api/trpc/")[1]?.split("?")[0] ?? path;
  if (result.status === 200 && isJson) {
    console.log(`OK ${label} -> ${result.status} JSON`);
  } else {
    failed = true;
    console.error(`FAIL ${label} -> ${result.status}`, result.body.slice(0, 200));
  }
}

if (failed) process.exit(1);
