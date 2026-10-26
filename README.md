# BugArena

An experimental Meta-powered browser tester that explores a demo shop, reports a visible rule violation, reproduces its actions in a fresh browser, and exports a Playwright regression test.

## What is implemented

- Meta Responses API connection using `muse-spark-1.3`, with a server-side environment key.
- A local shopping app with an intentionally stale coupon discount and a corrected version.
- An agent loop that receives visible text, form controls, and cart values, not source code or bug locations.
- A small validated action vocabulary: click, fill, report, finish. No model-generated JavaScript execution.
- A deterministic checker for the published cart contract, independent of the model's suspicion.
- Fresh-context replay, before/after screenshots, a Playwright trace, JSON/Markdown reports, and an exported regression test.
- Explicitly separate scripted fixture mode for testing the infrastructure without an API key.

This is milestone 1, not a general-purpose website tester. A successful fixture run is **not evidence of AI discovery**. A live Meta run is required to demonstrate discovery. The corrected variant is prewritten; BugArena does not automatically fix application code.

## Step 1 — open the project

Open PowerShell in this folder. You need Node.js 22 or later:

```powershell
node --version
npm.cmd install
npm.cmd run browser:install
```

## Step 2 — save your key privately

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-key.ps1
```

This invocation allows only this local setup script to run in its child process; it does not change your permanent PowerShell policy. Paste your Meta key when prompted. It is saved to `.env`, which is Git-ignored. If a `.env` already exists, the script refuses to overwrite it. You can instead copy `.env.example` to `.env` and edit it locally. Never put the key in screenshots, chat, frontend code, or GitHub. Local `.env` storage is plaintext; keep it private.

Check that hackathon credits appear in Meta Billing before running requests. A billing notification is not a hard spending cap.

## Step 3 — verify the local API connection

```powershell
npm.cmd run check:meta
```

Expect a short connection-success response plus token usage. This verifies the saved key from your computer, separately from the Playground test. No Baseten key is required. The request uses `https://api.meta.ai/v1/responses` and the model from your working Playground example.

On an error, check key/model access and credit balance. An incomplete model response may require raising `MAX_OUTPUT_TOKENS`; that also increases potential usage. No live call silently falls back to scripted output.

## Step 4 — verify the infrastructure

```powershell
npm.cmd test
npm.cmd run smoke
```

Smoke mode uses a known sequence and no Meta calls. Expected: `confirmed`, a stale $2.50 discount on a $50 subtotal, a fresh-browser reproduction, and a passing corrected replay. Artifacts go to `runs/<timestamp>-fixture/`. Do not present this as autonomous discovery.

## Step 5 — run actual AI discovery

```powershell
npm.cmd run hunt
```

The runner starts its own temporary shop server and headless browser, calls Meta once per decision, and prints each action. It stops at the configured step limit (15 by default, maximum 30), a report, completion, or an error. Model and browser timeouts bound individual calls. The model sees the goal and product rules but is not given the bug trigger or shop implementation.

Possible outcomes:

- `confirmed`: a visible rule violation reproduced with matching observed values in a fresh context.
- `unsupported-report`: the model suspected a bug but the contract checker found no violation.
- `unconfirmed`: replay did not reproduce the same result.
- `no-finding` / `step-limit`: no confirmed discovery; preserve this outcome in evaluation.
- `error`: infrastructure or model output failed; inspect the local report.

Open the new `runs/<timestamp>-meta/report.md` and `report.json`. They include the provider label, actions, visible states, replay outcome, and token usage. Screenshots are captured before each decision. `trace.zip` can be opened using `npx playwright show-trace <path>`.

## Step 6 — run the exported test yourself

In terminal A:

```powershell
npm.cmd start
```

Visit http://127.0.0.1:3100/shop to inspect the demo manually. `/fixed` serves the corrected version.

In terminal B, from this folder (replace RUN_FOLDER with the actual folder):

```powershell
npm.cmd run replay -- "runs/RUN_FOLDER/regression.spec.js"
```

It should **fail** on `/shop`, because the exported test asserts the correct product behavior. Then:

```powershell
$env:SHOP_PATH='/fixed'
npm.cmd run replay -- "runs/RUN_FOLDER/regression.spec.js"
Remove-Item Env:SHOP_PATH
```

The identical test should **pass** on `/fixed`. Only confirmed runs export a test. To evaluate false alarms, run `npm.cmd run hunt -- --fixed`; the same model receives the same rules but tests the corrected app.

## Scope and honest evaluation

The oracle and DOM adapter are specific to this shop. The model chooses the workflow and when to report; expected totals are calculated in ordinary code from visible values and the published rule. This avoids treating a second LLM opinion as proof. It does not demonstrate general discovery on arbitrary sites. Public product rules necessarily reveal what behavior matters, but do not disclose the implementation defect.

Do not feed reports, source code, fixture actions, fixed/broken route names, or the hidden benchmark manifest into the agent. The browser observation contains only page text, controls, and visible cart values. Model calls contain that information and prior observations. No private site data is involved in the supplied demo.

The generated test is built from validated actions, not arbitrary model code. The runner only targets its own loopback demo server. Screenshots/reports can contain page data, so runs are Git-ignored. This prototype has no hosted service, user authentication, queue, or multi-user isolation.

## Next milestones through submission

1. **Live proof:** obtain one confirmed Meta-discovered bug; save the raw run and replay evidence. Report failures honestly rather than counting only the successful attempt.
2. **Robustness:** handle malformed model JSON with bounded retries, add cancellation and total run budgets, and improve selectors while preserving validation.
3. **More scenarios:** add coupon eligibility, removing cart items, rounding, and checkout consistency; give each a clean corrected control. Keep expected bug labels in a separate evaluation manifest invisible to the model.
4. **Dashboard:** launch a run, show current step and evidence, list confirmed versus unsupported findings, download tests, and trigger replay. Keep the API key only in the backend.
5. **Evaluation:** record attempted runs, discoveries, false alarms on clean controls, replay success, duration, and token usage. Use repeated runs and state the sample size. Distinguish fixture runs from live runs in every view.
6. **Packaging:** create a separate public BugArena repo, add setup instructions and architecture, document exactly what was developed during the event, and provide a working demonstration environment. Review data before publishing sample reports.
7. **Video:** within three minutes, show goal → model-selected actions → bug evidence → failing exported test → passing same test on the corrected app. Label seeded bugs and the prewritten fix honestly.
8. **Submission:** upload through the hackathon's CV submission page; verify repo/video access while signed out and list all contributors. The supplied guide specifies November 4, 2026, 9 p.m. Eastern / 8 p.m. Chicago. Aim to submit a day early and verify any organizer updates.

Confirm the event's start-time ambiguity (guide says building Oct 27; partner form says Oct 26) with organizers and retain accurate commit timestamps. Never backdate work or describe pre-event work as event work. The pasted judging section was incomplete; incorporate the full rubric when available.

## Sources

- [Meta quickstart](https://dev.meta.ai/docs/quickstart)
- [Playwright documentation](https://playwright.dev/docs/intro)
- Participant guide supplied by the participant; current event announcements take precedence.
