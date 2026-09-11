import { Stack } from 'expo-router';
import { AppThemeProvider } from '@/contexts/theme-context';

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add_depense" />
        <Stack.Screen name="add_revenu" />
        <Stack.Screen name="depenses-fixes" />
      </Stack>
    </AppThemeProvider>
  );
}