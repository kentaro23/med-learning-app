import fs from "node:fs";
import readline from "node:readline";
import { spawn } from "node:child_process";

function hidePrompt(query){
  return new Promise((resolve)=>{
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const _write = rl._writeToOutput;
    rl._writeToOutput = function(){ /* suppress echo */ };
    rl.question(query, (ans)=>{ rl.history = rl.history.slice(1); rl.close(); resolve(ans.trim()); });
    process.stdout.write(query);
  });
}

function mustPooler6543(u){
  let ok=true, out=u;
  try{
    const url = new URL(u);
    if(!url.hostname.includes("pooler.supabase.com")) ok=false;
    if(url.port !== "6543") ok=false;
    const params = url.searchParams;
    if(!params.has("pgbouncer")) params.set("pgbouncer","true");
    if(!params.has("connection_limit")) params.set("connection_limit","1");
    if(!params.has("sslmode")) params.set("sslmode","require");
    // rebuild
    url.search = params.toString();
    out = url.toString();
  }catch{ ok=false; }
  return { ok, out };
}

function mask(u){
  try{
    const url = new URL(u);
    const user = url.username || "";
    const host = url.hostname || "";
    const port = url.port || "";
    return `postgresql://${user?user+"@":""}${host}:${port}${url.pathname}?${url.searchParams.toString().replace(/password=[^&]*/,"password=***")}`;
  }catch{
    return "<invalid>";
  }
}

async function run(cmd, args, input){
  return await new Promise((resolve, reject)=>{
    const p = spawn(cmd, args, { stdio: ["pipe","pipe","pipe"] });
    let out="", err="";
    p.stdout.on("data", d=> out += d.toString());
    p.stderr.on("data", d=> err += d.toString());
    p.on("close", code=> code===0 ? resolve({code,out,err}) : reject(new Error(err||out)));
    if(input){ p.stdin.write(input); }
    p.stdin.end();
  });
}

async function main(){
  // 1) ask URIs once (hidden input)
  const dbUri = await hidePrompt("Paste Transaction pooler(6543) URI for DATABASE_URL (hidden): ");
  const directUri = await hidePrompt("Paste Transaction pooler(6543) URI for DIRECT_URL (hidden; TEMP same as above): ");

  const a = mustPooler6543(dbUri);
  const b = mustPooler6543(directUri);
  if(!a.ok || !b.ok){
    console.error("\nInvalid URI(s). They must be pooler hosts (*.pooler.supabase.com) and port 6543. Try again.");
    process.exit(1);
  }

  const envText = `DATABASE_URL=${a.out}
DIRECT_URL=${b.out}
`;
  fs.writeFileSync(".env.local", envText, {encoding:"utf8", flag:"w"});
  console.log("\n.env.local written (secrets not printed).");
  console.log("DATABASE_URL =>", mask(a.out));
  console.log("DIRECT_URL   =>", mask(b.out));

  // 2) connectivity probe (fails fast if wrong)
  await run("node", ["scripts/check-db.mjs"]);

  // 3) prisma validate/generate/migrate
  await run("pnpm", ["-s","prisma","validate"]);
  await run("pnpm", ["-s","prisma","generate"]);
  try{
    // create initial migration if none
    if(!fs.existsSync("prisma/migrations") || fs.readdirSync("prisma/migrations").length===0){
      await run("pnpm", ["-s","prisma","migrate","dev","--name","init"]);
    } else {
      console.log("migrations exist: skipping migrate dev");
    }
  }catch(e){
    console.error("Prisma migrate failed:", e.message);
    process.exit(1);
  }

  // 4) commit & push (never commit .env*)
  await run("git", ["add","prisma/migrations","prisma/schema.prisma","package.json","scripts/check-db.mjs","scripts/secure-setup.mjs"]);
  try { await run("git", ["commit","-m","chore: secure setup + pooler env + initial prisma migration"]); } catch {}
  await run("git", ["push","origin","main"]);

  // 5) optional: sync to Vercel envs without echo
  console.log("\nOptionally syncing envs to Vercel (Prod/Preview/Dev). If CLI not configured, this may fail safely.");
  try{
    const inp1 = envText; // contains two lines
    await run("bash", ["-lc", `printf %s "${envText.replace(/"/g,'\\"')}" > .env.tmp`]);
    await run("bash", ["-lc", `grep '^DATABASE_URL=' .env.tmp | cut -d= -f2- | vercel env add DATABASE_URL production || true`]);
    await run("bash", ["-lc", `grep '^DIRECT_URL='   .env.tmp | cut -d= -f2- | vercel env add DIRECT_URL  production || true`]);
    await run("bash", ["-lc", `grep '^DATABASE_URL=' .env.tmp | cut -d= -f2- | vercel env add DATABASE_URL preview    || true`]);
    await run("bash", ["-lc", `grep '^DIRECT_URL='   .env.tmp | cut -d= -f2- | vercel env add DIRECT_URL  preview    || true`]);
    await run("bash", ["-lc", `grep '^DATABASE_URL=' .env.tmp | cut -d= -f2- | vercel env add DATABASE_URL development || true`]);
    await run("bash", ["-lc", `grep '^DIRECT_URL='   .env.tmp | cut -d= -f2- | vercel env add DIRECT_URL  development || true`]);
    await run("bash", ["-lc", `rm -f .env.tmp`]);
    console.log("Attempted Vercel env sync (ignore if project not linked).");
  }catch(e){
    console.log("Vercel env sync skipped or failed (that's OK). You can set them in dashboard.");
  }

  // 6) summary
  console.log("\n✅ Setup completed. Next: Redeploy on Vercel with Clear build cache.");
  console.log("Checklist:");
  console.log("- tsc will run in CI via next build; you can run `pnpm -s tsc --noEmit` locally.");
  console.log("- .env.local present (not committed).");
  console.log("- prisma/migrations created/pushed.");
  console.log("- build will run: check-db → migrate deploy → next build.");
}
main().catch(e=>{ console.error(e); process.exit(1); });
