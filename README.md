# Pics.io video preview — Playwright suite

TypeScript / Playwright tests for the Pics.io **video preview player**. The selected fixtures are `test1.mp4` (about 67 seconds) and `IMG_6960.MOV` (about 7 seconds). The tests open their `/preview/<assetId>` URLs directly, matching the test data strategy in [section 5 of my test plan](https://docs.google.com/document/d/1OPdC32WYnynKtCIdPItbP55-H35ubhVKHuUxTHO2oNI/edit?tab=t.0#heading=h.bya7mt845bha) and avoiding repeated upload/processing waits.

I chose the player because I had not tested a video player before and wanted to take on a new challenge. Video previews also combine widely used controls with higher-risk media behavior such as asynchronous processing, large files, codecs, and browser differences. That made it a useful feature for exploring and for selecting a focused automation subset.

## What is automated

The suite focuses on deterministic, high-value candidates from section 5:

- All eight playback speeds, with the HTML video `playbackRate` and the selected speed label checked. The checkmark itself is visual-only in the current UI, so the automated assertion uses the selected label rather than unnamed icon markup.
- Play/pause, seeking with the timeline, mute state, video duration and the displayed time.
- Standard/Timecode display switching.
- Seeking to the midpoint of the short MOV.
- AI Summary smoke check. It verifies that the panel opens and a non-empty summary item is visible, without comparing AI-generated wording.

Clip boundary selection and clip generation/download are left manual for now. The clip tool opens with a five-second default selection; changing that selection to validate one-second and boundary cases is outside this automated subset. Generation and file creation are asynchronous. Timestamped comments are also left manual here: the plan requires deleting test comments in teardown, and a failed teardown could leave activity on the shared asset. Quality output, A/V sync, codecs, large files, mobile/Safari, and subjective processing UX remain exploratory/manual coverage as described in the plan.

## Requirements

- Node.js 20 or newer
- npm
- Playwright Chromium browser
- Access to the Pics.io account containing the two video fixtures

### Reviewer access

The repository does not include `.env`, the authenticated browser state, or private asset URLs. To run the tests, a reviewer needs a Pics.io account with access to `test1.mp4` (about 67 seconds) and `IMG_6960.MOV` (about 7 seconds), or equivalent MP4/MOV files with durations in that range. Create a local browser state and set `PICSIO_STORAGE_STATE`, `PICSIO_MP4_URL`, and `PICSIO_MOV_URL` as described below. Without those values, the tests skip; no credentials or session files should be committed.

## Local setup

1. Install dependencies and Chromium:

   ```powershell
   npm ci
   npx playwright install chromium
   ```

2. Launch Google Chrome with remote debugging enabled on port `9222` and a separate profile at `.auth/chrome-profile`, then sign in to Pics.io in the opened browser. Chrome 136+ requires a separate profile when remote debugging is enabled. Use the command for your operating system:

   **Windows PowerShell**

   ```powershell
   $profile = Join-Path (Get-Location) '.auth/chrome-profile'
   Start-Process "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" -ArgumentList @('--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9222', "--user-data-dir=$profile", 'https://pics.io/login')
   ```

   **macOS**

   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --remote-debugging-address=127.0.0.1 \
     --remote-debugging-port=9222 \
     --user-data-dir="$PWD/.auth/chrome-profile" \
     https://pics.io/login &
   ```

   **Linux** (replace `google-chrome` with the installed Chrome/Chromium command if needed)

   ```bash
   google-chrome \
     --remote-debugging-address=127.0.0.1 \
     --remote-debugging-port=9222 \
     --user-data-dir="$PWD/.auth/chrome-profile" \
     https://pics.io/login &
   ```

   Sign in in the opened Chrome window. Leave it open, then run this in a second VS Code terminal:

   ```bash
   npm run auth:save
   ```

   This writes `.auth/user.json` for the tests. The repository ignores `.auth/`; never commit that file or the Chrome profile.

3. Copy `.env.example` to `.env`. Set the direct preview URLs for `test1.mp4` and `IMG_6960.MOV`, using the IDs in your Pics.io library. The expected duration ranges are defined in `src/ui/constants/video-player.constants.ts`; adjust them if using videos with different lengths. Keep `.env` local; it contains private asset URLs and the path to your session state.

4. Run the suite:

   ```bash
   npm test
   ```

Run with a visible browser using `npm run test:headed`, or open Playwright UI mode with `npm run test:ui`.
If you want to use an already installed Chrome instead of Playwright's bundled Chromium, set `PLAYWRIGHT_CHANNEL=chrome` for that run.

The tests skip with a clear reason until the session state and both preview URLs are set. The default fixtures are `test1.mp4` (about 67 seconds) and `IMG_6960.MOV` (about 7 seconds).
The suite uses one worker to avoid loading the same media fixtures from multiple browser sessions at once.

## AI-assisted work

I explored the Pics.io player, chose the scenarios to automate, inspected the DOM, ran the tests in VS Code, and made the final decisions about assertions and selectors. Claude helped brainstorm edge cases, structure the test plan, and review selector and assertion approaches. I checked its suggestions against the actual product behavior and adjusted the tests based on the observed UI and test runs.

## Browser used for local runs

I used the Playwright `chromium` project with the installed Google Chrome channel (`PLAYWRIGHT_CHANNEL=chrome`) in Playwright UI mode. The default configuration uses Playwright's bundled Chromium when `PLAYWRIGHT_CHANNEL` is not set.

## Selector strategy

The inspected player has no `data-testid` or `aria-label` on its controls. The Page Object is in `src/ui/video-player.page.ts`, and its selectors are centralized in `src/ui/constants/video-player.constants.ts`. They use the stable `.videoControls` wrapper, exposed control IDs (`speed`, `timeView`), and player classes (`.btnPlayVideo`, `.playerGearMenu`). The scrubber currently has only a CSS-module class with a generated suffix, so its selector matches the stable `videoTracks--` prefix rather than a specific hash. If the product adds test IDs or accessible names, prefer those in the Page Object.

## Diagnostics

The list reporter prints results in the terminal. Playwright writes an HTML report to `playwright-report/`, and retains traces and screenshots for failures.
