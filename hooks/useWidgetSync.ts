import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import EverlyLiveActivity from '../modules/everly-live-activity';
import { usePlanner } from './usePlanner';
import { usePlannerStore } from '../zustand/planner';
import { guestStats, useGuestsStore } from '../zustand/guests';
import { t } from '../i18n';

/**
 * Keeps the Home Screen / Lock Screen widget (targets/activity,
 * EverlyHomeWidget.swift) in step with the plan. The widget can't read the
 * app's AsyncStorage, so every change to the plan or the guest list writes a
 * small JSON snapshot into the shared App Group. Labels go already translated:
 * i18n lives here, not in Swift. Mounted once, in app/_layout.tsx.
 */
export function useWidgetSync(): void {
  const planner = usePlanner();
  const weddingDate = usePlannerStore((s) => s.weddingDate);
  const partnerA = usePlannerStore((s) => s.partnerA);
  const partnerB = usePlannerStore((s) => s.partnerB);
  const guests = useGuestsStore((s) => s.guests);

  const json = useMemo(() => {
    const couple = [partnerA, partnerB].map((n) => n.trim()).filter(Boolean).join(' & ');

    // Same order as "Up next" on the Plan tab: the current phase's pending
    // tasks, essentials first, then whatever else is still pending.
    const nextTasks: string[] = [];
    if (planner) {
      const current = planner.phases.find((p) => p.isCurrent);
      const pendingCurrent = (current?.tasks ?? [])
        .filter((e) => e.state === 'pending')
        .sort((a, b) => (b.task.essential ? 1 : 0) - (a.task.essential ? 1 : 0));
      const pendingAll = planner.phases.flatMap((p) => p.tasks).filter((e) => e.state === 'pending');
      for (const entry of [...pendingCurrent, ...pendingAll]) {
        if (nextTasks.length >= 3) break;
        if (!nextTasks.includes(entry.task.title)) nextTasks.push(entry.task.title);
      }
    }

    const stats = guestStats(guests);

    return JSON.stringify({
      weddingDate: weddingDate ?? null,
      couple,
      nextTasks,
      doneCount: planner?.doneCount ?? 0,
      total: planner?.total ?? 0,
      attending: stats.attending,
      invited: stats.invited,
      url: Linking.createURL('/plan'),
      labels: {
        daysToGo: t('widget.daysToGo'),
        dayToGo: t('widget.dayToGo'),
        today: t('widget.today'),
        married: t('widget.married'),
        upNext: t('widget.upNext'),
        allDone: t('widget.allDone'),
        rsvp: t('widget.rsvp'),
        tasks: t('widget.tasks'),
        emptyTitle: t('widget.emptyTitle'),
        emptySubtitle: t('widget.emptySubtitle'),
      },
    });
  }, [planner, weddingDate, partnerA, partnerB, guests]);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !EverlyLiveActivity?.setWidgetSnapshot) return;
    try {
      const ok = EverlyLiveActivity.setWidgetSnapshot(json);
      if (!ok) console.warn('[Widget] App Group unavailable; widget not updated');
    } catch (e) {
      console.warn('[Widget] setWidgetSnapshot failed', e);
    }
  }, [json]);
}
