import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getProfile, initDatabase } from './src/db';
import { getBiometricLabel, hasPinSet, isBiometricAvailable } from './src/lib/auth';
import LockScreen from './src/screens/LockScreen';
import TodayScreen from './src/screens/TodayScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { colors, fontsToLoad } from './src/theme';

type AuthPhase = 'loading' | 'welcome' | 'locked' | 'unlocked';

export default function App() {
  const [fontsLoaded] = useFonts(fontsToLoad);
  const [dbReady, setDbReady] = useState(false);
  const [phase, setPhase] = useState<AuthPhase>('loading');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);

  const evaluatePhase = useCallback(async () => {
    const profile = await getProfile();
    if (!profile) {
      setPhase('welcome');
      return;
    }

    const pinSet = await hasPinSet();
    if (!pinSet) {
      setPhase('unlocked');
      return;
    }

    if (profile.biometricEnabled && (await isBiometricAvailable())) {
      setBiometricEnabled(true);
      setBiometricLabel(await getBiometricLabel());
    } else {
      setBiometricEnabled(false);
      setBiometricLabel(null);
    }
    setPhase('locked');
  }, []);

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
  }, []);

  useEffect(() => {
    if (dbReady) void evaluatePhase();
  }, [dbReady, evaluatePhase]);

  if (!fontsLoaded || phase === 'loading') {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider>
      {phase === 'welcome' && <WelcomeScreen onComplete={evaluatePhase} />}
      {phase === 'locked' && (
        <LockScreen
          biometricEnabled={biometricEnabled}
          biometricLabel={biometricLabel}
          onUnlock={() => setPhase('unlocked')}
        />
      )}
      {phase === 'unlocked' && <TodayScreen />}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
