export type TransactionType = 'income' | 'expense';
export type NecessityType = 'essential' | 'optional';
export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  description?: string;
  necessity?: NecessityType;
  createdAt: string;
  updatedAt?: string;
}
