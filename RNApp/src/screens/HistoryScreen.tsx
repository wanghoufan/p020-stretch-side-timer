import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHistory } from '../store/HistoryContext';
import { useTheme } from '../theme/useTheme';

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const fmtSide = (sec: number): string => (sec >= 60 ? `${sec / 60} 分钟` : `${sec} 秒`);

export default function HistoryScreen() {
  const { records, deleteRecord, clearAll } = useHistory();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>拉伸记录</Text>
        {records.length > 0 && (
          <Pressable onPress={clearAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>清空</Text>
          </Pressable>
        )}
      </View>

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>还没有记录，去完成一次拉伸吧</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowDate}>{fmtDate(item.date)}</Text>
                <Text style={styles.rowDesc}>
                  总时长 {item.totalMinutes} 分钟 · 完成 {item.completedSides} 边 · 每边 {fmtSide(item.perSideSeconds)}
                </Text>
              </View>
              <Pressable
                onPress={() => deleteRecord(item.id)}
                hitSlop={10}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>删除</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (t: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.colors.background },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
    },
    header: { fontSize: 22, fontWeight: t.headerWeight, color: t.colors.text },
    clearBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: t.radius, backgroundColor: t.colors.ghostBg },
    clearText: { color: t.colors.onGhost, fontSize: 14, fontWeight: '700' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyEmoji: { fontSize: 56 },
    emptyText: { marginTop: 12, fontSize: 15, color: t.colors.textMuted },
    list: { padding: 20 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.colors.surface,
      borderRadius: t.radius,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    rowMain: { flex: 1 },
    rowDate: { fontSize: 16, fontWeight: '700', color: t.colors.text },
    rowDesc: { marginTop: 4, fontSize: 13, color: t.colors.textSecondary },
    deleteBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: t.radius, backgroundColor: t.colors.dangerBg },
    deleteText: { color: t.colors.danger, fontSize: 13, fontWeight: '700' },
  });