import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { currentMonth } from '@/utils/date';
import { defaultSettings, ledgerSchema, settingsSchema, type Ledger, type Settings } from './models';

export interface TransactionRepository {
  read(): Promise<Ledger>;
  write(state: Ledger): Promise<void>;
}
export interface SettingsRepository {
  read(): Promise<Settings>;
  write(settings: Settings): Promise<void>;
}

async function readValidated<T>(key: string, schema: z.ZodType<T>, fallback: () => T): Promise<T> {
  // Corrupt data is never overwritten with an empty ledger.
  const raw = await AsyncStorage.getItem(key);
  return raw === null ? fallback() : schema.parse(JSON.parse(raw));
}
export const transactionRepository: TransactionRepository = {
  read: () => readValidated('dailyledger:ledger:v1', ledgerSchema, () => ({
    version: 1, activeMonth: currentMonth(), revision: 0, transactions: [], reports: [],
  })),
  write: async state => AsyncStorage.setItem('dailyledger:ledger:v1', JSON.stringify(ledgerSchema.parse(state))),
};
export const settingsRepository: SettingsRepository = {
  read: () => readValidated('dailyledger:settings:v1', settingsSchema, () => defaultSettings),
  write: async settings => AsyncStorage.setItem('dailyledger:settings:v1', JSON.stringify(settingsSchema.parse(settings))),
};
