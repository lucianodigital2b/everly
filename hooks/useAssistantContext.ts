import { useMemo } from 'react';
import { t, LANGUAGE } from '../i18n';
import { PHASES } from '../data/weddingPlan';
import { usePlanner } from './usePlanner';
import { usePremium } from './usePremium';
import { usePlannerStore } from '../zustand/planner';
import { useGuestsStore } from '../zustand/guests';
import { budgetSummary, useBudgetStore } from '../zustand/budget';

/**
 * What the assistant knows about this wedding, sent with every chat message
 * (the server renders it into the system prompt, see ChatService::contextBlock).
 *
 * The planner only lives on the device, so this is the assistant's one view of
 * it. Counts only: no guest name, phone, email or address ever leaves the phone.
 * Every key is optional; the server skips what is missing.
 */
export function useAssistantContext(): Record<string, unknown> {
  const planner = usePlanner();
  const premium = usePremium();

  const partnerA = usePlannerStore((s) => s.partnerA);
  const partnerB = usePlannerStore((s) => s.partnerB);
  const weddingDate = usePlannerStore((s) => s.weddingDate);
  const dateEstimated = usePlannerStore((s) => s.dateEstimated);
  const role = usePlannerStore((s) => s.role);
  const weddingType = usePlannerStore((s) => s.weddingType);
  const worry = usePlannerStore((s) => s.worry);
  const guestEstimate = usePlannerStore((s) => s.guestEstimate);

  const guests = useGuestsStore((s) => s.guests);

  const budgetTotal = useBudgetStore((s) => s.total);
  const categories = useBudgetStore((s) => s.categories);
  const expenses = useBudgetStore((s) => s.expenses);

  return useMemo(() => {
    const context: Record<string, unknown> = {};

    if (partnerA || partnerB) {
      context.couple = { partnerA: partnerA || undefined, partnerB: partnerB || undefined };
    }

    const wedding: Record<string, unknown> = {};
    if (weddingDate) {
      wedding.date = weddingDate;
      wedding.dateEstimated = dateEstimated;
    }
    if (planner) {
      wedding.daysLeft = planner.daysLeft;
      wedding.phase = PHASES.find((p) => p.id === planner.currentPhase)?.title;
    }
    if (role) wedding.role = t(`plan.wizard.roles.${role}`, { defaultValue: role });
    if (weddingType) wedding.type = t(`plan.wizard.types.${weddingType}`, { defaultValue: weddingType });
    if (worry) wedding.worry = t(`plan.wizard.worries.${worry}`, { defaultValue: worry });
    if (guestEstimate) wedding.guestEstimate = guestEstimate;
    if (Object.keys(wedding).length) context.wedding = wedding;

    if (planner) {
      const current = planner.phases.find((p) => p.isCurrent);
      context.checklist = {
        done: planner.doneCount,
        total: planner.total,
        overdue: planner.overdue,
        essentialsLeft: planner.essentialsLeft,
        next: planner.next?.title,
        openThisPhase: (current?.tasks ?? [])
          .filter((entry) => entry.state === 'pending')
          .slice(0, 8)
          .map((entry) => entry.task.title),
      };
    }

    // The couple's own rows (coupleSlot) are not guests.
    const list = guests.filter((g) => !g.coupleSlot);
    if (list.length) {
      context.guests = {
        total: list.length,
        attending: list.filter((g) => g.status === 'attending').length,
        waiting: list.filter((g) => g.status === 'waiting').length,
        plusOnes: list.filter((g) => g.plusOne).length,
        children: list.filter((g) => g.age === 'child').length,
        babies: list.filter((g) => g.age === 'baby').length,
      };
    }

    if (budgetTotal || expenses.length) {
      const summary = budgetSummary({ total: budgetTotal, categories, expenses });
      const today = new Date().toISOString().slice(0, 10);
      const due = expenses
        .filter((e) => e.dueDate && e.dueDate >= today && e.paid < e.estimated)
        .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))[0];

      context.budget = {
        // Amounts follow the app language, with no conversion (see formatUsd).
        currency: LANGUAGE === 'pt' ? 'BRL' : 'USD',
        total: summary.total ?? undefined,
        estimated: summary.estimated,
        paid: summary.paid,
        categories: summary.byCategory
          .filter((c) => c.estimated > 0 || c.paid > 0)
          .map((c) => ({ name: c.category.name, estimated: c.estimated, paid: c.paid })),
        nextPayment: due
          ? {
              label: due.label,
              category: categories.find((c) => c.id === due.categoryId)?.name,
              dueDate: due.dueDate,
              amount: due.estimated - due.paid,
            }
          : undefined,
      };
    }

    if (premium !== null) context.premium = premium;

    return context;
  }, [
    planner, premium, partnerA, partnerB, weddingDate, dateEstimated, role,
    weddingType, worry, guestEstimate, guests, budgetTotal, categories, expenses,
  ]);
}
