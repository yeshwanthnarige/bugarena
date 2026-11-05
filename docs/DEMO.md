# Three-minute BugArena demo

Use the public dashboard at https://bugarena-96ki.onrender.com, or run your own local dashboard at http://127.0.0.1:3200. A 2:58.93 narrated evidence walkthrough has been produced; its upload URL has not yet been supplied. Keep `.env`, API-key settings, private tabs, and personal notifications off screen. Leave model retry messages visible; do not describe recorded evidence as a live run.

## 0:00–0:25 — Problem and scope

“AI testers can suggest bugs, but developers need evidence they can reproduce. BugArena connects Meta Muse exploration to browser replay and executable regression tests. This demo uses a controlled shop with a deliberately seeded coupon defect.”

Show the dashboard and the distinction between Start AI test and Run scenario checks.

## 0:25–1:10 — AI discovery

Start AI test if timing permits, or select the saved live Meta run `2026-11-03T18-54-22-665Z-meta` and say it is a recorded live API run. Do not substitute a scripted smoke run and call it AI discovery.

“Muse receives visible page information and store rules. It chooses actions; it does not receive the seeded bug or a reproduction script.”

Show the actions: add item, enter SAVE10, apply coupon, add another item, report.

## 1:10–1:45 — Evidence

Show expected versus actual amounts: subtotal $50, expected discount $5, actual discount $2.50, actual total $47.50 instead of $45. Show the replay and corrected screenshots.

“Ordinary code independently checks the arithmetic and repeats the actions in a fresh browser. The same workflow on the prewritten corrected version produces the right amounts. BugArena does not automatically write that fix.”

## 1:45–2:15 — Developer handoff

Open the developer report and download the regression test. If demonstrating its execution, prepare two terminals before recording: one running `npm.cmd start`; the other running the exported test against `/shop`, then `/fixed`. Show actual output; do not claim a generated test was executed unless it was.

## 2:15–2:45 — Coverage and limitations

Select the coverage run `2026-11-03T18-17-15-424Z-coverage`. Show 15 passes and five expected failures across 20 checks, with every corrected-shop case passing.

“These are ten predefined scenarios on two variants, not ten autonomous discoveries. Five scenarios expose the same underlying bug. A separate AI run on the corrected shop reached its 15-step limit without reporting a bug; that result is inconclusive.”

## 2:45–3:00 — Close

“BugArena turns AI-selected exploration into verified, reproducible developer evidence. The current prototype supports this controlled shop. Next is extending the observation adapter and verification contracts to other applications.”

Show the repository link once published. Record under three minutes, with readable browser zoom. Upload the video and check its viewer access before submitting.
