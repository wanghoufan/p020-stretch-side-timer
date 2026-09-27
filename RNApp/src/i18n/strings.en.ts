/**
 * 英文文案表（spec F8 界面多语言）。
 *
 * 类型标注为 `Record<StringKey, string>`（StringKey 来自 strings.zh.ts）：
 *   - 中文表里有的 key 这里漏一个 → `tsc` 直接报错（硬约束）；
 *   - 多写一个中文表里没有的 key → 同样报错。
 * 所以「加语言」时不可能静默漏翻。
 *
 * 口径（spec F8）：
 *   - 静态界面文字全译；
 *   - 4 首轻音乐显示「英文原曲名（中文注解）」（CC BY 4.0 署名要求，署名正文见 constants.ts 的 MUSIC_ATTRIBUTION，不删减）；
 *   - 音效名 / 动物名 / 主题名 / 时长档位名按界面语言译；
 *   - 短标签风格，与现有 UI 一致，不写长句。
 */
import type { StringKey } from './strings.zh';

export const en: Record<StringKey, string> = {
  // ── Bottom tabs ───────────────────────────────────────────
  'tab.timer': 'Timer',
  'tab.settings': 'Settings',
  'tab.history': 'History',

  // ── Timer screen ──────────────────────────────────────────
  'timer.ready': 'Ready when you are',
  'timer.side': 'Side {side} / {total}',
  'timer.start': 'Start',
  'timer.restart': 'Restart',
  'timer.pause': 'Pause',
  'timer.stop': 'Stop',
  'timer.resume': 'Resume',
  'timer.modeSwitch': 'Modes',
  'timer.defaultMode': 'Default',
  'timer.modeMeta': 'T{m} S{s} A{a}',
  'prompt.remind': 'Switch!',
  'prompt.finished': 'Done!',

  // ── Companion pet ─────────────────────────────────────────
  'pet.idle': 'Ready?',
  'pet.running': 'Focusing…',
  'pet.paused': 'Paused — take a break',
  'pet.remind': 'Switch!',
  'pet.finished': 'Done!',
  'pet.name.dog': 'Puppy',
  'pet.name.rabbit': 'Bunny',
  'pet.name.cat': 'Kitty',

  // ── Alert sounds ──────────────────────────────────────────
  'sound.dingdong': 'Ding-dong',
  'sound.dingdingding': 'Ding-ding-ding',
  'sound.beep': 'Beep',
  'sound.bell': 'Bell',
  'sound.ding': 'Single Ding',
  'sound.alarm': 'Alarm',
  'sound.rising': 'Rising',
  'sound.digital': 'Clock',

  // ── Background sounds ────────────────────────────────────
  'bg.ticktock': 'Clock Tick',
  'bg.clock_tick1': 'Crisp Tick',
  'bg.clock_tick2': 'Short Pulse',
  'bg.rain': 'Rain',
  'bg.waves': 'Waves',
  // Original English titles + Chinese annotation (spec F8: keep original name in English UI)
  'bg.senbazuru': 'Senbazuru (禅意古筝)',
  'bg.reminiscing': 'Reminiscing (静思钢琴)',
  'bg.reawakening': 'Reawakening (温暖苏醒)',
  'bg.facile': 'Facile (轻柔随想)',

  // ── Themes ────────────────────────────────────────────────
  'theme.default': 'Cozy',
  'theme.tech': 'Tech',
  'theme.minimal': 'Minimal',
  'theme.magazine': 'Magazine',

  // ── Settings screen ───────────────────────────────────────
  'settings.header': 'Settings',
  'settings.group.language': 'Language',
  'settings.group.theme': 'Theme',
  'settings.group.total': 'Total time (min)',
  'settings.group.perSide': 'Time per side',
  'settings.group.pet': 'Companion',
  'settings.group.sound': 'Alert sound (tap to preview)',
  'settings.group.ambient': 'Countdown sound (tap to preview)',
  'settings.group.music': 'Music (tap to preview)',
  'settings.group.alertDuration': 'Alert length (sec)',
  'settings.group.modes': 'Modes',

  'settings.minutesChip': '{n} min',
  'settings.secondsChip': '{n}s',
  'settings.perSide.30': '30s',
  'settings.perSide.45': '45s',
  'settings.perSide.60': '1 min',
  'settings.perSide.120': '2 min',
  'settings.off': 'Off',

  'settings.speedTitle': 'Speed ({n}x)',
  'settings.speedValue': '{n}x',
  'settings.speedHint': '1x = normal; 100x = 100 display seconds in 3 real seconds',

  'settings.saveCurrent': 'Save as mode',
  'settings.newMode': '+ New mode',
  'settings.modeEmpty': 'No modes yet — tap "New mode" to create one',
  'settings.modeCurrent': 'Active',
  'settings.modeCardMeta': '{m} min · {s}s/side',
  'settings.modeActivate': 'Use',
  'settings.modeEdit': 'Edit',
  'settings.modeDuplicate': 'Copy',
  'settings.modeDelete': 'Delete',
  'settings.modeCopySuffix': 'copy',
  'settings.modeNameTemplate': '[T{m} S{s} A{a}—]',

  'settings.modal.titleEdit': 'Edit mode',
  'settings.modal.titleCreate': 'New mode',
  'settings.modal.cancel': 'Cancel',
  'settings.modal.modeName': 'Mode name',
  'settings.modal.modeNamePlaceholder': 'Enter mode name',
  'settings.modal.soundLabel': 'Alert sound',
  'settings.modal.saveEdit': 'Save changes',
  'settings.modal.create': 'Create mode',

  'settings.tip':
    'Tip: all three groups above play a preview on tap — sounds about 2.5s, music about 20s. ' +
    'The finish sound is always Bell, distinct from the switch sound. ' +
    'A selected countdown sound or music loops while timing, auto-pauses at each switch alert and resumes after; ' +
    'choose Off to play no background sound.',
  // MUSIC_ATTRIBUTION.text is already self-contained English (CC BY 4.0), so no extra label is needed here.
  'settings.attributionFormat': '{text}',

  // ── History screen ────────────────────────────────────────
  'history.header': 'History',
  'history.clear': 'Clear',
  'history.empty': 'No records yet — finish a stretch session to see it here',
  'history.rowDesc': '{total} min · {sides} sides · {per} each',
  'history.delete': 'Delete',
};
