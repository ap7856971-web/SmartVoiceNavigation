/**
 * Global app theme hook.
 *
 * All screens/components use the same ThemeContext, so switching
 * Dark Mode in Settings updates the whole app.
 */

import { useTheme as useGlobalTheme } from "@/context/ThemeContext";

export function useTheme() {
  const { isDark, darkMode, setDarkMode, toggleDarkMode, colors } =
    useGlobalTheme();

  // Keep the API compatible with Expo's original useTheme() hook.
  const theme = {
    text: colors.text,
    background: colors.background,
    tint: colors.primary,
    icon: colors.icon,
    tabIconDefault: colors.icon,
    tabIconSelected: colors.primary,

    // Extra global colors for app screens.
    card: colors.card,
    secondary: colors.secondary,
    border: colors.border,
    input: colors.input,
    surface: colors.surface,
    primary: colors.primary,
  };

  return {
    ...theme,
    theme,
    colors,

    // Global theme controls.
    isDark,
    darkMode,
    setDarkMode,
    toggleDarkMode,
  };
}
