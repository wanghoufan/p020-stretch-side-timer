import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

/** 换边/完成 大字提示（spec F1/F3，声音+屏幕双重提醒） */
export function PromptBanner({ text }: { text: string }) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const makeStyles = (t: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    banner: {
      backgroundColor: t.colors.accent,
      borderRadius: t.bannerRadius,
      paddingVertical: 18,
      paddingHorizontal: 32,
      alignItems: 'center',
      marginVertical: 12,
      ...(t.glow
        ? { shadowColor: t.colors.accent, shadowOpacity: 0.8, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 8 }
        : {}),
    },
    text: { color: t.colors.onAccent, fontSize: 34, fontWeight: '800', letterSpacing: 2 },
  });