# BugArena developer report

Run: 2026-11-03T18-54-22-665Z-meta

Status: **confirmed**

Source: **Live Meta AI exploration** (muse-spark-1.3).

Browser actions: 4. Model requests: 6. Rejected model responses: 1.

Store contract: Each notebook costs 2500 cents. Quantity is an integer from 0 to 10. SAVE10 discounts the current subtotal by 10%, rounded to cents, and remains active until reset. No taxes or shipping. Total equals subtotal minus discount.

## Finding: cart amounts violate the store rules

**Confirmed:** the same discrepancy reproduced in a fresh browser.

| Amount | Expected | Actual |
|---|---:|---:|
| subtotal | $50.00 | $50.00 |
| discount | $5.00 | $2.50 |
| total | $45.00 | $47.50 |

Customer impact at this state: total is $2.50 higher than expected.

## Reproduction steps

Start with a fresh cart on `/shop`.

1. Click **Add to cart**.
2. Set **Promo code** to **SAVE10**.
3. Click **Apply coupon**.
4. Click **Add to cart**.

Observe quantity 2 and compare the displayed amounts with the table above.

## Verification

- Fresh-browser replay: violation observed.
- Corrected-app replay: passes the amount checker.

The AI observes behavior; this report does not establish a source-code root cause. Inspect discount recalculation when cart state changes.

## Evidence

- [fixed.png](./fixed.png)
- [regression.spec.js](./regression.spec.js)
- [replay.png](./replay.png)
- [report.json](./report.json)
- [step-0.png](./step-0.png)
- [step-1.png](./step-1.png)
- [step-2.png](./step-2.png)
- [step-3.png](./step-3.png)
- [step-4.png](./step-4.png)

## Run the exported regression test

Start the shop with `npm.cmd start` in another terminal. Then, from the project folder:

```powershell
npm.cmd run replay -- "runs/2026-11-03T18-54-22-665Z-meta/regression.spec.js"
$env:SHOP_PATH = '/fixed'
npm.cmd run replay -- "runs/2026-11-03T18-54-22-665Z-meta/regression.spec.js"
Remove-Item Env:SHOP_PATH
```

The test should fail on the buggy shop and pass on the corrected shop. Replay checker results above do not mean this exported test has separately been executed.

## Coverage limits

This run records one exploration path, not exhaustive scenario coverage. Quantity decrease, zero quantity, reset, and coupon-before-cart are untested unless present in its recorded actions. Run `npm.cmd run scenarios` for a separate, explicitly scripted coverage matrix.
