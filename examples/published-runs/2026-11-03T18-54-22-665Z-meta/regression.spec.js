import { test, expect } from '@playwright/test';
const actions=[
  {
    "type": "click",
    "target": "add"
  },
  {
    "type": "fill",
    "target": "coupon",
    "value": "SAVE10"
  },
  {
    "type": "click",
    "target": "apply"
  },
  {
    "type": "click",
    "target": "add"
  }
];
test('cart totals follow the published coupon rule',async({page})=>{
 await page.goto((process.env.SHOP_BASE_URL||'http://127.0.0.1:3100')+(process.env.SHOP_PATH||'/shop'));
 for(const a of actions){const control=page.getByTestId(a.target);if(a.type==='click')await control.click();else{await control.fill(a.value);await control.press('Tab');}}
 const cents=async id=>Math.round(Number((await page.getByTestId(id).innerText()).replace('$',''))*100);
 const quantity=Number(await page.getByTestId('quantity').inputValue());
 const subtotal=quantity*await cents('unit-price');
 const status=await page.getByTestId('coupon-status').innerText();
 const discount=status.includes('SAVE10')&&!status.startsWith('No')?Math.round(subtotal*.1):0;
 expect(await cents('subtotal')).toBe(subtotal);
 expect(await cents('discount')).toBe(discount);
 expect(await cents('total')).toBe(subtotal-discount);
});
