import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import PinDots from '../components/PinDots';
import PinKeypad from '../components/PinKeypad';
import { getProfile, resetAllData, setBiometricEnabled as persistBiometricEnabled, setProfileName } from '../db';
import type { Profile } from '../db/profile';
import { clearPin, hasPinSet, isBiometricAvailable, savePin, verifyPin } from '../lib/auth';
import { exportDataAsJson } from '../lib/exportData';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  type NotificationPermissionStatus,
} from '../lib/notifications';
import { radius, spacing, type ColorPalette, type, useTheme } from '../theme';

type PinFlowStep = 'setPin' | 'confirmPin' | 'disablePin' | null;
type NotificationStatus = NotificationPermissionStatus;

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
  onDataReset: () => void;
}

export default function SettingsScreen({ visible, onClose, onDataReset }: SettingsScreenProps) {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>('undetermined');
  const [exporting, setExporting] = useState(false);

  const [pinFlow, setPinFlow] = useState<PinFlowStep>(null);
  const [pinDraft, setPinDraft] = useState('');
  const [pinConfirmDraft, setPinConfirmDraft] = useState('');
  const [pinError, setPinError] = useState(false);

  const loadState = useCallback(async () => {
    const [currentProfile, pinSet, biometricHardware, notificationPermission] = await Promise.all([
      getProfile(),
      hasPinSet(),
      isBiometricAvailable(),
      getNotificationPermissionStatus(),
    ]);
    if (currentProfile) {
      setProfile(currentProfile);
      setName(currentProfile.name);
    }
    setPinEnabled(pinSet);
    setBiometricAvailable(biometricHardware);
    setNotificationStatus(notificationPermission);
  }, []);

  useEffect(() => {
    if (visible) {
      void loadState();
      setPinFlow(null);
      setPinDraft('');
      setPinConfirmDraft('');
      setPinError(false);
    }
  }, [visible, loadState]);

  async function handleNameBlur() {
    if (!profile) return;
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed === profile.name) {
      setName(profile.name);
      return;
    }
    await setProfileName(profile.id, trimmed);
    setProfile({ ...profile, name: trimmed });
  }

  function handlePinTogglePress(next: boolean) {
    if (next) {
      setPinDraft('');
      setPinConfirmDraft('');
      setPinError(false);
      setPinFlow('setPin');
    } else {
      setPinDraft('');
      setPinError(false);
      setPinFlow('disablePin');
    }
  }

  function handleSetPinDigit(digit: string) {
    if (pinDraft.length >= 4) return;
    const next = pinDraft + digit;
    setPinDraft(next);
    if (next.length === 4) setTimeout(() => setPinFlow('confirmPin'), 150);
  }

  function handleConfirmPinDigit(digit: string) {
    if (pinConfirmDraft.length >= 4 || pinError) return;
    const next = pinConfirmDraft + digit;
    setPinConfirmDraft(next);
    if (next.length === 4) {
      if (next === pinDraft) {
        void finishEnablingPin();
      } else {
        setPinError(true);
        setTimeout(() => {
          setPinConfirmDraft('');
          setPinError(false);
        }, 500);
      }
    }
  }

  async function finishEnablingPin() {
    await savePin(pinDraft);
    setPinEnabled(true);
    setPinFlow(null);
    setPinDraft('');
    setPinConfirmDraft('');
  }

  async function handleDisablePinDigit(digit: string) {
    if (pinDraft.length >= 4 || pinError) return;
    const next = pinDraft + digit;
    setPinDraft(next);
    if (next.length === 4) {
      const valid = await verifyPin(next);
      if (valid) {
        await clearPin();
        if (profile) await persistBiometricEnabled(profile.id, false);
        setPinEnabled(false);
        setPinFlow(null);
        setPinDraft('');
      } else {
        setPinError(true);
        setTimeout(() => {
          setPinDraft('');
          setPinError(false);
        }, 500);
      }
    }
  }

  async function handleBiometricToggle(next: boolean) {
    if (!profile) return;
    await persistBiometricEnabled(profile.id, next);
    setProfile({ ...profile, biometricEnabled: next });
  }

  async function handleNotificationPress() {
    if (notificationStatus === 'granted') return;
    if (notificationStatus === 'denied') {
      await Linking.openSettings();
      return;
    }
    const result = await requestNotificationPermission();
    setNotificationStatus(result);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportDataAsJson();
    } finally {
      setExporting(false);
    }
  }

  function handleResetPress() {
    Alert.alert(
      'Reset all data',
      'This deletes every habit, completion, and your PIN. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: confirmReset },
      ]
    );
  }

  async function confirmReset() {
    await clearPin();
    await resetAllData();
    onDataReset();
  }

  const notificationLabel =
    notificationStatus === 'granted'
      ? 'Enabled'
      : notificationStatus === 'denied'
        ? 'Open Settings'
        : 'Enable';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[type.display, styles.title]}>Settings</Text>

          {pinFlow === null && (
            <>
              <Text style={[type.label, styles.sectionLabel]}>NAME</Text>
              <TextInput
                style={[type.body, styles.textInput]}
                value={name}
                onChangeText={setName}
                onBlur={handleNameBlur}
                placeholder="Your name"
                placeholderTextColor={colors.inkMuted}
              />

              <View style={styles.row}>
                <Text style={[type.body, styles.rowLabel]}>PIN lock</Text>
                <Switch
                  value={pinEnabled}
                  onValueChange={handlePinTogglePress}
                  trackColor={{ false: colors.border, true: colors.terracotta }}
                  thumbColor={colors.surface}
                />
              </View>

              {pinEnabled && biometricAvailable && (
                <View style={styles.row}>
                  <Text style={[type.body, styles.rowLabel]}>Biometric unlock</Text>
                  <Switch
                    value={profile?.biometricEnabled ?? false}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: colors.border, true: colors.terracotta }}
                    thumbColor={colors.surface}
                  />
                </View>
              )}

              <View style={styles.row}>
                <Text style={[type.body, styles.rowLabel]}>Reminder notifications</Text>
                <Button
                  label={notificationLabel}
                  variant="secondary"
                  onPress={handleNotificationPress}
                  disabled={notificationStatus === 'granted'}
                />
              </View>

              <View style={styles.row}>
                <Text style={[type.body, styles.rowLabel]}>Dark mode</Text>
                <Switch
                  value={mode === 'dark'}
                  onValueChange={(next) => setMode(next ? 'dark' : 'light')}
                  trackColor={{ false: colors.border, true: colors.terracotta }}
                  thumbColor={colors.surface}
                />
              </View>

              <Text style={[type.label, styles.sectionLabel]}>DATA</Text>
              <View style={styles.actionGap}>
                <Button label="Export data as JSON" variant="secondary" onPress={handleExport} disabled={exporting} />
              </View>
              <View style={styles.actionGap}>
                <Button label="Reset all data" variant="danger" onPress={handleResetPress} />
              </View>

              <View style={styles.actions}>
                <Button label="Close" variant="secondary" onPress={onClose} />
              </View>
            </>
          )}

          {pinFlow === 'setPin' && (
            <>
              <Text style={[type.h1, styles.title]}>Set a PIN</Text>
              <Text style={[type.bodyMuted, styles.subtitle]}>Choose a 4-digit PIN to lock Hearth.</Text>
              <View style={styles.dotsWrap}>
                <PinDots length={4} filled={pinDraft.length} />
              </View>
              <PinKeypad onDigitPress={handleSetPinDigit} onBackspacePress={() => setPinDraft((p) => p.slice(0, -1))} />
              <View style={styles.actions}>
                <Button label="Cancel" variant="secondary" onPress={() => setPinFlow(null)} />
              </View>
            </>
          )}

          {pinFlow === 'confirmPin' && (
            <>
              <Text style={[type.h1, styles.title]}>Confirm your PIN</Text>
              <Text style={[type.bodyMuted, styles.subtitle]}>Enter it once more to make sure it&apos;s right.</Text>
              <View style={styles.dotsWrap}>
                <PinDots length={4} filled={pinConfirmDraft.length} error={pinError} />
              </View>
              <PinKeypad
                onDigitPress={handleConfirmPinDigit}
                onBackspacePress={() => setPinConfirmDraft((p) => p.slice(0, -1))}
              />
              <View style={styles.actions}>
                <Button label="Cancel" variant="secondary" onPress={() => setPinFlow(null)} />
              </View>
            </>
          )}

          {pinFlow === 'disablePin' && (
            <>
              <Text style={[type.h1, styles.title]}>Enter your PIN</Text>
              <Text style={[type.bodyMuted, styles.subtitle]}>Confirm your PIN to turn off PIN lock.</Text>
              <View style={styles.dotsWrap}>
                <PinDots length={4} filled={pinDraft.length} error={pinError} />
              </View>
              <PinKeypad
                onDigitPress={handleDisablePinDigit}
                onBackspacePress={() => setPinDraft((p) => p.slice(0, -1))}
              />
              <View style={styles.actions}>
                <Button label="Cancel" variant="secondary" onPress={() => setPinFlow(null)} />
              </View>
            </>
          )}
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
      marginBottom: spacing.sm,
    },
    subtitle: {
      color: colors.inkMuted,
      textAlign: 'left',
      marginBottom: spacing.xl,
    },
    sectionLabel: {
      color: colors.inkMuted,
      marginTop: spacing.base,
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
      marginBottom: spacing.base,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowLabel: {
      color: colors.ink,
      textAlign: 'left',
    },
    dotsWrap: {
      marginBottom: spacing.xl,
    },
    actionGap: {
      marginTop: spacing.base,
    },
    actions: {
      marginTop: spacing.xl,
    },
  });
}
