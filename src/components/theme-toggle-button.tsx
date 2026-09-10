import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/contexts/theme-context';

export function ThemeToggleButton() {
  const { scheme, toggleScheme } = useAppTheme();

  return (
    <Pressable onPress={toggleScheme} style={styles.button}>
      <ThemedText style={styles.icon}>{scheme === 'dark' ? '☀️' : '🌙'}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  icon: {
    fontSize: 18,
  },
});