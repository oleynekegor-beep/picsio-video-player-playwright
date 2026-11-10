# Pics.io video preview — Playwright suite

TypeScript / Playwright tests for the Pics.io **video preview player**. The selected fixtures are the first MP4 and fourth MOV in the user's test library. The tests open their `/preview/<assetId>` URLs directly, matching the test data strategy in section 5 of the test plan and avoiding repeated upload/processing waits.

## What is automated

The suite focuses on deterministic, high-value candidates from section 5:

- All eight playback speeds, with the HTML video `playbackRate` and the selected speed label checked. The checkmark itself is visual-only in the current UI, so the automated assertion uses the selected label rather than unnamed icon markup.
- Play/pause, keyboard seeking, mute state, video duration and the displayed time.
- Standard/Timecode display switching.
- Seeking to the midpoint of the short MOV.
- Clip selection at the start, full length and end, including the one-second minimum and duration label.
- AI Summary panel smoke check. It checks that the panel opens and has a visible state, without evaluating generated text.

Clip generation/download is left manual because processing and file creation are asynchronous. Timestamped comments are also left manual here: the plan requires deleting test comments in teardown, and a failed teardown could leave activity on the shared asset. Quality output, A/V sync, codecs, large files, mobile/Safari, and subjective processing UX remain exploratory/manual coverage as described in the plan.

## Requirements

- Node.js 20 or newer
- npm
- Playwright Chromium browser
- Access to the Pics.io account containing the two video fixtures

## Local setup

1. Install dependencies and Chromium:

   ```bash
   npm install
   npx playwright install chromium
   ```

2. Create an ignored auth-state directory and sign in manually in a Playwright-owned browser. Do not commit the resulting file:

   ```bash
   mkdir .auth
   npx playwright codegen --save-storage=.auth/user.json https://pics.io/login
   ```

   Sign in in the opened browser, then close it to save the state. The repository ignores `.auth/`.

3. Copy `.env.example` to `.env`. Set the direct preview URLs for the first MP4 and fourth MOV, using the IDs from your Pics.io library. Keep `.env` local; it contains private asset URLs and the path to your session state.

4. Run the suite:

   ```bash
   npm test
   ```

Run with a visible browser using `npm run test:headed`, or open Playwright UI mode with `npm run test:ui`.

The tests skip with a clear reason until `PICSIO_STORAGE_STATE`, `PICSIO_MP4_URL`, and `PICSIO_MOV_URL` are set. Tests expect the reference MP4 to be about 67 seconds and the MOV about 7 seconds; update the bounds in the spec if the fixtures change.

## Selector strategy

The inspected player has no `data-testid` or `aria-label` on its controls. Selectors are centralized in `tests/video-player.page.ts`, scoped to the stable `.videoControls` wrapper, and use the player’s exposed control IDs (`speed`, `timeView`, `btnCrop`) or semantic classes. No hashed CSS-module classes are used. If the product adds test IDs or accessible names, prefer those in the Page Object.

## AI assistance

OpenAI Codex helped translate section 5 into a focused suite, review the selector approach, and organize app-specific selectors in a Page Object. The generated AI Summary content is deliberately not judged; the test checks only that the panel opens and renders a state.

## Diagnostics

The list reporter prints results in the terminal. Playwright writes an HTML report to `playwright-report/`, and retains traces and screenshots for failures.
