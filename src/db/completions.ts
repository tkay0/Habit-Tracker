import { getDb } from './client';
import { generateId } from './id';
import type { Completion } from './types';

interface CompletionRow {
  id: string;
  habit_id: string;
  date: string;
  completed_at: string;
}

function mapCompletionRow(row: CompletionRow): Completion {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completedAt: row.completed_at,
  };
}

export async function addCompletion(
  habitId: string,
  date: string,
  completedAt: string = new Date().toISOString()
): Promise<Completion> {
  const db = await getDb();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO completions (id, habit_id, date, completed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(habit_id, date) DO UPDATE SET completed_at = excluded.completed_at`,
    id,
    habitId,
    date,
    completedAt
  );

  const completion = await getCompletion(habitId, date);
  if (!completion) throw new Error('Failed to record completion');
  return completion;
}

export async function removeCompletion(habitId: string, date: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM completions WHERE habit_id = ? AND date = ?', habitId, date);
}

export async function toggleCompletion(habitId: string, date: string): Promise<boolean> {
  const existing = await getCompletion(habitId, date);
  if (existing) {
    await removeCompletion(habitId, date);
    return false;
  }
  await addCompletion(habitId, date);
  return true;
}

export async function getCompletion(habitId: string, date: string): Promise<Completion | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CompletionRow>(
    'SELECT * FROM completions WHERE habit_id = ? AND date = ?',
    habitId,
    date
  );
  return row ? mapCompletionRow(row) : null;
}

export async function listCompletionsForHabit(
  habitId: string,
  range?: { from?: string; to?: string }
): Promise<Completion[]> {
  const db = await getDb();
  const conditions = ['habit_id = ?'];
  const params: (string | number)[] = [habitId];

  if (range?.from) {
    conditions.push('date >= ?');
    params.push(range.from);
  }
  if (range?.to) {
    conditions.push('date <= ?');
    params.push(range.to);
  }

  const rows = await db.getAllAsync<CompletionRow>(
    `SELECT * FROM completions WHERE ${conditions.join(' AND ')} ORDER BY date ASC`,
    params
  );
  return rows.map(mapCompletionRow);
}
