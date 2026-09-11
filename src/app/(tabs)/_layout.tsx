import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { useAppTheme } from "@/contexts/theme-context";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const { scheme } = useAppTheme(); // fonctionne maintenant car le Provider est plus haut dans l'arbre

  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
