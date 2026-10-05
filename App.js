import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import Routes from './src/routes';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Routes />
    </SafeAreaProvider>
  );
}