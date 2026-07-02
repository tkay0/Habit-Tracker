import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import PinDots from '../components/PinDots';
import PinKeypad from '../components/PinKeypad';
import { createProfile } from '../db/profile';
import { getBiometricLabel, isBiometricAvailable, savePin } from '../lib/auth';
import { colors, radius, spacing, type } from '../theme';

type Step = 'name' | 'pin' | 'confirm' | 'biometric';

interface WelcomeScreenProps {
  onComplete: () => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [confirmError, setConfirmError] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);

  function handleNameContinue() {
    if (name.trim().length === 0) return;
    setStep('pin');
  }

  function handleSkipPin() {
    void finishOnboarding(null, false);
  }

  function handlePinDigit(digit: string) {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => setStep('confirm'), 150);
    }
  }

  function handleConfirmDigit(digit: string) {
    if (confirmPin.length >= 4 || confirmError) return;
    const next = confirmPin + digit;
    setConfirmPin(next);
    if (next.length === 4) {
      if (next === pin) {
        void proceedAfterPinSet();
      } else {
        setConfirmError(true);
        setTimeout(() => {
          setConfirmPin('');
          setConfirmError(false);
        }, 500);
      }
    }
  }

  function handleStartOver() {
    setPin('');
    setConfirmPin('');
    setConfirmError(false);
    setStep('pin');
  }

  async function proceedAfterPinSet() {
    const available = await isBiometricAvailable();
    if (!available) {
      await finishOnboarding(pin, false);
      return;
    }
    const label = await getBiometricLabel();
    setBiometricLabel(label);
    setStep('biometric');
  }

  async function finishOnboarding(pinToSave: string | null, biometricEnabled: boolean) {
    if (pinToSave) {
      await savePin(pinToSave);
    }
    await createProfile({ name: name.trim(), biometricEnabled });
    onComplete();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {step === 'name' && (
            <>
              <Text style={[type.display, styles.title]}>Welcome to Hearth</Text>
              <Text style={[type.bodyMuted, styles.subtitle]}>
                Let&apos;s get your space set up. What should we call you?
              </Text>
              <TextInput
                style={[type.body, styles.textInput]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.inkMuted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleNameContinue}
              />
              <View style={styles.actions}>
                <Button label="Continue" onPress={handleNameContinue} disabled={name.trim().length === 0} />
              </View>
            </>
          )}

          {step === 'pin' && (
            <>
              <Text style={[type.h1, styles.title]}>Set a PIN</Text>
              <Text style={[type.bodyMuted, styles.subtitle]}>
                Optional, but it keeps your habits private. You can always add this later.
              </Text>
              <View style={styles.dotsWrap}>
                <PinDots length={4} filled={pin.length} />
              </View>
              <PinKeypad onDigitPress={handlePinDigit} onBackspacePress={() => setPin((p) => p.slice(0, -1))} />
              <View style={styles.actions}>
                <Button label="Skip for now" variant="secondary" onPress={handleSkipPin} />
              </View>
            </>
          )}

          {step === 'confirm' && (
            <>
              <Text style={[type.h1, styles.title]}>Confirm your PIN</Text>
              <Text style={[type.bodyMuted, styles.subtitle]}>Enter it once more to make sure it&apos;s right.</Text>
              <View style={styles.dotsWrap}>
                <PinDots length={4} filled={confirmPin.length} error={confirmError} />
              </View>
              <PinKeypad
                onDigitPress={handleConfirmDigit}
                onBackspacePress={() => setConfirmPin((p) => p.slice(0, -1))}
              />
              <View style={styles.actions}>
                <Button label="Start over" variant="secondary" onPress={handleStartOver} />
              </View>
            </>
          )}

          {step === 'biometric' && (
            <>
              <Text style={[type.h1, styles.title]}>Enable {biometricLabel}?</Text>
              <Text style={[type.bodyMuted, styles.subtitle]}>
                Unlock Hearth faster with {biometricLabel} instead of typing your PIN.
              </Text>
              <View style={styles.actions}>
                <Button label={`Enable ${biometricLabel}`} onPress={() => finishOnboarding(pin, true)} />
                <View style={styles.actionGap} />
                <Button label="Not now" variant="secondary" onPress={() => finishOnboarding(pin, false)} />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
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
  dotsWrap: {
    marginBottom: spacing.xl,
  },
  actions: {
    marginTop: spacing.xl,
  },
  actionGap: {
    height: spacing.base,
  },
});
