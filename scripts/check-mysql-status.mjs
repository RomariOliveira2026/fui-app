import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

const EXPECTED_LATEST = "0018_media_campaigns";

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

function maskUrl(url) {
  try {
    const u = new URL(url.replace(/^mysql:\/\//, "http://"));
    return {
      host: u.hostname + (u.port ? `:${u.port}` : ""),
      database: u.pathname.replace(/^\//, "") || "(sem database)",
      user: u.username || "(vazio)",
      isLocal: ["localhost", "127.0.0.1"].includes(u.hostname),
    };
  } catch {
    return { host: "(invalid)", database: "?", user: "?", isLocal: false };
  }
}

const envFile = loadEnvFile();
const url = process.env.DATABASE_URL || envFile.DATABASE_URL;
const report = {
  checkedAt: new Date().toISOString(),
  expectedLatestMigration: EXPECTED_LATEST,
  hasDatabaseUrl: Boolean(url),
  urlSource: process.env.DATABASE_URL
    ? "DATABASE_URL (ambiente atual)"
    : envFile.DATABASE_URL
      ? ".env local"
      : "nenhuma",
  vercelProduction: "nao verificavel daqui (sem Vercel CLI) — confira em Vercel → Settings → Environment Variables → Production",
};

if (!url) {
  report.connection = "nao testada";
  report.summary =
    "Nenhuma DATABASE_URL no ambiente local. Producao: verifique manualmente na Vercel.";
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

report.target = maskUrl(url);
report.isLikelyProduction = !report.target.isLocal;

try {
  const conn = await mysql.createConnection(url);
  report.connection = "ok";

  const [dbRow] = await conn.query("SELECT DATABASE() AS db");
  report.currentDatabase = dbRow[0]?.db ?? null;

  const [tables] = await conn.query(
    "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name"
  );
  report.tableCount = tables.length;
  const tableNames = tables.map((r) => r.name);
  report.hasMediaPartners = tableNames.includes("media_partners");
  report.hasMediaCampaigns = tableNames.includes("media_campaigns");
  report.hasCampaignEvents = tableNames.includes("campaign_events");
  report.mediaMigrationApplied =
    report.hasMediaPartners && report.hasMediaCampaigns && report.hasCampaignEvents;

  try {
    const [migrations] = await conn.query(
      "SELECT id, hash, created_at FROM __drizzle_migrations ORDER BY created_at"
    );
    report.appliedMigrationCount = migrations.length;
    report.latestAppliedMigration = migrations[migrations.length - 1]?.id ?? null;
    report.migrationsTable = "ok";
  } catch {
    report.migrationsTable = "missing";
    report.appliedMigrationCount = 0;
    report.latestAppliedMigration = null;
  }

  await conn.end();
} catch (error) {
  report.connection = "failed";
  report.errorCode = error.code || String(error.errno ?? "unknown");
  report.errorMessage = error.sqlMessage || error.message;
  report.mediaMigrationApplied = false;
}

if (report.connection === "failed") {
  report.summary =
    report.target.isLocal
      ? "MySQL local configurado, mas conexao falhou (servico parado ou database inexistente)."
      : "DATABASE_URL aponta para host remoto, mas conexao falhou.";
} else if (!report.mediaMigrationApplied) {
  report.summary = "Conexao OK, mas tabelas da Onda 2 (media_*) ainda nao existem — rode migrations.";
} else {
  report.summary = "Conexao OK e tabelas media_* presentes.";
}

console.log(JSON.stringify(report, null, 2));
