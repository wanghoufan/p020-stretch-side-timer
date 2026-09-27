import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TimerScreen from '../screens/TimerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { useT } from '../i18n';
import { useTheme } from '../theme/useTheme';

export type RootTabParamList = {
  Timer: undefined;
  Settings: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>;
}

export default function RootNavigator() {
  const theme = useTheme();
  const t = useT();
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style={theme.statusBarStyle} />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.accent,
            tabBarInactiveTintColor: theme.colors.textMuted,
            tabBarStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Tab.Screen
            name="Timer"
            component={TimerScreen}
            options={{
              title: t('tab.timer'),
              tabBarIcon: ({ focused }) => <TabIcon emoji="⏱️" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: t('tab.settings'),
              tabBarIcon: ({ focused }) => <TabIcon emoji="🎛️" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{
              title: t('tab.history'),
              tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}