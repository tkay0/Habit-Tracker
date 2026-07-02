import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PinDots from '../components/PinDots';
import PinKeypad from '../components/PinKeypad';
import { authenticateWithBiometrics, verifyPin } from '../lib/auth';
import { colors, spacing, type } from '../theme';

interface LockScreenProps {
  biometricEnabled: boolean;
  biometricLabel: string | null;
  onUnlock: () => void;
}

export default function LockScreen({ biometricEnabled, biometricLabel, onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const triedBiometricOnMount = useRef(false);

  useEffect(() => {
    if (biometricEnabled && biometricLabel && !triedBiometricOnMount.current) {
      triedBiometricOnMount.current = true;
      void tryBiometric();
    }
    // Only auto-prompt once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function tryBiometric() {
    const success = await authenticateWithBiometrics('Unlock Hearth');
    if (success) onUnlock();
  }

  async function handleDigit(digit: string) {
    if (pin.length >= 4 || error) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      const valid = await verifyPin(next);
      if (valid) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 500);
      }
    }
  }

  function handleBackspace() {
    if (error) return;
    setPin((p) => p.slice(0, -1));
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={[type.h1, styles.title]}>Welcome back</Text>
        <Text style={[type.bodyMuted, styles.subtitle]}>Enter your PIN to unlock Hearth.</Text>
        <View style={styles.dotsWrap}>
          <PinDots length={4} filled={pin.length} error={error} />
        </View>
        <PinKeypad
          onDigitPress={handleDigit}
          onBackspacePress={handleBackspace}
          biometricLabel={biometricEnabled ? biometricLabel : null}
          onBiometricPress={biometricEnabled ? tryBiometric : undefined}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.ink,
    textAlign: 'left',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.inkMuted,
    textAlign: 'left',
    marginBottom: spacing.xl,
  },
  dotsWrap: {
    marginBottom: spacing.xl,
  },
});
