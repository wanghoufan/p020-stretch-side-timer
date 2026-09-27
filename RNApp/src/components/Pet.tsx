import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { PETS, type PetId } from '../constants';
import { useT, type StringKey } from '../i18n';
import { useTheme } from '../theme/useTheme';

export type PetState = 'idle' | 'running' | 'paused' | 'remind' | 'finished';

/** 状态 → 文案 key（Record 标注保证每个状态都有文案，漏一个即编译报错） */
const SUBTITLE_KEY: Record<PetState, StringKey> = {
  idle: 'pet.idle',
  running: 'pet.running',
  paused: 'pet.paused',
  remind: 'pet.remind',
  finished: 'pet.finished',
};

const EXTRAS: Record<PetState, string> = {
  idle: '💤',
  running: '💪',
  paused: '⏸️',
  remind: '🔄',
  finished: '🎉',
};

/**
 * 陪伴小动物（spec F2）：emoji + 4 状态动画。
 * idle=趴着待机（轻微浮动），running=专注呼吸，remind=弹跳叫醒，finished=庆祝。
 */
export function Pet({ pet, state }: { pet: PetId; state: PetState }) {
  const theme = useTheme();
  const t = useT();
  const emoji = PETS.find((p) => p.id === pet)?.emoji ?? '🐶';
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    scale.stopAnimation();
    scale.setValue(1);
    let anim: Animated.CompositeAnimation | null = null;
    if (state === 'running') {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.08,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
    } else if (state === 'remind') {
      anim = Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.3,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]);
    } else if (state === 'finished') {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.15, duration: 300, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      );
    } else {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
    }
    anim.start();
    return () => anim?.stop();
  }, [state, scale]);

  const styles = makeStyles(theme);

  return (
    <View style={styles.wrap}>
      <View>
        <Animated.Text style={[styles.pet, { transform: [{ scale }] }]}>{emoji}</Animated.Text>
        <Text style={styles.extra}>{EXTRAS[state]}</Text>
      </View>
      <Text style={styles.subtitle}>{t(SUBTITLE_KEY[state])}</Text>
    </View>
  );
}

const makeStyles = (t: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    wrap: { alignItems: 'center', marginVertical: 8 },
    pet: { fontSize: 96, lineHeight: 110 },
    extra: { position: 'absolute', top: -6, right: -18, fontSize: 30 },
    subtitle: { marginTop: 4, fontSize: 16, color: t.colors.textSecondary, fontWeight: '600' },
  });