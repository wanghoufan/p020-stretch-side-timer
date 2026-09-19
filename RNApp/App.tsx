import React, { useEffect } from 'react';
import { SettingsProvider } from './src/store/SettingsContext';
import { HistoryProvider } from './src/store/HistoryContext';
import { configureAudioMode } from './src/sounds/playSound';
import RootNavigator from './src/navigation/BottomTabs';

export default function App() {
  // 音频会话必须在首次播放前配置好，否则第一声提醒仍按默认模式（不申请焦点）播放
  useEffect(() => {
    configureAudioMode();
  }, []);

  return (
    <SettingsProvider>
      <HistoryProvider>
        <RootNavigator />
      </HistoryProvider>
    </SettingsProvider>
  );
}
