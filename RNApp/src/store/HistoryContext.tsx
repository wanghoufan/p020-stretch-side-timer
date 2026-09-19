import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface HistoryRecord {
  id: string;
  date: string; // ISO
  totalMinutes: number;
  perSideSeconds: number;
  completedSides: number;
}

const KEY = '@stretch/history';

interface HistoryContextValue {
  records: HistoryRecord[];
  addRecord: (r: Omit<HistoryRecord, 'id' | 'date'>) => void;
  deleteRecord: (id: string) => void;
  clearAll: () => void;
}

const HistoryContext = createContext<HistoryContextValue | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setRecords(JSON.parse(raw) as HistoryRecord[]);
      })
      .catch(() => undefined);
  }, []);

  const persist = (next: HistoryRecord[]) => {
    setRecords(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const addRecord = (r: Omit<HistoryRecord, 'id' | 'date'>) => {
    const record: HistoryRecord = {
      ...r,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
    };
    persist([record, ...records]);
  };

  const deleteRecord = (id: string) => persist(records.filter((r) => r.id !== id));

  const clearAll = () => persist([]);

  const value = useMemo(
    () => ({ records, addRecord, deleteRecord, clearAll }),
    [records]
  );
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider');
  return ctx;
}
