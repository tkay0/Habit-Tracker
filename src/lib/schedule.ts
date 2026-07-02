import { format, getISODay, parseISO } from 'date-fns';

import type { Habit } from '../db/types';

export const DATE_FORMAT = 'yyyy-MM-dd';

export type ScheduleHabit = Pick<Habit, 'frequencyType' | 'customDays'>;

export function isScheduledOn(habit: ScheduleHabit, dateStr: string): boolean {
  if (habit.frequencyType === 'daily') return true;
  const isoWeekday = getISODay(parseISO(dateStr));
  return (habit.customDays ?? []).includes(isoWeekday);
}

export function todayDateString(): string {
  return format(new Date(), DATE_FORMAT);
}
