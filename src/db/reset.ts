import { getDb } from './client';

export async function resetAllData(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM completions');
    await db.execAsync('DELETE FROM habits');
    await db.execAsync('DELETE FROM profile');
  });
}
