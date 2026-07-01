import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDatabase } from './src/db';
import StyleGuideScreen from './src/screens/StyleGuideScreen';
import { colors, fontsToLoad } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts(fontsToLoad);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
  }, []);

  if (!fontsLoaded || !dbReady) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <StyleGuideScreen />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
