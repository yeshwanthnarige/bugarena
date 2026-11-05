# Submission copy

## Project name

BugArena

## One sentence

BugArena uses Meta Muse to explore a web app, then verifies suspected bugs through deterministic checks and browser replay, producing developer reports and executable regression tests.

## What we built

BugArena is a local testing workspace built with Node.js, Playwright, and the Meta Responses API using muse-spark-1.3. The model receives visible page text, controls, cart values, and product rules, then selects validated click, fill, report, or finish actions. It does not receive the seeded defect or the scripted scenario suite.

When the agent reports a discrepancy, a deterministic checker evaluates the visible amounts. BugArena replays the action sequence in a fresh browser, checks a prewritten corrected variant, and exports a Playwright regression test. The dashboard displays live progress, run history, evidence screenshots, expected-versus-actual values, and downloadable reports.

## Demonstrated results

- A saved live Meta run found the deliberately seeded coupon bug: after adding another item, the discount remained $2.50 instead of $5.00 on a $50 subtotal. Fresh-browser replay reproduced the discrepancy; the corrected variant produced the expected amounts.
- Ten scripted scenarios across buggy and corrected variants produced 15 passes and five expected buggy-shop failures. The failures are five triggers of one underlying defect; all ten corrected-shop cases passed.
- A separate live Meta exploration on the corrected shop reached its 15-step limit without reporting a bug. This is inconclusive, not proof of zero false positives or a bug-free app.
- Saved failures and formatting retries are retained in evaluation records. These runs are not a controlled benchmark and do not establish a generalized detection rate.

## What makes it useful

The model chooses exploration actions, while code provides repeatable verification and a concrete developer handoff. A model's suspicion alone is not treated as proof.

## Scope and limitations

This is a single-user local prototype for a controlled demo shop. It is not a general-purpose website scanner. Page observations use DOM text and controls, not vision. The verification contract is specific to the shop. The corrected implementation is prewritten, not an AI-generated fix. The Docker deployment on Render has been verified with a live Meta discovery, fresh-browser replay, and scripted coverage. Live execution is judge-gated; saved evidence is public.

## Development disclosure

The initial local prototype commit is dated October 26, 2026. Subsequent work added retries, broader scripted coverage, developer reports, and the local dashboard. Retain actual commit dates and disclose this timeline to organizers; the supplied guide and partner material differed on the start date. Development used AI coding assistance.

## Fill before submitting

- Public repository URL: https://github.com/yeshwanthnarige/bugarena
- Demo video: a narrated 1080p MP4 lasting 2:58.93 has been produced. Its public viewing URL must be supplied after upload; no uploaded URL has been confirmed.
- Contributors: confirm the names required by the application.
- Public demo: https://bugarena-96ki.onrender.com — public evidence viewing, live Meta discovery, replay, and scenario checks verified. Supply the judge access code privately.

Copy only the sections relevant to the actual form. Do not submit placeholder URLs or claim publication/video completion before they exist.
