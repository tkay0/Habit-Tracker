import { getDb } from './client';
import { SCHEMA_SQL } from './schema';

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync(SCHEMA_SQL);
}
