# Pics.io video preview — Playwright suite

TypeScript / Playwright tests for the Pics.io **video preview player**. The selected fixtures are the first MP4 and fourth MOV in the user's test library. The tests open their `/preview/<assetId>` URLs directly, matching the test data strategy in section 5 of the test plan and avoiding repeated upload/processing waits.

## What is automated

The suite focuses on deterministic, high-value candidates from section 5:

- All eight playback speeds, with the HTML video `playbackRate` and the selected speed label checked. The checkmark itself is visual-only in the current UI, so the automated assertion uses the selected label rather than unnamed icon markup.
- Play/pause, keyboard seeking, mute state, video duration and the displayed time.
- Standard/Timecode display switching.
- Seeking to the midpoint of the short MOV.
- AI Summary panel smoke check. It verifies that the panel opens and its heading is visible, without evaluating generated text.

Clip boundary selection and clip generation/download are left manual for now. The clip tool opens with a five-second default selection; changing that selection to validate one-second and boundary cases is outside this automated subset. Generation and file creation are asynchronous. Timestamped comments are also left manual here: the plan requires deleting test comments in teardown, and a failed teardown could leave activity on the shared asset. Quality output, A/V sync, codecs, large files, mobile/Safari, and subjective processing UX remain exploratory/manual coverage as described in the plan.

## Requirements

- Node.js 20 or newer
- npm
- Playwright Chromium browser
- Access to the Pics.io account containing the two video fixtures

## Local setup

1. Install dependencies and Chromium:

   ```powershell
   npm install
   npx playwright install chromium
   ```

2. Create a local Chrome profile and sign in manually in regular Chrome. This avoids Google's block on the Playwright codegen browser. Chrome 136+ requires a separate profile when remote debugging is enabled. In a VS Code PowerShell terminal, run:

   ```powershell
   $profile = Join-Path (Get-Location) '.auth/chrome-profile'
   Start-Process "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" -ArgumentList @('--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9222', "--user-data-dir=$profile", 'https://pics.io/login')
   ```

   Sign in in the opened Chrome window. Leave it open, then run this in a second VS Code terminal:

   ```bash
   npm run auth:save
   ```

   This writes `.auth/user.json` for the tests. The repository ignores `.auth/`; never commit that file or the Chrome profile.

3. Copy `.env.example` to `.env`. Set the direct preview URLs for the first MP4 and fourth MOV, using the IDs from your Pics.io library. Keep `.env` local; it contains private asset URLs and the path to your session state.

4. Run the suite:

   ```bash
   npm test
   ```

Run with a visible browser using `npm run test:headed`, or open Playwright UI mode with `npm run test:ui`.
If you want to use an already installed Chrome instead of Playwright's bundled Chromium, set `PLAYWRIGHT_CHANNEL=chrome` for that run.

The tests skip with a clear reason until `PICSIO_STORAGE_STATE`, `PICSIO_MP4_URL`, and `PICSIO_MOV_URL` are set. Tests expect the reference MP4 to be about 67 seconds and the MOV about 7 seconds; update the bounds in the spec if the fixtures change.
The suite uses two workers to avoid loading the same media fixtures from many parallel browser sessions at once.

## Selector strategy

The inspected player has no `data-testid` or `aria-label` on its controls. Selectors are centralized in `tests/video-player.page.ts` and use the stable `.videoControls` wrapper, exposed control IDs (`speed`, `timeView`), and player classes (`.btnPlayVideo`, `.playerGearMenu`). The scrubber currently has only a CSS-module class with a generated suffix, so the Page Object matches its stable `videoTracks--` prefix rather than a specific hash. If the product adds test IDs or accessible names, prefer those in the Page Object.

## Diagnostics

The list reporter prints results in the terminal. Playwright writes an HTML report to `playwright-report/`, and retains traces and screenshots for failures.
