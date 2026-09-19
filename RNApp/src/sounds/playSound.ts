import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import {
  BACKGROUND_SOUNDS,
  DONE_SOUND_ID,
  SOUNDS,
  type BackgroundSoundId,
  type SoundId,
} from '../constants';

const players = new Map<string, AudioPlayer>();
const bgPlayers = new Map<string, AudioPlayer>();

/**
 * 配置全局音频会话（App 启动时调用一次）。
 *
 * interruptionMode 用 duckOthers：播提醒音时申请音频焦点，其他 App（音乐/播客）
 * 自动降低音量，提醒播完自动恢复。若用默认的 mixWithOthers（Android 上不申请焦点），
 * 边听音乐边拉伸时提醒会被音乐完全盖住。
 *
 * playsInSilentMode: true —— Android 上静音/振动模式也不静音提醒（拉伸时提醒必须能听见）。
 * shouldRouteThroughEarpiece: false —— 走扬声器，不走听筒（听筒音量小得多）。
 */
export function configureAudioMode(): void {
  setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
    shouldRouteThroughEarpiece: false,
  }).catch(() => undefined);
}

function getPlayer(id: SoundId): AudioPlayer {
  let p = players.get(id);
  if (!p) {
    const meta = SOUNDS.find((s) => s.id === id);
    if (!meta) throw new Error(`unknown sound: ${id}`);
    p = createAudioPlayer(meta.file);
    players.set(id, p);
  }
  return p;
}

/** 播放换边音（可连续多次触发，从头部重播） */
export function playSound(id: SoundId): void {
  const p = getPlayer(id);
  // seekTo 是异步的，而 play() 是同步的（见 expo-audio 类型定义）。
  // 不等 seek 完成就 play，第二次起播会落在音频末尾 → 提醒听不到声音。
  p.seekTo(0)
    .catch(() => undefined)
    .then(() => p.play())
    .catch(() => undefined);
}

/** 播放结束音（固定钟声，区别于换边音） */
export function playDone(): void {
  playSound(DONE_SOUND_ID);
}

/** 循环播放倒计时背景音（音量压低，不盖过换边音） */
export function playBackground(id: BackgroundSoundId): void {
  stopBackground();
  let p = bgPlayers.get(id);
  if (!p) {
    const meta = BACKGROUND_SOUNDS.find((s) => s.id === id);
    if (!meta) throw new Error(`unknown background sound: ${id}`);
    p = createAudioPlayer(meta.file);
    bgPlayers.set(id, p);
  }
  p.loop = true;
  p.volume = 0.5;
  p.play();
}

/** 停止背景音 */
export function stopBackground(): void {
  bgPlayers.forEach((p) => p.pause());
}
