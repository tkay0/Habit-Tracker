import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, type ColorPalette, type, useTheme } from '../theme';

interface PinKeypadProps {
  onDigitPress: (digit: string) => void;
  onBackspacePress: () => void;
  biometricLabel?: string | null;
  onBiometricPress?: () => void;
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

export default function PinKeypad({
  onDigitPress,
  onBackspacePress,
  biometricLabel,
  onBiometricPress,
}: PinKeypadProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.pad}>
      {ROWS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((digit) => (
            <Pressable key={digit} style={styles.key} onPress={() => onDigitPress(digit)}>
              <Text style={[type.h2, styles.keyText]}>{digit}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      <View style={styles.row}>
        {biometricLabel && onBiometricPress ? (
          <Pressable style={styles.key} onPress={onBiometricPress}>
            <Text style={[type.caption, styles.keySubText]}>{biometricLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.key} />
        )}
        <Pressable style={styles.key} onPress={() => onDigitPress('0')}>
          <Text style={[type.h2, styles.keyText]}>0</Text>
        </Pressable>
        <Pressable style={styles.key} onPress={onBackspacePress}>
          <Text style={[type.h3, styles.keyText]}>⌫</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    pad: {
      gap: spacing.base,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.base,
      justifyContent: 'center',
    },
    key: {
      width: 72,
      height: 72,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyText: {
      color: colors.ink,
    },
    keySubText: {
      color: colors.inkMuted,
      textAlign: 'center',
      paddingHorizontal: spacing.xs,
    },
  });
}
