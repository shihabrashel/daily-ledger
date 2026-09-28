export const expenseCategories = [
  'groceries', 'rent', 'food', 'medicine', 'transport', 'utilities', 'education',
  'donation', 'family', 'shopping', 'entertainment', 'snacks', 'otherExpense',
] as const;
export const incomeCategories = ['salary', 'freelance', 'business', 'bonus', 'gift', 'investment', 'otherIncome'] as const;
export const categoriesFor = (type: 'income' | 'expense'): readonly string[] =>
  type === 'income' ? incomeCategories : expenseCategories;
