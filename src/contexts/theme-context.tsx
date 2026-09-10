import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedScheme = 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  scheme: ResolvedScheme;
  setPreference: (pref: ThemePreference) => void;
  toggleScheme: () => void;
};

const STORAGE_KEY = 'theme-preference';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setPreferenceState(value);
      }
      setLoaded(true);
    });
  }, []);

  function setPreference(pref: ThemePreference) {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  }

  function toggleScheme() {
    const current = preference === 'system' ? (systemScheme === 'unspecified' ? 'light' : systemScheme) : preference;
    setPreference(current === 'dark' ? 'light' : 'dark');
  }

  const resolvedSystem: ResolvedScheme = systemScheme === 'unspecified' ? 'light' : systemScheme;
  const scheme: ResolvedScheme = preference === 'system' ? resolvedSystem : preference;

  if (!loaded) return null; // évite un flash du mauvais thème au démarrage

  return (
    <ThemeContext.Provider value={{ preference, scheme, setPreference, toggleScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme doit être utilisé à l’intérieur de AppThemeProvider');
  return context;
}