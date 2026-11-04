# BugArena

An experimental Meta-powered browser tester that explores a demo shop, reports a visible rule violation, reproduces its actions in a fresh browser, and exports a Playwright regression test.

## For judges and reviewers

- **Public source:** https://github.com/yeshwanthnarige/bugarena
- **Public live demo:** https://bugarena-96ki.onrender.com — saved evidence is public; live execution requires the judge access code. The localhost URLs below are only for running your own copy.
- **Recorded evidence:** [live AI example](examples/confirmed-coupon/README.md) and [bundled demo reports](examples/published-runs).
- **Deployment:** [Render setup](docs/DEPLOYMENT.md).
- **Submission:** [complete checklist](docs/SUBMISSION-CHECKLIST.md) and [video script](docs/DEMO.md).

## What is implemented

- Local dashboard with AI/coverage/smoke launch controls, live runner output, cancellation, run history, scenario matrix, screenshots and artifact downloads.

- Meta Responses API connection using `muse-spark-1.3`, with a server-side environment key.
- A local shopping app with an intentionally stale coupon discount and a corrected version.
- An agent loop that receives visible text, form controls, and cart values, not source code or bug locations.
- A small validated action vocabulary: click, fill, report, finish. No model-generated JavaScript execution.
- A deterministic checker for the published cart contract, independent of the model's suspicion.
- Fresh-context replay, before/after screenshots, a Playwright trace, JSON/Markdown reports, and an exported regression test.
- Explicitly separate scripted fixture mode for testing the infrastructure without an API key.

This is a working local prototype, not a general-purpose website tester. A successful fixture run is **not evidence of AI discovery**. A live Meta run is required to demonstrate discovery. The corrected variant is prewritten; BugArena does not automatically fix application code.

## Step 1 — open the project

Open PowerShell in this folder. You need Node.js 22 or later:

```powershell
node --version
npm.cmd install
npm.cmd run browser:install
```

## Local dashboard

From the project folder, run `npm.cmd run dashboard`, then visit http://127.0.0.1:3200. Keep that terminal running. This command starts the local single-user dashboard. For hosted deployment use the Dockerfile and the separate judge access code described in DEPLOYMENT.md.

- **Start AI test** calls Meta and explores the buggy shop. **AI · corrected shop** runs a separate exploration of the clean control; it is not a replay.
- **Run scenario checks** runs the ten scripted cases against both variants, with no API requests.
- **Scripted smoke test** verifies the discovery/replay pipeline with a known action sequence; it is not AI discovery.
- Select a run to inspect amounts, actions, coverage, screenshots and downloads. The generated regression test is available only for confirmed hunt runs; scenario suites do not generate one.
- A completed runner means the process finished; inspect the report's finding status. Five expected buggy-shop failures in the coverage suite are successful detection, not infrastructure errors.

Only one test runs at a time. Stop cancels the runner; a cancelled/interrupted run may not have a complete report. Runs have a 15-minute process limit. The dashboard recognizes this workspace's existing browser cache automatically; other installations should use `npm.cmd run browser:install` or set `PLAYWRIGHT_BROWSERS_PATH`.

The key is loaded from ignored `.env` at startup and used only by backend processes. Restart after changing it. The browser receives only a key-present flag, never the key. Test-launch routes require a per-process session token and the server binds to loopback. Hosting support is included, but public deployment must be completed and verified separately.

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

The runner starts its own temporary shop server and headless browser, calls Meta for each decision (with at most two additional retries for invalid actions), and prints each action. It stops at the configured step limit (15 by default, maximum 30), a report, completion, or an error. Model and browser timeouts bound individual calls. The model sees the goal and product rules but is not given the bug trigger or shop implementation.

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

### Developer reports and scenario coverage

Every new hunt writes a developer report containing reproduction actions, expected/actual amounts, customer impact, replay outcomes, evidence links, and instructions to run the exported test. Source-code root cause is not inferred from browser observations. Invalid model actions receive at most two retries; all attempts and token usage are recorded.

To regenerate a previous run's Markdown report from its existing JSON without calling Meta:

```powershell
npm.cmd run report:refresh -- "runs/YOUR_RUN_FOLDER"
```

Run ten predefined scenarios on both `/shop` and `/fixed`:

```powershell
# This workspace already has browsers installed here. Omit this line if using the default install.
$env:PLAYWRIGHT_BROWSERS_PATH = (Resolve-Path "..\..\work\bugarena-browsers").Path
npm.cmd run scenarios
```

This starts its own temporary server, uses fresh browser contexts, and makes no API calls. It is **scripted coverage, not AI discovery**. The model never receives the scenario definitions. Cases cover coupon application, quantity increases by input/button, decrease, zero, coupon before cart, reset, repeat coupon, no-coupon changes, and maximum quantity. Assertions use independently specified quantity/coupon state and the published $25 unit price after every action.

Open `runs/<timestamp>-coverage/report.md` for the passed/failed/error/untested matrix, grouped coupon failures, reproduction steps, actual/expected values, and screenshot/trace links. Full checkpoints are in `report.json`. A failed check remains recorded even if later actions restore correct values. Deliberate buggy-shop failures do not make the command fail; errors, untested cases, or failures on the corrected control do. The suite is finite and does not prove exhaustive coverage.

The oracle and DOM adapter are specific to this shop. The model chooses the workflow and when to report; expected totals are calculated in ordinary code from visible values and the published rule. This avoids treating a second LLM opinion as proof. It does not demonstrate general discovery on arbitrary sites. Public product rules necessarily reveal what behavior matters, but do not disclose the implementation defect.

Do not feed reports, source code, fixture actions, fixed/broken route names, or the hidden benchmark manifest into the agent. The browser observation contains only page text, controls, and visible cart values. Model calls contain that information and prior observations. No private site data is involved in the supplied demo.

The generated test is built from validated actions, not arbitrary model code. The runner only targets its own loopback demo server. Screenshots/reports can contain page data, so runs are Git-ignored. The hosted demo uses a shared judge access code, not individual user accounts or multi-user isolation.

## Evidence and submission materials

- [Recorded live discovery](examples/confirmed-coupon/README.md): selected actions, replay evidence, and exported regression test.
- [Saved live-run outcomes](docs/evaluation.json): includes errors and inconclusive results; not a controlled benchmark.
- [Architecture](docs/ARCHITECTURE.md).
- [Three-minute demo script](docs/DEMO.md).
- [Submission text and development disclosure](docs/SUBMISSION.md).

Initial prototype commit: October 26, 2026. Later work added retry handling, scenario coverage, developer reports, and the dashboard. Retain the actual history; verify event eligibility and current submission requirements with organizers.

Remaining delivery steps are deploying and verifying the public demo, recording/uploading the video, and submitting the form. See the submission checklist.

## Sources

- [Meta quickstart](https://dev.meta.ai/docs/quickstart)
- [Playwright documentation](https://playwright.dev/docs/intro)
- Participant guide supplied by the participant; current event announcements take precedence.
