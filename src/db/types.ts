export type FrequencyType = 'daily' | 'custom';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequencyType: FrequencyType;
  /** ISO weekday numbers, 1 (Monday) - 7 (Sunday). Null when frequencyType is 'daily'. */
  customDays: number[] | null;
  reminderTime: string | null;
  sortOrder: number;
  archived: boolean;
  notes: string | null;
  createdAt: string;
}

export interface NewHabitInput {
  name: string;
  icon: string;
  color: string;
  frequencyType: FrequencyType;
  customDays?: number[] | null;
  reminderTime?: string | null;
  sortOrder?: number;
  notes?: string | null;
}

export interface HabitUpdateInput {
  name?: string;
  icon?: string;
  color?: string;
  frequencyType?: FrequencyType;
  customDays?: number[] | null;
  reminderTime?: string | null;
  sortOrder?: number;
  archived?: boolean;
  notes?: string | null;
}

export interface Completion {
  id: string;
  habitId: string;
  /** YYYY-MM-DD */
  date: string;
  completedAt: string;
}
