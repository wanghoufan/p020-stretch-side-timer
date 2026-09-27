/**
 * 界面多语言入口（spec F8）。
 *
 * ┌─ 新增一种语言（页面代码零改动）───────────────────────────────────┐
 * │ 1. 新建 `src/i18n/strings.<code>.ts`，导出该语言完整文案表，        │
 * │    类型标注 `Record<StringKey, string>`（漏翻会在 tsc 直接报错）；  │
 * │ 2. 在下面 `LANGUAGES` 表**加一行**：                              │
 * │      { code: '<code>', label: '<该语言自称>', strings: <该表> }     │
 * │    （`LanguageCode` 由 LANGUAGES 推导，加这一行即自动生效；         │
 * │      `LANGUAGES` 的 label 用各语言的自称，是语言表自身的常量，        │
 * │      故不放进 strings 文案表；首项 `system` 伪项无自称，label 为 null，│
 * │      显示文案走 SYSTEM_LANGUAGE_LABEL_KEY。）                      │
 * └──────────────────────────────────────────────────────────────┘
 *
 * 页面/组件一律通过 `useT()` 取文（`const t = useT(); ... t('timer.start')`），
 * 禁止写死任何用户可见文案；语言值取自 `SettingsContext.settings.language`。
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useLocales } from 'expo-localization';
import { zh, type StringKey } from './strings.zh';
import { en } from './strings.en';
import type { BackgroundSoundId, PetId, SoundId, PerSideSeconds } from '../constants';
import type { ThemeId } from '../theme/themes';
// 运行期依赖方向：i18n → store。反向（store 取 LanguageCode）只用 `import type`，编译期擦除，无运行期环。
import { useSettings } from '../store/SettingsContext';

export type { StringKey };

/** 「跟随系统」伪项的显示文案 key（中文界面「跟随系统」/ 英文界面 "Follow system"） */
export const SYSTEM_LANGUAGE_LABEL_KEY = 'settings.language.system' as const;

/**
 * 语言表：code = 语言代码（持久化用），label = 语言自称（选择器显示用）。
 *
 * 首项 `system` 是**伪项不是语言**（spec F8）：无 strings，表示「跟随系统」；
 * 它没有语言自称（label 为 null），显示文案走 `SYSTEM_LANGUAGE_LABEL_KEY` 经 `t()` 取，
 * 故不写死中文。
 */
export const LANGUAGES = [
  { code: 'system', label: null, strings: null },
  { code: 'zh', label: '中文', strings: zh },
  { code: 'en', label: 'English', strings: en },
] as const;

/** 语言选项条目类型（含 'system' 伪项） */
export type LanguageEntry = (typeof LANGUAGES)[number];

/** 语言代码联合类型（由 LANGUAGES 推导 → 加一行即扩展；含 'system' 伪项） */
export type LanguageCode = LanguageEntry['code'];

/** 可真正取文案的语言（去掉 'system' 伪项） */
export type SupportedLanguageCode = Exclude<LanguageCode, 'system'>;

/** 可跟随的实际语言（由 LANGUAGES 推导，新增语言自动纳入跟随范围） */
const FOLLOWABLE_CODES: SupportedLanguageCode[] = LANGUAGES.map((l) => l.code).filter(
  (c): c is SupportedLanguageCode => c !== 'system',
);

/**
 * 把「语言选择」解析为实际用于取文案的语言（**纯函数**：无副作用、不读全局，便于单测）。
 * - `code !== 'system'`：手动选择优先，原样返回；
 * - `code === 'system'`：取系统 tag 的语言前缀（'zh-Hans-CN' → 'zh'、'en-US' → 'en'），
 *   命中已支持语言则跟随该语言；tag 缺失或未命中（如 'ja-JP'）则回落 'zh'。
 */
export function resolveLanguage(
  code: LanguageCode,
  systemLocaleTag: string | null | undefined,
): SupportedLanguageCode {
  if (code !== 'system') return code;
  const prefix = (systemLocaleTag ?? '').trim().split(/[-_]/)[0].toLowerCase();
  return FOLLOWABLE_CODES.find((c) => c === prefix) ?? 'zh';
}

/** 语言选项显示文案：'system' 走 SYSTEM_LANGUAGE_LABEL_KEY（跟随系统/Follow system），其余用语言自称 */
export function languageLabel(lang: LanguageEntry, t: TFn): string {
  return lang.code === 'system' ? t(SYSTEM_LANGUAGE_LABEL_KEY) : lang.label;
}

