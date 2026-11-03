const $=id=>document.getElementById(id);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const badge=value=>`<span class="badge ${/^[\w-]+$/.test(value)?value:''}">${escape(value)}</span>`;
const label=r=>r.provider==='meta'?'AI exploration':r.provider==='scripted-scenario-suite'?'Scenario coverage':'Scripted smoke test';
const action=a=>a.type==='click'?`Click ${a.target==='add'?'Add to cart':a.target==='apply'?'Apply coupon':a.target==='reset'?'Reset cart':a.target}`:a.type==='fill'?`Set ${a.target} to ${a.value}`:a.type;
let token='',selected=null,runs=[],lastJob=null,refreshing=false;
async function api(url,options={}){const response=await fetch(url,{...options,headers:{'x-bugarena-token':token,...options.headers}});const data=await response.json();if(!response.ok)throw new Error(data.error||'Request failed');return data;}
function showError(error){$('error').hidden=false;$('error').textContent=error.message;}
function artifact(id,file){return `/artifacts/${encodeURIComponent(id)}/${encodeURIComponent(file)}`;}
function download(id,file,title=file){return `<a class="download" href="${artifact(id,file)}" download>${escape(title)} ↓</a>`;}
function stats(items){return `<div class="stats">${items.map(([name,value])=>`<div class="stat"><b>${escape(value)}</b><small>${escape(name)}</small></div>`).join('')}</div>`;}
function renderHistory(){
 $('runs').replaceChildren();
 if(!runs.length){$('runs').textContent='No saved runs yet. Start a test above.';return;}
 for(const run of runs){const button=document.createElement('button');button.className='run'+(selected===run.id?' selected':'');button.innerHTML=`${badge(run.status)} <strong>${label(run)}</strong><small>${escape(run.id.slice(0,19).replace('T',' · '))} UTC</small>`;button.onclick=()=>selectRun(run.id);$('runs').append(button);}
}
async function selectRun(id){
 selected=id;renderHistory();
 try {
  const {report:r,files}=await api(`/api/runs/${encodeURIComponent(id)}`);
  if(selected!==id)return;
  let html=`<div class="detail-top"><h2>${label(r)}</h2>${badge(r.status)}</div><p class="run-id">${escape(id)}</p>`;
  const coverage=r.provider==='scripted-scenario-suite';
  if(coverage){
   html+='<p>Predefined checks on both shop versions. No AI requests.</p>';
   html+=stats(['passed','failed','error','untested'].map(s=>[s,r.counts?.[s]??0]));
   html+='<h3>Scenario matrix</h3><table><thead><tr><th>Scenario</th><th>Buggy</th><th>Corrected</th></tr></thead><tbody>';
   for(const item of (r.results||[]).filter(x=>x.variant==='shop')){const fixed=r.results.find(x=>x.id===item.id&&x.variant==='fixed');html+=`<tr><td>${escape(item.name)}</td><td>${badge(item.status)}</td><td>${badge(fixed?.status||'untested')}</td></tr>`;}
   html+='</tbody></table>';
   for(const group of r.groups||[])html+=`<h3>${escape(group.label)}</h3><p>${group.scenarios.length} scenarios grouped under one known demo defect.</p>`;
   for(const result of (r.results||[]).filter(x=>x.status!=='passed')){
    html+=`<details><summary>${escape(result.name)} · ${escape(result.variant)} · ${escape(result.status)}</summary>`;
    if(result.error)html+=`<p>${escape(result.error)}</p>`;
    html+='<ol>';
    for(const checkpoint of result.checkpoints||[]){html+=`<li>${escape(action(checkpoint.action))}`;for(const d of checkpoint.differences||[])html+=`<p>${escape(d.field)}: expected <b>${escape(d.expected)}</b>, actual <b>${escape(d.actual)}</b></p>`;if(checkpoint.screenshot&&files.includes(checkpoint.screenshot))html+=`<a href="${artifact(id,checkpoint.screenshot)}" target="_blank" rel="noopener">View screenshot ↗</a>`;html+='</li>';}
    html+='</ol>';if(result.trace&&files.includes(result.trace))html+=download(id,result.trace,'Browser trace');html+='</details>';
   }
  }else {
   html+=`<p>${r.provider==='meta'?`Model: ${escape(r.model)} · AI-selected browser actions`:'Known scripted sequence — not AI discovery'}</p>`;
   html+=stats([['Browser actions',(r.steps||[]).filter(s=>['click','fill'].includes(s.action.type)).length],['Model requests',r.usage?.length||0],['Fresh replay',r.replay?(r.replay.violated?'Reproduced':'No violation'):'Not tested'],['Corrected replay',r.fixedReplay?(r.fixedReplay.violated?'Failed':'Passed'):'Not tested']]);
   if(r.finding?.violated){html+='<h3>Cart amounts violate the store rules</h3><table><thead><tr><th>Amount</th><th>Expected</th><th>Actual</th></tr></thead><tbody>';for(const key of ['subtotal','discount','total'])html+=`<tr><td>${key}</td><td>$${(r.finding.expected[key]/100).toFixed(2)}</td><td>$${(r.finding.actual[key]/100).toFixed(2)}</td></tr>`;html+='</tbody></table>';}else html+='<p>No confirmed finding recorded. This does not prove the app is bug-free.</p>';
   html+='<h3>Recorded actions</h3><ol>'+(r.steps||[]).map(s=>`<li>${escape(action(s.action))}</li>`).join('')+'</ol>';
   html+='<p>One exploration path. Use scenario checks for the separate coverage matrix.</p>';
  }
  if(r.error)html+=`<h3>Run error</h3><pre>${escape(r.error)}</pre>`;
  html+='<h3>Evidence & downloads</h3><div class="downloads">';
  for(const [file,title] of [['report.md','Developer report'],['report.json','Raw run data'],['regression.spec.js','Regression test'],['trace.zip','Browser trace']])if(files.includes(file))html+=download(id,file,title);
  html+='</div><div class="evidence">';
  const images=files.filter(f=>f.endsWith('.png'));
  for(const file of images)html+=`<a href="${artifact(id,file)}" target="_blank" rel="noopener"><img loading="lazy" src="${artifact(id,file)}" alt="${escape(file)}">${escape(file)}</a>`;
  html+='</div>';$('detail').innerHTML=html;
 }catch(error){showError(error);}
}
async function refresh(){
 if(refreshing)return;refreshing=true;
 try {
  const [state,history]=await Promise.all([api('/api/state'),api('/api/runs')]);token=state.token;runs=history;
  $('connection').textContent=state.keyConfigured?'Meta key configured':'Meta key missing';
  const busy=state.job?.status==='running';
  document.querySelectorAll('[data-kind]').forEach(b=>b.disabled=busy||(!state.keyConfigured&&['ai','fixed'].includes(b.dataset.kind)));
  if(state.job){const job=state.job;$('progress').hidden=false;$('job-title').textContent=`${{ai:'AI exploration',fixed:'AI on corrected shop',coverage:'Scenario checks',smoke:'Scripted smoke test'}[job.kind]} · ${job.status}`;$('log').textContent=job.log||'Starting browser…';$('stop').hidden=!busy;
   $('job-result').textContent=job.status==='running'?'Live runner output. Evidence appears when the run finishes.':job.runId?'Run saved. Select it below to inspect the result.':'No completed report was saved. Check the log above.';
   if(job.status!=='running'&&job.runId&&lastJob!==job.id){lastJob=job.id;selectRun(job.runId);}
  }
  renderHistory();if(!selected&&runs.length)await selectRun(runs[0].id);
 }catch(error){$('connection').textContent='Disconnected';showError(error);}finally{refreshing=false;}
}
document.querySelectorAll('[data-kind]').forEach(button=>button.addEventListener('click',async()=>{
 $('error').hidden=true;document.querySelectorAll('[data-kind]').forEach(b=>b.disabled=true);
 try{await api(`/api/start?kind=${button.dataset.kind}`,{method:'POST'});await refresh();}catch(error){showError(error);await refresh();}
}));
$('stop').onclick=async()=>{try{await api('/api/stop',{method:'POST'});await refresh();}catch(error){showError(error);}};
$('refresh').onclick=refresh;
refresh();setInterval(refresh,2000);
