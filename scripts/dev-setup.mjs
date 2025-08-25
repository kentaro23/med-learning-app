import fs from "node:fs";
import { spawn } from "node:child_process";
import readline from "node:readline";
import crypto from "node:crypto";

const ENV_PATH = ".env.local";

function readEnv(path){
  const m = new Map();
  if (fs.existsSync(path)) {
    for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
      const m2 = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m2) m.set(m2[1], m2[2]);
    }
  }
  return m;
}

function writeEnv(path, m){
  const lines = [];
  for (const [k,v] of m) lines.push(`${k}=${v}`);
  fs.writeFileSync(path, lines.join("\n") + "\n", {encoding:"utf8"});
}

function hidePrompt(query){
  return new Promise((resolve)=>{
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl._writeToOutput = function(){}; // suppress echo
    rl.question(query, (ans)=>{ rl.close(); resolve(ans.trim()); });
    process.stdout.write(query);
  });
}

function maskUri(u){
  try{
    const url = new URL(u);
    const host = url.hostname, port = url.port;
    return `${host}:${port}`;
  }catch{ return "<invalid>"; }
}

async function run(cmd, args){
  return await new Promise((resolve,reject)=>{
    const p = spawn(cmd, args, {stdio:["ignore","pipe","pipe"]});
    let out="", err="";
    p.stdout.on("data", d=> out+=d.toString());
    p.stderr.on("data", d=> err+=d.toString());
    p.on("error", (error) => {
      reject(new Error(`Command '${cmd}' not found: ${error.message}`));
    });
    p.on("close", c=> c===0 ? resolve({out,err}) : reject(new Error(err||out)));
  });
}

async function tryPullFromVercel(){
  // Try pulling envs without printing secrets
  try{
    console.log("🔍 Trying to pull environment variables from Vercel...");
    await run("vercel", ["env","pull",".env.vercel"]);
    const map = readEnv(".env.vercel");
    fs.rmSync(".env.vercel", {force:true});
    console.log("✅ Successfully pulled environment variables from Vercel");
    return map;
  }catch(error){
    if (error.message.includes("not found")) {
      console.log("⚠️  Vercel CLI not found, skipping Vercel env pull");
    } else {
      console.log("⚠️  Failed to pull from Vercel:", error.message);
    }
    return new Map();
  }
}

function ensureBase(map){
  // NEXTAUTH_URL / AUTH_TRUST_HOST
  map.set("NEXTAUTH_URL", "http://localhost:3000");
  map.set("AUTH_TRUST_HOST", "true");
  // NEXTAUTH_SECRET
  const sec = map.get("NEXTAUTH_SECRET");
  if (!sec || sec.length < 32) {
    const gen = crypto.randomBytes(32).toString("base64");
    map.set("NEXTAUTH_SECRET", gen);
    console.log("🔐 Generated new NEXTAUTH_SECRET");
  }
  return map;
}

function need(v){ return v && v.trim().length>0; }

(async ()=>{
  console.log("🚀 Setting up development environment...");
  
  const cur = readEnv(ENV_PATH);
  const pulled = await tryPullFromVercel();
  // merge order: pulled -> cur (local overrides pulled)
  const env = new Map([...pulled, ...cur]);

  // Base entries
  ensureBase(env);

  // DB URIs
  if (!need(env.get("DATABASE_URL"))) {
    console.log("\n📝 DATABASE_URL not found, please enter your Supabase connection string");
    const v = await hidePrompt("Paste your Supabase DATABASE_URL (hidden): ");
    env.set("DATABASE_URL", v);
  }
  if (!need(env.get("DIRECT_URL"))) {
    console.log("\n📝 DIRECT_URL not found, please enter your Supabase direct connection string");
    const v = await hidePrompt("Paste your Supabase DIRECT_URL (hidden): ");
    env.set("DIRECT_URL", v);
  }

  // Write .env.local
  writeEnv(ENV_PATH, env);

  // Safe summary
  console.log("\n✅ Wrote .env.local (secrets not printed).");
  console.log(" NEXTAUTH_URL:", env.get("NEXTAUTH_URL"));
  console.log(" AUTH_TRUST_HOST:", env.get("AUTH_TRUST_HOST"));
  console.log(" DATABASE_URL ->", maskUri(env.get("DATABASE_URL")));
  console.log(" DIRECT_URL   ->", maskUri(env.get("DIRECT_URL")));

  // Connectivity probe if available
  if (fs.existsSync("scripts/check-db.mjs")) {
    console.log("\n🔍 Checking database connectivity...");
    try {
      await run("node", ["scripts/check-db.mjs"]);
      console.log("✅ Database connectivity check passed");
    } catch (error) {
      console.log("⚠️  Database connectivity check failed:", error.message);
    }
  }

  // Prisma + Typecheck
  console.log("\n🔧 Running Prisma validation and generation...");
  try { 
    await run("pnpm", ["-s","prisma","validate"]); 
    console.log("✅ Prisma validation passed");
  } catch(e){ 
    console.log("❌ Prisma validation failed:", e.message); 
  }
  
  try { 
    await run("pnpm", ["-s","prisma","generate"]); 
    console.log("✅ Prisma client generated");
  } catch(e){ 
    console.log("❌ Prisma generation failed:", e.message); 
  }
  
  console.log("\n🔍 Running TypeScript check...");
  try { 
    await run("pnpm", ["-s","tsc","--noEmit"]); 
    console.log("✅ TypeScript check passed");
  } catch(e){ 
    console.log("❌ TypeScript check failed:", e.message); 
  }

  console.log("\n🎉 Setup complete! Start development with: pnpm dev");
})();
