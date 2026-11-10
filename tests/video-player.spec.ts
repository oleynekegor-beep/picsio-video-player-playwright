import { expect, test } from '@playwright/test';
import { VideoPlayerPage } from './video-player.page';

const env = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

const hasSession = Boolean(env.PICSIO_STORAGE_STATE);
const mp4Url = env.PICSIO_MP4_URL;
const movUrl = env.PICSIO_MOV_URL;

const speedOptions = [
  { rate: 0.25, label: '0.25' },
  { rate: 0.5, label: '0.5' },
  { rate: 0.75, label: '0.75' },
  { rate: 1, label: 'Normal' },
  { rate: 1.25, label: '1.25' },
  { rate: 1.5, label: '1.5' },
  { rate: 1.75, label: '1.75' },
  { rate: 2, label: '2' },
];

test.describe('Pics.io video preview — point 5 automation candidates', () => {
  test.describe('MP4 reference video', () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!hasSession, 'Set PICSIO_STORAGE_STATE to a local Playwright storage state.');
      test.skip(!mp4Url, 'Set PICSIO_MP4_URL to the first video preview URL in .env.');
      await page.goto(mp4Url!, { waitUntil: 'domcontentloaded' });
      await new VideoPlayerPage(page).expectReady(66, 68);
    });

    for (const { rate, label } of speedOptions) {
      test(`sets playback speed to ${label}`, async ({ page }) => {
        const player = new VideoPlayerPage(page);
        await player.setPlaybackRate(rate, label);
      });
    }

    test('play, pause, keyboard seek, mute, and duration display stay in sync', async ({ page }) => {
      const player = new VideoPlayerPage(page);
      await expect(player.timeDisplay).toBeVisible();

      await player.playPause.click();
      await expect
        .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).paused))
        .toBe(false);
      await expect
        .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).currentTime))
        .toBeGreaterThan(0);

      await player.playPause.click();
      await expect
        .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).paused))
        .toBe(true);

      const duration = await player.video.evaluate((element) => (element as HTMLVideoElement).duration);
      await player.seekToFraction(0.5);
      await expect
        .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).currentTime))
        .toBeGreaterThan(duration * 0.35);
      await expect
        .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).currentTime))
        .toBeLessThan(duration * 0.65);

      const wasMuted = await player.video.evaluate((element) => (element as HTMLVideoElement).muted);
      await page.keyboard.press('m');
      await expect
        .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).muted))
        .toBe(!wasMuted);

      await expect(player.timeDisplay).toContainText('01:06');
    });

    test('switches between Standard and Timecode views', async ({ page }) => {
      const player = new VideoPlayerPage(page);
      const normalizeTime = (value: string) => value.replace(/\s+/g, '');
      const standardValue = normalizeTime(await player.timeDisplay.innerText());

      await player.setTimeView('Timecode');
      await expect
        .poll(async () => normalizeTime(await player.timeDisplay.innerText()))
        .not.toBe(standardValue);

      await player.setTimeView('Standard');
      await expect
        .poll(async () => normalizeTime(await player.timeDisplay.innerText()))
        .toBe(standardValue);
    });
  });

  test.describe('short MOV reference video', () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!hasSession, 'Set PICSIO_STORAGE_STATE to a local Playwright storage state.');
      test.skip(!movUrl, 'Set PICSIO_MOV_URL to the fourth video preview URL in .env.');
      await page.goto(movUrl!, { waitUntil: 'domcontentloaded' });
      await new VideoPlayerPage(page).expectReady(6, 8);
    });

    test('seeks to the middle and updates the displayed playback time', async ({ page }) => {
      const player = new VideoPlayerPage(page);
      const duration = await player.video.evaluate((element) => (element as HTMLVideoElement).duration);

      await player.seekToFraction(0.5);
      await expect
        .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).currentTime))
        .toBeGreaterThan(duration * 0.35);
      await expect
        .poll(() => player.video.evaluate((element) => (element as HTMLVideoElement).currentTime))
        .toBeLessThan(duration * 0.65);
      await expect(player.timeDisplay).toBeVisible();
    });

    test('opens the AI Summary panel without asserting its generated content', async ({ page }) => {
      const player = new VideoPlayerPage(page);
      await player.openAiSummary();
    });
  });
});
