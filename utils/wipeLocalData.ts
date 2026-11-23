import { usePlannerStore } from "../zustand/planner";
import { useBudgetStore } from "../zustand/budget";
import { useGuestsStore } from "../zustand/guests";
import { notificationsStore } from "../zustand/notifications";
import { queryClient } from "../services/queryClient";

/**
 * Erases everything the app keeps on the phone about the couple: the wedding
 * plan (names, date, vibe, task progress), the budget and expenses, the guest
 * list, the notifications, and the cached server data.
 *
 * The planner, budget and guests live only on the device (persisted zustand
 * stores), so deleting the account on the server never touched them: signing
 * in again brought the whole plan back. Called after the server confirms the
 * account is gone.
 */
export async function wipeLocalData() {
  const stores = [usePlannerStore, useBudgetStore, useGuestsStore, notificationsStore] as const;
  for (const store of stores) {
    // Back to the initial state in memory (the screens re-render empty), then
    // drop the saved copy so nothing rehydrates on the next launch.
    (store as any).setState((store as any).getInitialState(), true);
    await store.persist.clearStorage();
  }
  queryClient.clear();
}
