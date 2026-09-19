import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { BackgroundSoundId, PetId, SoundId } from '../constants';
import { DEFAULT_MODE_SETTINGS, type Mode } from '../constants';
import type { ThemeId } from '../theme/themes';

export interface Settings {
  totalMinutes: number;
  perSideSeconds: number;
  soundId: SoundId;
  alertDurationSec: number;
  pet: PetId;
  backgroundSound: BackgroundSoundId | 'off';
  theme: ThemeId;
  timeSpeed: number;
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
};

interface SettingsContextValue {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  modes: Mode[];
  activeModeId: string | null;
  createMode: (name: string, settings: Partial<Settings>) => void;
  updateMode: (id: string, updates: Partial<Mode>) => void;
  deleteMode: (id: string) => void;
  setActiveMode: (id: string | null) => void;
  duplicateMode: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function generateId(): string {
  return `mode_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function settingsToModeSettings(s: Settings): Mode['settings'] {
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

function modeSettingsToSettings(m: Mode['settings']): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...m,
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

  const createMode = (name: string, partial: Partial<Settings> = {}) => {
    const newMode: Mode = {
      id: generateId(),
      name: name || `模式 ${modes.length + 1}`,
      settings: {
        ...DEFAULT_SETTINGS,
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
        setSettings(modeSettingsToSettings(mode.settings));
      }
    }
  };

  const duplicateMode = (id: string) => {
    const mode = modes.find((m) => m.id === id);
    if (!mode) return;
    const newMode: Mode = {
      ...mode,
      id: generateId(),
      name: `${mode.name} 副本`,
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
