// Evaluation cases only: never sent to the exploration model.
const click = (target, quantity, active) => ({action:{type:'click',target},quantity,active});
const fill = (target, value, quantity, active) => ({action:{type:'fill',target,value:String(value)},quantity,active});
const coupon = quantity => [fill('coupon','SAVE10',quantity,false),click('apply',quantity,true)];
export const scenarios = [
 {id:'no-coupon',name:'Change quantity without a coupon',steps:[click('add',1,false),fill('quantity',3,3,false),fill('quantity',1,1,false),fill('quantity',0,0,false)]},
 {id:'apply-coupon',name:'Apply SAVE10 to an existing cart',steps:[fill('quantity',2,2,false),...coupon(2)]},
 {id:'increase-input',name:'Increase quantity after coupon using input',steps:[click('add',1,false),...coupon(1),fill('quantity',2,2,true)]},
 {id:'increase-button',name:'Add another item after coupon',steps:[click('add',1,false),...coupon(1),click('add',2,true)]},
 {id:'decrease',name:'Decrease quantity after coupon',steps:[fill('quantity',3,3,false),...coupon(3),fill('quantity',1,1,true)]},
 {id:'empty',name:'Set quantity to zero after coupon',steps:[click('add',1,false),...coupon(1),fill('quantity',0,0,true)]},
 {id:'coupon-first',name:'Apply coupon before adding items',steps:[...coupon(0),click('add',1,true)]},
 {id:'reset',name:'Reset clears cart and coupon',steps:[click('add',1,false),...coupon(1),click('reset',0,false),click('add',1,false)]},
 {id:'repeat-coupon',name:'Reapplying coupon does not stack discounts',steps:[fill('quantity',2,2,false),...coupon(2),click('apply',2,true)]},
 {id:'maximum',name:'Add at maximum quantity keeps quantity at ten',steps:[fill('quantity',10,10,false),...coupon(10),click('add',10,true)]}
];

// Independent expected state comes from the test contract, not UI quantity,
// unit price, or coupon-status values that might themselves be wrong.
export function checkScenario(cart, step) {
 const subtotal = step.quantity * 2500, discount = step.active ? Math.round(subtotal * .1) : 0;
 const expected = {quantity:String(step.quantity),'unit-price':'$25.00',subtotal:format(subtotal),discount:format(discount),total:format(subtotal-discount),'coupon-status':step.active?'SAVE10 applied':'No coupon applied'};
 const differences = Object.entries(expected).filter(([key,value])=>cart[key]!==value).map(([field,value])=>({field,expected:value,actual:cart[field]}));
 return {expected,actual:cart,differences};
}
function format(cents) { return `$${(cents/100).toFixed(2)}`; }
