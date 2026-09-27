/**
 * 中文文案表（spec F8 界面多语言）。
 *
 * 本文件是**唯一的 key 来源**：所有界面文字都在这里登记 key。
 * strings.en.ts 以 `Record<StringKey, string>` 标注，漏翻一个 key 会在 `tsc` 阶段直接报错。
 *
 * 带占位符的文案用 `{名字}` 形式，由 t(key, params) 替换，例如：
 *   'timer.side': '第 {side} / {total} 边'  ->  t('timer.side', { side: 1, total: 10 })
 *
 * 加新语言不改本文件（除非中文本身要改）；只需新建 strings.<code>.ts + 在 index.tsx 的 LANGUAGES 加一行。
 */
export const zh = {
  // ── 底部导航 ──────────────────────────────────────────────
  'tab.timer': '计时',
  'tab.settings': '设置',
  'tab.history': '记录',

  // ── 计时页 ────────────────────────────────────────────────
  'timer.ready': '准备好就开始吧',
  'timer.side': '第 {side} / {total} 边',
  'timer.start': '开始',
  'timer.restart': '再来一次',
  'timer.pause': '暂停',
  'timer.stop': '结束',
  'timer.resume': '继续',
  'timer.modeSwitch': '模式切换',
  'timer.defaultMode': '默认',
  'timer.modeMeta': '总{m} 单{s} 提{a}',
  'prompt.remind': '换边！',
  'prompt.finished': '完成啦！',

  // ── 小动物（spec F2）──────────────────────────────────────
  'pet.idle': '准备好了吗？',
  'pet.running': '专注中…',
  'pet.paused': '暂停中，休息一下',
  'pet.remind': '换边！',
  'pet.finished': '完成啦！',
  'pet.name.dog': '小狗',
  'pet.name.rabbit': '小兔',
  'pet.name.cat': '小猫',

  // ── 提醒音效名（spec F3，8 种）───────────────────────────
  'sound.dingdong': '叮咚',
  'sound.dingdingding': '叮叮叮',
  'sound.beep': '蜂鸣',
  'sound.bell': '钟声',
  'sound.ding': '单声叮',
  'sound.alarm': '警报',
  'sound.rising': '升调',
  'sound.digital': '闹钟',

  // ── 背景音名（spec F3，环境音 5 + 轻音乐 4）──────────────
  'bg.ticktock': '时钟滴答',
  'bg.clock_tick1': '清脆滴答',
  'bg.clock_tick2': '短促脉冲',
  'bg.rain': '雨声白噪',
  'bg.waves': '海浪白噪',
  // 轻音乐 4 首：中文界面用中文名；英文界面为「英文原曲名（中文注解）」，见 strings.en.ts
  'bg.senbazuru': '禅意古筝',
  'bg.reminiscing': '静思钢琴',
  'bg.reawakening': '温暖苏醒',
  'bg.facile': '轻柔随想',

  // ── 主题名（spec F6）──────────────────────────────────────
  'theme.default': '暖萌',
  'theme.tech': '科技',
  'theme.minimal': '极简',
  'theme.magazine': '杂志',

  // ── 设置页 ────────────────────────────────────────────────
  'settings.header': '设置',
  'settings.group.language': '界面语言',
  // 「跟随系统」伪项显示文案（语言表 label 的取值来源）
  'settings.language.system': '跟随系统',
  'settings.group.theme': '主题风格',
  'settings.group.total': '总时长（分钟）',
  'settings.group.perSide': '单边时长',
  'settings.group.pet': '陪伴动物',
  'settings.group.sound': '提醒音效（点击可试听）',
  'settings.group.ambient': '倒计时声音（点击可试听，可关闭）',
  'settings.group.music': '倒计时轻音乐（点击可试听，可关闭）',
  'settings.group.alertDuration': '提醒持续时长（秒）',
  'settings.group.modes': '模式管理',

  // 档位/单位（带占位符）
  'settings.minutesChip': '{n} 分钟',
  'settings.secondsChip': '{n} 秒',
  // 单边档位固定四档，显式给 key，避免 "60 秒" 与 "1 分钟" 的单位分歧
  'settings.perSide.30': '30 秒',
  'settings.perSide.45': '45 秒',
  'settings.perSide.60': '1 分钟',
  'settings.perSide.120': '2 分钟',
  'settings.off': '关闭',

  // 时间流速（spec F7）
  'settings.speedTitle': '时间流速（{n}倍）',
  'settings.speedValue': '{n}倍',
  'settings.speedHint': '1倍=正常速度，100倍=100秒实际时间走完100秒显示时间',

  // 模式管理（spec F7）
  'settings.saveCurrent': '保存当前为模式',
  'settings.newMode': '+ 新建模式',
  'settings.modeEmpty': '暂无模式，点击“新建模式”创建',
  'settings.modeCurrent': '当前',
  'settings.modeCardMeta': '{m}分钟 · {s}秒/边',
  'settings.modeActivate': '启用',
  'settings.modeEdit': '编辑',
  'settings.modeDuplicate': '复制',
  'settings.modeDelete': '删除',
  'settings.modeCopySuffix': '副本',
  'settings.modeNameTemplate': '【总{m} 单{s} 提{a}—】',

  // 模式编辑 Modal
  'settings.modal.titleEdit': '编辑模式',
  'settings.modal.titleCreate': '新建模式',
  'settings.modal.cancel': '取消',
  'settings.modal.modeName': '模式名称',
  'settings.modal.modeNamePlaceholder': '输入模式名称',
  // Modal 内「提醒音效」不带分组标题的「（点击可试听）」，单独一条 key
  'settings.modal.soundLabel': '提醒音效',
  'settings.modal.saveEdit': '保存修改',
  'settings.modal.create': '创建模式',

  // 底部提示与 CC BY 4.0 署名（署名正文 MUSIC_ATTRIBUTION.text 原样保留，不删减）
  'settings.tip':
    '提示：上面三组（提醒音效 / 倒计时声音 / 倒计时轻音乐）都是点击即试听 —— 声音类约响 2.5 秒，轻音乐约 20 秒。' +
    '结束音固定为钟声，与换边音区分。倒计时声音或轻音乐选中后，会在开始计时时循环播放，每次换边提醒自动暂停、提醒完继续；' +
    '选「关闭」则计时中不播任何背景音。',
  'settings.attributionFormat': '背景轻音乐版权：{text}',

  // ── 历史记录页（spec F5）──────────────────────────────────
  'history.header': '拉伸记录',
  'history.clear': '清空',
  'history.empty': '还没有记录，去完成一次拉伸吧',
  'history.rowDesc': '总时长 {total} 分钟 · 完成 {sides} 边 · 每边 {per}',
  'history.delete': '删除',
};

/** 全部文案 key（英文表以 Record<StringKey, string> 标注 → 漏翻即编译报错） */
export type StringKey = keyof typeof zh;
