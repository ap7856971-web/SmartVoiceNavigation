import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "@smart_voice_navigation_settings";

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  secondary: string;
  border: string;
  icon: string;
  input: string;
  surface: string;
  primary: string;
};

type ThemeContextType = {
  isDark: boolean;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [darkMode, setDarkModeState] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);

        if (!saved) return;

        const parsed = JSON.parse(saved);

        if (typeof parsed.darkMode === "boolean") {
          setDarkModeState(parsed.darkMode);
        }
      } catch (error) {
        console.log("[Theme] Load error:", error);
      }
    })();
  }, []);

  const setDarkMode = (value: boolean) => {
    setDarkModeState(value);

    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        const parsed = saved ? JSON.parse(saved) : {};

        await AsyncStorage.setItem(
          THEME_KEY,
          JSON.stringify({
            ...parsed,
            darkMode: value,
          })
        );
      } catch (error) {
        console.log("[Theme] Save error:", error);
      }
    })();
  };

  const toggleDarkMode = () => {
    setDarkModeState((previous) => !previous);
  };

  const colors = useMemo(
    () => ({
      background: darkMode ? "#0B1220" : "#F4F7FB",
      card: darkMode ? "#111827" : "#FFFFFF",
      text: darkMode ? "#F9FAFB" : "#111827",
      secondary: darkMode ? "#9CA3AF" : "#666666",
      border: darkMode ? "#243044" : "#E5E7EB",
      icon: darkMode ? "#CBD5E1" : "#6B7280",
      input: darkMode ? "#182235" : "#F9FAFB",
      surface: darkMode ? "#172033" : "#F8FAFC",
      primary: "#2874F0",
    }),
    [darkMode]
  );

  const value = useMemo(
    () => ({
      isDark: darkMode,
      darkMode,
      setDarkMode,
      toggleDarkMode,
      colors,
    }),
    [darkMode, colors]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}

export default ThemeContext;
