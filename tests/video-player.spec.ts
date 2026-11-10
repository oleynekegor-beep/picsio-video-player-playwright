import { expect, test } from '@playwright/test';
import { VideoPlayerPage } from '../src/ui/video-player.page';
import {
  MIDPOINT_SEEK_POSITION,
  MIDPOINT_SEEK_RANGE,
  MP4_DISPLAYED_DURATION,
  MP4_DURATION_SECONDS,
  MOV_DURATION_SECONDS,
  PLAYBACK_SPEED_OPTIONS,
  PLAYBACK_START_SECONDS,
  STANDARD_TIME_DISPLAY_PATTERN,
  TIMECODE_DISPLAY_PATTERN,
} from '../src/ui/constants/video-player.constants';

const env = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

const hasSession = Boolean(env.PICSIO_STORAGE_STATE);
const mp4Url = env.PICSIO_MP4_URL;
const movUrl = env.PICSIO_MOV_URL;

test.describe('Pics.io video preview — point 5 automation candidates', () => {
  test.describe('MP4 reference video', () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!hasSession, 'Set PICSIO_STORAGE_STATE to a local Playwright storage state.');
      test.skip(!mp4Url, 'Set PICSIO_MP4_URL to the first video preview URL in .env.');
      await page.goto(mp4Url!, { waitUntil: 'domcontentloaded' });
      await new VideoPlayerPage(page).expectReady(
        MP4_DURATION_SECONDS.min,
        MP4_DURATION_SECONDS.max,
      );
    });

    for (const { rate, label } of PLAYBACK_SPEED_OPTIONS) {
      test(`sets playback speed to ${label}`, async ({ page }) => {
        const player = new VideoPlayerPage(page);
        await player.setPlaybackRate(rate, label);
      });
    }

    test('play, pause, seek, mute, and duration display stay in sync', async ({ page }) => {
      const player = new VideoPlayerPage(page);
      await test.step('Play and pause the video', async () => {
        await expect(player.timeDisplay).toBeVisible();

        await player.playPause.click();
        await expect(player.video).toHaveJSProperty('paused', false);
        await expect
          .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).currentTime))
          .toBeGreaterThan(PLAYBACK_START_SECONDS);

        await player.playPause.click();
        await expect(player.video).toHaveJSProperty('paused', true);
      });

      await test.step('Seek to the middle of the video', async () => {
        const duration = await player.video.evaluate((element) => (element as HTMLVideoElement).duration);
        await player.seekToFraction(MIDPOINT_SEEK_POSITION);
        await expect
          .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).currentTime))
          .toBeGreaterThan(duration * MIDPOINT_SEEK_RANGE.min);
        await expect
          .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).currentTime))
          .toBeLessThan(duration * MIDPOINT_SEEK_RANGE.max);
      });

      await test.step('Toggle mute with the keyboard', async () => {
        const wasMuted = await player.video.evaluate((element) => (element as HTMLVideoElement).muted);
        await page.keyboard.press('m');
        await expect(player.video).toHaveJSProperty('muted', !wasMuted);
      });

      await test.step('Show the video duration', async () => {
        await expect(player.timeDisplay).toContainText(MP4_DISPLAYED_DURATION);
      });
    });

    test('switches between Standard and Timecode views', async ({ page }) => {
      const player = new VideoPlayerPage(page);

      await test.step('Switch to Timecode view', async () => {
        await player.setTimeView('Timecode');
        await expect(player.timeDisplay).toHaveText(TIMECODE_DISPLAY_PATTERN);
      });

      await test.step('Switch back to Standard view', async () => {
        await player.setTimeView('Standard');
        await expect(player.timeDisplay).toHaveText(STANDARD_TIME_DISPLAY_PATTERN);
      });
    });
  });

  test.describe('short MOV reference video', () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!hasSession, 'Set PICSIO_STORAGE_STATE to a local Playwright storage state.');
      test.skip(!movUrl, 'Set PICSIO_MOV_URL to the fourth video preview URL in .env.');
      await page.goto(movUrl!, { waitUntil: 'domcontentloaded' });
      await new VideoPlayerPage(page).expectReady(
        MOV_DURATION_SECONDS.min,
        MOV_DURATION_SECONDS.max,
      );
    });

    test('seeks to the middle and updates the displayed playback time', async ({ page }) => {
      const player = new VideoPlayerPage(page);
      const duration = await player.video.evaluate((element) => (element as HTMLVideoElement).duration);
      const initialDisplayedTime = await player.timeDisplay.innerText();

      await player.seekToFraction(MIDPOINT_SEEK_POSITION);
      await expect
        .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).currentTime))
        .toBeGreaterThan(duration * MIDPOINT_SEEK_RANGE.min);
      await expect
        .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).currentTime))
        .toBeLessThan(duration * MIDPOINT_SEEK_RANGE.max);
      await expect(player.timeDisplay).not.toHaveText(initialDisplayedTime);
    });

    test('opens the AI Summary panel', async ({ page }) => {
      const player = new VideoPlayerPage(page);
      await player.openAiSummary();
    });
  });
});
