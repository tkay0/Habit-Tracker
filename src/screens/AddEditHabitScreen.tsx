import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import { createHabit, deleteHabit, updateHabit } from '../db/habits';
import type { FrequencyType, Habit } from '../db/types';
import { habitColors, radius, spacing, type ColorPalette, type, useTheme } from '../theme';

const ICON_OPTIONS: (keyof typeof Feather.glyphMap)[] = [
  'zap',
  'droplet',
  'book-open',
  'activity',
  'moon',
  'sun',
  'heart',
  'coffee',
  'edit-3',
  'music',
  'smile',
  'target',
  'feather',
  'dollar-sign',
  'users',
  'check-circle',
];

const DAY_OPTIONS: { label: string; value: number }[] = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 7 },
];

const TIME_FORMAT = 'HH:mm';

function defaultReminderDate(): Date {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  return date;
}

interface AddEditHabitScreenProps {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export default function AddEditHabitScreen({ visible, habit, onClose, onSaved, onDeleted }: AddEditHabitScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = habit !== null;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0]);
  const [color, setColor] = useState<string>(colors[habitColors[0]]);
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date>(defaultReminderDate());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    if (habit) {
      setName(habit.name);
      setIcon(habit.icon);
      setColor(habit.color);
      setFrequencyType(habit.frequencyType);
      setCustomDays(habit.customDays ?? []);
      if (habit.reminderTime) {
        setReminderEnabled(true);
        setReminderDate(parse(habit.reminderTime, TIME_FORMAT, new Date()));
      } else {
        setReminderEnabled(false);
        setReminderDate(defaultReminderDate());
      }
    } else {
      setName('');
      setIcon(ICON_OPTIONS[0]);
      setColor(colors[habitColors[0]]);
      setFrequencyType('daily');
      setCustomDays([]);
      setReminderEnabled(false);
      setReminderDate(defaultReminderDate());
    }
  }, [visible, habit]);

  const canSave = name.trim().length > 0 && (frequencyType === 'daily' || customDays.length > 0);

  function toggleDay(day: number) {
    setCustomDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        icon,
        color,
        frequencyType,
        customDays: frequencyType === 'custom' ? customDays : null,
        reminderTime: reminderEnabled ? format(reminderDate, TIME_FORMAT) : null,
      };
      if (habit) {
        await updateHabit(habit.id, payload);
      } else {
        await createHabit(payload);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  function handleDeletePress() {
    if (!habit) return;
    Alert.alert('Delete habit', `Delete "${habit.name}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: confirmDelete },
    ]);
  }

  async function confirmDelete() {
    if (!habit) return;
    setSaving(true);
    try {
      await deleteHabit(habit.id);
      onDeleted();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[type.h1, styles.title]}>{isEditing ? 'Edit habit' : 'New habit'}</Text>

          <Text style={[type.label, styles.sectionLabel]}>NAME</Text>
          <TextInput
            style={[type.body, styles.textInput]}
            value={name}
            onChangeText={setName}
            placeholder="Drink water"
            placeholderTextColor={colors.inkMuted}
            autoFocus={!isEditing}
          />

          <Text style={[type.label, styles.sectionLabel]}>ICON</Text>
          <View style={styles.optionRow}>
            {ICON_OPTIONS.map((option) => {
              const selected = option === icon;
              return (
                <Pressable
                  key={option}
                  style={[styles.iconOption, selected && { borderColor: color }]}
                  onPress={() => setIcon(option)}
                >
                  <Feather name={option} size={22} color={selected ? color : colors.ink} />
                </Pressable>
              );
            })}
          </View>

          <Text style={[type.label, styles.sectionLabel]}>COLOR</Text>
          <View style={styles.optionRow}>
            {habitColors.map((key) => {
              const hex = colors[key];
              return (
                <Pressable
                  key={key}
                  style={[styles.colorOption, { backgroundColor: hex }, hex === color && styles.colorOptionSelected]}
                  onPress={() => setColor(hex)}
                />
              );
            })}
          </View>

          <Text style={[type.label, styles.sectionLabel]}>FREQUENCY</Text>
          <View style={styles.frequencyRow}>
            <Pressable
              style={[styles.frequencyOption, frequencyType === 'daily' && styles.frequencyOptionSelected]}
              onPress={() => setFrequencyType('daily')}
            >
              <Text style={[type.body, frequencyType === 'daily' ? styles.frequencyTextSelected : styles.frequencyText]}>
                Every day
              </Text>
            </Pressable>
            <Pressable
              style={[styles.frequencyOption, frequencyType === 'custom' && styles.frequencyOptionSelected]}
              onPress={() => setFrequencyType('custom')}
            >
              <Text
                style={[type.body, frequencyType === 'custom' ? styles.frequencyTextSelected : styles.frequencyText]}
              >
                Specific days
              </Text>
            </Pressable>
          </View>

          {frequencyType === 'custom' && (
            <View style={styles.dayRow}>
              {DAY_OPTIONS.map((day) => {
                const selected = customDays.includes(day.value);
                return (
                  <Pressable
                    key={day.value}
                    style={[styles.dayOption, selected && { backgroundColor: color, borderColor: color }]}
                    onPress={() => toggleDay(day.value)}
                  >
                    <Text style={[type.label, selected ? styles.dayTextSelected : styles.dayText]}>{day.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.reminderRow}>
            <Text style={[type.label, styles.reminderLabel]}>REMINDER</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: colors.border, true: color }}
              thumbColor={colors.surface}
            />
          </View>

          {reminderEnabled && (
            <Pressable style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
              <Text style={[type.body, styles.timeButtonText]}>{format(reminderDate, 'h:mm a')}</Text>
            </Pressable>
          )}

          {showTimePicker && (
            <DateTimePicker
              value={reminderDate}
              mode="time"
              onChange={(_event, selected) => {
                setShowTimePicker(false);
                if (selected) setReminderDate(selected);
              }}
            />
          )}

          <View style={styles.actions}>
            <Button label={isEditing ? 'Save changes' : 'Add habit'} onPress={handleSave} disabled={!canSave || saving} />
            <View style={styles.actionGap} />
            {isEditing && (
              <>
                <Button label="Delete habit" variant="danger" onPress={handleDeletePress} disabled={saving} />
                <View style={styles.actionGap} />
              </>
            )}
            <Button label="Cancel" variant="secondary" onPress={onClose} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
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
    textInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.base,
      color: colors.ink,
      marginBottom: spacing.xl,
    },
    optionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    iconOption: {
      width: 48,
      height: 48,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    colorOptionSelected: {
      borderColor: colors.ink,
    },
    frequencyRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.base,
    },
    frequencyOption: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    frequencyOptionSelected: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    frequencyText: {
      color: colors.ink,
    },
    frequencyTextSelected: {
      color: colors.surface,
    },
    dayRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    dayOption: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayText: {
      color: colors.ink,
    },
    dayTextSelected: {
      color: colors.surface,
    },
    reminderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.base,
    },
    reminderLabel: {
      color: colors.inkMuted,
    },
    timeButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.base,
      alignItems: 'flex-start',
      marginBottom: spacing.xl,
    },
    timeButtonText: {
      color: colors.ink,
    },
    actions: {
      marginTop: spacing.base,
    },
    actionGap: {
      height: spacing.base,
    },
  });
}
