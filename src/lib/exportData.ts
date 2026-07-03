import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { getProfile, listCompletionsForHabit, listHabits } from '../db';

export async function exportDataAsJson(): Promise<void> {
  const [profile, habits] = await Promise.all([getProfile(), listHabits({ includeArchived: true })]);

  const completionsByHabit = await Promise.all(
    habits.map(async (habit) => ({ habitId: habit.id, completions: await listCompletionsForHabit(habit.id) }))
  );

  const payload = {
    exportedAt: new Date().toISOString(),
    profile,
    habits,
    completions: completionsByHabit.flatMap((entry) => entry.completions),
  };

  const fileUri = `${FileSystem.cacheDirectory}hearth-export-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Hearth data' });
  }
}
