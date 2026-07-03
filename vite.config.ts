import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

const plugins = [react(), tailwindcss(), jsxLocPlugin()];

const projectRoot = path.resolve(import.meta.dirname);

function normalizeAppUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.replace(/\/+$/, "") || "https://fui-app.vercel.app";
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "");
  const viteBetaDemo = env.VITE_BETA_DEMO ?? process.env.VITE_BETA_DEMO ?? "";
  const appUrl = normalizeAppUrl(
    env.VITE_APP_URL ?? process.env.VITE_APP_URL ?? "https://fui-app.vercel.app"
  );

  return {
    plugins: [
      ...plugins,
      {
        name: "fui-canonical-url",
        transformIndexHtml(html) {
          const redirectScript = `<script>(function(){try{var c=${JSON.stringify(appUrl)};var h=location.hostname;var u=new URL(c);if(h!==u.hostname&&h!=='localhost'&&h!=='127.0.0.1'&&h!=='fuiapp.com.br'&&h!=='www.fuiapp.com.br'&&/\\.vercel\\.app$/.test(h))location.replace(c+location.pathname+location.search+location.hash);}catch(e){}})();</script>`;
          return html
            .replace("</head>", `${redirectScript}</head>`)
            .replaceAll("https://fuiapp.com.br", appUrl);
        },
      },
    ],
    define: {
      "import.meta.env.VITE_BETA_DEMO": JSON.stringify(viteBetaDemo),
      "import.meta.env.VITE_APP_URL": JSON.stringify(appUrl),
    },
    resolve: {
      alias: {
        "@": path.resolve(projectRoot, "client", "src"),
        "@shared": path.resolve(projectRoot, "shared"),
        "@assets": path.resolve(projectRoot, "attached_assets"),
      },
    },
    envDir: projectRoot,
    root: path.resolve(projectRoot, "client"),
    publicDir: path.resolve(projectRoot, "client", "public"),
    build: {
      outDir: path.resolve(projectRoot, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: true,
      allowedHosts: ["localhost", "127.0.0.1"],
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
