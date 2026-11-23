import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  /** A reply that failed; shown with a retry instead of sent as history. */
  failed?: boolean;
};

// The thread survives closing the sheet and the app. Capped so storage stays
// small; the server only reads the last 12 turns anyway.
const MAX_STORED = 60;

type AssistantState = {
  messages: AssistantMessage[];
  add: (m: Omit<AssistantMessage, 'id' | 'createdAt'>) => string;
  remove: (id: string) => void;
  clear: () => void;
};

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set) => ({
      messages: [],
      add: (m) => {
        const id = newId();
        set((s) => ({
          messages: [...s.messages, { ...m, id, createdAt: Date.now() }].slice(-MAX_STORED),
        }));
        return id;
      },
      remove: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
      clear: () => set({ messages: [] }),
    }),
    {
      name: 'assistant-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
