import fs from "node:fs";
import { URL } from "node:url";
import child_process from "node:child_process";

function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  const txt = fs.readFileSync(file, "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
function saveEnv(file, envObj) {
  const lines = Object.entries(envObj).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(file, lines.join("\n") + "\n");
}
function to5432(uStr) {
  const u = new URL(uStr);
  u.port = "5432";
  // 5432では pgBouncerパラメータ不要。必要なら残しても害なしだが掃除する:
  const params = ["pgbouncer","connection_limit"];
  for (const p of params) u.searchParams.delete(p);
  if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode","require");
  return u.toString();
}
function to6543(uStr) {
  const u = new URL(uStr);
  u.port = "6543";
  u.searchParams.set("pgbouncer","true");
  u.searchParams.set("connection_limit","1");
  if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode","require");
  return u.toString();
}

const localFile = ".env.local";
const env = loadEnv(localFile);
if (!env.DATABASE_URL || !env.DIRECT_URL) {
  console.log("INFO: .env.local に DATABASE_URL / DIRECT_URL がないため、.env から補完を試みます。");
  const env2 = loadEnv(".env");
  if (!env.DATABASE_URL && env2.DATABASE_URL) env.DATABASE_URL = env2.DATABASE_URL;
  if (!env.DIRECT_URL && env2.DIRECT_URL) env.DIRECT_URL = env2.DIRECT_URL;
}
if (!env.DATABASE_URL || !env.DIRECT_URL) {
  console.error("ERROR: DATABASE_URL or DIRECT_URL missing. Please paste your Supabase connection URIs once, then re-run.");
  process.exit(1);
}

// 現状を表示
console.log("Current local env:");
console.log("DATABASE_URL=", env.DATABASE_URL);
console.log("DIRECT_URL  =", env.DIRECT_URL);

// Local を 5432 に切替
const localDB5432   = to5432(env.DATABASE_URL);
const localDirect5432 = to5432(env.DIRECT_URL);

// バックアップ
const bak = `.env.local.bak-${Date.now()}`;
if (fs.existsSync(localFile)) fs.copyFileSync(localFile, bak);

// 書き込み（ローカルは両方とも 5432）
env.DATABASE_URL = localDB5432;
env.DIRECT_URL   = localDirect5432;
saveEnv(localFile, env);

console.log("\nWrote .env.local (both to 5432). Backup:", bak);

// 簡易接続チェック
import net from "node:net";
async function ping(host, port, ms=3000) {
  return new Promise(res=>{
    const s = net.createConnection({host, port, timeout: ms}, ()=>{ s.destroy(); res(true); });
    s.on("error", ()=>res(false));
    s.on("timeout", ()=>{ s.destroy(); res(false); });
  });
}
const host = new URL(env.DATABASE_URL).host.split(":")[0];
const port = Number(new URL(env.DATABASE_URL).port || 5432);
const host2 = new URL(env.DIRECT_URL).host.split(":")[0];
const port2 = Number(new URL(env.DIRECT_URL).port || 5432);
const ok1 = await ping(host, port);
const ok2 = await ping(host2, port2);
console.log("\nConnectivity:");
console.log(`${host}:${port} ->`, ok1);
console.log(`${host2}:${port2} ->`, ok2);

// Prisma 再生成
try {
  child_process.execSync("pnpm -s prisma generate", { stdio: "inherit" });
} catch (e) {
  console.log("WARN: prisma generate failed. You can run it manually.");
}

// Vercel 側（任意）：Production/Preview を 6543 に整える（CLI ログイン済みなら）
function hasVercelCLI() {
  try { child_process.execSync("vercel --version", {stdio:"ignore"}); return true; } catch { return false; }
}
if (hasVercelCLI()) {
  const proj = (process.env.VERCEL_PROJECT || "").trim(); // 任意: 指定があれば使用
  const base = proj ? `-y --scope ${process.env.VERCEL_ORG||""} --yes` : "-y";
  // 既存 local の 5432 から 6543 版を推定（ホスト等は同じ想定）
  const prodDB6543   = to6543(env.DATABASE_URL);
  const prodDirect   = to5432(env.DIRECT_URL); // DIRECT_URL は 5432 推奨
  console.log("\n[Optional] Attempting to set Vercel envs via CLI...");
  const setEnv = (name, value, envName) => {
    try {
      // CLIの仕様により "env add" を stdin 経由で与える
      child_process.execSync(`printf "${value.replace(/"/g,'\\"')}" | vercel env add ${name} ${envName}`, { stdio:"inherit" });
    } catch (e) {
      console.log(`WARN: Failed to set ${name} for ${envName}. You can paste it manually:\n${name}=${value}\n`);
    }
  };
  setEnv("DATABASE_URL", prodDB6543, "production");
  setEnv("DATABASE_URL", prodDB6543, "preview");
  setEnv("DIRECT_URL",   prodDirect, "production");
  setEnv("DIRECT_URL",   prodDirect, "preview");
  console.log("\nIf CLI prompts appeared, follow them; otherwise paste values manually in the Vercel dashboard.");
} else {
  console.log("\nVercel CLI not found/logged-in. Paste these in the dashboard:");
  const prodDB6543   = to6543(env.DATABASE_URL);
  const prodDirect   = to5432(env.DIRECT_URL);
  console.log("\n[Production/Preview] DATABASE_URL =", prodDB6543);
  console.log("[Production/Preview] DIRECT_URL   =", prodDirect, "(recommended 5432)");
  console.log("\nRemember to Redeploy after saving.");
}
