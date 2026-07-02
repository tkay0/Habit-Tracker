import { addDays, format, getISODay, parseISO, subDays } from 'date-fns';

import type { Completion, Habit } from '../db/types';
import { DATE_FORMAT, isScheduledOn, todayDateString } from './schedule';

// Guards getCurrentStreak against malformed data (e.g. a 'custom' habit with
// an empty customDays array) where no day is ever "scheduled" and the walk
// backward from today would otherwise never hit a break condition.
const MAX_LOOKBACK_DAYS = 3650;

export type StreakHabit = Pick<Habit, 'frequencyType' | 'customDays'>;
export type CompletionRecord = Pick<Completion, 'date'>;

export interface WeekdayStat {
  /** ISO weekday, 1 (Monday) - 7 (Sunday). */
  weekday: number;
  rate: number;
}

export interface BestWorstWeekday {
  best: WeekdayStat | null;
  worst: WeekdayStat | null;
}

export function getCurrentStreak(
  habit: StreakHabit,
  completions: CompletionRecord[],
  today: string = todayDateString()
): number {
  const completedDates = new Set(completions.map((c) => c.date));
  let streak = 0;
  let cursor = parseISO(today);
  let isFirstDay = true;

  for (let daysChecked = 0; daysChecked < MAX_LOOKBACK_DAYS; daysChecked += 1) {
    const dateStr = format(cursor, DATE_FORMAT);
    if (isScheduledOn(habit, dateStr)) {
      if (completedDates.has(dateStr)) {
        streak += 1;
      } else if (isFirstDay) {
        // Today may not be completed yet; that alone shouldn't break the streak.
      } else {
        break;
      }
    }
    isFirstDay = false;
    cursor = subDays(cursor, 1);
  }

  return streak;
}

export function getLongestStreak(habit: StreakHabit, completions: CompletionRecord[]): number {
  if (completions.length === 0) return 0;

  const completedDates = new Set(completions.map((c) => c.date));
  const sortedDates = completions.map((c) => parseISO(c.date)).sort((a, b) => a.getTime() - b.getTime());

  let longest = 0;
  let current = 0;
  let cursor = sortedDates[0];
  const end = sortedDates[sortedDates.length - 1];

  while (cursor.getTime() <= end.getTime()) {
    const dateStr = format(cursor, DATE_FORMAT);
    if (isScheduledOn(habit, dateStr)) {
      if (completedDates.has(dateStr)) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    cursor = addDays(cursor, 1);
  }

  return longest;
}

export function getCompletionRate(
  habit: StreakHabit,
  completions: CompletionRecord[],
  rangeDays: number,
  today: string = todayDateString()
): number {
  const completedDates = new Set(completions.map((c) => c.date));
  const end = parseISO(today);

  let scheduled = 0;
  let completed = 0;

  for (let i = 0; i < rangeDays; i += 1) {
    const dateStr = format(subDays(end, i), DATE_FORMAT);
    if (isScheduledOn(habit, dateStr)) {
      scheduled += 1;
      if (completedDates.has(dateStr)) completed += 1;
    }
  }

  return scheduled === 0 ? 0 : completed / scheduled;
}

export function getBestWorstWeekday(
  habit: StreakHabit,
  completions: CompletionRecord[],
  today: string = todayDateString()
): BestWorstWeekday {
  if (completions.length === 0) return { best: null, worst: null };

  const completedDates = new Set(completions.map((c) => c.date));
  const sortedDates = completions.map((c) => parseISO(c.date)).sort((a, b) => a.getTime() - b.getTime());
  const scheduledCount = new Array(8).fill(0);
  const completedCount = new Array(8).fill(0);

  let cursor = sortedDates[0];
  const end = parseISO(today);

  while (cursor.getTime() <= end.getTime()) {
    const dateStr = format(cursor, DATE_FORMAT);
    if (isScheduledOn(habit, dateStr)) {
      const weekday = getISODay(cursor);
      scheduledCount[weekday] += 1;
      if (completedDates.has(dateStr)) completedCount[weekday] += 1;
    }
    cursor = addDays(cursor, 1);
  }

  let best: WeekdayStat | null = null;
  let worst: WeekdayStat | null = null;

  for (let weekday = 1; weekday <= 7; weekday += 1) {
    if (scheduledCount[weekday] === 0) continue;
    const rate = completedCount[weekday] / scheduledCount[weekday];
    if (!best || rate > best.rate) best = { weekday, rate };
    if (!worst || rate < worst.rate) worst = { weekday, rate };
  }

  return { best, worst };
}
