import { Stack } from "expo-router";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Get Started / Splash */}
        <Stack.Screen name="index" />

        {/* Authentication */}
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />

        {/* Main App */}
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
