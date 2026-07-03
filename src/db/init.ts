import { getDb } from './client';
import { SCHEMA_SQL } from './schema';

// One-off column additions for installs whose tables predate them.
// CREATE TABLE IF NOT EXISTS above won't retrofit an existing table, so these
// run every launch and simply no-op (caught) once the column already exists.
const COLUMN_MIGRATIONS = [
  'ALTER TABLE habits ADD COLUMN notes TEXT',
  "ALTER TABLE profile ADD COLUMN theme_mode TEXT NOT NULL DEFAULT 'light'",
];

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync(SCHEMA_SQL);

  for (const migration of COLUMN_MIGRATIONS) {
    try {
      await db.execAsync(migration);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('duplicate column name')) throw error;
    }
  }
}
