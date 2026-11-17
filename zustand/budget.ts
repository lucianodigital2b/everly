import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type BudgetCategory = {
  id: string;
  name: string;
  share: number;
  color: string;
};

export type Expense = {
  id: string;
  categoryId: string;
  label: string;
  estimated: number;
  paid: number;
  createdAt: number;
  dueDate: string | null; // YYYY-MM-DD
  taskId: string | null;
};

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: 'venue', name: 'Venue', share: 0.3, color: '#C77E8D' },
  { id: 'catering', name: 'Food & drinks', share: 0.25, color: '#E6A9B4' },
  { id: 'photo', name: 'Photo & video', share: 0.12, color: '#8FA9C7' },
  { id: 'attire', name: 'Attire & beauty', share: 0.08, color: '#B7A3D6' },
  { id: 'flowers', name: 'Flowers & decor', share: 0.08, color: '#9DC3A8' },
  { id: 'music', name: 'Music', share: 0.05, color: '#E8C48F' },
  { id: 'rings', name: 'Rings', share: 0.04, color: '#D4A5A5' },
  { id: 'paper', name: 'Invitations', share: 0.02, color: '#A8B5C0' },
  { id: 'other', name: 'Other', share: 0.06, color: '#C9B79C' },
];

export const BUDGET_ITEM_SUGGESTIONS: Record<string, string[]> = {
  venue: ['Venue rental', 'Ceremony site fee', 'Chairs & tables', 'Venue deposit'],
  catering: ['Catering per guest', 'Bar & drinks', 'Wedding cake', 'Service staff'],
  photo: ['Photographer', 'Videographer', 'Engagement shoot', 'Album'],
  attire: [
    'Wedding dress',
    'Suit or tux',
    'Alterations',
    'Hair & makeup',
    'Shoes & accessories',
  ],
  flowers: ['Bouquets', 'Centerpieces', 'Ceremony arch', 'Boutonnieres'],
  music: ['DJ', 'Band', 'Ceremony musicians', 'Sound & lighting'],
  rings: ['Engagement ring', 'Wedding bands', 'Engraving'],
  paper: ['Save the dates', 'Invitations', 'Postage', 'Signage'],
  other: ['Officiant', 'Marriage license', 'Favors', 'Transportation', 'Honeymoon'],
};

type BudgetState = {
  total: number | null;
  categories: BudgetCategory[];
  expenses: Expense[];
  setTotal: (n: number) => void;
  addExpense: (p: {
    categoryId: string;
    label: string;
    estimated: number;
    paid: number;
    dueDate?: string | null;
    taskId?: string | null;
  }) => string;
  updateExpense: (
    id: string,
    patch: Partial<Omit<Expense, 'id' | 'createdAt'>>,
  ) => void;
  removeExpense: (id: string) => void;
  markPaid: (id: string) => void;
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      total: null,
      categories: DEFAULT_CATEGORIES,
      expenses: [],

      setTotal: (n) => set({ total: n }),

      addExpense: (p) => {
        const id = generateId();
        const expense: Expense = {
          id,
          categoryId: p.categoryId,
          label: p.label,
          estimated: p.estimated,
          paid: p.paid,
          createdAt: Date.now(),
          dueDate: p.dueDate ?? null,
          taskId: p.taskId ?? null,
        };
        set((state) => ({ expenses: [...state.expenses, expense] }));
        return id;
      },

      updateExpense: (id, patch) =>
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? { ...expense, ...patch } : expense,
          ),
        })),

      removeExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        })),

      markPaid: (id) =>
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? { ...expense, paid: expense.estimated } : expense,
          ),
        })),
    }),
    {
      name: 'budget-store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState, _version) => {
        const state = (persistedState ?? {}) as Partial<BudgetState>;
        return {
          total: state.total ?? null,
          categories: state.categories ?? DEFAULT_CATEGORIES,
          expenses: (state.expenses ?? []).map((expense: any) => ({
            ...expense,
            dueDate: expense.dueDate ?? null,
            taskId: expense.taskId ?? null,
          })),
        } as BudgetState;
      },
    },
  ),
);

export function budgetSummary(
  state: Pick<BudgetState, 'total' | 'categories' | 'expenses'>,
) {
  const estimated = state.expenses.reduce((sum, expense) => sum + expense.estimated, 0);
  const paid = state.expenses.reduce((sum, expense) => sum + expense.paid, 0);
  const pending = state.expenses.reduce(
    (sum, expense) => sum + Math.max(0, expense.estimated - expense.paid),
    0,
  );
  const total = state.total;
  const remaining = (total ?? 0) - estimated;

  const byCategory = state.categories.map((category) => {
    const categoryExpenses = state.expenses.filter(
      (expense) => expense.categoryId === category.id,
    );
    const categoryEstimated = categoryExpenses.reduce(
      (sum, expense) => sum + expense.estimated,
      0,
    );
    const categoryPaid = categoryExpenses.reduce(
      (sum, expense) => sum + expense.paid,
      0,
    );

    return {
      category,
      allocated: (total ?? 0) * category.share,
      estimated: categoryEstimated,
      paid: categoryPaid,
      count: categoryExpenses.length,
    };
  });

  return {
    total,
    estimated,
    paid,
    pending,
    remaining,
    byCategory,
  };
}

export function formatUsd(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  const sign = safe < 0 ? '-' : '';
  const rounded = Math.round(Math.abs(safe));
  const withThousands = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}$${withThousands}`;
}

export function compactUsd(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }

  return formatUsd(safe);
}
