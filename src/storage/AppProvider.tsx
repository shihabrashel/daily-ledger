import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { transactionRepository, settingsRepository } from './repositories';
import { defaultSettings, type Ledger, type SavedReport, type Settings } from './models';
import { currentMonth } from '@/utils/date';
import { transactionSchema, type TransactionForm } from '@/features/transactions/validation/transaction';
import { closeLedger } from '@/features/reports/closing';
import i18n from '@/localization';
import { reportService } from '@/features/reports/nativeReports';
import { controlledError } from '@/utils/errors';
import { DEFAULT_CURRENCY } from '@/constants/currencies';

interface AppContextValue {
  ledger: Ledger | null; settings: Settings; loading: boolean; error: string | null; todayMonth: string;
  reload(): Promise<void>; saveSettings(settings: Settings): Promise<void>;
  saveTransaction(form: TransactionForm, id?: string): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  retainReport(report: SavedReport): Promise<void>;
  closeMonth(report: SavedReport): Promise<void>;
}
const Context = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: React.PropsWithChildren) {
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayMonth, setTodayMonth] = useState(currentMonth());
  const state = useRef<Ledger | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const hydrate = useCallback(async () => {
    try {
      const storedSettings = await settingsRepository.read();
      setSettings(storedSettings);
      await i18n.changeLanguage(storedSettings.language);
      const storedLedger = await transactionRepository.read();
      state.current = storedLedger; setLedger(storedLedger); setError(null);
    } catch (error) { setError(controlledError(error, 'errors.storage').key); }
    finally { setLoading(false); }
  }, []);
  // Hydration synchronizes with asynchronous device storage on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void hydrate(); }, [hydrate]);
  const reload = async () => { setLoading(true); await hydrate(); };
  useEffect(() => {
    const update = () => setTodayMonth(currentMonth());
    const subscription = AppState.addEventListener('change', update);
    const interval = setInterval(update, 30000);
    return () => { subscription.remove(); clearInterval(interval); };
  }, []);

  const mutate = (change: (value: Ledger) => Ledger | Promise<Ledger>) => {
    const operation = queue.current.then(async () => {
      if (!state.current) throw new Error('errors.storage');
      const next = await change(state.current);
      await transactionRepository.write(next);
      state.current = next; setLedger(next);
    }).catch(error => { throw controlledError(error, 'errors.storage'); });
    queue.current = operation.catch(() => undefined);
    return operation;
  };
  const value: AppContextValue = {
    ledger, settings, loading, error, todayMonth, reload,
    saveSettings: next => {
      // Serialize preference changes with closing so a report's currency cannot change mid-close.
      const operation = queue.current.then(async () => {
        await settingsRepository.write(next); setSettings(next); await i18n.changeLanguage(next.language);
      }).catch(error => { throw controlledError(error, 'errors.storage'); });
      queue.current = operation.catch(() => undefined);
      return operation;
    },
    saveTransaction: (form, id) => mutate(previous => {
      if ((!id && previous.activeMonth !== currentMonth()) || previous.activeMonth > currentMonth()) throw new Error('errors.monthBlocked');
      const parsed = transactionSchema(previous.activeMonth).parse(form);
      const existing = previous.transactions.find(item => item.id === id);
      if (id && !existing) throw new Error('errors.missing');
      const now = new Date().toISOString();
      const item = { ...parsed, necessity: parsed.type === 'expense' ? parsed.necessity : undefined,
        amount: Number(parsed.amount), id: id ?? randomUUID(), createdAt: existing?.createdAt ?? now, updatedAt: existing ? now : undefined };
      return { ...previous, revision: previous.revision + 1, transactions: [...previous.transactions.filter(tx => tx.id !== item.id), item] };
    }),
    deleteTransaction: id => mutate(previous => ({ ...previous, revision: previous.revision + 1, transactions: previous.transactions.filter(item => item.id !== id) })),
    retainReport: report => mutate(previous => {
      if (report.month !== previous.activeMonth || report.revision !== previous.revision) throw new Error('errors.staleReport');
      return { ...previous, reports: [...previous.reports, report] };
    }),
    closeMonth: report => mutate(async previous => {
      const currentSettings = await settingsRepository.read();
      if ((report.currency ?? DEFAULT_CURRENCY) !== currentSettings.currency) throw new Error('errors.staleReport');
      await reportService.verify(report);
      return closeLedger(previous, report);
    }),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('AppProvider missing');
  return value;
}
