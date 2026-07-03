import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import HabitHeatmap from '../components/HabitHeatmap';
import { listCompletionsForHabit, updateHabit } from '../db';
import type { Completion, Habit } from '../db/types';
import { buildHeatmapCells } from '../lib/heatmap';
import { getCurrentStreak, getLongestStreak } from '../lib/streaks';
import { colors, radius, spacing, type } from '../theme';

interface HabitDetailScreenProps {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
}

export default function HabitDetailScreen({ visible, habit, onClose }: HabitDetailScreenProps) {
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visible || !habit) return;
    setNotes(habit.notes ?? '');
    void listCompletionsForHabit(habit.id).then(setCompletions);
  }, [visible, habit?.id]);

  const currentStreak = useMemo(() => (habit ? getCurrentStreak(habit, completions) : 0), [habit, completions]);
  const longestStreak = useMemo(() => (habit ? getLongestStreak(habit, completions) : 0), [habit, completions]);
  const heatmapCells = useMemo(() => (habit ? buildHeatmapCells(habit, completions, 12) : []), [habit, completions]);

  async function saveNotes() {
    if (!habit) return;
    const trimmed = notes.trim();
    await updateHabit(habit.id, { notes: trimmed.length > 0 ? trimmed : null });
  }

  async function handleClose() {
    await saveNotes();
    onClose();
  }

  if (!habit) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.iconWrap, { borderColor: habit.color }]}>
              <Feather name={habit.icon as React.ComponentProps<typeof Feather>['name']} size={26} color={habit.color} />
            </View>
            <Text style={[type.h1, styles.title]}>{habit.name}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[type.display, { color: habit.color }]}>{currentStreak}</Text>
              <Text style={[type.label, styles.statLabel]}>CURRENT STREAK</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[type.display, { color: habit.color }]}>{longestStreak}</Text>
              <Text style={[type.label, styles.statLabel]}>LONGEST STREAK</Text>
            </View>
          </View>

          <Text style={[type.label, styles.sectionLabel]}>LAST 12 WEEKS</Text>
          <View style={styles.heatmapCard}>
            <HabitHeatmap cells={heatmapCells} color={habit.color} />
          </View>

          <Text style={[type.label, styles.sectionLabel]}>NOTES</Text>
          <TextInput
            style={[type.body, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            onBlur={saveNotes}
            placeholder="Add notes about this habit..."
            placeholderTextColor={colors.inkMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.actions}>
            <Button label="Close" variant="secondary" onPress={handleClose} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  title: {
    color: colors.ink,
    textAlign: 'left',
    flexShrink: 1,
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
    textAlign: 'left',
  },
  sectionLabel: {
    color: colors.inkMuted,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  heatmapCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.xl,
    alignItems: 'flex-start',
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    color: colors.ink,
    minHeight: 100,
    marginBottom: spacing.xl,
  },
  actions: {
    marginTop: spacing.base,
  },
});
