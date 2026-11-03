import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createShopServer} from './server.js';
import {observe,validateAction,execute} from './browser.js';
import {scenarios,checkScenario} from './scenarios.js';
import {describeAction} from './report.js';

const runId = new Date().toISOString().replace(/[:.]/g,'-')+'-coverage';
const directory = path.resolve('runs',runId);
await mkdir(directory,{recursive:true});
const report = {runId,provider:'scripted-scenario-suite',aiDiscovery:false,results:[],status:'running'};
for(const scenario of scenarios)for(const variant of ['shop','fixed'])report.results.push({id:scenario.id,name:scenario.name,variant,status:'untested',checkpoints:[]});
let browser,server;
try {
 server = createShopServer();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 browser = await chromium.launch();
 const base = `http://127.0.0.1:${server.address().port}`;
 for(const result of report.results) {
  const scenario = scenarios.find(s=>s.id===result.id);
  const context = await browser.newContext();
  try {
   await context.tracing.start({screenshots:true,snapshots:true});
   const page = await context.newPage();
   await page.goto(`${base}/${result.variant}`);
   for(const [index,step] of scenario.steps.entries()) {
    await execute(page,validateAction(step.action,await observe(page)));
    const check = checkScenario((await observe(page)).cart,step);
    const checkpoint = {step:index+1,action:step.action,...check};
    if(check.differences.length || index===scenario.steps.length-1) {
     checkpoint.screenshot = `${result.id}-${result.variant}-${index+1}.png`;
     await page.screenshot({path:path.join(directory,checkpoint.screenshot),fullPage:true});
    }
    result.checkpoints.push(checkpoint);
   }
   result.status = result.checkpoints.some(c=>c.differences.length)?'failed':'passed';
  } catch(error) {result.status='error';result.error=error.message;}
  finally {
   try {result.trace=`${result.id}-${result.variant}-trace.zip`;await context.tracing.stop({path:path.join(directory,result.trace)});}
   catch(error) {delete result.trace;result.evidenceError=error.message;result.status='error';}
   await context.close();
  }
  console.log(`${result.variant}: ${result.name} — ${result.status}`);
 }
 report.status='completed';
} catch(error) {report.status='error';report.error=error.message;process.exitCode=1;}
finally {
 await browser?.close();
 if(server?.listening)await new Promise(resolve=>server.close(resolve));
 report.counts = Object.fromEntries(['passed','failed','error','untested'].map(status=>[status,report.results.filter(r=>r.status===status).length]));
 // These are observed symptoms of the known seeded defect, not multiple AI discoveries.
 const related = report.results.filter(r=>r.variant==='shop' && r.status==='failed' && r.checkpoints.filter(c=>c.differences.length).every(c=>c.differences.every(d=>['discount','total'].includes(d.field))));
 report.groups = related.length ? [{id:'coupon-recalculation',label:'Coupon discount not recalculated after cart changes',basis:'Known demo defect; grouped by discount/total failures. Not AI source-code diagnosis.',scenarios:related.map(r=>r.id)}] : [];
 await writeFile(path.join(directory,'report.json'),JSON.stringify(report,null,2));
 const lines=['# BugArena scenario coverage','','**Scripted checks — not AI discovery. No model API requests.**','',
  `Status: ${report.status}. Each scenario starts in a fresh browser context. Assertions run after every action.`, '',
  `Passed: ${report.counts.passed} · Failed: ${report.counts.failed} · Errors: ${report.counts.error} · Untested: ${report.counts.untested}`, '',
  '| Scenario | Buggy shop | Corrected shop |','|---|---|---|',
  ...scenarios.map(s=>`| ${s.name} | ${report.results.find(r=>r.id===s.id&&r.variant==='shop').status} | ${report.results.find(r=>r.id===s.id&&r.variant==='fixed').status} |`),'',
  '## Related failures','',
  ...report.groups.map(g=>`**${g.label}** affects ${g.scenarios.length} scenarios: ${g.scenarios.join(', ')}. These are grouped as one known underlying demo bug, not separate discoveries.`),'',
  '## Reproduction and evidence',''];
 for(const result of report.results.filter(r=>r.status!=='passed')) {
  lines.push(`### ${result.name} — /${result.variant}: ${result.status}`,'','Start with a fresh cart.','');
  if(result.error)lines.push(`Error: ${result.error}`,'');
  for(const checkpoint of result.checkpoints) {
   lines.push(`${checkpoint.step}. ${describeAction(checkpoint.action)}`);
   for(const diff of checkpoint.differences)lines.push(`   - ${diff.field}: expected **${diff.expected}**, actual **${diff.actual}**.`);
   if(checkpoint.screenshot)lines.push(`   - [Screenshot](./${checkpoint.screenshot})`);
  }
  if(result.trace)lines.push('',`[Browser trace](./${result.trace})`);
  lines.push('');
 }
 if(report.error)lines.push(`Suite error: ${report.error}`,'');
 lines.push('## Limits','','This finite suite does not establish exhaustive coverage or measure AI discovery rates. It tests the published rules for this controlled shop; arbitrary sites, checkout, network failures, invalid-input behavior, accessibility, and other browsers are not covered. Passing means all assertions in that scenario passed.', '',
  'Expected failures on the deliberately buggy shop are recorded as findings. Errors, untested cases, or any failure on the corrected shop make the command exit unsuccessfully.','',
  '[Full checkpoint data](./report.json)','');
 await writeFile(path.join(directory,'report.md'),lines.join('\n'));
 if(report.results.some(r=>['error','untested'].includes(r.status)||(r.variant==='fixed'&&r.status==='failed')))process.exitCode=1;
 console.log(`Artifacts: ${directory}`);
}
