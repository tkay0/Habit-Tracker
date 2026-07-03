import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing, type ColorPalette, useTheme } from '../theme';

interface PinDotsProps {
  length: number;
  filled: number;
  error?: boolean;
}

export default function PinDots({ length, filled, error = false }: PinDotsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index < filled && (error ? styles.dotError : styles.dotFilled)]}
        />
      ))}
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.base,
      justifyContent: 'center',
    },
    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    dotFilled: {
      backgroundColor: colors.terracotta,
      borderColor: colors.terracotta,
    },
    dotError: {
      backgroundColor: colors.miss,
      borderColor: colors.miss,
    },
  });
}
