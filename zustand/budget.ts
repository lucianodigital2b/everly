import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { LANGUAGE, t } from '../i18n';

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
  { id: 'venue', name: t('budgetData.categories.venue'), share: 0.3, color: '#C77E8D' },
  { id: 'catering', name: t('budgetData.categories.catering'), share: 0.25, color: '#E6A9B4' },
  { id: 'photo', name: t('budgetData.categories.photo'), share: 0.12, color: '#8FA9C7' },
  { id: 'attire', name: t('budgetData.categories.attire'), share: 0.08, color: '#B7A3D6' },
  { id: 'flowers', name: t('budgetData.categories.flowers'), share: 0.08, color: '#9DC3A8' },
  { id: 'music', name: t('budgetData.categories.music'), share: 0.05, color: '#E8C48F' },
  { id: 'rings', name: t('budgetData.categories.rings'), share: 0.04, color: '#D4A5A5' },
  { id: 'paper', name: t('budgetData.categories.paper'), share: 0.02, color: '#A8B5C0' },
  { id: 'other', name: t('budgetData.categories.other'), share: 0.06, color: '#C9B79C' },
];

export const BUDGET_ITEM_SUGGESTIONS: Record<string, string[]> = {
  venue: [
    t('budgetData.suggestions.venue.rental'),
    t('budgetData.suggestions.venue.ceremonyFee'),
    t('budgetData.suggestions.venue.chairsTables'),
    t('budgetData.suggestions.venue.deposit'),
  ],
  catering: [
    t('budgetData.suggestions.catering.perGuest'),
    t('budgetData.suggestions.catering.barDrinks'),
    t('budgetData.suggestions.catering.weddingCake'),
    t('budgetData.suggestions.catering.serviceStaff'),
  ],
  photo: [
    t('budgetData.suggestions.photo.photographer'),
    t('budgetData.suggestions.photo.videographer'),
    t('budgetData.suggestions.photo.engagementShoot'),
    t('budgetData.suggestions.photo.album'),
  ],
  attire: [
    t('budgetData.suggestions.attire.dress'),
    t('budgetData.suggestions.attire.suitOrTux'),
    t('budgetData.suggestions.attire.alterations'),
    t('budgetData.suggestions.attire.hairMakeup'),
    t('budgetData.suggestions.attire.shoesAccessories'),
  ],
  flowers: [
    t('budgetData.suggestions.flowers.bouquets'),
    t('budgetData.suggestions.flowers.centerpieces'),
    t('budgetData.suggestions.flowers.ceremonyArch'),
    t('budgetData.suggestions.flowers.boutonnieres'),
  ],
  music: [
    t('budgetData.suggestions.music.dj'),
    t('budgetData.suggestions.music.band'),
    t('budgetData.suggestions.music.ceremonyMusicians'),
    t('budgetData.suggestions.music.soundLighting'),
  ],
  rings: [
    t('budgetData.suggestions.rings.engagementRing'),
    t('budgetData.suggestions.rings.weddingBands'),
    t('budgetData.suggestions.rings.engraving'),
  ],
  paper: [
    t('budgetData.suggestions.paper.saveTheDates'),
    t('budgetData.suggestions.paper.invitations'),
    t('budgetData.suggestions.paper.postage'),
    t('budgetData.suggestions.paper.signage'),
  ],
  other: [
    t('budgetData.suggestions.other.officiant'),
    t('budgetData.suggestions.other.marriageLicense'),
    t('budgetData.suggestions.other.favors'),
    t('budgetData.suggestions.other.transportation'),
    t('budgetData.suggestions.other.honeymoon'),
  ],
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

// Money follows the app language: Portuguese shows reais (R$ 1.234, R$ 50 mil),
// everything else dollars ($1,234, $50k). The amounts are whatever the couple
// typed; there is no conversion.
const PT = LANGUAGE === 'pt';
export const CURRENCY_SYMBOL = PT ? 'R$' : '$';
const THOUSANDS = PT ? '.' : ',';

export function formatUsd(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  const sign = safe < 0 ? '-' : '';
  const rounded = Math.round(Math.abs(safe));
  const withThousands = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS);
  return PT ? `${sign}R$ ${withThousands}` : `${sign}$${withThousands}`;
}

export function compactUsd(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? '-' : '';
  const short = (v: number) => {
    const text = v.toFixed(1).replace(/\.0$/, '');
    return PT ? text.replace('.', ',') : text;
  };

  if (abs >= 1_000_000) {
    return PT ? `${sign}R$ ${short(abs / 1_000_000)} mi` : `${sign}$${short(abs / 1_000_000)}M`;
  }

  if (abs >= 1_000) {
    return PT ? `${sign}R$ ${short(abs / 1_000)} mil` : `${sign}$${short(abs / 1_000)}k`;
  }

  return formatUsd(safe);
}
