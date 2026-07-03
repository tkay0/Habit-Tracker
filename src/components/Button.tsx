import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing, type ColorPalette, type, useTheme } from '../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const VARIANT_STYLES = {
  primary: { container: 'primary', text: 'primaryText' },
  secondary: { container: 'secondary', text: 'secondaryText' },
  danger: { container: 'danger', text: 'dangerText' },
} as const;

export default function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { container, text } = VARIANT_STYLES[variant];

  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.base, styles[container], disabled && styles.disabled]}>
      <Text style={[type.button, styles[text]]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    base: {
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
    },
    primary: {
      backgroundColor: colors.terracotta,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    danger: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.miss,
    },
    disabled: {
      opacity: 0.5,
    },
    primaryText: {
      color: colors.surface,
    },
    secondaryText: {
      color: colors.ink,
    },
    dangerText: {
      color: colors.miss,
    },
  });
}
