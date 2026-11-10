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
  readonly aiSummaryButton: Locator;
  readonly aiSummaryPanel: Locator;
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.controls = page.locator('.videoControls');
    this.video = page.locator('video');
    this.playPause = this.controls.locator('.btnPlayVideo').first();
    // Pics.io renders the scrubber with a CSS-module class whose stable prefix
    // is videoTracks; match the prefix rather than its generated hash suffix.
    this.seekBar = page.locator('[class*="videoTracks--"]');
    this.timeDisplay = this.controls.getByText(/^\d[\d:]*\s*\/\s*\d[\d:]*$/);
    this.settingsButton = this.controls.locator('.playerGearMenu').first();
    this.aiSummaryButton = page.getByRole('button', { name: 'AI Summary', exact: true });
    this.aiSummaryPanel = page.locator('.video-ai-preview');
  }

  async expectReady(minDuration: number, maxDuration: number): Promise<void> {
    await expect(this.controls).toBeVisible();
    await expect(this.video).toBeVisible();
    await expect
      .poll(() => this.video.evaluate((element) => (element as HTMLVideoElement).readyState))
      .toBeGreaterThanOrEqual(2);
    await expect
      .poll(() => this.video.evaluate((element) => (element as HTMLVideoElement).duration))
      .toBeGreaterThan(minDuration);
    await expect
      .poll(() => this.video.evaluate((element) => (element as HTMLVideoElement).duration))
      .toBeLessThan(maxDuration);
  }

  async setPlaybackRate(rate: number, label: string): Promise<void> {
    await expect(this.settingsButton).toBeVisible();
    await this.settingsButton.click();
    const speedMenu = this.controls.locator('#speed');
    await expect(speedMenu).toBeVisible();
    await speedMenu.click();
    await this.controls.getByText(label, { exact: true }).click();

    await expect
      .poll(() => this.video.evaluate((element) => (element as HTMLVideoElement).playbackRate))
      .toBe(rate);

    // The menu summary reflects the selected rate. The checkmark is visual-only
    // in the current UI, so the test avoids coupling to its unnamed icon markup.
    await expect(speedMenu).toContainText(label);
  }

  async setTimeView(label: 'Standard' | 'Timecode'): Promise<void> {
    await expect(this.settingsButton).toBeVisible();
    const timeView = this.page.locator('#timeView');
    // Choosing a time view can leave the settings menu open. Don't toggle it
    // closed when changing back to the other option.
    if (!(await timeView.isVisible())) {
      await this.settingsButton.click();
    }
    await expect(timeView).toBeVisible();
    await timeView.click();
    await this.page.getByText(label, { exact: true }).click();
  }

  async seekToFraction(fraction: number): Promise<void> {
    await expect(this.seekBar).toBeVisible();
    const box = await this.seekBar.boundingBox();
    if (!box) throw new Error('The video seek bar is not visible');

    await this.seekBar.click({
      position: {
        x: Math.max(1, Math.min(box.width - 1, box.width * fraction)),
        y: Math.floor(box.height / 2),
      },
    });
  }

  async openAiSummary(): Promise<void> {
    await this.page.locator('#button-previewTranscripts').click();
    await expect(this.aiSummaryButton).toBeVisible();
    await expect(this.aiSummaryPanel).toBeVisible();
  }
}
