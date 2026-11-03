import http from 'node:http';
import {readFile,readdir,realpath,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const project = fileURLToPath(new URL('../',import.meta.url));
const runPattern = /^[\w-]+$/;
export function createDashboard(root=project) {
 const token=randomUUID();let job=null,child=null;
 const runs=path.join(root,'runs');
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const clean=text=>process.env.MODEL_API_KEY ? text.split(process.env.MODEL_API_KEY).join('[redacted]') : text;
 async function runFile(id,name) {
  if(!runPattern.test(id)||! /^[\w.-]+$/.test(name))throw new Error('Invalid path');
  const base=await realpath(runs),file=await realpath(path.join(runs,id,name));
  if(!file.startsWith(base+path.sep))throw new Error('Invalid path');
  return file;
 }
 const server=http.createServer(async(req,res)=>{
  try {
   const host=`127.0.0.1:${server.address().port}`;
   if(req.headers.host!==host && req.headers.host!==`localhost:${server.address().port}`)return send(res,403,{error:'Local access only'});
   const url=new URL(req.url,`http://${host}`),parts=url.pathname.split('/').filter(Boolean);
   if(req.method==='POST') {
    if(req.headers['x-bugarena-token']!==token)return send(res,403,{error:'Invalid session token'});
    if(url.pathname==='/api/start') {
     if(child)return send(res,409,{error:'A test is already running.'});
     const kind=url.searchParams.get('kind');
     const args={ai:['src/hunt.js'],fixed:['src/hunt.js','--fixed'],coverage:['src/coverage.js'],smoke:['src/hunt.js','--fixture']}[kind];
     if(!args)return send(res,400,{error:'Unknown test type'});
     if(['ai','fixed'].includes(kind)&&!process.env.MODEL_API_KEY)return send(res,400,{error:'Set MODEL_API_KEY in .env and restart the dashboard.'});
     const env={...process.env};
     const localBrowsers=path.resolve(root,'../../work/bugarena-browsers');
     if(!env.PLAYWRIGHT_BROWSERS_PATH&&existsSync(localBrowsers))env.PLAYWRIGHT_BROWSERS_PATH=localBrowsers;
     job={id:randomUUID(),kind,status:'running',startedAt:new Date().toISOString(),log:'',runId:null};
     const current=job;
     child=spawn(process.execPath,args,{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
     const append=chunk=>{current.log=(current.log+clean(chunk.toString())).slice(-50000);const match=current.log.match(/Artifacts:.*[\\/]runs[\\/]([\w-]+)/);if(match)current.runId=match[1];};
     child.stdout.on('data',append);child.stderr.on('data',append);
     const timer=setTimeout(()=>{current.status='timed-out';child?.kill();},15*60*1000);
     child.on('error',error=>{append(error.message);current.status='error';});
     child.on('close',code=>{clearTimeout(timer);current.exitCode=code;current.endedAt=new Date().toISOString();if(current.status==='running')current.status=code===0?'completed':'error';child=null;});
     return send(res,202,job);
    }
    if(url.pathname==='/api/stop') {if(child){job.status='cancelled';child.kill();}return send(res,200,{ok:true});}
    return send(res,404,{error:'Not found'});
   }
   if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
   if(url.pathname==='/api/state')return send(res,200,{token,job,keyConfigured:Boolean(process.env.MODEL_API_KEY)});
   if(url.pathname==='/api/runs') {
    const dirs=await readdir(runs,{withFileTypes:true}).catch(()=>[]);
    const reports=await Promise.all(dirs.filter(d=>d.isDirectory()&&runPattern.test(d.name)).map(async d=>{
     try {const r=JSON.parse(await readFile(await runFile(d.name,'report.json'),'utf8'));return {id:d.name,provider:r.provider,status:r.status,counts:r.counts,confirmed:r.confirmed,model:r.model};}catch{return null;}
    }));
    return send(res,200,reports.filter(Boolean).sort((a,b)=>b.id.localeCompare(a.id)));
   }
   if(parts[0]==='api'&&parts[1]==='runs'&&parts.length===3) {
    const file=await runFile(parts[2],'report.json'),report=JSON.parse(await readFile(file,'utf8'));
    const files=(await readdir(path.dirname(file))).filter(f=>/^(?:report\.(?:md|json)|regression\.spec\.js|[\w-]+\.png|[\w-]*trace\.zip)$/.test(f));
    return send(res,200,{report,files});
   }
   if(parts[0]==='artifacts'&&parts.length===3) {
    if(!/^(?:report\.(?:md|json)|regression\.spec\.js|[\w-]+\.png|[\w-]*trace\.zip)$/.test(parts[2]))return send(res,404,{error:'Not found'});
    const file=await runFile(parts[1],parts[2]);
    if((await stat(file)).size>30*1024*1024)return send(res,413,{error:'File too large'});
    const type=parts[2].endsWith('.png')?'image/png':'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff',...(type==='image/png'?{}:{'Content-Disposition':`attachment; filename="${parts[2]}"`})});return res.end(await readFile(file));
   }
   const assets={'/':'dashboard.html','/dashboard.js':'dashboard.js','/dashboard.css':'dashboard.css'};
   if(!assets[url.pathname])return send(res,404,{error:'Not found'});
   const file=assets[url.pathname];
   res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':'text/css','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'"});
   res.end(await readFile(path.join(project,'src',file)));
  }catch {if(!res.headersSent)send(res,404,{error:'Report or file unavailable.'});else res.end();}
 });
 server.on('close',()=>child?.kill());
 return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const server=createDashboard();
 server.listen(3200,'127.0.0.1',()=>console.log('BugArena dashboard: http://127.0.0.1:3200'));
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port 3200 is already in use. Close the previous dashboard first.':e.message);process.exitCode=1;});
}
