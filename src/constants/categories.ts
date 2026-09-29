export const expenseCategories = [
  'groceries', 'foodDining', 'snacksDrinks', 'medicalHealthcare', 'houseRent',
  'electricity', 'gas', 'internet', 'phoneMobile', 'transportation', 'bike', 'car',
  'education', 'donationCharity', 'familyPersonal', 'subscriptions', 'electronicsService',
  'furnitureHousehold', 'serviceCharge', 'festival', 'travelTour', 'taxProfessional', 'other',
] as const;
export const incomeCategories = ['salary', 'freelance', 'business', 'bonus', 'gift', 'investment', 'otherIncome'] as const;
export const categoriesFor = (type: 'income' | 'expense'): readonly string[] =>
  type === 'income' ? incomeCategories : expenseCategories;

const legacyExpenseCategories = new Map<string, string>([
  ['food', 'foodDining'], ['snacks', 'snacksDrinks'], ['medicine', 'medicalHealthcare'],
  ['rent', 'houseRent'], ['transport', 'transportation'], ['donation', 'donationCharity'],
  ['family', 'familyPersonal'], ['otherExpense', 'other'],
  // Old combined/broad categories cannot be assigned to a specific new expense.
  ['utilities', 'other'], ['utility', 'other'], ['shopping', 'other'], ['entertainment', 'other'],
]);

export function normalizeExpenseCategory(id: string): string {
  return categoriesFor('expense').includes(id) ? id : legacyExpenseCategories.get(id) ?? 'other';
}

export function categoryTranslationKey(id: string, type: 'income' | 'expense'): string {
  const key = type === 'expense' ? normalizeExpenseCategory(id) : categoriesFor('income').includes(id) ? id : 'otherIncome';
  return `categories.${key}`;
}

export function searchCategories(ids: readonly string[], query: string, labelFor: (id: string) => string): string[] {
  const search = query.trim().normalize('NFC').toLocaleLowerCase();
  return ids.filter(id => labelFor(id).normalize('NFC').toLocaleLowerCase().includes(search));
}
