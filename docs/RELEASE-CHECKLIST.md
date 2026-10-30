# Release checklist (Waves#199)

Short checklist before any main push. Do not rewrite the docs folder for a release.

1. Tests pass: `npm test` — self-test + mock claim + mock reward, all green.
2. Bundle matches: `npm run check:bundle` — committed `web/engine-bundle.js` equals a fresh `npm run build:engine`.
3. Integrity fresh: `npm run check:integrity` — committed `web/app/integrity.json` matches current files (regenerate with `npm run integrity` if stale).
4. Waves badge correct: `README.md` badge number matches the latest completed wave.
5. Short changelog in README: one factual block for the new waves (what changed, what is partial, what needs live testing). No agent logs, no invented Discord fields.
6. Workflow file decision: `.github/workflows/web-ci.yml` is included only if the GitHub App has workflows permission; otherwise it is excluded from the snapshot and reported as excluded — it must never block the other files.
7. No token, no code in the diff: grep the changed files for token patterns and `rewardCode` persistence outside session memory / explicit export opt-in.
8. Live testing note: after Cloudflare deploys, test on the web with a test account — especially captcha, 429 resume, SW update, and real reward rendering — before calling the release done.
