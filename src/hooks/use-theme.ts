/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

export function useTheme() {
  const { scheme } = useAppTheme();
  return Colors[scheme];
}