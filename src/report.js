import {readFile, writeFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const money = value => `$${(value / 100).toFixed(2)}`;
const safe = value => String(value ?? '').replace(/[\r\n|]/g, ' ').replace(/</g, '&lt;');
export function describeAction(action) {
  const labels = {add:'Add to cart',apply:'Apply coupon',reset:'Reset cart',quantity:'Quantity',coupon:'Promo code'};
  return action.type === 'click' ? `Click **${labels[action.target] || safe(action.target)}**.` : `Set **${labels[action.target] || safe(action.target)}** to **${safe(action.value)}**.`;
}
export function amountTable(check) {
  return '| Amount | Expected | Actual |\n|---|---:|---:|\n' + ['subtotal','discount','total'].map(key => `| ${key} | ${money(check.expected[key])} | ${money(check.actual[key])} |`).join('\n');
}
export function renderRunReport(report, files = []) {
  const actions = report.steps.filter(s => ['click','fill'].includes(s.action.type));
  const lines = ['# BugArena developer report', '', `Run: ${safe(report.runId)}`, '', `Status: **${safe(report.status)}**`, '',
    report.provider === 'meta' ? `Source: **Live Meta AI exploration** (${safe(report.model)}).` : 'Source: **Scripted infrastructure check — not AI discovery.**', '',
    `Browser actions: ${actions.length}. Model requests: ${report.usage?.length || 0}. Rejected model responses: ${report.modelAttempts?.filter(a=>!a.accepted).length || 0}.`, '',
    `Store contract: ${safe(report.rules)}`, ''];
  if (report.finding?.violated) {
    lines.push('## Finding: cart amounts violate the store rules', '',
      report.confirmed ? '**Confirmed:** the same discrepancy reproduced in a fresh browser.' : '**Not confirmed:** treat this as a suspected discrepancy.', '',
      amountTable(report.finding), '',
      `Customer impact at this state: total is ${money(Math.abs(report.finding.actual.total - report.finding.expected.total))} ${report.finding.actual.total > report.finding.expected.total ? 'higher' : 'lower'} than expected.`, '',
      '## Reproduction steps', '', `Start with a fresh cart on ${report.targetPath ? '`'+safe(report.targetPath)+'`' : 'the original target route (older run did not record its route)'}.`, '',
      ...actions.map((s,i)=>`${i+1}. ${describeAction(s.action)}`), '',
      `Observe quantity ${report.finding.quantity} and compare the displayed amounts with the table above.`, '',
      '## Verification', '',
      `- Fresh-browser replay: ${report.replay ? (report.replay.violated ? 'violation observed' : 'no violation observed') : 'not tested'}.`,
      `- Corrected-app replay: ${report.fixedReplay ? (report.fixedReplay.violated ? 'violation still observed' : 'passes the amount checker') : 'not tested'}.`, '',
      'The AI observes behavior; this report does not establish a source-code root cause. Inspect discount recalculation when cart state changes.', '');
  } else {
    lines.push('No confirmed bug is established by this run. A no-finding result does not prove the app is bug-free.', '');
  }
  if (report.error) lines.push(`Run error: ${safe(report.error)}`, '');
  lines.push('## Evidence', '');
  for (const file of files.filter(f=>/^(?:step-\d+\.png|replay\.png|fixed\.png|trace\.zip|regression\.spec\.js|report\.json)$/.test(f))) lines.push(`- [${file}](./${file})`);
  if (files.includes('regression.spec.js')) lines.push('', '## Run the exported regression test', '',
    'Start the shop with `npm.cmd start` in another terminal. Then, from the project folder:', '', '```powershell',
    `npm.cmd run replay -- "runs/${report.runId}/regression.spec.js"`,
    "$env:SHOP_PATH = '/fixed'",
    `npm.cmd run replay -- "runs/${report.runId}/regression.spec.js"`,
    'Remove-Item Env:SHOP_PATH', '```', '',
    'The test should fail on the buggy shop and pass on the corrected shop. Replay checker results above do not mean this exported test has separately been executed.');
  lines.push('', '## Coverage limits', '', 'This run records one exploration path, not exhaustive scenario coverage. Quantity decrease, zero quantity, reset, and coupon-before-cart are untested unless present in its recorded actions. Run `npm.cmd run scenarios` for a separate, explicitly scripted coverage matrix.', '');
  return lines.join('\n');
}
export async function writeRunReport(directory, report) {
  await writeFile(path.join(directory,'report.md'),renderRunReport(report,await readdir(directory)));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const directory = path.resolve(process.argv[2] || '');
  const report = JSON.parse(await readFile(path.join(directory,'report.json'),'utf8'));
  await writeRunReport(directory,report);
  console.log(`Updated ${path.join(directory,'report.md')}`);
}
