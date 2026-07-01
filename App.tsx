import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import StyleGuideScreen from './src/screens/StyleGuideScreen';
import { colors, fontsToLoad } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts(fontsToLoad);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <StyleGuideScreen />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
