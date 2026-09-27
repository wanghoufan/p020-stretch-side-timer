import React, { useEffect } from 'react';
import { SettingsProvider } from './src/store/SettingsContext';
import { HistoryProvider } from './src/store/HistoryContext';
import { I18nProvider } from './src/i18n';
import { configureAudioMode } from './src/sounds/playSound';
import RootNavigator from './src/navigation/BottomTabs';

export default function App() {
  // 音频会话必须在首次播放前配置好，否则第一声提醒仍按默认模式（不申请焦点）播放
  useEffect(() => {
    configureAudioMode();
  }, []);

  return (
    <SettingsProvider>
      {/* I18nProvider 在 SettingsProvider 之内（语言取自 SettingsContext）、HistoryProvider 之外；
          切换语言只重渲染整棵树，不 remount 根组件，故 useTimer 的计时状态不中断、不归零 */}
      <I18nProvider>
        <HistoryProvider>
          <RootNavigator />
        </HistoryProvider>
      </I18nProvider>
    </SettingsProvider>
  );
}
