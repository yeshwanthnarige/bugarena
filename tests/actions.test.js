import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAction,chooseAction} from '../src/actions.js';
const observation={controls:[{id:'add',tag:'button'}]};
test('accepts JSON and fenced JSON but rejects prose, multiple objects, and invalid controls',()=>{
 assert.deepEqual(parseAction('```json\n{"type":"click","target":"add"}\n```',observation),{type:'click',target:'add'});
 for(const text of ['Here: {"type":"finish"}','{"type":"finish"}{"type":"report"}','{"type":"click","target":"missing"}'])assert.throws(()=>parseAction(text,observation));
});
test('retries without changing observation and records every request',async()=>{
 const attempts=[],inputs=[];const replies=['not JSON','{"type":"click","target":"missing"}','{"type":"click","target":"add"}'];
 const action=await chooseAction({observation,instructions:'test',input:{observation},ask:async(_,input)=>{inputs.push(JSON.parse(input));return {text:replies.shift(),usage:{total_tokens:1}};},onAttempt:a=>attempts.push(a)});
 assert.equal(action.target,'add');assert.deepEqual(attempts.map(a=>a.accepted),[false,false,true]);
 assert.deepEqual(inputs[2].observation,observation);assert.match(inputs[1].formatCorrection,/No action was executed/);
});
test('stops after three invalid responses',async()=>{
 let calls=0;await assert.rejects(chooseAction({observation,input:{},ask:async()=>{calls++;return {text:'invalid'};}}),/all 3 attempts/);assert.equal(calls,3);
});
test('API errors propagate without retrying authentication or network failures',async()=>{
 let calls=0;await assert.rejects(chooseAction({observation,input:{},ask:async()=>{calls++;throw new Error('HTTP 401');}}),/401/);assert.equal(calls,1);
});
