import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Player selectors live here so the spec stays readable and app-specific
 * selector changes have one maintenance point. The player has no test IDs or
 * aria-labels today; use its stable semantic wrapper and exposed control IDs.
 */
export class VideoPlayerPage {
  readonly controls: Locator;
  readonly video: Locator;
  readonly playPause: Locator;
  readonly seekBar: Locator;
  readonly timeDisplay: Locator;
  readonly settingsButton: Locator;
  readonly cropButton: Locator;
  readonly clipStart: Locator;
  readonly clipEnd: Locator;
  readonly clipDuration: Locator;
  readonly aiSummaryButton: Locator;
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.controls = page.locator('.videoControls');
    this.video = page.locator('video');
    this.playPause = this.controls.locator('[title^="Play/Pause"], .playPauseButton').first();
    this.seekBar = this.controls.locator('.seekBar');
    this.timeDisplay = this.controls.getByText(/^\d[\d:]*\s*\/\s*\d[\d:]*$/);
    this.settingsButton = this.controls
      .locator('button[title*="setting" i], .settingsButton')
      .first();
    this.cropButton = this.controls.locator('.btnCrop, [id="btnCrop"]').first();
    this.clipStart = this.controls.locator('input[type="text"]').nth(0);
    this.clipEnd = this.controls.locator('input[type="text"]').nth(1);
    this.clipDuration = this.controls.getByText(/^\d{2} sec$/);
    this.aiSummaryButton = page.getByRole('button', { name: 'AI Summary', exact: true });
  }

  async expectReady(minDuration: number, maxDuration: number): Promise<void> {
    await expect(this.controls).toBeVisible();
    await expect(this.video).toBeVisible();
    await expect
      .poll(() => this.video.evaluate((video) => video.readyState))
      .toBeGreaterThanOrEqual(2);
    await expect
      .poll(() => this.video.evaluate((video) => video.duration))
      .toBeGreaterThan(minDuration);
    await expect
      .poll(() => this.video.evaluate((video) => video.duration))
      .toBeLessThan(maxDuration);
  }

  async setPlaybackRate(rate: number, label: string): Promise<void> {
    await this.settingsButton.click();
    const speedMenu = this.controls.locator('#speed');
    await expect(speedMenu).toBeVisible();
    await speedMenu.click();
    await this.controls.getByText(label, { exact: true }).click();

    await expect
      .poll(() => this.video.evaluate((video) => video.playbackRate))
      .toBe(rate);

    // The menu summary reflects the selected rate. The checkmark is visual-only
    // in the current UI, so the test avoids coupling to its unnamed icon markup.
    await expect(speedMenu).toContainText(label);
  }

  async setTimeView(label: 'Standard' | 'Timecode'): Promise<void> {
    await this.settingsButton.click();
    const timeView = this.controls.locator('#timeView');
    await expect(timeView).toBeVisible();
    await timeView.click();
    await this.controls.getByText(label, { exact: true }).click();
  }

  async seekToFraction(fraction: number): Promise<void> {
    const box = await this.seekBar.boundingBox();
    if (!box) throw new Error('The video seek bar is not visible');

    await this.seekBar.click({
      position: {
        x: Math.max(1, Math.min(box.width - 1, box.width * fraction)),
        y: Math.floor(box.height / 2),
      },
    });
  }

  async openClipTool(): Promise<void> {
    await this.cropButton.click();
    await expect(this.clipStart).toBeVisible();
    await expect(this.clipEnd).toBeVisible();
  }

  async setClip(startSeconds: number, endSeconds: number): Promise<void> {
    const format = (seconds: number) => `00:${String(seconds).padStart(2, '0')}`;
    await this.clipStart.fill(format(startSeconds));
    await this.clipEnd.fill(format(endSeconds));
  }

  async openAiSummary(): Promise<void> {
    await this.page.locator('#button-previewTranscripts').click();
    await expect(this.aiSummaryButton).toBeVisible();
  }
}
