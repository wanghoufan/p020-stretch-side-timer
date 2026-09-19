/**
 * 主题系统：4 套风格（暖萌经典 / 科技 / 极简 / 杂志）。
 * 所有屏幕组件一律通过 useTheme() 取色，禁止在组件内写死颜色。
 */
export type ThemeId = 'default' | 'tech' | 'minimal' | 'magazine';

export interface Theme {
  id: ThemeId;
  label: string;
  emoji: string;
  statusBarStyle: 'dark' | 'light';
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    onAccent: string;
    ghostBg: string;
    onGhost: string;
    border: string;
    dangerBg: string;
    danger: string;
  };
  radius: number;
  bannerRadius: number;
  headerWeight: '700' | '800' | '900';
  countdownWeight: '700' | '800' | '900';
  countdownLetterSpacing: number;
  glow: boolean;
}

export const THEMES: readonly Theme[] = [
  {
    id: 'default',
    label: '暖萌',
    emoji: '🌼',
    statusBarStyle: 'dark',
    colors: {
      background: '#fff8f0',
      surface: '#ffffff',
      text: '#5b4636',
      textSecondary: '#8a6d3b',
      textMuted: '#b9a98f',
      accent: '#ff7e67',
      onAccent: '#ffffff',
      ghostBg: '#f3e9dc',
      onGhost: '#8a6d3b',
      border: '#f0e6d8',
      dangerBg: '#ffe4de',
      danger: '#ff7e67',
    },
    radius: 20,
    bannerRadius: 24,
    headerWeight: '800',
    countdownWeight: '800',
    countdownLetterSpacing: 2,
    glow: false,
  },
  {
    id: 'tech',
    label: '科技',
    emoji: '⚡',
    statusBarStyle: 'light',
    colors: {
      background: '#0b1020',
      surface: '#151b2e',
      text: '#e6edf7',
      textSecondary: '#8fa3c0',
      textMuted: '#5b6b8c',
      accent: '#00e0ff',
      onAccent: '#04121f',
      ghostBg: '#1b2338',
      onGhost: '#a9c3ff',
      border: '#26324d',
      dangerBg: '#2a1626',
      danger: '#ff5c8a',
    },
    radius: 8,
    bannerRadius: 8,
    headerWeight: '800',
    countdownWeight: '900',
    countdownLetterSpacing: 6,
    glow: true,
  },
  {
    id: 'minimal',
    label: '极简',
    emoji: '◽',
    statusBarStyle: 'dark',
    colors: {
      background: '#fafafa',
      surface: '#ffffff',
      text: '#181818',
      textSecondary: '#555555',
      textMuted: '#999999',
      accent: '#181818',
      onAccent: '#ffffff',
      ghostBg: '#efefef',
      onGhost: '#333333',
      border: '#e5e5e5',
      dangerBg: '#eeeeee',
      danger: '#333333',
    },
    radius: 2,
    bannerRadius: 2,
    headerWeight: '700',
    countdownWeight: '700',
    countdownLetterSpacing: 1,
    glow: false,
  },
  {
    id: 'magazine',
    label: '杂志',
    emoji: '📰',
    statusBarStyle: 'dark',
    colors: {
      background: '#fbf7f0',
      surface: '#ffffff',
      text: '#1a120b',
      textSecondary: '#6b5a45',
      textMuted: '#a89a85',
      accent: '#c43a1f',
      onAccent: '#ffffff',
      ghostBg: '#f0e7da',
      onGhost: '#3d2c1d',
      border: '#e5d8c4',
      dangerBg: '#f8e0d8',
      danger: '#c43a1f',
    },
    radius: 0,
    bannerRadius: 0,
    headerWeight: '900',
    countdownWeight: '900',
    countdownLetterSpacing: 3,
    glow: false,
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'default';

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}