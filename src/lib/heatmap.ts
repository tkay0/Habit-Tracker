import { addDays, format, getISODay, parseISO, subDays } from 'date-fns';

import type { Completion } from '../db/types';
import { DATE_FORMAT, isScheduledOn, todayDateString, type ScheduleHabit } from './schedule';

export interface HeatmapCell {
  /** YYYY-MM-DD */
  date: string;
  /** 0 = oldest week in the grid, weeks-1 = the current week. */
  weekIndex: number;
  /** ISO weekday, 1 (Monday) - 7 (Sunday). */
  weekday: number;
  scheduled: boolean;
  completed: boolean;
  isFuture: boolean;
}

export function buildHeatmapCells(
  habit: ScheduleHabit,
  completions: Pick<Completion, 'date'>[],
  weeks: number = 12,
  today: string = todayDateString()
): HeatmapCell[] {
  const completedDates = new Set(completions.map((c) => c.date));
  const todayDate = parseISO(today);
  const currentWeekMonday = subDays(todayDate, getISODay(todayDate) - 1);
  const gridStart = subDays(currentWeekMonday, (weeks - 1) * 7);

  const cells: HeatmapCell[] = [];
  for (let weekIndex = 0; weekIndex < weeks; weekIndex += 1) {
    for (let weekdayOffset = 0; weekdayOffset < 7; weekdayOffset += 1) {
      const date = addDays(gridStart, weekIndex * 7 + weekdayOffset);
      const dateStr = format(date, DATE_FORMAT);
      cells.push({
        date: dateStr,
        weekIndex,
        weekday: weekdayOffset + 1,
        scheduled: isScheduledOn(habit, dateStr),
        completed: completedDates.has(dateStr),
        isFuture: dateStr > today,
      });
    }
  }
  return cells;
}
