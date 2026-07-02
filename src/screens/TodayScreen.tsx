import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddEditHabitScreen from './AddEditHabitScreen';
import HabitRow from '../components/HabitRow';
import { addCompletion, listCompletionsForHabit, listHabits, removeCompletion } from '../db';
import type { Completion, Habit } from '../db/types';
import { isScheduledOn, todayDateString } from '../lib/schedule';
import { getCurrentStreak } from '../lib/streaks';
import { colors, radius, spacing, type } from '../theme';

export default function TodayScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completionsByHabit, setCompletionsByHabit] = useState<Record<string, Completion[]>>({});
  const [loading, setLoading] = useState(true);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const today = useMemo(() => todayDateString(), []);

  const loadData = useCallback(async () => {
    const allHabits = await listHabits();
    const todayHabits = allHabits.filter((h) => isScheduledOn(h, today));

    const entries = await Promise.all(
      todayHabits.map(async (habit) => [habit.id, await listCompletionsForHabit(habit.id)] as const)
    );

    setHabits(allHabits);
    setCompletionsByHabit(Object.fromEntries(entries));
    setLoading(false);
  }, [today]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const todayHabits = useMemo(() => habits.filter((h) => isScheduledOn(h, today)), [habits, today]);

  const rows = useMemo(
    () =>
      todayHabits.map((habit) => {
        const completions = completionsByHabit[habit.id] ?? [];
        return {
          habit,
          isCompleted: completions.some((c) => c.date === today),
          streak: getCurrentStreak(habit, completions, today),
        };
      }),
    [todayHabits, completionsByHabit, today]
  );

  function handleAddPress() {
    setEditingHabit(null);
    setEditorVisible(true);
  }

  function handleEditPress(habit: Habit) {
    setEditingHabit(habit);
    setEditorVisible(true);
  }

  function handleEditorClose() {
    setEditorVisible(false);
  }

  function handleEditorSaved() {
    setEditorVisible(false);
    void loadData();
  }

  function handleEditorDeleted() {
    setEditorVisible(false);
    void loadData();
  }

  function handleToggle(habit: Habit) {
    const completions = completionsByHabit[habit.id] ?? [];
    const wasCompleted = completions.some((c) => c.date === today);

    // Optimistic: flip local state immediately, no spinner for a local write.
    setCompletionsByHabit((prev) => ({
      ...prev,
      [habit.id]: wasCompleted
        ? completions.filter((c) => c.date !== today)
        : [...completions, { id: `optimistic-${today}`, habitId: habit.id, date: today, completedAt: new Date().toISOString() }],
    }));

    const persist = wasCompleted ? removeCompletion(habit.id, today) : addCompletion(habit.id, today);
    persist.catch(() => {
      // Roll back on a write failure.
      setCompletionsByHabit((prev) => ({ ...prev, [habit.id]: completions }));
    });
  }

  if (loading) {
    return <View style={styles.screen} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.habit.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={[type.display, styles.pageTitle]}>Today</Text>}
        renderItem={({ item }) => (
          <HabitRow
            name={item.habit.name}
            icon={item.habit.icon}
            color={item.habit.color}
            streak={item.streak}
            isCompleted={item.isCompleted}
            onToggle={() => handleToggle(item.habit)}
            onEdit={() => handleEditPress(item.habit)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[type.h2, styles.emptyTitle]}>
              {habits.length === 0 ? 'No habits yet' : 'Nothing scheduled for today'}
            </Text>
            <Text style={[type.bodyMuted, styles.emptySubtitle]}>
              {habits.length === 0
                ? 'Tap the + button to add your first habit.'
                : 'Enjoy the day off — check back tomorrow.'}
            </Text>
          </View>
        }
      />

      <Pressable style={styles.fab} onPress={handleAddPress}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <AddEditHabitScreen
        visible={editorVisible}
        habit={editingHabit}
        onClose={handleEditorClose}
        onSaved={handleEditorSaved}
        onDeleted={handleEditorDeleted}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl * 3,
    flexGrow: 1,
  },
  pageTitle: {
    color: colors.ink,
    textAlign: 'left',
    marginBottom: spacing.xl,
  },
  empty: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: spacing.xl * 2,
  },
  emptyTitle: {
    color: colors.ink,
    textAlign: 'left',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.inkMuted,
    textAlign: 'left',
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: colors.surface,
    fontSize: 30,
    lineHeight: 32,
  },
});
