import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

const plugins = [react(), tailwindcss(), jsxLocPlugin()];

const projectRoot = path.resolve(import.meta.dirname);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "");
  const viteBetaDemo = env.VITE_BETA_DEMO ?? process.env.VITE_BETA_DEMO ?? "";

  return {
    plugins,
    define: {
      "import.meta.env.VITE_BETA_DEMO": JSON.stringify(viteBetaDemo),
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
