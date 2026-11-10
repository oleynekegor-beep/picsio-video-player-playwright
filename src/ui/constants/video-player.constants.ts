export const MP4_DURATION_SECONDS = { min: 66, max: 68 };
export const MOV_DURATION_SECONDS = { min: 6, max: 8 };
export const MIDPOINT_SEEK_RANGE = { min: 0.35, max: 0.65 };
export const MIDPOINT_SEEK_POSITION = 0.5;
export const PLAYBACK_START_SECONDS = 0;
export const MP4_DISPLAYED_DURATION = '01:06';
export const STANDARD_TIME_DISPLAY_PATTERN = /^\d{2}:\d{2}\s*\/\s*\d{2}:\d{2}$/;
export const TIMECODE_DISPLAY_PATTERN = /^\d{2}:\d{2}:\d{2}:\d{2}\s*\/\s*\d{2}:\d{2}:\d{2}:\d{2}$/;

export const PLAYBACK_SPEED_OPTIONS = [
  { rate: 0.25, label: '0.25' },
  { rate: 0.5, label: '0.5' },
  { rate: 0.75, label: '0.75' },
  { rate: 1, label: 'Normal' },
  { rate: 1.25, label: '1.25' },
  { rate: 1.5, label: '1.5' },
  { rate: 1.75, label: '1.75' },
  { rate: 2, label: '2' },
] as const;

export const VIDEO_PLAYER_SELECTORS = {
  controls: '.videoControls',
  video: 'video',
  playPause: '.btnPlayVideo',
  seekBar: '[class*="videoTracks--"]',
  timeDisplay: /^\d[\d:]*\s*\/\s*\d[\d:]*$/,
  settingsButton: '.playerGearMenu',
  aiSummaryButtonName: 'AI Summary',
  aiSummaryPanelHeading: /Video & Audio Intelligence \(Beta\)/,
  aiSummaryText: 'li[class*="TranscriptItem__text"]',
  speedMenu: '#speed',
  timeView: '#timeView',
  transcriptsButton: '#button-previewTranscripts',
} as const;
