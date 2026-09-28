import { beforeEach, describe, expect, it, vi } from 'vitest';
import { transactionRepository, settingsRepository } from '@/storage/repositories';
import { defaultSettings } from '@/storage/models';
const memory = vi.hoisted(() => new Map<string, string>());
const setItem = vi.hoisted(() => vi.fn(async (key: string, value: string) => { memory.set(key, value); }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: {
  getItem: async (key: string) => memory.get(key) ?? null,
  setItem,
} }));

beforeEach(() => { memory.clear(); setItem.mockClear(); });
describe('device repositories', () => {
  it('round-trips transactions and settings through persistence', async () => {
    const ledger = await transactionRepository.read();
    ledger.transactions.push({ id: '1ba4c119-41bd-4a1d-a8df-f063cf1e9c14', date: `${ledger.activeMonth}-01`, type: 'income', categoryId: 'salary', amount: 12.5, createdAt: new Date().toISOString() });
    await transactionRepository.write(ledger);
    expect(await transactionRepository.read()).toEqual(ledger);
    const settings = { ...defaultSettings, email: 'person@example.com', language: 'bn' as const, onboardingCompleted: true };
    await settingsRepository.write(settings);
    expect(await settingsRepository.read()).toEqual(settings);
  });
  it('preserves corrupt JSON for recovery', async () => {
    memory.set('dailyledger:ledger:v1', '{broken');
    await expect(transactionRepository.read()).rejects.toThrow();
    expect(memory.get('dailyledger:ledger:v1')).toBe('{broken');
    expect(setItem).not.toHaveBeenCalled();
  });
  it('rejects invalid settings and preserves stored content', async () => {
    memory.set('dailyledger:settings:v1', JSON.stringify({ ...defaultSettings, email: 'bad' }));
    await expect(settingsRepository.read()).rejects.toThrow();
    expect(setItem).not.toHaveBeenCalled();
  });
  it('surfaces write failures without replacing previous data', async () => {
    const ledger = await transactionRepository.read();
    await transactionRepository.write(ledger);
    setItem.mockRejectedValueOnce(new Error('disk full'));
    await expect(transactionRepository.write({ ...ledger, revision: 1 })).rejects.toThrow('disk full');
    expect(await transactionRepository.read()).toEqual(ledger);
  });
});
