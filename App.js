import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import Routes from './src/routes';

export default function App() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <StatusBar style="dark" />
        <Routes />
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}