const STRINGS = LANGUAGES.reduce<Record<string, Record<StringKey, string>>>(
  (acc, l) => (l.strings ? { ...acc, [l.code]: l.strings } : acc),
  {},
);

/** 占位符参数：文案里写 `{n}`，params 传 `{ n: 3 }` */
export type TParams = Record<string, string | number>;
export type TFn = (key: StringKey, params?: TParams) => string;

function translate(language: SupportedLanguageCode, key: StringKey, params?: TParams): string {
  const table = STRINGS[language] ?? STRINGS.zh;
  let out = table[key] ?? zh[key] ?? key;
  if (params) {
    for (const name of Object.keys(params)) {
      out = out.split(`{${name}}`).join(String(params[name]));
    }
  }
  return out;
}

interface I18nValue {
  language: SupportedLanguageCode;
  t: TFn;
}

const I18nContext = createContext<I18nValue | undefined>(undefined);

/**
 * 语言 Provider：语言取自 SettingsContext（唯一真源）。
 * 切换语言 → SettingsContext 值变 → 本 Provider 重渲染 → `t` 换表 → 整棵界面树重渲染。
 * 只重渲染、不 remount：计时状态（useTimer）与导航状态均不受影响（spec F8）。
 *
 * `settings.language === 'system'` 时由 `resolveLanguage` 实时解析系统语言：
 * 系统 tag 由 `useLocales()` 取（自带订阅，系统语言变化会触发重渲染，故运行期改系统语言可实时跟随）；
 * 也可经 `systemLocaleTag` 注入（便于单测/QA），**注入时以 prop 优先**。
 */
export function I18nProvider({
  children,
  systemLocaleTag,
}: {
  children: React.ReactNode;
  systemLocaleTag?: string;
}) {
  const { settings } = useSettings();
  // 无条件调用 hook（遵循 hook 规则），prop 已注入时其返回值被覆盖，仅保留可测性。
  const detectedTag = useLocales()[0]?.languageTag;
  const language = resolveLanguage(settings.language ?? 'system', systemLocaleTag ?? detectedTag);

  const value = useMemo<I18nValue>(
    () => ({
      language,
      t: (key, params) => translate(language, key, params),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n/useT must be used within I18nProvider');
  return ctx;
}

/** 取文 hook：`const t = useT(); t('timer.start')` */
export function useT(): TFn {
  return useI18n().t;
}

// ── id → 文案 key 映射表 ─────────────────────────────────────────────
// 用 Record<Id, StringKey> 标注：新增音效/动物/主题/背景音却忘了登记 key，会在 tsc 阶段报错。
// 这些表与语言无关，加语言时无需改动。

export const PET_NAME_KEY: Record<PetId, StringKey> = {
  dog: 'pet.name.dog',
  rabbit: 'pet.name.rabbit',
  cat: 'pet.name.cat',
};

export const SOUND_LABEL_KEY: Record<SoundId, StringKey> = {
  dingdong: 'sound.dingdong',
  dingdingding: 'sound.dingdingding',
  beep: 'sound.beep',
  bell: 'sound.bell',
  ding: 'sound.ding',
  alarm: 'sound.alarm',
  rising: 'sound.rising',
  digital: 'sound.digital',
};

export const BACKGROUND_LABEL_KEY: Record<BackgroundSoundId, StringKey> = {
  ticktock: 'bg.ticktock',
  clock_tick1: 'bg.clock_tick1',
  clock_tick2: 'bg.clock_tick2',
  rain: 'bg.rain',
  waves: 'bg.waves',
  senbazuru: 'bg.senbazuru',
  reminiscing: 'bg.reminiscing',
  reawakening: 'bg.reawakening',
  facile: 'bg.facile',
};

export const THEME_LABEL_KEY: Record<ThemeId, StringKey> = {
  default: 'theme.default',
  tech: 'theme.tech',
  minimal: 'theme.minimal',
  magazine: 'theme.magazine',
};

export const PER_SIDE_LABEL_KEY: Record<PerSideSeconds, StringKey> = {
  30: 'settings.perSide.30',
  45: 'settings.perSide.45',
  60: 'settings.perSide.60',
  120: 'settings.perSide.120',
};
