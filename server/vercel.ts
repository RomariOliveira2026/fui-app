import "dotenv/config";
import { createApp } from "./_core/createApp";

/**
 * Entry point bundlado para a função serverless Vercel (api/index.js).
 * Não importar este arquivo diretamente em runtime — use o bundle gerado no build.
 */
const app = createApp({ enableStatic: false });

export default app;
