import test from 'node:test';import assert from 'node:assert/strict';
import {checkCart,validateAction} from '../src/browser.js';import {responseText} from '../src/meta.js';
const cart={quantity:'2','unit-price':'$25.00',subtotal:'$50.00',discount:'$2.50',total:'$47.50','coupon-status':'SAVE10 applied'};
test('oracle catches stale discount and accepts corrected values',()=>{assert.equal(checkCart(cart).violated,true);assert.equal(checkCart({...cart,discount:'$5.00',total:'$45.00'}).violated,false);});
test('uncouponed cart has no discount',()=>{assert.equal(checkCart({...cart,'coupon-status':'No coupon applied',discount:'$0.00',total:'$50.00'}).violated,false);});
test('untrusted agent cannot execute code or select nonexistent controls',()=>{assert.throws(()=>validateAction({type:'evaluate',code:'anything'},{controls:[]}));assert.throws(()=>validateAction({type:'click',target:'fake'},{controls:[]}));});
test('quantity validation rejects out of range actions',()=>{assert.throws(()=>validateAction({type:'fill',target:'quantity',value:'-1'},{controls:[{id:'quantity',tag:'input'}]}));});
test('response extraction excludes reasoning and rejects incomplete output',()=>{assert.equal(responseText({status:'completed',output:[{type:'reasoning',content:[]},{type:'message',content:[{type:'output_text',text:'done'}]}]}),'done');assert.throws(()=>responseText({status:'incomplete',output:[]}));});
