import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createDashboard} from '../src/dashboard-server.js';
test('hosted mode keeps evidence public and requires a separate secret for execution',async()=>{
 const key='test-only-judge-access-code-123456';
 const server=createDashboard(undefined,{publicMode:true,runKey:key});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try {
  const state=await (await fetch(base+'/api/state')).json();assert.equal(state.canRun,false);assert.equal(JSON.stringify(state).includes(key),false);
  assert.equal((await fetch(base+'/healthz')).status,200);
  assert.equal((await fetch(base+'/api/start?kind=smoke',{method:'POST',headers:{'x-bugarena-token':state.token}})).status,403);
  const unlocked=await (await fetch(base+'/api/state',{headers:{'x-bugarena-run-key':key}})).json();assert.equal(unlocked.canRun,true);
  assert.equal((await fetch(base+'/api/start?kind=unknown',{method:'POST',headers:{'x-bugarena-token':state.token,'x-bugarena-run-key':key}})).status,400);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('dashboard serves reports but blocks file traversal and unauthenticated execution',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'bugarena-dashboard-'));
 await mkdir(path.join(root,'runs','sample'),{recursive:true});
 await writeFile(path.join(root,'runs','sample','report.json'),JSON.stringify({status:'confirmed',provider:'meta'}));
 await writeFile(path.join(root,'secret.txt'),'private');
 const server=createDashboard(root);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try {
  assert.equal((await fetch(base)).status,200);
  const state=await (await fetch(base+'/api/state')).json();assert.ok(state.token);assert.equal(state.key,undefined);
  const runs=await (await fetch(base+'/api/runs')).json();assert.equal(runs[0].id,'sample');
  assert.equal((await fetch(base+'/api/start?kind=coverage',{method:'POST'})).status,403);
  assert.equal((await fetch(base+'/api/start?kind=arbitrary',{method:'POST',headers:{'x-bugarena-token':state.token}})).status,400);
  assert.equal((await fetch(base+'/artifacts/sample/secret.txt')).status,404);
  assert.equal((await fetch(base+'/artifacts/%2e%2e/secret.txt')).status,404);
  const file=await fetch(base+'/artifacts/sample/report.json');assert.equal(file.status,200);assert.match(file.headers.get('content-disposition'),/attachment/);
 }finally{await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}
});
