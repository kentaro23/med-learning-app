import fs from "node:fs";
import readline from "node:readline";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const ENV_PATH = ".env.local";

function parseEnv(text){
  const m = new Map();
  for (const line of text.split(/\r?\n/)) {
    const mm = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (mm) m.set(mm[1], mm[2]);
  }
  return m;
}
function readEnv(path){
  if (!fs.existsSync(path)) return new Map();
  return parseEnv(fs.readFileSync(path, "utf8"));
}
function writeEnv(path, map){
  const lines = [];
  for (const [k,v] of map) lines.push(`${k}=${v}`);
  fs.writeFileSync(path, lines.join("\n") + "\n", "utf8");
}

function isPgUrl(u){
  try {
    if (!/^postgres(ql)?:\/\//i.test(u)) return false;
    const x = new URL(u);
    return (x.protocol === "postgresql:" || x.protocol === "postgres:") && !!x.hostname;
  } catch { return false; }
}

function normalizePgUrl(u){
  // Ensure sslmode for production-ish connections if missing.
  try {
    const x = new URL(u);
    const params = new URLSearchParams(x.search);
    if (!params.has("sslmode")) params.set("sslmode", "require");
    x.search = params.toString() ? "?" + params.toString() : "";
    return x.toString();
  } catch { return u; }
}

function mask(u){
  try {
    const x = new URL(u);
    return `${x.hostname}:${x.port || (x.protocol.startsWith("postgres") ? "5432" : "")}`;
  } catch { return "<invalid>"; }
}

function hiddenPrompt(label){
  return new Promise((resolve)=>{
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl._writeToOutput = function(){}; // no echo
    process.stdout.write(label);
    rl.question("", (ans)=>{ rl.close(); resolve(ans.trim()); });
  });
}

async function run(cmd, args){
  return await new Promise((resolve,reject)=>{
    const p = spawn(cmd, args, {stdio:["ignore","pipe","pipe"]});
    let out="", err="";
    p.stdout.on("data", d=> out+=d.toString());
    p.stderr.on("data", d=> err+=d.toString());
    p.on("close", c=> c===0 ? resolve({out,err}) : reject(new Error(err||out)));
  });
}

(async ()=>{
  // 1) load current env
  const env = readEnv(ENV_PATH);

  // 2) ensure base dev vars
  if (!env.get("NEXTAUTH_URL")) env.set("NEXTAUTH_URL", "http://localhost:3000");
  if (!env.get("AUTH_TRUST_HOST")) env.set("AUTH_TRUST_HOST", "true");
  if (!env.get("NEXTAUTH_SECRET") || env.get("NEXTAUTH_SECRET").length < 32) {
    env.set("NEXTAUTH_SECRET", crypto.randomBytes(32).toString("base64"));
  }

  // 3) DATABASE_URL
  let db = env.get("DATABASE_URL");
  if (!db || !isPgUrl(db)) {
    db = await hiddenPrompt("\nPaste your Supabase DATABASE_URL (hidden): ");
  }
  while (!isPgUrl(db)) {
    db = await hiddenPrompt("Invalid URL. Paste a valid postgres URI (postgresql://...): ");
  }
  db = normalizePgUrl(db);
  env.set("DATABASE_URL", db);

  // 4) DIRECT_URL
  let direct = env.get("DIRECT_URL");
  if (!direct || !isPgUrl(direct)) {
    direct = await hiddenPrompt("Paste your Supabase DIRECT_URL (hidden): ");
  }
  while (!isPgUrl(direct)) {
    direct = await hiddenPrompt("Invalid URL. Paste a valid postgres URI (postgresql://...): ");
  }
  direct = normalizePgUrl(direct);
  env.set("DIRECT_URL", direct);

  // 5) write .env.local
  writeEnv(ENV_PATH, env);

  // 6) safe summary
  console.log("\n✅ .env.local updated (secrets not printed)");
  console.log(" NEXTAUTH_URL:", env.get("NEXTAUTH_URL"));
  console.log(" AUTH_TRUST_HOST:", env.get("AUTH_TRUST_HOST"));
  console.log(" DATABASE_URL ->", mask(env.get("DATABASE_URL")));
  console.log(" DIRECT_URL   ->", mask(env.get("DIRECT_URL")));

  // 7) try prisma validate/generate
  try { await run("pnpm", ["-s","prisma","validate"]); } catch(e){ console.error(e.message); }
  try { await run("pnpm", ["-s","prisma","generate"]); } catch(e){ console.error(e.message); }

  // 8) optional connectivity check if check-db exists
  if (fs.existsSync("scripts/check-db.mjs")) {
    try { await run("node", ["scripts/check-db.mjs"]); } catch(e){ console.error(e.message); }
  }

  console.log("\nDone. Start dev with: pnpm dev");
})();
