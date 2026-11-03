import test from 'node:test';
import assert from 'node:assert/strict';
import {renderRunReport} from '../src/report.js';
import {checkScenario} from '../src/scenarios.js';

test('coverage oracle rejects a self-consistent UI with wrong quantity, unit price or coupon state',()=>{
 const result=checkScenario({quantity:'1','unit-price':'$50.00',subtotal:'$50.00',discount:'$0.00',total:'$50.00','coupon-status':'No coupon applied'},{quantity:2,active:true});
 assert.deepEqual(result.differences.map(d=>d.field),['quantity','unit-price','discount','total','coupon-status']);
});
test('developer report includes reproduction, financial impact and actual evidence only',()=>{
 const report={runId:'example-meta',provider:'meta',model:'test-model',status:'confirmed',confirmed:true,rules:'10% off',steps:[{action:{type:'click',target:'add'}}],usage:[],finding:{violated:true,quantity:2,expected:{subtotal:5000,discount:500,total:4500},actual:{subtotal:5000,discount:250,total:4750}},replay:{violated:true},fixedReplay:{violated:false}};
 const output=renderRunReport(report,['report.json','replay.png','regression.spec.js']);
 assert.match(output,/Live Meta AI exploration/);assert.match(output,/Click \*\*Add to cart\*\*/);assert.match(output,/\$2.50 higher/);assert.match(output,/\.\/replay.png/);assert.doesNotMatch(output,/\.\/trace.zip/);
 assert.match(output,/does not establish a source-code root cause/);
});
test('errors and fixtures cannot be presented as confirmed AI findings',()=>{
 const output=renderRunReport({runId:'failed',provider:'scripted-fixture',status:'error',steps:[],error:'invalid JSON',rules:'test'});
 assert.match(output,/not AI discovery/);assert.match(output,/No confirmed bug/);assert.match(output,/Run error: invalid JSON/);assert.doesNotMatch(output,/\*\*Confirmed:/);
});
