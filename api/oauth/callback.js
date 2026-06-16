export default function handler(_req, res) {
  res.statusCode = 501;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "OAuth callback not configured on Vercel preview" }));
}
