# BugArena scenario coverage

**Scripted checks — not AI discovery. No model API requests.**

Status: completed. Each scenario starts in a fresh browser context. Assertions run after every action.

Passed: 15 · Failed: 5 · Errors: 0 · Untested: 0

| Scenario | Buggy shop | Corrected shop |
|---|---|---|
| Change quantity without a coupon | passed | passed |
| Apply SAVE10 to an existing cart | passed | passed |
| Increase quantity after coupon using input | failed | passed |
| Add another item after coupon | failed | passed |
| Decrease quantity after coupon | failed | passed |
| Set quantity to zero after coupon | failed | passed |
| Apply coupon before adding items | failed | passed |
| Reset clears cart and coupon | passed | passed |
| Reapplying coupon does not stack discounts | passed | passed |
| Add at maximum quantity keeps quantity at ten | passed | passed |

## Related failures

**Coupon discount not recalculated after cart changes** affects 5 scenarios: increase-input, increase-button, decrease, empty, coupon-first. These are grouped as one known underlying demo bug, not separate discoveries.

## Reproduction and evidence

### Increase quantity after coupon using input — /shop: failed

Start with a fresh cart.

1. Click **Add to cart**.
2. Set **Promo code** to **SAVE10**.
3. Click **Apply coupon**.
4. Set **Quantity** to **2**.
   - discount: expected **$5.00**, actual **$2.50**.
   - total: expected **$45.00**, actual **$47.50**.
   - [Screenshot](./increase-input-shop-4.png)


### Add another item after coupon — /shop: failed

Start with a fresh cart.

1. Click **Add to cart**.
2. Set **Promo code** to **SAVE10**.
3. Click **Apply coupon**.
4. Click **Add to cart**.
   - discount: expected **$5.00**, actual **$2.50**.
   - total: expected **$45.00**, actual **$47.50**.
   - [Screenshot](./increase-button-shop-4.png)


### Decrease quantity after coupon — /shop: failed

Start with a fresh cart.

1. Set **Quantity** to **3**.
2. Set **Promo code** to **SAVE10**.
3. Click **Apply coupon**.
4. Set **Quantity** to **1**.
   - discount: expected **$2.50**, actual **$7.50**.
   - total: expected **$22.50**, actual **$17.50**.
   - [Screenshot](./decrease-shop-4.png)


### Set quantity to zero after coupon — /shop: failed

Start with a fresh cart.

1. Click **Add to cart**.
2. Set **Promo code** to **SAVE10**.
3. Click **Apply coupon**.
4. Set **Quantity** to **0**.
   - discount: expected **$0.00**, actual **$2.50**.
   - total: expected **$0.00**, actual **$-2.50**.
   - [Screenshot](./empty-shop-4.png)


### Apply coupon before adding items — /shop: failed

Start with a fresh cart.

1. Set **Promo code** to **SAVE10**.
2. Click **Apply coupon**.
3. Click **Add to cart**.
   - discount: expected **$2.50**, actual **$0.00**.
   - total: expected **$22.50**, actual **$25.00**.
   - [Screenshot](./coupon-first-shop-3.png)


## Limits

This finite suite does not establish exhaustive coverage or measure AI discovery rates. It tests the published rules for this controlled shop; arbitrary sites, checkout, network failures, invalid-input behavior, accessibility, and other browsers are not covered. Passing means all assertions in that scenario passed.

Expected failures on the deliberately buggy shop are recorded as findings. Errors, untested cases, or any failure on the corrected shop make the command exit unsuccessfully.

[Full checkpoint data](./report.json)

Published sample omits browser trace archives.
