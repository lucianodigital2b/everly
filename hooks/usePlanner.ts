import { useEffect, useMemo, useState } from 'react';
import {
  PHASES,
  PLAN_TASKS,
  phaseDeadlineLabel,
  type PhaseId,
  type PlanTask,
} from '../data/weddingPlan';
import {
  parseISODate,
  usePlannerStore,
  type CustomTask,
} from '../zustand/planner';

export type StepState = 'done' | 'skipped' | 'pending';

export interface PhaseTaskEntry {
  task: PlanTask;
  state: StepState;
  note: string;
}

export interface PhaseProgress {
  phase: (typeof PHASES)[number];
  tasks: PhaseTaskEntry[];
  done: number;
  total: number;
  percent: number;
  isCurrent: boolean;
  isPast: boolean;
  deadlineLabel: string;
}

export interface PlannerData {
  daysLeft: number;
  daysUntil: number;
  monthsLeft: number;
  currentPhase: PhaseId;
  phases: PhaseProgress[];
  doneCount: number;
  total: number;
  percent: number;
  next: PlanTask | null;
  overdue: number;
  essentialsLeft: number;
}

export function findTask(id: string, customTasks: CustomTask[]): PlanTask | null {
  const builtIn = PLAN_TASKS.find((task) => task.id === id);
  if (builtIn) return builtIn;

  const custom = customTasks.find((task) => task.id === id);
  if (!custom) return null;

  return {
    id: custom.id,
    phase: custom.phase,
    title: custom.title,
    tip: '',
    category: 'planning',
    custom: true,
  };
}

export function usePlanner(): PlannerData | null {
  const weddingDate = usePlannerStore((state) => state.weddingDate);
  const marks = usePlannerStore((state) => state.marks);
  const customTasks = usePlannerStore((state) => state.customTasks);
  const notes = usePlannerStore((state) => state.notes);

  return useMemo<PlannerData | null>(() => {
    if (!weddingDate) return null;

    const weddingNoon = parseISODate(weddingDate).getTime();
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const todayNoon = today.getTime();
    const day = 86400000;
    const daysUntil = Math.round((weddingNoon - todayNoon) / day);
    const daysLeft = Math.max(0, daysUntil);

    const wedding = parseISODate(weddingDate);
    const monthsLeft = Math.max(
      0,
      (wedding.getFullYear() - today.getFullYear()) * 12 +
        (wedding.getMonth() - today.getMonth()),
    );

    const currentPhase: PhaseId =
      PHASES.find((phase) => daysUntil >= phase.dueDays)?.id ?? 'after';

    const customByPhase = customTasks.reduce<Record<PhaseId, PlanTask[]>>(
      (acc, task) => {
        const phaseTasks = acc[task.phase] ?? [];
        phaseTasks.push({
          id: task.id,
          phase: task.phase,
          title: task.title,
          tip: '',
          category: 'planning',
          custom: true,
        });
        acc[task.phase] = phaseTasks;
        return acc;
      },
      {
        p12: [],
        p7: [],
        p4: [],
        p2: [],
        p1: [],
        w2: [],
        d0: [],
        after: [],
      },
    );

    const phases: PhaseProgress[] = PHASES.map((phase) => {
      const builtInTasks = PLAN_TASKS.filter((task) => task.phase === phase.id);
      const customPhaseTasks = customByPhase[phase.id] ?? [];
      const tasks: PhaseTaskEntry[] = [...builtInTasks, ...customPhaseTasks].map(
        (task) => {
          const mark = marks[task.id];
          return {
            task,
            state: mark ? mark.state : 'pending',
            note: notes[task.id] ?? '',
          };
        },
      );

      const done = tasks.filter((entry) => entry.state !== 'pending').length;
      const total = tasks.length;
      const percent = total === 0 ? 0 : Math.round((done / total) * 100);
      const isCurrent = phase.id === currentPhase;
      const isPast = daysUntil < phase.dueDays;

      return {
        phase,
        tasks,
        done,
        total,
        percent,
        isCurrent,
        isPast,
        deadlineLabel: phaseDeadlineLabel(weddingDate, phase),
      };
    });

    const allEntries = phases.flatMap((phase) => phase.tasks);
    const doneCount = allEntries.filter((entry) => entry.state !== 'pending').length;
    const total = allEntries.length;
    const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

    const currentPhaseProgress = phases.find((phase) => phase.isCurrent);
    const pendingCurrent = (currentPhaseProgress?.tasks ?? [])
      .filter((entry) => entry.state === 'pending')
      .sort((a, b) => (b.task.essential ? 1 : 0) - (a.task.essential ? 1 : 0));

    const next =
      pendingCurrent[0]?.task ??
      allEntries.find((entry) => entry.state === 'pending')?.task ??
      null;

    const overdue = phases
      .filter((phase) => phase.isPast)
      .reduce(
        (sum, phase) =>
          sum + phase.tasks.filter((entry) => entry.state === 'pending').length,
        0,
      );

    const essentialsLeft = allEntries.filter(
      (entry) => entry.task.essential && entry.state === 'pending',
    ).length;

    return {
      daysLeft,
      daysUntil,
      monthsLeft,
      currentPhase,
      phases,
      doneCount,
      total,
      percent,
      next,
      overdue,
      essentialsLeft,
    };
  }, [weddingDate, marks, customTasks, notes]);
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export function useCountdown(weddingDate: string): Countdown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return useMemo<Countdown>(() => {
    const target = parseISODate(weddingDate).getTime();
    const diff = target - now;
    const isPast = diff <= 0;
    const totalSeconds = Math.max(0, Math.floor(diff / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds, isPast };
  }, [weddingDate, now]);
}
