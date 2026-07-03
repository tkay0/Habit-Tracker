import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, type ColorPalette, type, useTheme } from '../theme';

interface HabitRowProps {
  name: string;
  icon: string;
  color: string;
  streak: number;
  isCompleted: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onPress: () => void;
}

export default function HabitRow({ name, icon, color, streak, isCompleted, onToggle, onEdit, onPress }: HabitRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Pressable style={styles.tapArea} onPress={onPress}>
        <View style={[styles.iconWrap, { borderColor: color }]}>
          <Feather name={icon as React.ComponentProps<typeof Feather>['name']} size={22} color={color} />
        </View>

        <View style={styles.info}>
          <Text style={[type.h3, styles.name]}>{name}</Text>
          {streak > 0 && (
            <Text style={[type.caption, styles.streak]}>
              {streak} {streak === 1 ? 'day' : 'days'} streak
            </Text>
          )}
        </View>
      </Pressable>

      <Pressable style={styles.editButton} onPress={onEdit} hitSlop={8}>
        <Feather name="edit-2" size={16} color={colors.inkMuted} />
      </Pressable>

      <Pressable
        style={[styles.check, isCompleted ? { backgroundColor: color, borderColor: color } : null]}
        onPress={onToggle}
      >
        {isCompleted && <Feather name="check" size={24} color={colors.surface} />}
      </Pressable>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.base,
      marginBottom: spacing.base,
    },
    tapArea: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.sm,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.base,
    },
    info: {
      flex: 1,
    },
    name: {
      color: colors.ink,
      textAlign: 'left',
    },
    streak: {
      color: colors.gold,
      textAlign: 'left',
      marginTop: spacing.xs,
    },
    editButton: {
      padding: spacing.xs,
      marginLeft: spacing.sm,
    },
    check: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.base,
    },
  });
}
