/**
 * 全局常量：所有选项与 spec.md F1/F2/F3 保持一致，禁止随意增删。
 */
import type { ThemeId } from './theme/themes';

export const TOTAL_MINUTES_OPTIONS = [5, 10, 15, 20];

export const PER_SIDE_OPTIONS = [
  { label: '30 秒', value: 30 },
  { label: '45 秒', value: 45 },
  { label: '1 分钟', value: 60 },
  { label: '2 分钟', value: 120 },
] as const;

export const ALERT_DURATION_OPTIONS = [1, 2, 3];

export const PETS = [
  { id: 'dog', emoji: '🐶', name: '小狗' },
  { id: 'rabbit', emoji: '🐰', name: '小兔' },
  { id: 'cat', emoji: '🐱', name: '小猫' },
] as const;

export type PetId = (typeof PETS)[number]['id'];

/**
 * 内置 8 种短提示音（spec F3）。
 * 全部由 scripts/generate-sounds.py 合成：峰值拉满 -0.3dBFS、主频落在手机小喇叭
 * 效率最高的人耳敏感区（1-3kHz）、多脉冲节奏 + 足够时长，适配筋膜枪等嘈杂环境。
 */
export const SOUNDS = [
  { id: 'dingdong', label: '叮咚', file: require('../assets/sounds/dingdong.wav') },
  { id: 'dingdingding', label: '叮叮叮', file: require('../assets/sounds/dingdingding.wav') },
  { id: 'beep', label: '蜂鸣', file: require('../assets/sounds/beep.wav') },
  { id: 'bell', label: '钟声', file: require('../assets/sounds/bell.wav') },
  { id: 'ding', label: '单声叮', file: require('../assets/sounds/ding.wav') },
  { id: 'alarm', label: '警报', file: require('../assets/sounds/alarm.wav') },
  { id: 'rising', label: '升调', file: require('../assets/sounds/rising.wav') },
  { id: 'digital', label: '闹钟', file: require('../assets/sounds/digital.wav') },
] as const;

export type SoundId = (typeof SOUNDS)[number]['id'];

/**
 * 倒计时背景音（可关闭）：环境音 5 种 + 轻音乐 4 首。
 *
 * 轻音乐来自 Incompetech（Kevin MacLeod），**CC BY 4.0，必须署名**——
 * 署名文案见 MUSIC_ATTRIBUTION，由设置页底部渲染，勿删。
 * 素材经 scripts/prepare-music.py 处理：首尾交叉淡化（无缝循环）+ loudnorm 响度归一。
 */
export const BACKGROUND_SOUNDS = [
  { id: 'ticktock', label: '时钟滴答', group: '环境音', file: require('../assets/sounds/ticktock.wav') },
  { id: 'clock_tick1', label: '清脆滴答', group: '环境音', file: require('../assets/sounds/clock_tick1.wav') },
  { id: 'clock_tick2', label: '短促脉冲', group: '环境音', file: require('../assets/sounds/clock_tick2.wav') },
  { id: 'rain', label: '雨声白噪', group: '环境音', file: require('../assets/sounds/rain.wav') },
  { id: 'waves', label: '海浪白噪', group: '环境音', file: require('../assets/sounds/waves.wav') },
  { id: 'senbazuru', label: '禅意古筝', group: '轻音乐', file: require('../assets/music/senbazuru.mp3') },
  { id: 'reminiscing', label: '静思钢琴', group: '轻音乐', file: require('../assets/music/reminiscing.mp3') },
  { id: 'reawakening', label: '温暖苏醒', group: '轻音乐', file: require('../assets/music/reawakening.mp3') },
  { id: 'facile', label: '轻柔随想', group: '轻音乐', file: require('../assets/music/facile.mp3') },
] as const;

export type BackgroundSoundId = (typeof BACKGROUND_SOUNDS)[number]['id'];

/**
 * 轻音乐署名（CC BY 4.0 强制要求，非可选客气）。
 * 曲目来自 Incompetech（Kevin MacLeod），设置页底部必须展示本段文字。
 */
export const MUSIC_ATTRIBUTION = {
  label: '背景轻音乐版权',
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
  settings: {
    totalMinutes: number;
    perSideSeconds: number;
    soundId: SoundId;
    alertDurationSec: number;
    pet: PetId;
    backgroundSound: BackgroundSoundId | 'off';
    theme: ThemeId;
    timeSpeed: number;
  };
  createdAt: number;
  updatedAt: number;
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
