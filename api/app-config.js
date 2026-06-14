/** Runtime config — lê BETA_DEMO no servidor (sem depender do bundle Vite). */
export default function handler(_req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.status(200).json({
    betaDemo: process.env.BETA_DEMO === "true",
  });
}
