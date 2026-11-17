import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PhaseId } from '../data/weddingPlan';
import type { VibeField } from '../data/weddingVibe';

export type Vibe = Record<VibeField, string | null>;
const EMPTY_VIBE: Vibe = { color: null, season: null, style: null, honeymoon: null };

export type Mark = {
  state: 'done' | 'skipped';
  at: number;
};

export type CustomTask = {
  id: string;
  title: string;
  phase: PhaseId;
  createdAt: number;
};

type PlannerState = {
  partnerA: string;
  partnerB: string;
  weddingDate: string | null;
  coverUri: string | null;
  marks: Record<string, Mark>;
  customTasks: CustomTask[];
  notes: Record<string, string>;
  guestEstimate: number | null;
  setupSkipped: boolean;
  vibe: Vibe;
};

type PlannerActions = {
  setCouple: (a: string, b: string) => void;
  setDate: (iso: string) => void;
  setCover: (uri: string | null) => void;
  toggleDone: (id: string) => void;
  skip: (id: string) => void;
  undo: (id: string) => void;
  markDoneMany: (ids: string[]) => void;
  addCustomTask: (title: string, phase: PhaseId) => string;
  updateCustomTask: (id: string, patch: { title?: string; phase?: PhaseId }) => void;
  removeCustomTask: (id: string) => void;
  setNote: (id: string, text: string) => void;
  setGuestEstimate: (n: number | null) => void;
  skipSetup: () => void;
  setVibe: (patch: Partial<Vibe>) => void;
  reset: () => void;
};

export type PlannerStore = PlannerState & PlannerActions;

const initialState: PlannerState = {
  partnerA: '',
  partnerB: '',
  weddingDate: null,
  coverUri: null,
  marks: {},
  customTasks: [],
  notes: {},
  guestEstimate: null,
  setupSkipped: false,
  vibe: EMPTY_VIBE,
};

export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set) => ({
      ...initialState,

      setCouple: (a, b) => set({ partnerA: a.trim(), partnerB: b.trim() }),
      setDate: (iso) => set({ weddingDate: iso }),
      setCover: (uri) => set({ coverUri: uri }),

      toggleDone: (id) =>
        set((current) => {
          const existing = current.marks[id];
          const pendingToDone: Mark = { state: 'done', at: Date.now() };
          const doneToPending = { ...current.marks };
          delete doneToPending[id];

          if (!existing) {
            return { marks: { ...current.marks, [id]: pendingToDone } };
          }
          if (existing.state === 'done') {
            return { marks: doneToPending };
          }
          return { marks: { ...current.marks, [id]: pendingToDone } };
        }),

      skip: (id) =>
        set((current) => ({
          marks: {
            ...current.marks,
            [id]: { state: 'skipped', at: Date.now() },
          },
        })),

      undo: (id) =>
        set((current) => {
          const marks = { ...current.marks };
          delete marks[id];
          return { marks };
        }),

      markDoneMany: (ids) =>
        set((current) => {
          const now = Date.now();
          const newMarks = { ...current.marks };
          ids.forEach((id) => {
            newMarks[id] = { state: 'done', at: now };
          });
          return { marks: newMarks };
        }),

      addCustomTask: (title, phase) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const task: CustomTask = {
          id,
          title: title.trim(),
          phase,
          createdAt: Date.now(),
        };
        set((current) => ({
          customTasks: [...current.customTasks, task],
        }));
        return id;
      },

      updateCustomTask: (id, patch) =>
        set((current) => ({
          customTasks: current.customTasks.map((task) => {
            if (task.id !== id) return task;
            return {
              ...task,
              ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
              ...(patch.phase !== undefined ? { phase: patch.phase } : {}),
            };
          }),
        })),

      removeCustomTask: (id) =>
        set((current) => {
          const marks = { ...current.marks };
          const notes = { ...current.notes };
          delete marks[id];
          delete notes[id];
          return {
            customTasks: current.customTasks.filter((task) => task.id !== id),
            marks,
            notes,
          };
        }),

      setNote: (id, text) =>
        set((current) => {
          const trimmed = text.trim();
          const notes = { ...current.notes };
          if (!trimmed) {
            delete notes[id];
          } else {
            notes[id] = text;
          }
          return { notes };
        }),

      setGuestEstimate: (n) => set({ guestEstimate: n }),
      skipSetup: () => set({ setupSkipped: true }),
      setVibe: (patch) => set((current) => ({ vibe: { ...current.vibe, ...patch } })),

      reset: () =>
        set({
          ...initialState,
        }),
    }),
    {
      name: 'planner-store',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState) => {
        const persisted = (persistedState ?? {}) as Partial<PlannerState>;
        return {
          partnerA: persisted.partnerA ?? '',
          partnerB: persisted.partnerB ?? '',
          weddingDate: persisted.weddingDate ?? null,
          coverUri: persisted.coverUri ?? null,
          marks: persisted.marks ?? {},
          customTasks: persisted.customTasks ?? [],
          notes: persisted.notes ?? {},
          guestEstimate: persisted.guestEstimate ?? null,
          setupSkipped: persisted.setupSkipped ?? false,
          vibe: { ...EMPTY_VIBE, ...(persisted.vibe ?? {}) },
        };
      },
    },
  ),
);

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
