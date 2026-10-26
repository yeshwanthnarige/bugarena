export const RULES='Each notebook costs 2500 cents. Quantity is an integer from 0 to 10. SAVE10 discounts the current subtotal by 10%, rounded to cents, and remains active until reset. No taxes or shipping. Total equals subtotal minus discount.';
export async function observe(page){
 return await page.evaluate(()=>({
  text:document.body.innerText.slice(0,10000),
  controls:[...document.querySelectorAll('button[data-testid],input[data-testid]')].map(e=>({id:e.dataset.testid,tag:e.tagName.toLowerCase(),text:e.innerText||'',value:e.value||''})),
  cart:Object.fromEntries(['quantity','unit-price','subtotal','discount','total','coupon-status'].map(id=>{const e=document.querySelector(`[data-testid="${id}"]`);return[id,e.tagName==='INPUT'?e.value:e.innerText];}))
 }));
}
export function validateAction(action, observation){
 if(!action || typeof action!=='object')throw new Error('Invalid agent action');
 if(['report','finish'].includes(action.type)) return {type:action.type};
 if(!['click','fill'].includes(action.type))throw new Error('Only click, fill, report, or finish are allowed.');
 const control=observation.controls.find(c=>c.id===action.target);
 if(!control || (action.type==='click' && control.tag!=='button') || (action.type==='fill' && control.tag!=='input')) throw new Error('Agent selected a nonexistent or incompatible control.');
 if(action.type==='fill' && (typeof action.value!=='string'||action.value.length>80))throw new Error('Invalid fill value.');
 if(action.target==='quantity' && !/^(?:[0-9]|10)$/.test(action.value))throw new Error('Quantity must be 0–10.');
 return action.type==='click'?{type:'click',target:action.target}:{type:'fill',target:action.target,value:action.value};
}
export async function execute(page,action){
 const control=page.getByTestId(action.target);
 if(action.type==='click') await control.click();
 else{await control.fill(action.value);await control.press('Tab');}
}
export function checkCart(cart){
 const cents=s=>{if(!/^\$-?\d+\.\d{2}$/.test(s))throw new Error('Invalid visible currency value');return Math.round(Number(s.slice(1))*100);};
 const quantity=Number(cart.quantity),unit=cents(cart['unit-price']);
 if(!Number.isInteger(quantity)||quantity<0||quantity>10)throw new Error('Invalid visible quantity');
 const expectedSubtotal=quantity*unit;
 const active=cart['coupon-status'].includes('SAVE10') && !cart['coupon-status'].startsWith('No');
 const expectedDiscount=active?Math.round(expectedSubtotal*.1):0;
 const expected={subtotal:expectedSubtotal,discount:expectedDiscount,total:expectedSubtotal-expectedDiscount};
 const actual={subtotal:cents(cart.subtotal),discount:cents(cart.discount),total:cents(cart.total)};
 return {violated:Object.keys(expected).some(k=>expected[k]!==actual[k]),expected,actual,quantity,couponActive:active};
}
