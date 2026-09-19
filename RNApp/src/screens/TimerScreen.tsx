import React, { useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pet } from '../components/Pet';
import { PromptBanner } from '../components/PromptBanner';
import { formatTime } from '../constants';
import { useSettings } from '../store/SettingsContext';
import { useTheme } from '../theme/useTheme';
import { useTimer } from '../timer/useTimer';

export default function TimerScreen() {
  const { settings, modes, activeModeId, setActiveMode } = useSettings();
  const theme = useTheme();
  const { phase, remainingSec, side, totalSides, start, pause, resume, stop, reset } = useTimer();

  const petState: 'idle' | 'running' | 'paused' | 'remind' | 'finished' =
    phase === 'finished'
      ? 'finished'
      : phase === 'remind'
        ? 'remind'
        : phase === 'running'
          ? 'running'
          : phase === 'paused'
            ? 'paused'
            : 'idle';

  const title = phase === 'idle' ? '准备好就开始吧' : `第 ${side} / ${totalSides} 边`;

  const styles = useMemo(() => makeStyles(theme), [theme]);
  const scrollRef = useRef<ScrollView>(null);

  const activeMode = modes.find((m) => m.id === activeModeId) || null;

  const handleModeSwitch = (id: string | null) => {
    if (phase !== 'idle' && phase !== 'finished') return;
    setActiveMode(id);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>

        <Pet pet={settings.pet} state={petState} />

        {phase === 'remind' && <PromptBanner text="换边！" />}
        {phase === 'finished' && <PromptBanner text="完成啦！" />}

        <Text style={[styles.countdown, phase === 'remind' && styles.countdownHot]}>
          {formatTime(remainingSec)}
        </Text>

        <View style={styles.actions}>
          {(phase === 'idle' || phase === 'finished') && (
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={phase === 'idle' ? start : reset}>
              <Text style={styles.btnText}>{phase === 'idle' ? '开始' : '再来一次'}</Text>
            </Pressable>
          )}
          {phase === 'running' && (
            <>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={pause}>
                <Text style={styles.btnText}>暂停</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={stop}>
                <Text style={styles.btnGhostText}>结束</Text>
              </Pressable>
            </>
          )}
          {phase === 'paused' && (
            <>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={resume}>
                <Text style={styles.btnText}>继续</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={stop}>
                <Text style={styles.btnGhostText}>结束</Text>
              </Pressable>
            </>
          )}
          {phase === 'remind' && (
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={stop}>
              <Text style={styles.btnGhostText}>结束</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.modeBar}>
          <Text style={styles.modeBarTitle}>模式切换</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modeList}
          >
            <Pressable
              style={[styles.modeItem, activeModeId === null && styles.modeItemActive]}
              onPress={() => handleModeSwitch(null)}
            >
              <View style={styles.modeItemContent}>
                <Text style={[styles.modeItemName, activeModeId === null && styles.modeItemNameActive]}>
                  默认
                </Text>
                <Text style={styles.modeItemMeta}>总{settings.totalMinutes} 单{settings.perSideSeconds} 提{settings.alertDurationSec}</Text>
              </View>
            </Pressable>
            {modes.map((m) => (
              <Pressable
                key={m.id}
                style={[styles.modeItem, activeModeId === m.id && styles.modeItemActive]}
                onPress={() => handleModeSwitch(m.id)}
              >
                <View style={styles.modeItemContent}>
                  <Text style={[styles.modeItemName, activeModeId === m.id && styles.modeItemNameActive]}>
                    {m.name}
                  </Text>
                  <Text style={styles.modeItemMeta}>
                    总{m.settings.totalMinutes} 单{m.settings.perSideSeconds} 提{m.settings.alertDurationSec}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.colors.background },
    container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24, paddingHorizontal: 20 },
    title: { fontSize: 18, color: t.colors.textSecondary, fontWeight: '600' },
    countdown: {
      fontSize: 72,
      fontWeight: t.countdownWeight,
      color: t.colors.text,
      fontVariant: ['tabular-nums'],
      letterSpacing: t.countdownLetterSpacing,
      ...(t.glow ? { textShadowColor: t.colors.accent, textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } } : {}),
    },
    countdownHot: { color: t.colors.accent },
    actions: { flexDirection: 'row', gap: 14, marginBottom: 12 },
    btn: { paddingVertical: 14, paddingHorizontal: 34, borderRadius: t.radius, minWidth: 120, alignItems: 'center' },
    btnPrimary: { backgroundColor: t.colors.accent },
    btnGhost: { backgroundColor: t.colors.ghostBg },
    btnText: { color: t.colors.onAccent, fontSize: 18, fontWeight: '700' },
    btnGhostText: { color: t.colors.onGhost, fontSize: 18, fontWeight: '700' },
    modeBar: { width: '100%', maxHeight: '30%', marginBottom: 12 },
    modeBarTitle: { fontSize: 13, color: t.colors.textMuted, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
    modeList: { gap: 6, paddingHorizontal: 4 },
    modeItem: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: t.radius,
      backgroundColor: t.colors.ghostBg,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    modeItemActive: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
    modeItemContent: { flexDirection: 'column', gap: 2 },
    modeItemName: { fontSize: 15, color: t.colors.onGhost, fontWeight: '700' },
    modeItemNameActive: { color: t.colors.onAccent },
    modeItemMeta: { fontSize: 12, color: t.colors.textMuted, marginTop: 2 },
    modeItemActiveMeta: { color: t.colors.onAccent },
  });
