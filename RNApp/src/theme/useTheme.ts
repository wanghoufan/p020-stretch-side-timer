import { useMemo } from 'react';
import { useSettings } from '../store/SettingsContext';
import { getTheme, type Theme } from './themes';

export function useTheme(): Theme {
  const { settings } = useSettings();
  return useMemo(() => getTheme(settings.theme), [settings.theme]);
}