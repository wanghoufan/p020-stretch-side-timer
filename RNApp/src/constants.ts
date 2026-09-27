/**
 * 全局常量：所有选项与 spec.md F1/F2/F3 保持一致，禁止随意增删。
 *
 * 说明（spec F8 界面多语言）：显示用文案（音效名/动物名/主题名/档位名）统一放 `src/i18n/strings.*.ts`，
 * 本文件只保留与语言无关的 id、数值与资源引用（key 映射见 src/i18n/index.tsx）。
 */
import type { ThemeId } from './theme/themes';

export const TOTAL_MINUTES_OPTIONS = [5, 10, 15, 20];

/** 单边时长档位（秒）；显示文案走 i18n 的 settings.perSide.* */
export const PER_SIDE_OPTIONS = [30, 45, 60, 120] as const;

export type PerSideSeconds = (typeof PER_SIDE_OPTIONS)[number];

export const ALERT_DURATION_OPTIONS = [1, 2, 3];

export const PETS = [
  { id: 'dog', emoji: '🐶' },
  { id: 'rabbit', emoji: '🐰' },
  { id: 'cat', emoji: '🐱' },
] as const;

export type PetId = (typeof PETS)[number]['id'];

/**
 * 内置 8 种短提示音（spec F3）。
 * 全部由 scripts/generate-sounds.py 合成：峰值拉满 -0.3dBFS、主频落在手机小喇叭
 * 效率最高的人耳敏感区（1-3kHz）、多脉冲节奏 + 足够时长，适配筋膜枪等嘈杂环境。
 */
export const SOUNDS = [
  { id: 'dingdong', file: require('../assets/sounds/dingdong.wav') },
  { id: 'dingdingding', file: require('../assets/sounds/dingdingding.wav') },
  { id: 'beep', file: require('../assets/sounds/beep.wav') },
  { id: 'bell', file: require('../assets/sounds/bell.wav') },
  { id: 'ding', file: require('../assets/sounds/ding.wav') },
  { id: 'alarm', file: require('../assets/sounds/alarm.wav') },
  { id: 'rising', file: require('../assets/sounds/rising.wav') },
  { id: 'digital', file: require('../assets/sounds/digital.wav') },
] as const;

export type SoundId = (typeof SOUNDS)[number]['id'];

/** 背景音分组（与语言无关的内部标识；分组标题文案见 i18n 的 settings.group.ambient / .music） */
export type BackgroundSoundGroup = 'ambient' | 'music';

/**
 * 倒计时背景音（可关闭）：环境音 5 种（ambient）+ 轻音乐 4 首（music）。
 *
 * 轻音乐来自 Incompetech（Kevin MacLeod），**CC BY 4.0，必须署名**——
 * 署名文案见 MUSIC_ATTRIBUTION，由设置页底部渲染，勿删。
 * 素材经 scripts/prepare-music.py 处理：首尾交叉淡化（无缝循环）+ loudnorm 响度归一。
 */
export const BACKGROUND_SOUNDS = [
  { id: 'ticktock', group: 'ambient', file: require('../assets/sounds/ticktock.wav') },
  { id: 'clock_tick1', group: 'ambient', file: require('../assets/sounds/clock_tick1.wav') },
  { id: 'clock_tick2', group: 'ambient', file: require('../assets/sounds/clock_tick2.wav') },
  { id: 'rain', group: 'ambient', file: require('../assets/sounds/rain.wav') },
  { id: 'waves', group: 'ambient', file: require('../assets/sounds/waves.wav') },
  { id: 'senbazuru', group: 'music', file: require('../assets/music/senbazuru.mp3') },
  { id: 'reminiscing', group: 'music', file: require('../assets/music/reminiscing.mp3') },
  { id: 'reawakening', group: 'music', file: require('../assets/music/reawakening.mp3') },
  { id: 'facile', group: 'music', file: require('../assets/music/facile.mp3') },
] as const satisfies readonly { id: string; group: BackgroundSoundGroup; file: number }[];

export type BackgroundSoundId = (typeof BACKGROUND_SOUNDS)[number]['id'];

/**
 * 轻音乐署名（CC BY 4.0 强制要求，非可选客气）。
 * 曲目来自 Incompetech（Kevin MacLeod），设置页底部必须展示本段文字。
 * 标题行由 i18n 的 settings.attributionFormat 提供（中文界面「背景轻音乐版权：」+ 本段正文）。
 */
export const MUSIC_ATTRIBUTION = {
  text:
    'Music: Senbazuru, Reminiscing, Reawakening, Facile — by Kevin MacLeod (incompetech.com), ' +
    'Licensed under Creative Commons: By Attribution 4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/',
  urlLabel: 'creativecommons.org/licenses/by/4.0',
};

/** 结束音固定为钟声，与换边音区分（spec F1/F3） */
export const DONE_SOUND_ID: SoundId = 'bell';

export const formatTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/** 模式/分组：一组预设设置 */
export interface Mode {
  id: string;
  name: string;
  settings: ModeSettings;
  createdAt: number;
  updatedAt: number;
}

/**
 * 模式快照设置（spec F7）。
 * **不含 `language`**：界面语言是全局偏好，不随模式复制/切换（spec F8）。
 */
export interface ModeSettings {
  totalMinutes: number;
  perSideSeconds: number;
  soundId: SoundId;
  alertDurationSec: number;
  pet: PetId;
  backgroundSound: BackgroundSoundId | 'off';
  theme: ThemeId;
  timeSpeed: number;
}

export const DEFAULT_MODE_SETTINGS = {
  totalMinutes: 10,
  perSideSeconds: 60,
  soundId: 'dingdong' as SoundId,
  alertDurationSec: 2,
  pet: 'dog' as PetId,
  backgroundSound: 'off' as BackgroundSoundId | 'off',
  theme: 'default' as ThemeId,
  timeSpeed: 1,
};
