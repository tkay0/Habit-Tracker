import { Feather } from '@expo/vector-icons';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import { listCompletionsForHabit, listHabits } from '../db';
import type { Completion, Habit } from '../db/types';
import { todayDateString } from '../lib/schedule';
import {
  getCompletionRate,
  getCurrentStreak,
  getOverallBestWorstWeekday,
  getBestWorstWeekday,
  type BestWorstWeekday,
} from '../lib/streaks';
import { colors, radius, spacing, type } from '../theme';

type Period = '7d' | '30d' | 'all';

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: 'all', label: 'All Time' },
];

const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

interface InsightsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function InsightsScreen({ visible, onClose }: InsightsScreenProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completionsByHabit, setCompletionsByHabit] = useState<Record<string, Completion[]>>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7d');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const today = useMemo(() => todayDateString(), []);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    listHabits().then(async (allHabits) => {
      const entries = await Promise.all(
        allHabits.map(async (habit) => [habit.id, await listCompletionsForHabit(habit.id)] as const)
      );
      setHabits(allHabits);
      setCompletionsByHabit(Object.fromEntries(entries));
      setLoading(false);
    });
  }, [visible]);

  function rangeDaysFor(habit: Habit): number {
    if (period === '7d') return 7;
    if (period === '30d') return 30;
    return Math.max(1, differenceInCalendarDays(parseISO(today), parseISO(habit.createdAt)) + 1);
  }

  const perHabitRates = useMemo(
    () =>
      habits.map((habit) => ({
        habit,
        rate: getCompletionRate(habit, completionsByHabit[habit.id] ?? [], rangeDaysFor(habit), today),
      })),
    [habits, completionsByHabit, period, today]
  );

  const overallRate = useMemo(
    () => (perHabitRates.length === 0 ? 0 : perHabitRates.reduce((sum, s) => sum + s.rate, 0) / perHabitRates.length),
    [perHabitRates]
  );

  const activeStreaks = useMemo(
    () =>
      habits
        .map((habit) => ({ habit, streak: getCurrentStreak(habit, completionsByHabit[habit.id] ?? [], today) }))
        .filter((s) => s.streak > 0)
        .sort((a, b) => b.streak - a.streak),
    [habits, completionsByHabit, today]
  );

  const overallBestWorst = useMemo(
    () =>
      getOverallBestWorstWeekday(
        habits.map((habit) => ({ habit, completions: completionsByHabit[habit.id] ?? [] })),
        today
      ),
    [habits, completionsByHabit, today]
  );

  const selectedHabit = habits.find((h) => h.id === selectedHabitId) ?? null;

  const displayedBestWorst: BestWorstWeekday = useMemo(() => {
    if (!selectedHabit) return overallBestWorst;
    return getBestWorstWeekday(selectedHabit, completionsByHabit[selectedHabit.id] ?? [], today);
  }, [selectedHabit, completionsByHabit, today, overallBestWorst]);

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']} />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[type.display, styles.title]}>Insights</Text>

          {habits.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[type.h2, styles.emptyTitle]}>No insights yet</Text>
              <Text style={[type.bodyMuted, styles.emptySubtitle]}>Add a habit and start checking it off.</Text>
            </View>
          ) : (
            <>
              <Text style={[type.label, styles.sectionLabel]}>OVERALL COMPLETION</Text>
              <View style={styles.pillRow}>
                {PERIOD_OPTIONS.map((option) => {
                  const selected = option.key === period;
                  return (
                    <Pressable
                      key={option.key}
                      style={[styles.pill, selected && styles.pillSelected]}
                      onPress={() => setPeriod(option.key)}
                    >
                      <Text style={[type.body, selected ? styles.pillTextSelected : styles.pillText]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.overallCard}>
                <Text style={[type.display, { color: colors.terracotta }]}>{Math.round(overallRate * 100)}%</Text>
                <Text style={[type.label, styles.overallLabel]}>ACROSS {habits.length} HABITS</Text>
              </View>

              <Text style={[type.label, styles.sectionLabel]}>BY HABIT</Text>
              <View style={styles.card}>
                {perHabitRates.map(({ habit, rate }, index) => (
                  <View key={habit.id} style={[styles.habitRateRow, index > 0 && styles.habitRateRowBorder]}>
                    <View style={[styles.habitIconWrap, { borderColor: habit.color }]}>
                      <Feather
                        name={habit.icon as React.ComponentProps<typeof Feather>['name']}
                        size={16}
                        color={habit.color}
                      />
                    </View>
                    <View style={styles.habitRateInfo}>
                      <Text style={[type.body, styles.habitRateName]}>{habit.name}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[styles.barFill, { width: `${Math.round(rate * 100)}%`, backgroundColor: habit.color }]}
                        />
                      </View>
                    </View>
                    <Text style={[type.body, styles.habitRatePercent, { color: habit.color }]}>
                      {Math.round(rate * 100)}%
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={[type.label, styles.sectionLabel]}>BEST & WORST DAY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                <View style={styles.pillRow}>
                  <Pressable
                    style={[styles.pill, selectedHabitId === null && styles.pillSelected]}
                    onPress={() => setSelectedHabitId(null)}
                  >
                    <Text style={[type.body, selectedHabitId === null ? styles.pillTextSelected : styles.pillText]}>
                      Overall
                    </Text>
                  </Pressable>
                  {habits.map((habit) => {
                    const selected = selectedHabitId === habit.id;
                    return (
                      <Pressable
                        key={habit.id}
                        style={[styles.pill, selected && styles.pillSelected]}
                        onPress={() => setSelectedHabitId(habit.id)}
                      >
                        <Text style={[type.body, selected ? styles.pillTextSelected : styles.pillText]}>
                          {habit.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={[type.h2, { color: colors.moss }]}>
                    {displayedBestWorst.best ? WEEKDAY_NAMES[displayedBestWorst.best.weekday] : '—'}
                  </Text>
                  <Text style={[type.label, styles.statLabel]}>BEST DAY</Text>
                  {displayedBestWorst.best && (
                    <Text style={[type.caption, styles.statSubtext]}>
                      {Math.round(displayedBestWorst.best.rate * 100)}% completion
                    </Text>
                  )}
                </View>
                <View style={styles.statCard}>
                  <Text style={[type.h2, { color: colors.miss }]}>
                    {displayedBestWorst.worst ? WEEKDAY_NAMES[displayedBestWorst.worst.weekday] : '—'}
                  </Text>
                  <Text style={[type.label, styles.statLabel]}>WORST DAY</Text>
                  {displayedBestWorst.worst && (
                    <Text style={[type.caption, styles.statSubtext]}>
                      {Math.round(displayedBestWorst.worst.rate * 100)}% completion
                    </Text>
                  )}
                </View>
              </View>

              <Text style={[type.label, styles.sectionLabel]}>ACTIVE STREAKS</Text>
              {activeStreaks.length === 0 ? (
                <View style={styles.card}>
                  <Text style={[type.bodyMuted, styles.noStreaksText]}>No active streaks right now.</Text>
                </View>
              ) : (
                <View style={styles.card}>
                  {activeStreaks.map(({ habit, streak }, index) => (
                    <View key={habit.id} style={[styles.streakRow, index > 0 && styles.habitRateRowBorder]}>
                      <Text style={[type.label, styles.streakRank]}>{index + 1}</Text>
                      <View style={[styles.habitIconWrap, { borderColor: habit.color }]}>
                        <Feather
                          name={habit.icon as React.ComponentProps<typeof Feather>['name']}
                          size={16}
                          color={habit.color}
                        />
                      </View>
                      <Text style={[type.body, styles.streakName]}>{habit.name}</Text>
                      <Text style={[type.h3, { color: habit.color }]}>
                        {streak} {streak === 1 ? 'day' : 'days'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={styles.actions}>
            <Button label="Close" variant="secondary" onPress={onClose} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    color: colors.ink,
    textAlign: 'left',
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.inkMuted,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  empty: {
    paddingTop: spacing.xl * 2,
    alignItems: 'flex-start',
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
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  pillScroll: {
    marginBottom: spacing.base,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.surface,
  },
  pillSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pillText: {
    color: colors.ink,
  },
  pillTextSelected: {
    color: colors.surface,
  },
  overallCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  overallLabel: {
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xl,
  },
  habitRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  habitRateRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  habitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  habitRateInfo: {
    flex: 1,
    marginRight: spacing.base,
  },
  habitRateName: {
    color: colors.ink,
    textAlign: 'left',
    marginBottom: spacing.xs,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  habitRatePercent: {
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
    alignItems: 'flex-start',
  },
  statLabel: {
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  statSubtext: {
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  streakRank: {
    color: colors.inkMuted,
    width: 20,
  },
  streakName: {
    flex: 1,
    color: colors.ink,
    textAlign: 'left',
  },
  noStreaksText: {
    color: colors.inkMuted,
    paddingVertical: spacing.base,
  },
  actions: {
    marginTop: spacing.base,
  },
});
