import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ALERT_DURATION_OPTIONS,
  BACKGROUND_SOUNDS,
  MUSIC_ATTRIBUTION,
  PER_SIDE_OPTIONS,
  PETS,
  SOUNDS,
  TOTAL_MINUTES_OPTIONS,
  type BackgroundSoundId,
  type Mode,
  type PetId,
  type SoundId,
} from '../constants';
import { playBackground, playSound, stopBackground } from '../sounds/playSound';
import { useSettings, type Settings } from '../store/SettingsContext';
import { THEMES } from '../theme/themes';
import { useTheme } from '../theme/useTheme';

function Chip({
  active,
  label,
  onPress,
  styles,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]} onPress={onPress}>
        {label}
      </Text>
    </View>
  );
}

function Group({
  title,
  children,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.chipsRow}>{children}</View>
    </View>
  );
}

function ModeCard({
  mode,
  isActive,
  styles,
  onActivate,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  mode: Mode;
  isActive: boolean;
  styles: ReturnType<typeof makeStyles>;
  onActivate: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.modeCard, isActive && styles.modeCardActive]}>
      <View style={styles.modeCardHeader}>
        <Text style={styles.modeCardName}>{mode.name}</Text>
        {isActive && <Text style={styles.modeCardActiveLabel}>当前</Text>}
      </View>
      <View style={styles.modeCardMeta}>
        <Text style={styles.modeCardMetaText}>
          {mode.settings.totalMinutes}分钟 · {mode.settings.perSideSeconds}秒/边
        </Text>
      </View>
      <View style={styles.modeCardActions}>
        {!isActive && (
          <Pressable style={[styles.modeCardBtn, styles.modeCardBtnPrimary]} onPress={onActivate}>
            <Text style={styles.modeCardBtnText}>启用</Text>
          </Pressable>
        )}
        <Pressable style={styles.modeCardBtn} onPress={onEdit}>
          <Text style={styles.modeCardBtnText}>编辑</Text>
        </Pressable>
        <Pressable style={styles.modeCardBtn} onPress={onDuplicate}>
          <Text style={styles.modeCardBtnText}>复制</Text>
        </Pressable>
        <Pressable style={[styles.modeCardBtn, styles.modeCardBtnDanger]} onPress={onDelete}>
          <Text style={styles.modeCardBtnText}>删除</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, update, modes, activeModeId, createMode, updateMode, deleteMode, setActiveMode, duplicateMode } = useSettings();
  const theme = useTheme();
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showModeModal, setShowModeModal] = useState(false);
  const [editingMode, setEditingMode] = useState<Mode | null>(null);
  const [modeName, setModeName] = useState('');
  const [modeSettings, setModeSettings] = useState<Settings>(() => ({ ...settings, timeSpeed: settings.timeSpeed ?? 1 }));

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const previewBackground = (id: BackgroundSoundId) => {
    // 白噪/滴答听个音色 2.5 秒就够；轻音乐 2.5 秒判断不出是什么曲子，给 20 秒听主题
    const meta = BACKGROUND_SOUNDS.find((s) => s.id === id);
    const durationMs = meta?.group === '轻音乐' ? 20000 : 2500;
    playBackground(id);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(stopBackground, durationMs);
  };

  const generateModeName = (s: Settings): string => {
    const perSideLabel = s.perSideSeconds >= 60
      ? `${s.perSideSeconds / 60}`
      : `${s.perSideSeconds}`;
    return `【总${s.totalMinutes} 单${perSideLabel} 提${s.alertDurationSec}—】`;
  };

  const openCreateMode = () => {
    setEditingMode(null);
    setModeName('');
    setModeSettings(settings);
    setShowModeModal(true);
  };

  const saveCurrentAsMode = () => {
    const defaultName = generateModeName(settings);
    setEditingMode(null);
    setModeName(defaultName);
    setModeSettings(settings);
    setShowModeModal(true);
  };

  const openEditMode = (mode: Mode) => {
    setEditingMode(mode);
    setModeName(mode.name);
    setModeSettings({
      totalMinutes: mode.settings.totalMinutes,
      perSideSeconds: mode.settings.perSideSeconds,
      soundId: mode.settings.soundId,
      alertDurationSec: mode.settings.alertDurationSec,
      pet: mode.settings.pet,
      backgroundSound: mode.settings.backgroundSound,
      theme: mode.settings.theme,
      timeSpeed: mode.settings.timeSpeed,
    });
    setShowModeModal(true);
  };

  const saveMode = () => {
    if (!modeName.trim()) return;
    const fullSettings = {
      totalMinutes: modeSettings.totalMinutes,
      perSideSeconds: modeSettings.perSideSeconds,
      soundId: modeSettings.soundId,
      alertDurationSec: modeSettings.alertDurationSec,
      pet: modeSettings.pet,
      backgroundSound: modeSettings.backgroundSound,
      theme: modeSettings.theme,
      timeSpeed: modeSettings.timeSpeed,
    };
    if (editingMode) {
      updateMode(editingMode.id, {
        name: modeName.trim(),
        settings: fullSettings,
      });
    } else {
      createMode(modeName.trim(), fullSettings);
    }
    setShowModeModal(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.header}>设置</Text>
      <ScrollView contentContainerStyle={styles.content}>
        <Group title="主题风格" styles={styles}>
          {THEMES.map((t) => (
            <Chip
              key={t.id}
              styles={styles}
              active={settings.theme === t.id}
              label={`${t.emoji} ${t.label}`}
              onPress={() => update('theme', t.id)}
            />
          ))}
        </Group>

        <Group title="总时长（分钟）" styles={styles}>
          {TOTAL_MINUTES_OPTIONS.map((m) => (
            <Chip
              key={m}
              styles={styles}
              active={settings.totalMinutes === m}
              label={`${m} 分钟`}
              onPress={() => update('totalMinutes', m)}
            />
          ))}
        </Group>

        <Group title="单边时长" styles={styles}>
          {PER_SIDE_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              styles={styles}
              active={settings.perSideSeconds === o.value}
              label={o.label}
              onPress={() => update('perSideSeconds', o.value)}
            />
          ))}
        </Group>

        <Group title="陪伴动物" styles={styles}>
          {PETS.map((p) => (
            <Chip
              key={p.id}
              styles={styles}
              active={settings.pet === p.id}
              label={`${p.emoji} ${p.name}`}
              onPress={() => update('pet', p.id as PetId)}
            />
          ))}
        </Group>

        <Group title="提醒音效（点击可试听）" styles={styles}>
          {SOUNDS.map((s) => (
            <Chip
              key={s.id}
              styles={styles}
              active={settings.soundId === s.id}
              label={s.label}
              onPress={() => {
                update('soundId', s.id as SoundId);
                playSound(s.id);
              }}
            />
          ))}
        </Group>

        <Group title="倒计时声音（点击可试听，可关闭）" styles={styles}>
          <Chip
            styles={styles}
            active={settings.backgroundSound === 'off'}
            label="关闭"
            onPress={() => {
              update('backgroundSound', 'off');
              stopBackground();
            }}
          />
          {BACKGROUND_SOUNDS.filter((s) => s.group === '环境音').map((s) => (
            <Chip
              key={s.id}
              styles={styles}
              active={settings.backgroundSound === s.id}
              label={s.label}
              onPress={() => {
                update('backgroundSound', s.id as BackgroundSoundId);
                previewBackground(s.id);
              }}
            />
          ))}
        </Group>

        <Group title="倒计时轻音乐（点击可试听，可关闭）" styles={styles}>
          {/* 「关闭」是全局的：关掉背景音（含环境音与轻音乐），与本组其他选项互斥 */}
          <Chip
            styles={styles}
            active={settings.backgroundSound === 'off'}
            label="关闭"
            onPress={() => {
              update('backgroundSound', 'off');
              stopBackground();
            }}
          />
          {BACKGROUND_SOUNDS.filter((s) => s.group === '轻音乐').map((s) => (
            <Chip
              key={s.id}
              styles={styles}
              active={settings.backgroundSound === s.id}
              label={s.label}
              onPress={() => {
                update('backgroundSound', s.id as BackgroundSoundId);
                previewBackground(s.id);
              }}
            />
          ))}
        </Group>

        <Group title="提醒持续时长（秒）" styles={styles}>
          {ALERT_DURATION_OPTIONS.map((sec) => (
            <Chip
              key={sec}
              styles={styles}
              active={settings.alertDurationSec === sec}
              label={`${sec} 秒`}
              onPress={() => update('alertDurationSec', sec)}
            />
          ))}
        </Group>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>时间流速（{settings.timeSpeed}倍）</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={settings.timeSpeed}
              onValueChange={(v) => update('timeSpeed', v)}
            />
            <Text style={styles.sliderValue}>{settings.timeSpeed}倍</Text>
          </View>
          <Text style={styles.sliderHint}>
            1倍=正常速度，100倍=100秒实际时间走完100秒显示时间
          </Text>
        </View>

        <View style={styles.modeSection}>
          <View style={styles.modeSectionHeader}>
            <Text style={styles.groupTitle}>模式管理</Text>
            <View style={styles.modeSectionButtons}>
              <Pressable style={[styles.createBtn, styles.saveCurrentBtn]} onPress={saveCurrentAsMode}>
                <Text style={styles.createBtnText}>保存当前为模式</Text>
              </Pressable>
              <Pressable style={styles.createBtn} onPress={openCreateMode}>
                <Text style={styles.createBtnText}>+ 新建模式</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.modeList}>
            {modes.map((m) => (
              <ModeCard
                key={m.id}
                mode={m}
                isActive={activeModeId === m.id}
                styles={styles}
                onActivate={() => setActiveMode(m.id)}
                onEdit={() => openEditMode(m)}
                onDuplicate={() => duplicateMode(m.id)}
                onDelete={() => deleteMode(m.id)}
              />
            ))}
            {modes.length === 0 && (
              <Text style={styles.modeEmpty}>暂无模式，点击"新建模式"创建</Text>
            )}
          </View>
        </View>

        <Text style={styles.tip}>
          提示：上面三组（提醒音效 / 倒计时声音 / 倒计时轻音乐）都是点击即试听 —— 声音类约响 2.5 秒，轻音乐约 20 秒。
          结束音固定为钟声，与换边音区分。倒计时声音或轻音乐选中后，会在开始计时时循环播放，每次换边提醒自动暂停、提醒完继续；
          选「关闭」则计时中不播任何背景音。
        </Text>

        {/* 背景轻音乐 CC BY 4.0 强制署名，勿删（文案见 constants.ts 的 MUSIC_ATTRIBUTION） */}
        <Text style={styles.attribution}>
          {MUSIC_ATTRIBUTION.label}：{MUSIC_ATTRIBUTION.text}
        </Text>
      </ScrollView>

      <Modal
        visible={showModeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingMode ? '编辑模式' : '新建模式'}</Text>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setShowModeModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>取消</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>模式名称</Text>
              <TextInput
                style={styles.modalInput}
                value={modeName}
                onChangeText={setModeName}
                placeholder="输入模式名称"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>总时长（分钟）</Text>
              <View style={styles.modalChips}>
                {TOTAL_MINUTES_OPTIONS.map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.modalChip, modeSettings.totalMinutes === m && styles.modalChipActive]}
                    onPress={() => setModeSettings((prev) => ({ ...prev, totalMinutes: m }))}
                  >
                    <Text style={[styles.modalChipText, modeSettings.totalMinutes === m && styles.modalChipTextActive]}>
                      {m} 分钟
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>单边时长</Text>
              <View style={styles.modalChips}>
                {PER_SIDE_OPTIONS.map((o) => (
                  <Pressable
                    key={o.value}
                    style={[styles.modalChip, modeSettings.perSideSeconds === o.value && styles.modalChipActive]}
                    onPress={() => setModeSettings((prev) => ({ ...prev, perSideSeconds: o.value }))}
                  >
                    <Text style={[styles.modalChipText, modeSettings.perSideSeconds === o.value && styles.modalChipTextActive]}>
                      {o.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>提醒音效</Text>
              <View style={styles.modalChips}>
                {SOUNDS.map((s) => (
                  <Pressable
                    key={s.id}
                    style={[styles.modalChip, modeSettings.soundId === s.id && styles.modalChipActive]}
                    onPress={() => {
                      setModeSettings((prev) => ({ ...prev, soundId: s.id as SoundId }));
                      playSound(s.id);
                    }}
                  >
                    <Text style={[styles.modalChipText, modeSettings.soundId === s.id && styles.modalChipTextActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>陪伴动物</Text>
              <View style={styles.modalChips}>
                {PETS.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[styles.modalChip, modeSettings.pet === p.id && styles.modalChipActive]}
                    onPress={() => setModeSettings((prev) => ({ ...prev, pet: p.id as PetId }))}
                  >
                    <Text style={[styles.modalChipText, modeSettings.pet === p.id && styles.modalChipTextActive]}>
                      {p.emoji} {p.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>倒计时声音（点击可试听，可关闭）</Text>
              <View style={styles.modalChips}>
                <Pressable
                  style={[styles.modalChip, modeSettings.backgroundSound === 'off' && styles.modalChipActive]}
                  onPress={() => setModeSettings((prev) => ({ ...prev, backgroundSound: 'off' }))}
                >
                  <Text style={[styles.modalChipText, modeSettings.backgroundSound === 'off' && styles.modalChipTextActive]}>
                    关闭
                  </Text>
                </Pressable>
                {BACKGROUND_SOUNDS.filter((s) => s.group === '环境音').map((s) => (
                  <Pressable
                    key={s.id}
                    style={[styles.modalChip, modeSettings.backgroundSound === s.id && styles.modalChipActive]}
                    onPress={() => {
                      setModeSettings((prev) => ({ ...prev, backgroundSound: s.id as BackgroundSoundId }));
                      previewBackground(s.id);
                    }}
                  >
                    <Text style={[styles.modalChipText, modeSettings.backgroundSound === s.id && styles.modalChipTextActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>倒计时轻音乐（点击可试听，可关闭）</Text>
              <View style={styles.modalChips}>
                <Pressable
                  style={[styles.modalChip, modeSettings.backgroundSound === 'off' && styles.modalChipActive]}
                  onPress={() => setModeSettings((prev) => ({ ...prev, backgroundSound: 'off' }))}
                >
                  <Text style={[styles.modalChipText, modeSettings.backgroundSound === 'off' && styles.modalChipTextActive]}>
                    关闭
                  </Text>
                </Pressable>
                {BACKGROUND_SOUNDS.filter((s) => s.group === '轻音乐').map((s) => (
                  <Pressable
                    key={s.id}
                    style={[styles.modalChip, modeSettings.backgroundSound === s.id && styles.modalChipActive]}
                    onPress={() => {
                      setModeSettings((prev) => ({ ...prev, backgroundSound: s.id as BackgroundSoundId }));
                      previewBackground(s.id);
                    }}
                  >
                    <Text style={[styles.modalChipText, modeSettings.backgroundSound === s.id && styles.modalChipTextActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>提醒持续时长（秒）</Text>
              <View style={styles.modalChips}>
                {ALERT_DURATION_OPTIONS.map((sec) => (
                  <Pressable
                    key={sec}
                    style={[styles.modalChip, modeSettings.alertDurationSec === sec && styles.modalChipActive]}
                    onPress={() => setModeSettings((prev) => ({ ...prev, alertDurationSec: sec }))}
                  >
                    <Text style={[styles.modalChipText, modeSettings.alertDurationSec === sec && styles.modalChipTextActive]}>
                      {sec} 秒
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>主题风格</Text>
              <View style={styles.modalChips}>
                {THEMES.map((t) => (
                  <Pressable
                    key={t.id}
                    style={[styles.modalChip, modeSettings.theme === t.id && styles.modalChipActive]}
                    onPress={() => setModeSettings((prev) => ({ ...prev, theme: t.id }))}
                  >
                    <Text style={[styles.modalChipText, modeSettings.theme === t.id && styles.modalChipTextActive]}>
                      {t.emoji} {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>时间流速（{modeSettings.timeSpeed}倍）</Text>
              <View style={styles.modalSliderContainer}>
                <Slider
                  style={styles.modalSlider}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  value={modeSettings.timeSpeed}
                  onValueChange={(v) => setModeSettings((prev) => ({ ...prev, timeSpeed: v }))}
                />
                <Text style={styles.modalSliderValue}>{modeSettings.timeSpeed}倍</Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.modalSaveBtn, styles.modalSaveBtnPrimary]}
              onPress={saveMode}
            >
              <Text style={styles.modalSaveBtnText}>{editingMode ? '保存修改' : '创建模式'}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (t: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.colors.background },
    header: { fontSize: 22, fontWeight: t.headerWeight, color: t.colors.text, paddingHorizontal: 20, paddingTop: 12 },
    content: { padding: 20, paddingBottom: 40 },
    group: { marginBottom: 20 },
    groupTitle: { fontSize: 15, fontWeight: '700', color: t.colors.textSecondary, marginBottom: 10 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: t.radius,
      backgroundColor: t.colors.ghostBg,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    chipActive: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
    chipText: { fontSize: 15, color: t.colors.onGhost, fontWeight: '600' },
    chipTextActive: { color: t.colors.onAccent },
    tip: { marginTop: 8, fontSize: 12, color: t.colors.textMuted, lineHeight: 18 },
    attribution: { marginTop: 20, marginBottom: 12, fontSize: 10, color: t.colors.textMuted, lineHeight: 15 },
    sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    slider: { flex: 1, height: 30 },
    sliderValue: { fontSize: 16, fontWeight: '700', color: t.colors.accent, minWidth: 50, textAlign: 'right' },
    sliderHint: { marginTop: 6, fontSize: 11, color: t.colors.textMuted },
    modalSliderContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    modalSlider: { flex: 1, height: 30 },
    modalSliderValue: { fontSize: 16, fontWeight: '700', color: t.colors.accent, minWidth: 50, textAlign: 'right' },
    modeSection: { marginBottom: 20 },
    modeSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 },
    modeSectionButtons: { flexDirection: 'row', gap: 8 },
    createBtn: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: t.radius,
      backgroundColor: t.colors.accent,
    },
    saveCurrentBtn: { backgroundColor: t.colors.textSecondary },
    createBtnText: { color: t.colors.onAccent, fontSize: 13, fontWeight: '700' },
    modeList: { gap: 10 },
    modeCard: {
      padding: 14,
      borderRadius: t.radius,
      backgroundColor: t.colors.surface,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    modeCardActive: { borderColor: t.colors.accent, backgroundColor: t.colors.background },
    modeCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    modeCardName: { fontSize: 16, fontWeight: '700', color: t.colors.text },
    modeCardActiveLabel: { fontSize: 12, color: t.colors.accent, fontWeight: '600' },
    modeCardMeta: { marginBottom: 10 },
    modeCardMetaText: { fontSize: 13, color: t.colors.textMuted },
    modeCardActions: { flexDirection: 'row', gap: 8 },
    modeCardBtn: {
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: t.colors.ghostBg,
    },
    modeCardBtnPrimary: { backgroundColor: t.colors.accent },
    modeCardBtnDanger: { backgroundColor: t.colors.dangerBg },
    modeCardBtnText: { fontSize: 12, color: t.colors.onGhost, fontWeight: '600' },
    modeEmpty: { textAlign: 'center', color: t.colors.textMuted, fontSize: 14, paddingVertical: 20 },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    modalTitle: { fontSize: 20, fontWeight: t.headerWeight, color: t.colors.text },
    modalCloseBtn: { padding: 8 },
    modalCloseBtnText: { color: t.colors.textSecondary, fontSize: 15, fontWeight: '600' },
    modalContent: { padding: 20, paddingBottom: 100 },
    modalField: { marginBottom: 20 },
    modalLabel: { fontSize: 14, fontWeight: '700', color: t.colors.textSecondary, marginBottom: 8 },
    modalInput: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: t.radius,
      backgroundColor: t.colors.surface,
      color: t.colors.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    modalChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: t.radius,
      backgroundColor: t.colors.ghostBg,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    modalChipActive: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
    modalChipText: { fontSize: 13, color: t.colors.onGhost, fontWeight: '600' },
    modalChipTextActive: { color: t.colors.onAccent },
    modalFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      backgroundColor: t.colors.background,
    },
    modalSaveBtn: {
      paddingVertical: 14,
      borderRadius: t.radius,
      alignItems: 'center',
    },
    modalSaveBtnPrimary: { backgroundColor: t.colors.accent },
    modalSaveBtnText: { color: t.colors.onAccent, fontSize: 16, fontWeight: '700' },
  });
