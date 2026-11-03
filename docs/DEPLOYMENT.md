# Public live demo on Render

GitHub hosts the source code. `127.0.0.1` is a local-development address, not a public demo. The Dockerfile runs the real Node backend and installs Chromium using the locked Playwright version. A static hosting service cannot execute this runner.

## 1. Push these deployment files

From your BugArena terminal, use `git push origin main` after the deployment commit has been saved. Confirm GitHub contains `Dockerfile`, `.dockerignore`, `scripts/start-hosted.js`, and `examples/published-runs`.

## 2. Create the Render service

1. Sign in at https://dashboard.render.com/.
2. Select **New → Web Service**.
3. Connect GitHub and select `yeshwanthnarige/bugarena`. Alternatively use the public repository URL.
4. Branch: `main`. Root directory: leave blank. Language/runtime: **Docker**.
5. Dockerfile path: `./Dockerfile`. Leave Docker Command blank; the Dockerfile supplies it.
6. Name: choose an available name such as `bugarena-demo`. Do not assume the name or URL is available until Render assigns it.
7. Select a region and a plan you approve. For Chromium, choose adequate memory; 1 GB or more is a starting recommendation, not a measured requirement. Review current pricing before purchasing. Sleeping/free services can be unsuitable for immediate judging access.
8. Health check path: `/healthz`.

## 3. Add environment variables privately

| Variable | Value |
|---|---|
| `DASHBOARD_PUBLIC` | `1` |
| `MODEL_API_KEY` | Your working Meta API key; enter only in Render's secret environment settings |
| `META_MODEL` | `muse-spark-1.3` |
| `DASHBOARD_RUN_KEY` | A separate random judge access code, at least 24 characters; NOT your Meta API key |
| `MAX_STEPS` | `15` |
| `MAX_OUTPUT_TOKENS` | `4096` |

Render supplies `PORT`. Do not set `PLAYWRIGHT_BROWSERS_PATH` to a Windows path: the Docker image uses `/ms-playwright`.

The access code stays in browser memory while the judge's tab is open. Share it only in the submission's private reviewer instructions, if supported. If the form has no private field, ask organizers how to supply live-demo credentials. Do not put the code or API key in README, screenshots, public issues, or the video.

## 4. Deploy and verify

Click Deploy and wait for a successful build and service status. Render assigns an HTTPS URL; use that exact URL in the submission and README.

In a signed-out/incognito browser:

1. Open the public URL; existing evidence must be visible without signing in.
2. Check that saved runs include the confirmed AI example, corrected-shop `step-limit`, and 15-pass/5-fail coverage matrix.
3. Download a report/test and open a screenshot.
4. Without the judge code, live-run controls should be locked.
5. Enter the judge code. Run the scripted smoke test; expect `confirmed` with corrected replay passing.
6. Run scenario checks; expect 15 passes, five deliberate buggy-shop failures, no errors/untested cases.
7. Run one live AI test to verify the hosted server can reach Meta. Record its actual outcome; AI success is not guaranteed.
8. Keep the service available during judging. Save important new artifacts locally.

## Operational scope

This is a shared hackathon demo, not a multi-user production service. Everyone can view demo reports. The runner only operates its own seeded local shop. It allows one process at a time, a 15-minute process timeout, at most 20 launches per server lifetime, and a one-minute interval between launches. These are not a permanent billing cap; restarts reset the launch count. The Meta account's billing settings still apply.

Live run files use the container filesystem and can disappear on redeployment/restart. Bundled recorded evidence is restored at startup. A persistent disk and retention policy are future work; do not claim hosted live-run durability. Docker build/runtime must be verified on Render: Docker was not installed in the development environment used to prepare this deployment.

## Troubleshooting

- Build fails during browser install: inspect Render's build log; confirm the locked dependencies install successfully and the chosen service supports this Docker image.
- Browser crashes: inspect memory usage and runtime logs; adjust the plan if necessary.
- HTTP 401 from Meta: check the Render secret value, not the source files.
- `fetch failed`: check outbound network and provider availability.
- Locked launch controls: enter the judge code. A missing `DASHBOARD_RUN_KEY` intentionally leaves hosted execution disabled.
- `step-limit`: an inconclusive exploration result, not deployment failure.

Sources: https://render.com/docs/docker · https://render.com/docs/web-services · https://playwright.dev/docs/docker
