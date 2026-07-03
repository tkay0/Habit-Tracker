import type { SQLiteBindValue } from 'expo-sqlite';

import { getDb } from './client';
import { generateId } from './id';
import type { FrequencyType, Habit, HabitUpdateInput, NewHabitInput } from './types';

interface HabitRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency_type: string;
  custom_days: string | null;
  reminder_time: string | null;
  sort_order: number;
  archived: number;
  notes: string | null;
  created_at: string;
}

function mapHabitRow(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    frequencyType: row.frequency_type as FrequencyType,
    customDays: row.custom_days ? JSON.parse(row.custom_days) : null,
    reminderTime: row.reminder_time,
    sortOrder: row.sort_order,
    archived: row.archived === 1,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function createHabit(input: NewHabitInput): Promise<Habit> {
  const db = await getDb();
  const id = generateId();
  const createdAt = new Date().toISOString();
  const customDaysJson = input.customDays ? JSON.stringify(input.customDays) : null;

  await db.runAsync(
    `INSERT INTO habits (id, name, icon, color, frequency_type, custom_days, reminder_time, sort_order, archived, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    id,
    input.name,
    input.icon,
    input.color,
    input.frequencyType,
    customDaysJson,
    input.reminderTime ?? null,
    input.sortOrder ?? 0,
    input.notes ?? null,
    createdAt
  );

  const habit = await getHabitById(id);
  if (!habit) throw new Error('Failed to create habit');
  return habit;
}

export async function getHabitById(id: string): Promise<Habit | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<HabitRow>('SELECT * FROM habits WHERE id = ?', id);
  return row ? mapHabitRow(row) : null;
}

export async function listHabits(options: { includeArchived?: boolean } = {}): Promise<Habit[]> {
  const db = await getDb();
  const rows = options.includeArchived
    ? await db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY sort_order ASC, created_at ASC')
    : await db.getAllAsync<HabitRow>(
        'SELECT * FROM habits WHERE archived = 0 ORDER BY sort_order ASC, created_at ASC'
      );
  return rows.map(mapHabitRow);
}

export async function updateHabit(id: string, updates: HabitUpdateInput): Promise<Habit> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.icon !== undefined) {
    fields.push('icon = ?');
    values.push(updates.icon);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }
  if (updates.frequencyType !== undefined) {
    fields.push('frequency_type = ?');
    values.push(updates.frequencyType);
  }
  if (updates.customDays !== undefined) {
    fields.push('custom_days = ?');
    values.push(updates.customDays ? JSON.stringify(updates.customDays) : null);
  }
  if (updates.reminderTime !== undefined) {
    fields.push('reminder_time = ?');
    values.push(updates.reminderTime);
  }
  if (updates.sortOrder !== undefined) {
    fields.push('sort_order = ?');
    values.push(updates.sortOrder);
  }
  if (updates.archived !== undefined) {
    fields.push('archived = ?');
    values.push(updates.archived ? 1 : 0);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }

  if (fields.length > 0) {
    values.push(id);
    await db.runAsync(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, values as SQLiteBindValue[]);
  }

  const habit = await getHabitById(id);
  if (!habit) throw new Error(`Habit ${id} not found`);
  return habit;
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM completions WHERE habit_id = ?', id);
    await db.runAsync('DELETE FROM habits WHERE id = ?', id);
  });
}
