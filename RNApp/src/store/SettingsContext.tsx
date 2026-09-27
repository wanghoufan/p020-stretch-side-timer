import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { BackgroundSoundId, ModeSettings, PetId, SoundId } from '../constants';
import { DEFAULT_MODE_SETTINGS, type Mode } from '../constants';
import type { ThemeId } from '../theme/themes';
// type-only：编译期擦除，运行期不构成 i18n ↔ store 循环依赖（i18n 取值时才引用 store）
import type { LanguageCode } from '../i18n';

export interface Settings {
  totalMinutes: number;
  perSideSeconds: number;
  soundId: SoundId;
  alertDurationSec: number;
  pet: PetId;
  backgroundSound: BackgroundSoundId | 'off';
  theme: ThemeId;
  timeSpeed: number;
  /** 界面语言（spec F8，全局偏好，不进模式快照）；存量数据缺此字段时回落 'zh' */
  language: LanguageCode;
}

const SETTINGS_KEY = '@stretch/settings';
const MODES_KEY = '@stretch/modes';
const ACTIVE_MODE_KEY = '@stretch/activeMode';

export const DEFAULT_SETTINGS: Settings = {
  totalMinutes: 10,
  perSideSeconds: 60,
  soundId: 'dingdong',
  alertDurationSec: 2,
  pet: 'dog',
  backgroundSound: 'off',
  theme: 'default' as ThemeId,
  timeSpeed: 1,
  language: 'zh',
};

interface SettingsContextValue {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  modes: Mode[];
  activeModeId: string | null;
  createMode: (name: string, settings: Partial<ModeSettings>) => void;
  updateMode: (id: string, updates: Partial<Mode>) => void;
  deleteMode: (id: string) => void;
  setActiveMode: (id: string | null) => void;
  /** nameSuffix：自动生成的「副本」等后缀文案由调用方（UI 层）按当前语言传入 */
  duplicateMode: (id: string, nameSuffix: string) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function generateId(): string {
  return `mode_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 把当前 settings 收成模式快照；**刻意不带 language**（语言是全局偏好，spec F8） */
function settingsToModeSettings(s: Settings): ModeSettings {
  return {
    totalMinutes: s.totalMinutes,
    perSideSeconds: s.perSideSeconds,
    soundId: s.soundId,
    alertDurationSec: s.alertDurationSec,
    pet: s.pet,
    backgroundSound: s.backgroundSound,
    theme: s.theme,
    timeSpeed: s.timeSpeed,
  };
}

/**
 * 模式快照 → settings。
 * 模式不含 language，故必须显式带上当前语言，避免启用模式时把语言打回默认值。
 */
function modeSettingsToSettings(m: ModeSettings, language: LanguageCode): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...m,
    language,
  };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [modes, setModes] = useState<Mode[]>([]);
  const [activeModeId, setActiveModeId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SETTINGS_KEY),
      AsyncStorage.getItem(MODES_KEY),
      AsyncStorage.getItem(ACTIVE_MODE_KEY),
    ]).then(([settingsRaw, modesRaw, activeRaw]) => {
      if (settingsRaw) {
        try {
          const parsed = JSON.parse(settingsRaw) as Partial<Settings>;
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch {
          // ignore
        }
      }
      if (modesRaw) {
        try {
          const parsed = JSON.parse(modesRaw) as Mode[];
          setModes(parsed);
        } catch {
          // ignore
        }
      }
      if (activeRaw) {
        setActiveModeId(activeRaw);
      }
    }).catch(() => undefined);
  }, []);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  };

  const createMode = (name: string, partial: Partial<ModeSettings> = {}) => {
    const newMode: Mode = {
      id: generateId(),
      // 名称由 UI 层按当前语言生成好后传入（store 不写死任何界面文案）
      name,
      settings: {
        // 基线取 DEFAULT_MODE_SETTINGS（不含 language，保证模式快照永不携带语言字段）
        ...DEFAULT_MODE_SETTINGS,
        ...settingsToModeSettings(settings),
        ...partial,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setModes((prev) => {
      const next = [...prev, newMode];
      AsyncStorage.setItem(MODES_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  };

  const updateMode = (id: string, updates: Partial<Mode>) => {
    setModes((prev) => {
      const next = prev.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m
      );
      AsyncStorage.setItem(MODES_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  };

  const deleteMode = (id: string) => {
    setModes((prev) => {
      const next = prev.filter((m) => m.id !== id);
      AsyncStorage.setItem(MODES_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
    if (activeModeId === id) {
      setActiveModeId(null);
      AsyncStorage.removeItem(ACTIVE_MODE_KEY).catch(() => undefined);
    }
  };

  const setActiveMode = (id: string | null) => {
    setActiveModeId(id);
    if (id === null) {
      AsyncStorage.removeItem(ACTIVE_MODE_KEY).catch(() => undefined);
    } else {
      AsyncStorage.setItem(ACTIVE_MODE_KEY, id).catch(() => undefined);
      const mode = modes.find((m) => m.id === id);
      if (mode) {
        // 模式快照无 language，带上当前语言，避免切模式把界面语言打回默认
        setSettings(modeSettingsToSettings(mode.settings, settings.language));
      }
    }
  };

  const duplicateMode = (id: string, nameSuffix: string) => {
    const mode = modes.find((m) => m.id === id);
    if (!mode) return;
    const newMode: Mode = {
      ...mode,
      id: generateId(),
      name: `${mode.name} ${nameSuffix}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setModes((prev) => {
      const next = [...prev, newMode];
      AsyncStorage.setItem(MODES_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      settings,
      update,
      modes,
      activeModeId,
      createMode,
      updateMode,
      deleteMode,
      setActiveMode,
      duplicateMode,
    }),
    [settings, modes, activeModeId]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
