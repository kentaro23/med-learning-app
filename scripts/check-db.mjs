import net from "node:net";
function parse(u){ try{ const x=new URL(u); return {host:x.hostname, port:Number(x.port||"5432"), raw:u}; } catch { return null; } }
async function canConnect(host, port, timeoutMs=4000){
  return await new Promise(res=>{
    const s = net.createConnection({host, port, timeout: timeoutMs}, ()=>{ s.destroy(); res(true); });
    s.on("error", ()=>{ res(false); });
    s.on("timeout", ()=>{ s.destroy(); res(false); });
  });
}
function log(o){ console.log(JSON.stringify(o)); }
const db = parse(process.env.DATABASE_URL||"");
const direct = parse(process.env.DIRECT_URL||"");
log({HAS_DB:!!db, DB: db && {host:db.host, port:db.port}, HAS_DIRECT:!!direct, DIRECT: direct && {host:direct.host, port:direct.port}});
if(!db || !direct){ console.error("Missing DATABASE_URL or DIRECT_URL"); process.exit(1); }
const run = async ()=>{
  const ok1 = await canConnect(db.host, db.port);
  const ok2 = await canConnect(direct.host, direct.port);
  log({CONNECTIVITY:{[`${db.host}:${db.port}`]:ok1, [`${direct.host}:${direct.port}`]:ok2}});
  if(!ok1){ console.error("Cannot reach DATABASE_URL host/port"); process.exit(1); }
  if(!ok2){ console.error("Cannot reach DIRECT_URL host/port"); process.exit(1); }
};
await run();
